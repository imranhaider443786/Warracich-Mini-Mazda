import { jsPDF } from 'jspdf';
import {
  formatCurrencyPKR,
  translateCategory,
  translateDriverStatus,
  translateUnit,
  TRANSLATIONS,
} from '../i18n';
import {
  AddaSettings,
  BiltyRecord,
  DriverEntry,
  Language,
  RooznamchaEntry,
} from '../types';

const PAGE_W = 1240; // High-DPI A4 portrait canvas width
const PAGE_H = 1754; // High-DPI A4 portrait canvas height
const MARGIN = 64;

function getFont(lang: Language, weight: 400 | 600 | 700, size: number): string {
  const family =
    lang === 'ur'
      ? '"Noto Sans Arabic", "Plus Jakarta Sans", sans-serif'
      : '"Plus Jakarta Sans", "Noto Sans Arabic", sans-serif';
  return `${weight} ${size}px ${family}`;
}

function getMonoFont(weight: 400 | 600 | 700, size: number): string {
  return `${weight} ${size}px "IBM Plex Mono", monospace`;
}

function createPageCanvas(
  lang: Language,
  width = PAGE_W,
  height = PAGE_H
): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.direction = lang === 'ur' ? 'rtl' : 'ltr';
  ctx.textBaseline = 'middle';
  return { canvas, ctx };
}

function drawLetterhead(
  ctx: CanvasRenderingContext2D,
  settings: AddaSettings,
  lang: Language,
  reportTitle: string,
  subtitle: string
): number {
  const isRtl = lang === 'ur';
  const startX = isRtl ? PAGE_W - MARGIN : MARGIN;
  const oppX = isRtl ? MARGIN : PAGE_W - MARGIN;

  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(MARGIN, MARGIN, PAGE_W - MARGIN * 2, 10);

  ctx.fillStyle = '#0f172a';
  ctx.font = getFont(lang, 700, 34);
  ctx.textAlign = isRtl ? 'right' : 'left';
  const addaTitle = lang === 'ur' ? settings.addaNameUrdu : settings.addaName;
  ctx.fillText(addaTitle, startX, MARGIN + 48);

  ctx.fillStyle = '#475569';
  ctx.font = getFont(lang, 400, 18);
  const addaAddr = lang === 'ur' ? settings.addressUrdu : settings.address;
  ctx.fillText(`${addaAddr}  ·  ${settings.phone}`, startX, MARGIN + 84);

  ctx.fillStyle = '#1e3a8a';
  ctx.font = getFont(lang, 700, 24);
  ctx.textAlign = isRtl ? 'left' : 'right';
  ctx.fillText(reportTitle, oppX, MARGIN + 48);

  ctx.fillStyle = '#64748b';
  ctx.font = getFont(lang, 400, 17);
  ctx.fillText(subtitle, oppX, MARGIN + 84);

  const lineY = MARGIN + 114;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN, lineY);
  ctx.lineTo(PAGE_W - MARGIN, lineY);
  ctx.stroke();

  return lineY + 28;
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  lang: Language,
  pageNum: number,
  totalPages: number
) {
  const y = PAGE_H - 42;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(MARGIN, y - 22);
  ctx.lineTo(PAGE_W - MARGIN, y - 22);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = getFont(lang, 400, 16);
  ctx.textAlign = 'left';
  ctx.fillText(
    `${TRANSLATIONS[lang].appTitle} · ${new Date().toLocaleDateString()}`,
    MARGIN,
    y
  );
  ctx.textAlign = 'right';
  ctx.fillText(`Page ${pageNum} / ${totalPages}`, PAGE_W - MARGIN, y);
}

function canvasesToPdfBlob(
  canvases: HTMLCanvasElement[],
  orientation: 'portrait' | 'landscape' = 'portrait'
): Blob {
  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4',
    compress: true,
  });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();

  canvases.forEach((canvas, idx) => {
    if (idx > 0) pdf.addPage();
    const imgData = canvas.toDataURL('image/png', 0.95);
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH, undefined, 'FAST');
  });

  return pdf.output('blob');
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}…`;
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 4
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width <= maxWidth) {
      cur = next;
    } else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines;
}

export async function generateDriverRegisterPdfBlob(
  drivers: DriverEntry[],
  filterSummary: string,
  settings: AddaSettings,
  lang: Language
): Promise<Blob> {
  if (typeof document !== 'undefined' && document.fonts) {
    await document.fonts.ready;
  }
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ur';
  const rowsPerPage = 24;
  const totalPages = Math.max(1, Math.ceil(drivers.length / rowsPerPage));
  const canvases: HTMLCanvasElement[] = [];

  const cols = [
    { key: 'date', label: t.date, w: 125 },
    { key: 'gari', label: t.gariNumber, w: 150 },
    { key: 'feet', label: t.gariFeet, w: 135 },
    { key: 'city', label: t.city, w: 155 },
    { key: 'driver', label: t.driverName, w: 175 },
    { key: 'mobile', label: t.mobileNumber, w: 165 },
    { key: 'wazan', label: t.weightCapacity, w: 110 },
    { key: 'status', label: t.status, w: 97 },
  ];

  for (let p = 0; p < totalPages; p++) {
    const { canvas, ctx } = createPageCanvas(lang);
    let y = drawLetterhead(ctx, settings, lang, t.driverPageTitle, filterSummary);

    const tableW = PAGE_W - MARGIN * 2;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(MARGIN, y, tableW, 44);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(MARGIN, y, tableW, 44);

    ctx.fillStyle = '#0f172a';
    ctx.font = getFont(lang, 700, 17);
    let curX = isRtl ? PAGE_W - MARGIN : MARGIN;
    for (const col of cols) {
      ctx.textAlign = isRtl ? 'right' : 'left';
      const padX = isRtl ? curX - 10 : curX + 10;
      ctx.fillText(fitText(ctx, col.label, col.w - 16), padX, y + 22);
      curX += isRtl ? -col.w : col.w;
    }
    y += 44;

    const slice = drivers.slice(p * rowsPerPage, (p + 1) * rowsPerPage);
    slice.forEach((d, idx) => {
      const rowH = 52;
      if (idx % 2 === 1) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(MARGIN, y, tableW, rowH);
      }
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(MARGIN, y, tableW, rowH);

      const capText = d.weightCapacity
        ? `${d.weightCapacity} ${translateUnit(d.weightUnit, lang)}`
        : '—';

      const vals = [
        d.date || '—',
        d.gariNumber || '—',
        d.gariFeet || '—',
        d.city || '—',
        d.driverName || '—',
        d.mobileNumber || '—',
        capText,
        translateDriverStatus(d.status, lang),
      ];

      let cx = isRtl ? PAGE_W - MARGIN : MARGIN;
      cols.forEach((col, cIdx) => {
        ctx.fillStyle = cIdx === 1 || cIdx === 5 ? '#0f172a' : '#334155';
        ctx.font =
          cIdx === 0 || cIdx === 1 || cIdx === 5
            ? getMonoFont(600, 16)
            : getFont(lang, cIdx === 4 ? 600 : 400, 16);
        ctx.textAlign = isRtl ? 'right' : 'left';
        const px = isRtl ? cx - 10 : cx + 10;
        ctx.fillText(fitText(ctx, vals[cIdx], col.w - 16), px, y + rowH / 2);
        cx += isRtl ? -col.w : col.w;
      });
      y += rowH;
    });

    drawFooter(ctx, lang, p + 1, totalPages);
    canvases.push(canvas);
  }

  return canvasesToPdfBlob(canvases, 'portrait');
}

/**
 * Generates an authentic A4 Landscape Official Urdu PDF matching Warraich Goods Samundri stationery.
 * Always renders in Urdu RTL regardless of UI language toggle.
 */
export async function generateBiltyPdfBlob(
  bilty: BiltyRecord,
  settings: AddaSettings,
  _lang: Language
): Promise<Blob> {
  if (typeof document !== 'undefined' && document.fonts) {
    await document.fonts.ready;
  }
  const W = 1754;
  const H = 1240;
  const M = 56;
  const { canvas, ctx } = createPageCanvas('ur', W, H);
  const st = settings.biltyStationery;

  // Outer frame
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.strokeRect(M, M, W - M * 2, H - M * 2);

  const innerX = M + 28;
  const innerW = W - M * 2 - 56;
  let y = M + 28;

  // ── TOP BANNER ──
  // Right Half: Brand Header (x: innerX + innerW/2 .. innerX + innerW)
  const rightHalfW = innerW * 0.52;
  const rightEdge = innerX + innerW;
  const leftHalfW = innerW - rightHalfW - 24;

  // Top slogan & 24hr badge
  ctx.fillStyle = '#0f172a';
  ctx.font = getFont('ur', 700, 22);
  ctx.textAlign = 'right';
  ctx.fillText(st.topSloganUrdu, rightEdge, y + 18);

  // Green 24hr badge
  const badgeW = 190;
  const badgeH = 38;
  const badgeX = rightEdge - rightHalfW + 10;
  ctx.fillStyle = '#0f7a38';
  ctx.beginPath();
  ctx.roundRect(badgeX, y, badgeW, badgeH, 19);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = getFont('ur', 700, 19);
  ctx.textAlign = 'center';
  ctx.fillText(st.serviceBadgeUrdu, badgeX + badgeW / 2, y + badgeH / 2);

  // Bold Red Brand Title
  ctx.fillStyle = '#d91c1c';
  ctx.font = getFont('ur', 700, 74);
  ctx.textAlign = 'center';
  const brandCenterX = rightEdge - rightHalfW / 2;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3;
  ctx.strokeText(st.brandTitleUrdu, brandCenterX, y + 106);
  ctx.fillText(st.brandTitleUrdu, brandCenterX, y + 106);

  // Subtitle bar
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(rightEdge - rightHalfW, y + 158, rightHalfW, 38);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(rightEdge - rightHalfW, y + 158, rightHalfW, 38);
  ctx.fillStyle = '#0f172a';
  ctx.font = getFont('ur', 700, 21);
  ctx.fillText(fitText(ctx, st.brandSubtitleUrdu, rightHalfW - 20), brandCenterX, y + 177);

  // Left Half: Yellow Primary Box + Green Secondary Box + Red Group Badge
  const yellowW = leftHalfW * 0.57;
  const greenW = leftHalfW - yellowW - 14;
  const yellowX = innerX + greenW + 14;

  // Yellow contact box
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(yellowX, y, yellowW, 196);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.strokeRect(yellowX, y, yellowW, 196);

  ctx.fillStyle = '#b91c1c';
  ctx.font = getFont('ur', 700, 21);
  ctx.textAlign = 'center';
  ctx.fillText(
    fitText(ctx, st.primaryContactTitle, yellowW - 16),
    yellowX + yellowW / 2,
    y + 24
  );
  ctx.strokeStyle = 'rgba(217,119,6,0.4)';
  ctx.beginPath();
  ctx.moveTo(yellowX + 12, y + 44);
  ctx.lineTo(yellowX + yellowW - 12, y + 44);
  ctx.stroke();

  ctx.font = getMonoFont(700, 25);
  ctx.direction = 'ltr';
  st.primaryContactPhones.slice(0, 4).forEach((ph, idx) => {
    ctx.fillText(ph, yellowX + yellowW / 2, y + 72 + idx * 32);
  });
  ctx.direction = 'rtl';

  // Red Group Pill
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.roundRect(innerX, y, greenW, 44, 22);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = getFont('ur', 700, 18);
  ctx.fillText(fitText(ctx, st.groupBadgeUrdu, greenW - 16), innerX + greenW / 2, y + 22);

  // Green Secondary Contact Box
  ctx.fillStyle = '#dcfce7';
  ctx.fillRect(innerX, y + 54, greenW, 142);
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 2;
  ctx.strokeRect(innerX, y + 54, greenW, 142);

  ctx.fillStyle = '#b91c1c';
  ctx.font = getFont('ur', 700, 22);
  ctx.fillText(
    fitText(ctx, st.secondaryContactTitle, greenW - 16),
    innerX + greenW / 2,
    y + 82
  );
  ctx.font = getMonoFont(700, 22);
  ctx.direction = 'ltr';
  st.secondaryContactPhones.slice(0, 2).forEach((ph, idx) => {
    ctx.fillText(ph, innerX + greenW / 2, y + 124 + idx * 34);
  });
  ctx.direction = 'rtl';

  y += 216;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(innerX, y);
  ctx.lineTo(rightEdge, y);
  ctx.stroke();

  y += 28;

  // ── METADATA LINES ──
  const drawFieldLine = (
    xStartRight: number,
    width: number,
    yPos: number,
    label: string,
    val: string,
    mono = false
  ) => {
    ctx.fillStyle = '#b91c1c';
    ctx.font = getFont('ur', 700, 21);
    ctx.textAlign = 'right';
    ctx.fillText(label, xStartRight, yPos);
    const labelW = ctx.measureText(label).width + 14;

    ctx.fillStyle = '#0f172a';
    ctx.font = mono ? getMonoFont(700, 21) : getFont('ur', 600, 22);
    if (mono) ctx.direction = 'ltr';
    ctx.textAlign = mono ? 'left' : 'right';
    const valX = mono ? xStartRight - width + 8 : xStartRight - labelW;
    ctx.fillText(fitText(ctx, val || '', width - labelW - 10), valX, yPos);
    ctx.direction = 'rtl';

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xStartRight - width + 10, yPos + 18);
    ctx.lineTo(xStartRight, yPos + 18);
    ctx.stroke();
  };

  // Row 1: Bilty No | From | To | Date | Gari No
  drawFieldLine(rightEdge, 220, y, 'بلٹی نمبر:', bilty.biltyNumber, true);
  drawFieldLine(rightEdge - 235, 310, y, 'از:', bilty.fromCity);
  drawFieldLine(rightEdge - 560, 310, y, 'تا:', bilty.toCity);
  drawFieldLine(rightEdge - 885, 290, y, 'تاریخ:', bilty.date, true);
  drawFieldLine(rightEdge - 1190, innerW - 1190, y, 'گاڑی نمبر:', bilty.gariNumber, true);

  y += 50;

  // Row 2: Sender (Right 58%) + Boxed Driver (Left 40%)
  const senderW = innerW * 0.56;
  const driverBoxW = innerW * 0.41;
  drawFieldLine(
    rightEdge,
    senderW,
    y,
    'بھیجنے والے کا نام و موبائل نمبر:',
    [bilty.senderName, bilty.senderPhone].filter(Boolean).join('  ·  ')
  );

  ctx.fillStyle = '#f0fdf4';
  ctx.fillRect(innerX, y - 22, driverBoxW, 44);
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 2;
  ctx.strokeRect(innerX, y - 22, driverBoxW, 44);
  ctx.fillStyle = '#b91c1c';
  ctx.font = getFont('ur', 700, 19);
  ctx.textAlign = 'right';
  const drvLbl = 'ڈرائیور کا نام و موبائل نمبر:';
  ctx.fillText(drvLbl, innerX + driverBoxW - 12, y);
  const drvLblW = ctx.measureText(drvLbl).width + 20;
  ctx.fillStyle = '#0f172a';
  ctx.font = getFont('ur', 600, 20);
  ctx.fillText(
    fitText(
      ctx,
      [bilty.driverName, bilty.driverPhone].filter(Boolean).join(' · '),
      driverBoxW - drvLblW - 16
    ),
    innerX + driverBoxW - drvLblW,
    y
  );

  y += 52;

  // Row 3: Receiver
  drawFieldLine(
    rightEdge,
    innerW,
    y,
    'لینے والے کا نام اور موبائل نمبر:',
    [bilty.receiverName, bilty.receiverPhone].filter(Boolean).join('  ·  ')
  );

  y += 38;

  // ── GREEN CONSIGNMENT TABLE ──
  const hasAdvance = Number(bilty.advancePaid) > 0;
  const totalFreight = Number(bilty.freightAmount) || 0;
  const advanceVal = Number(bilty.advancePaid) || 0;
  const payable = Math.max(0, totalFreight - advanceVal);

  const cols = hasAdvance
    ? [
        { label: 'تعداد', w: 190, val: bilty.packagesCount || '', mono: false },
        { label: 'تفصیل مال', w: innerW - 940, val: bilty.goodsDescription || '', mono: false },
        { label: 'وزن', w: 180, val: bilty.weight || '', mono: false },
        {
          label: 'کل کرایہ',
          w: 190,
          val: totalFreight > 0 ? totalFreight.toLocaleString('en-PK') : '',
          mono: true,
        },
        {
          label: 'پیشگی',
          w: 170,
          val: advanceVal.toLocaleString('en-PK'),
          mono: true,
        },
        {
          label: 'کرایہ قابل ادا',
          w: 210,
          val: totalFreight > 0 || payable > 0 ? payable.toLocaleString('en-PK') : '',
          mono: true,
        },
      ]
    : [
        { label: 'تعداد', w: 200, val: bilty.packagesCount || '', mono: false },
        { label: 'تفصیل مال', w: innerW - 810, val: bilty.goodsDescription || '', mono: false },
        { label: 'وزن', w: 190, val: bilty.weight || '', mono: false },
        {
          label: 'کل کرایہ',
          w: 200,
          val: totalFreight > 0 ? totalFreight.toLocaleString('en-PK') : '',
          mono: true,
        },
        {
          label: 'کرایہ قابل ادا',
          w: 220,
          val: totalFreight > 0 || payable > 0 ? payable.toLocaleString('en-PK') : '',
          mono: true,
        },
      ];

  const headerH = 48;
  const bodyH = 290;

  // Green header bar
  ctx.fillStyle = '#0f7a38';
  ctx.fillRect(innerX, y, innerW, headerH);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(innerX, y, innerW, headerH + bodyH);

  let cx = rightEdge;
  cols.forEach((col, idx) => {
    // Column Header
    ctx.fillStyle = '#ffffff';
    ctx.font = getFont('ur', 700, 22);
    ctx.textAlign = 'center';
    ctx.fillText(col.label, cx - col.w / 2, y + headerH / 2);

    // Column Divider
    if (idx < cols.length - 1) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - col.w, y);
      ctx.lineTo(cx - col.w, y + headerH);
      ctx.stroke();

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - col.w, y + headerH);
      ctx.lineTo(cx - col.w, y + headerH + bodyH);
      ctx.stroke();
    }

    // Column Body Value
    ctx.fillStyle = '#0f172a';
    if (col.mono) {
      ctx.font = getMonoFont(700, 30);
      ctx.direction = 'ltr';
      ctx.textAlign = 'center';
      ctx.fillText(col.val, cx - col.w / 2, y + headerH + 64);
      ctx.direction = 'rtl';
    } else {
      ctx.font = getFont('ur', 700, 26);
      ctx.textAlign = 'center';
      const lines = wrapTextLines(ctx, col.val, col.w - 28, 4);
      lines.forEach((ln, li) => {
        ctx.fillText(ln, cx - col.w / 2, y + headerH + 56 + li * 38);
      });
    }

    cx -= col.w;
  });

  // Motto line inside bottom of table
  y += headerH + bodyH + 22;
  ctx.fillStyle = '#b91c1c';
  ctx.font = getFont('ur', 700, 19);
  ctx.textAlign = 'right';
  ctx.fillText(st.mottoUrdu, rightEdge, y);

  ctx.fillStyle = '#334155';
  ctx.textAlign = 'left';
  ctx.fillText('دستخط منیجر: ____________________', innerX, y);

  y += 28;

  // ── BOTTOM FOOTER STRIP: TERMS (Right) + PATRON (Left) ──
  const footerH = H - M - 24 - y;
  const patronW = innerW * 0.27;
  const termsW = innerW - patronW - 18;
  const termsX = innerX + patronW + 18;

  // Yellow Terms Box
  ctx.fillStyle = '#fef9c3';
  ctx.fillRect(termsX, y, termsW, footerH);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.strokeRect(termsX, y, termsW, footerH);

  ctx.fillStyle = '#dc2626';
  ctx.font = getFont('ur', 700, 20);
  ctx.textAlign = 'right';
  ctx.fillText('شرائط:', termsX + termsW - 14, y + 22);

  ctx.fillStyle = '#7f1d1d';
  ctx.font = getFont('ur', 400, 14);
  const colTermsW = (termsW - 44) / 2;
  st.termsUrdu.slice(0, 7).forEach((clause, idx) => {
    const colIdx = idx < 4 ? 0 : 1;
    const rowIdx = idx < 4 ? idx : idx - 4;
    const tx = colIdx === 0 ? termsX + termsW - 14 : termsX + colTermsW + 10;
    const ty = y + 48 + rowIdx * 28;
    ctx.fillText(fitText(ctx, clause, colTermsW), tx, ty);
  });

  // Patron Box (Left)
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(innerX, y, patronW, footerH);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.strokeRect(innerX, y, patronW, footerH);

  const pCenter = innerX + patronW / 2;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(pCenter - 95, y + 12, 190, 26);
  ctx.fillStyle = '#ffffff';
  ctx.font = getFont('ur', 700, 15);
  ctx.textAlign = 'center';
  ctx.fillText(st.patronLabelUrdu, pCenter, y + 25);

  ctx.fillStyle = '#b91c1c';
  ctx.font = getFont('ur', 700, 26);
  ctx.fillText(st.patronNameUrdu, pCenter, y + 58);

  ctx.fillStyle = '#0f172a';
  ctx.font = getFont('ur', 600, 15);
  ctx.fillText(fitText(ctx, st.patronDesignationUrdu, patronW - 20), pCenter, y + 90);

  ctx.font = getMonoFont(700, 23);
  ctx.direction = 'ltr';
  ctx.fillText(st.patronPhone, pCenter, y + 126);
  ctx.direction = 'rtl';

  ctx.fillStyle = '#475569';
  ctx.font = getFont('ur', 400, 13);
  ctx.fillText(fitText(ctx, st.patronNoteUrdu, patronW - 20), pCenter, y + 154);

  return canvasesToPdfBlob([canvas], 'landscape');
}

export async function generateRooznamchaPdfBlob(
  entries: RooznamchaEntry[],
  dateRangeLabel: string,
  openingBalance: number,
  totalIncome: number,
  totalExpense: number,
  closingBalance: number,
  settings: AddaSettings,
  lang: Language
): Promise<Blob> {
  if (typeof document !== 'undefined' && document.fonts) {
    await document.fonts.ready;
  }
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ur';
  const rowsPerPage = 22;
  const totalPages = Math.max(1, Math.ceil(entries.length / rowsPerPage));
  const canvases: HTMLCanvasElement[] = [];

  const cols = [
    { label: t.date, w: 130 },
    { label: t.entryType, w: 140 },
    { label: t.category, w: 200 },
    { label: t.description, w: 312 },
    { label: t.reference, w: 150 },
    { label: t.amountPKR, w: 180 },
  ];

  for (let p = 0; p < totalPages; p++) {
    const { canvas, ctx } = createPageCanvas(lang);
    let y = drawLetterhead(ctx, settings, lang, t.roozPageTitle, dateRangeLabel);

    if (p === 0) {
      const totalW = PAGE_W - MARGIN * 2;
      const gap = 16;
      const cardW = (totalW - gap * 3) / 4;
      const summaries = [
        { label: t.openingBalance, value: formatCurrencyPKR(openingBalance), color: '#0f172a' },
        { label: t.totalIncome, value: formatCurrencyPKR(totalIncome), color: '#16a34a' },
        { label: t.totalExpense, value: formatCurrencyPKR(totalExpense), color: '#dc2626' },
        { label: t.closingBalance, value: formatCurrencyPKR(closingBalance), color: '#1e3a8a' },
      ];
      summaries.forEach((s, idx) => {
        const bx = isRtl
          ? PAGE_W - MARGIN - (idx + 1) * cardW - idx * gap
          : MARGIN + idx * (cardW + gap);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(bx, y, cardW, 84);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, y, cardW, 84);

        ctx.fillStyle = '#475569';
        ctx.font = getFont(lang, 600, 15);
        ctx.textAlign = isRtl ? 'right' : 'left';
        ctx.fillText(fitText(ctx, s.label, cardW - 24), isRtl ? bx + cardW - 12 : bx + 12, y + 26);

        ctx.fillStyle = s.color;
        ctx.font = getMonoFont(700, 22);
        ctx.fillText(fitText(ctx, s.value, cardW - 24), isRtl ? bx + cardW - 12 : bx + 12, y + 58);
      });
      y += 108;
    }

    const tableW = PAGE_W - MARGIN * 2;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(MARGIN, y, tableW, 44);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(MARGIN, y, tableW, 44);

    ctx.fillStyle = '#0f172a';
    ctx.font = getFont(lang, 700, 17);
    let curX = isRtl ? PAGE_W - MARGIN : MARGIN;
    for (const col of cols) {
      ctx.textAlign = isRtl ? 'right' : 'left';
      const padX = isRtl ? curX - 10 : curX + 10;
      ctx.fillText(fitText(ctx, col.label, col.w - 16), padX, y + 22);
      curX += isRtl ? -col.w : col.w;
    }
    y += 44;

    const slice = entries.slice(p * rowsPerPage, (p + 1) * rowsPerPage);
    slice.forEach((e, idx) => {
      const rowH = 50;
      if (idx % 2 === 1) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(MARGIN, y, tableW, rowH);
      }
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(MARGIN, y, tableW, rowH);

      const vals = [
        e.date,
        e.type === 'income' ? t.incomeLabel : t.expenseLabel,
        translateCategory(e.category, lang),
        e.description || '—',
        e.reference || '—',
        formatCurrencyPKR(e.amount),
      ];

      let cx = isRtl ? PAGE_W - MARGIN : MARGIN;
      cols.forEach((col, cIdx) => {
        ctx.fillStyle =
          cIdx === 1 || cIdx === 5
            ? e.type === 'income'
              ? '#16a34a'
              : '#dc2626'
            : '#334155';
        ctx.font =
          cIdx === 0 || cIdx === 5
            ? getMonoFont(600, 16)
            : getFont(lang, cIdx === 1 ? 600 : 400, 16);
        ctx.textAlign = isRtl ? 'right' : 'left';
        const px = isRtl ? cx - 10 : cx + 10;
        ctx.fillText(fitText(ctx, vals[cIdx], col.w - 16), px, y + rowH / 2);
        cx += isRtl ? -col.w : col.w;
      });
      y += rowH;
    });

    drawFooter(ctx, lang, p + 1, totalPages);
    canvases.push(canvas);
  }

  return canvasesToPdfBlob(canvases, 'portrait');
}

export function downloadBlobLocally(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
