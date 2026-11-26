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

import {
  loadSvgImage,
  PAKISTAN_FLAG_DATA_URL,
  TRUCK_WATERMARK_DATA_URL,
  WHATSAPP_ICON_DATA_URL,
} from './biltyArtwork';

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

function getNastaliqFont(weight: 400 | 600 | 700, size: number): string {
  return `${weight} ${size}px "Noto Nastaliq Urdu", "Noto Sans Arabic", serif`;
}

function getCondensedFont(weight: 600 | 700, size: number): string {
  return `${weight} ${size}px "Oswald", "IBM Plex Mono", sans-serif`;
}

function getCleanDataFont(weight: 400 | 600 | 700, size: number): string {
  return `${weight} ${size}px "Plus Jakarta Sans", "Noto Sans Arabic", sans-serif`;
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

function wrapAllTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = (text || '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width <= maxWidth) {
      cur = next;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Generates an authentic A4 Landscape Official Urdu PDF matching Warraich Goods Samundri stationery.
 * Uses Noto Nastaliq Urdu for printed stationery, Oswald for stacked phone numbers,
 * realistic grayscale truck watermark, all 6 freight columns, and clean dark data text.
 */
export async function generateBiltyPdfBlob(
  bilty: BiltyRecord,
  settings: AddaSettings,
  _lang: Language
): Promise<Blob> {
  if (typeof document !== 'undefined' && document.fonts) {
    await Promise.allSettled([
      document.fonts.load('400 18px "Noto Nastaliq Urdu"'),
      document.fonts.load('700 24px "Noto Nastaliq Urdu"'),
      document.fonts.load('700 72px "Noto Nastaliq Urdu"'),
      document.fonts.load('700 32px "Oswald"'),
      document.fonts.load('700 28px "IBM Plex Mono"'),
      document.fonts.load('600 22px "Plus Jakarta Sans"'),
      document.fonts.ready,
    ]);
  }

  const [flagRes, waRes, truckRes] = await Promise.allSettled([
    loadSvgImage(PAKISTAN_FLAG_DATA_URL),
    loadSvgImage(WHATSAPP_ICON_DATA_URL),
    loadSvgImage(TRUCK_WATERMARK_DATA_URL),
  ]);
  const flagImg = flagRes.status === 'fulfilled' ? flagRes.value : null;
  const waImg = waRes.status === 'fulfilled' ? waRes.value : null;
  const truckImg = truckRes.status === 'fulfilled' ? truckRes.value : null;

  const W = 1754;
  const H = 1240;
  const M = 48;
  const { canvas, ctx } = createPageCanvas('ur', W, H);
  const st = settings.biltyStationery;

  // Outer stationery frame
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3.5;
  ctx.strokeRect(M, M, W - M * 2, H - M * 2);

  const innerX = M + 24;
  const innerW = W - M * 2 - 48; // 1610px
  const rightEdge = innerX + innerW; // 1682px
  let y = M + 24; // 72px

  // ── TOP BANNER ──
  const rightHalfW = 885;
  const rightZoneStart = rightEdge - rightHalfW; // 797px
  const leftHalfW = innerW - rightHalfW - 25; // 700px

  // 1) Top-right slogan + Pakistan flag + registered + 24hr green oval
  const sloganClean = (st.topSloganUrdu || '').replace(/[·•]/g, ' ').trim();
  const isDefaultSlogan =
    sloganClean.includes('جیوے') && sloganClean.includes('786');

  if (isDefaultSlogan) {
    ctx.fillStyle = '#0f172a';
    ctx.font = getNastaliqFont(700, 23);
    ctx.textAlign = 'right';
    ctx.fillText('جیوے', rightEdge - 6, y + 26);

    ctx.font = getCleanDataFont(700, 28);
    ctx.direction = 'ltr';
    ctx.textAlign = 'right';
    ctx.fillText('786', rightEdge - 72, y + 26);
    ctx.direction = 'rtl';

    if (flagImg) {
      ctx.drawImage(flagImg, rightEdge - 224, y + 2, 86, 52);
    }

    ctx.save();
    ctx.translate(rightEdge - 275, y + 24);
    ctx.rotate(-0.1);
    ctx.fillStyle = '#0f172a';
    ctx.font = getNastaliqFont(700, 26);
    ctx.textAlign = 'center';
    ctx.fillText('رجسٹرڈ', 0, 0);
    ctx.restore();
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.font = getNastaliqFont(700, 22);
    ctx.textAlign = 'right';
    ctx.fillText(st.topSloganUrdu, rightEdge - 6, y + 24);
    if (flagImg) {
      ctx.drawImage(flagImg, rightEdge - 290, y + 2, 80, 48);
    }
  }

  // Green 24hr oval emblem
  const ovalCx = rightZoneStart + 72;
  const ovalCy = y + 28;
  ctx.fillStyle = '#0f7a38';
  ctx.beginPath();
  ctx.ellipse(ovalCx, ovalCy, 62, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = getCleanDataFont(700, 21);
  ctx.fillText('24', ovalCx, ovalCy - 10);
  ctx.font = getNastaliqFont(700, 14);
  ctx.fillText('گھنٹے سروس', ovalCx, ovalCy + 11);

  // 2) Calligraphic Masthead ("وڑائچ گڈز" red with white stroke + black shadow, "سمندری" outlined)
  const titleTrimmed = (st.brandTitleUrdu || '').trim();
  const hasSamundriSuffix =
    titleTrimmed.endsWith('سمندری') && titleTrimmed.length > 7;
  const mainMasthead = hasSamundriSuffix
    ? titleTrimmed.slice(0, titleTrimmed.length - 'سمندری'.length).trim()
    : titleTrimmed;
  const citySuffix = hasSamundriSuffix ? 'سمندری' : '';

  const mastheadY = y + 122;
  const brandCenterX = rightZoneStart + rightHalfW / 2;

  if (citySuffix) {
    // Draw main red title slightly to the right and Samundri to its left
    ctx.font = getNastaliqFont(700, 68);
    const mainW = ctx.measureText(mainMasthead).width;
    ctx.font = getNastaliqFont(700, 44);
    const cityW = ctx.measureText(citySuffix).width;
    const totalW = mainW + cityW + 18;
    const mainCenterX = brandCenterX + totalW / 2 - mainW / 2;
    const cityCenterX = brandCenterX - totalW / 2 + cityW / 2;

    // Main title shadow + white outline + red fill
    ctx.font = getNastaliqFont(700, 68);
    ctx.textAlign = 'center';
    ctx.save();
    ctx.shadowColor = '#111827';
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.strokeText(mainMasthead, mainCenterX, mastheadY);
    ctx.restore();
    ctx.fillStyle = '#dc2626';
    ctx.fillText(mainMasthead, mainCenterX, mastheadY);

    // City suffix outlined calligraphy
    ctx.font = getNastaliqFont(700, 44);
    ctx.save();
    ctx.shadowColor = '#1e293b';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4.5;
    ctx.lineJoin = 'round';
    ctx.strokeText(citySuffix, cityCenterX, mastheadY + 6);
    ctx.restore();
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(citySuffix, cityCenterX, mastheadY + 6);
  } else {
    ctx.font = getNastaliqFont(700, 64);
    ctx.textAlign = 'center';
    ctx.save();
    ctx.shadowColor = '#111827';
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.strokeText(mainMasthead, brandCenterX, mastheadY);
    ctx.restore();
    ctx.fillStyle = '#dc2626';
    ctx.fillText(mainMasthead, brandCenterX, mastheadY);
  }

  // 3) Subtitle flanked by triple horizontal rules
  const subY = y + 206;
  ctx.fillStyle = '#0f172a';
  ctx.font = getNastaliqFont(700, 20);
  ctx.textAlign = 'center';
  const subText = fitText(ctx, st.brandSubtitleUrdu, rightHalfW - 140);
  const subTextW = ctx.measureText(subText).width;
  ctx.fillText(subText, brandCenterX, subY);

  const ruleGap = 14;
  const leftRuleEnd = brandCenterX - subTextW / 2 - ruleGap;
  const rightRuleStart = brandCenterX + subTextW / 2 + ruleGap;
  [-5, 0, 5].forEach((offset, i) => {
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = i === 1 ? 1.2 : 1.8;
    if (leftRuleEnd > rightZoneStart + 8) {
      ctx.beginPath();
      ctx.moveTo(rightZoneStart, subY + offset);
      ctx.lineTo(leftRuleEnd, subY + offset);
      ctx.stroke();
    }
    if (rightEdge > rightRuleStart + 8) {
      ctx.beginPath();
      ctx.moveTo(rightRuleStart, subY + offset);
      ctx.lineTo(rightEdge, subY + offset);
      ctx.stroke();
    }
  });

  // 4) Left Side Contact Cards (Yellow Primary + Red 43 Group Oval + Green Secondary)
  const yellowW = Math.round(leftHalfW * 0.58); // 406px
  const greenW = leftHalfW - yellowW - 14; // 280px
  const yellowX = innerX + greenW + 14;

  // Yellow Box
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(yellowX, y, yellowW, 226);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.strokeRect(yellowX, y, yellowW, 226);

  ctx.fillStyle = '#dc2626';
  ctx.font = getNastaliqFont(700, 20);
  ctx.textAlign = 'center';
  ctx.fillText(
    fitText(ctx, st.primaryContactTitle, yellowW - 18),
    yellowX + yellowW / 2,
    y + 24
  );
  ctx.strokeStyle = 'rgba(217,119,6,0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(yellowX + 12, y + 46);
  ctx.lineTo(yellowX + yellowW - 12, y + 46);
  ctx.stroke();

  ctx.fillStyle = '#dc2626';
  ctx.font = getCondensedFont(700, 32);
  ctx.direction = 'ltr';
  st.primaryContactPhones.slice(0, 4).forEach((ph, idx) => {
    const py = y + 76 + idx * 41;
    const textCenterX = yellowX + yellowW / 2 + (idx === 1 || idx === 2 ? 12 : 0);
    ctx.textAlign = 'center';
    ctx.fillText(ph, textCenterX, py);
    const numW = ctx.measureText(ph).width;

    if (idx === 1 && waImg) {
      ctx.drawImage(waImg, textCenterX - numW / 2 - 28, py - 12, 22, 22);
    }
    if (idx === 2) {
      // Ufone badge
      const bx = textCenterX - numW / 2 - 44;
      const by = py - 9;
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.roundRect(bx, by, 38, 17, 3);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = getCleanDataFont(700, 10);
      ctx.fillText('Ufone', bx + 19, py);
      ctx.fillStyle = '#dc2626';
      ctx.font = getCondensedFont(700, 32);
    }
  });
  ctx.direction = 'rtl';

  // Red 43 Group Oval
  const grpCx = innerX + greenW / 2;
  const grpCy = y + 32;
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.ellipse(grpCx, grpCy, greenW / 2 - 4, 31, 0, 0, Math.PI * 2);
  ctx.fill();

  const groupText = (st.groupBadgeUrdu || '').trim();
  const groupParts = groupText.startsWith('43 گروپ')
    ? ['43 گروپ', groupText.slice('43 گروپ'.length).trim()]
    : [groupText];
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  if (groupParts.length === 2) {
    ctx.font = getNastaliqFont(700, 16);
    ctx.fillText(groupParts[0], grpCx, grpCy - 11);
    ctx.font = getNastaliqFont(700, 15);
    ctx.fillText(fitText(ctx, groupParts[1], greenW - 36), grpCx, grpCy + 11);
  } else {
    ctx.font = getNastaliqFont(700, 16);
    ctx.fillText(fitText(ctx, groupText, greenW - 30), grpCx, grpCy);
  }

  // Green Secondary Box
  ctx.fillStyle = '#dcfce7';
  ctx.fillRect(innerX, y + 72, greenW, 154);
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 2;
  ctx.strokeRect(innerX, y + 72, greenW, 154);

  ctx.font = getNastaliqFont(700, 25);
  ctx.textAlign = 'center';
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeText(fitText(ctx, st.secondaryContactTitle, greenW - 18), grpCx, y + 104);
  ctx.restore();
  ctx.fillStyle = '#dc2626';
  ctx.fillText(fitText(ctx, st.secondaryContactTitle, greenW - 18), grpCx, y + 104);

  ctx.fillStyle = '#dc2626';
  ctx.font = getCondensedFont(700, 28);
  ctx.direction = 'ltr';
  st.secondaryContactPhones.slice(0, 2).forEach((ph, idx) => {
    ctx.fillText(ph, grpCx, y + 150 + idx * 40);
  });
  ctx.direction = 'rtl';

  y += 264;

  // ── METADATA LINES (Clean Dark Text for User Values) ──
  const drawFieldLine = (
    xStartRight: number,
    width: number,
    yPos: number,
    label: string,
    val: string,
    mono = false
  ) => {
    ctx.fillStyle = '#dc2626';
    ctx.font = getNastaliqFont(700, 19);
    ctx.textAlign = 'right';
    ctx.fillText(label, xStartRight, yPos);
    const labelW = ctx.measureText(label).width + 14;

    ctx.fillStyle = '#0f172a';
    ctx.font = mono ? getMonoFont(700, 21) : getCleanDataFont(600, 22);
    if (mono) ctx.direction = 'ltr';
    ctx.textAlign = mono ? 'left' : 'right';
    const valX = mono ? xStartRight - width + 10 : xStartRight - labelW;
    ctx.fillText(fitText(ctx, val || '', width - labelW - 14), valX, yPos);
    ctx.direction = 'rtl';

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xStartRight - width + 10, yPos + 19);
    ctx.lineTo(xStartRight, yPos + 19);
    ctx.stroke();
  };

  // Row 1: Bilty No | Az | Ta | Date | Gari No
  drawFieldLine(rightEdge, 210, y, 'بلٹی نمبر:', bilty.biltyNumber, true);
  drawFieldLine(rightEdge - 225, 320, y, 'از:', bilty.fromCity);
  drawFieldLine(rightEdge - 560, 320, y, 'تا:', bilty.toCity);
  drawFieldLine(rightEdge - 895, 300, y, 'تاریخ:', bilty.date, true);
  drawFieldLine(rightEdge - 1210, innerW - 1210, y, 'گاڑی نمبر:', bilty.gariNumber, true);

  y += 54;

  // Row 2: Sender (Right 56%) + Boxed Driver (Left 42%)
  const senderW = Math.round(innerW * 0.56);
  const driverBoxW = innerW - senderW - 24;
  drawFieldLine(
    rightEdge,
    senderW,
    y,
    'بھیجنے والے کا نام و موبائل نمبر:',
    [bilty.senderName, bilty.senderPhone].filter(Boolean).join(' · ')
  );

  ctx.fillStyle = '#f0fdf4';
  ctx.fillRect(innerX, y - 22, driverBoxW, 44);
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 2;
  ctx.strokeRect(innerX, y - 22, driverBoxW, 44);

  ctx.fillStyle = '#dc2626';
  ctx.font = getNastaliqFont(700, 18);
  ctx.textAlign = 'right';
  const drvLbl = 'ڈرائیور کا نام و موبائل نمبر:';
  ctx.fillText(drvLbl, innerX + driverBoxW - 12, y);
  const drvLblW = ctx.measureText(drvLbl).width + 20;

  ctx.fillStyle = '#0f172a';
  ctx.font = getCleanDataFont(700, 20);
  ctx.fillText(
    fitText(
      ctx,
      [bilty.driverName, bilty.driverPhone].filter(Boolean).join(' · '),
      driverBoxW - drvLblW - 18
    ),
    innerX + driverBoxW - drvLblW,
    y
  );

  y += 54;

  // Row 3: Receiver
  drawFieldLine(
    rightEdge,
    innerW,
    y,
    'لینے والے کا نام اور موبائل نمبر:',
    [bilty.receiverName, bilty.receiverPhone].filter(Boolean).join(' · ')
  );

  y += 38;

  // ── 6-COLUMN GREEN CONSIGNMENT TABLE (All 6 columns ALWAYS visible) ──
  const totalFreight = Number(bilty.freightAmount) || 0;
  const advanceVal = Number(bilty.advancePaid) || 0;
  const payable = Math.max(0, totalFreight - advanceVal);

  const cols = [
    { label: 'تعداد', w: 175, val: bilty.packagesCount || '', mono: false },
    { label: 'تفصیل مال', w: 555, val: bilty.goodsDescription || '', mono: false },
    { label: 'وزن', w: 175, val: bilty.weight || '', mono: false },
    {
      label: 'کل کرایہ',
      w: 225,
      val: totalFreight > 0 ? totalFreight.toLocaleString('en-PK') : '',
      mono: true,
    },
    {
      label: 'پیشگی',
      w: 210,
      val: advanceVal > 0 ? advanceVal.toLocaleString('en-PK') : '',
      mono: true,
    },
    {
      label: 'کرایہ قابل ادا',
      w: 270,
      val: totalFreight > 0 || payable > 0 ? payable.toLocaleString('en-PK') : '',
      mono: true,
    },
  ];

  const headerH = 52;
  const bodyH = 392;

  // Green header fill + outer table border
  ctx.fillStyle = '#0f7a38';
  ctx.fillRect(innerX, y, innerW, headerH);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(innerX, y, innerW, headerH + bodyH);

  // Realistic Grayscale Truck Watermark across the middle of the table body
  if (truckImg) {
    ctx.save();
    ctx.globalAlpha = 0.2;
    const wmW = 350;
    const wmH = 358;
    const wmX = innerX + (innerW - wmW) / 2;
    const wmY = y + headerH + (bodyH - wmH) / 2 - 4;
    ctx.drawImage(truckImg, wmX, wmY, wmW, wmH);
    ctx.restore();
  }

  let cx = rightEdge;
  let tafseelCellRight = rightEdge;
  let tafseelCellW = 555;

  cols.forEach((col, idx) => {
    if (idx === 1) {
      tafseelCellRight = cx;
      tafseelCellW = col.w;
    }

    // Nastaliq white column header
    ctx.fillStyle = '#ffffff';
    ctx.font = getNastaliqFont(700, 21);
    ctx.textAlign = 'center';
    ctx.fillText(col.label, cx - col.w / 2, y + headerH / 2 + 1);

    // Column dividers
    if (idx < cols.length - 1) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - col.w, y);
      ctx.lineTo(cx - col.w, y + headerH);
      ctx.stroke();

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - col.w, y + headerH);
      ctx.lineTo(cx - col.w, y + headerH + bodyH);
      ctx.stroke();
    }

    // Clean Dark Text for entered values
    ctx.fillStyle = '#0f172a';
    if (col.mono) {
      ctx.font = getMonoFont(700, 30);
      ctx.direction = 'ltr';
      ctx.textAlign = 'center';
      ctx.fillText(col.val, cx - col.w / 2, y + headerH + 66);
      ctx.direction = 'rtl';
    } else {
      ctx.font = getCleanDataFont(700, 25);
      ctx.textAlign = 'center';
      const lines = wrapTextLines(ctx, col.val, col.w - 30, 5);
      lines.forEach((ln, li) => {
        ctx.fillText(ln, cx - col.w / 2, y + headerH + 58 + li * 38);
      });
      if (idx === 1 && bilty.notes) {
        ctx.fillStyle = '#334155';
        ctx.font = getCleanDataFont(400, 17);
        const noteLines = wrapTextLines(ctx, bilty.notes, col.w - 36, 2);
        noteLines.forEach((nl, nli) => {
          ctx.fillText(
            nl,
            cx - col.w / 2,
            y + headerH + 62 + lines.length * 38 + nli * 24
          );
        });
      }
    }

    cx -= col.w;
  });

  // Motto + Manager Signature inside bottom of Tafseel Maal cell (single clean instance)
  const mottoClean = (st.mottoUrdu || '')
    .replace(/\s*[☆★]?\s*دستخط منیجر\s*$/, '')
    .trim();
  const mottoY = y + headerH + bodyH - 22;
  ctx.fillStyle = '#dc2626';
  ctx.font = getNastaliqFont(700, 16);
  ctx.textAlign = 'right';
  ctx.fillText(`${mottoClean} ★`, tafseelCellRight - 14, mottoY);

  ctx.textAlign = 'left';
  ctx.fillText('دستخط منیجر _________', tafseelCellRight - tafseelCellW + 14, mottoY);

  y += headerH + bodyH + 18;

  // ── BOTTOM FOOTER STRIP: TERMS (Right) + PATRON (Left) ──
  const footerH = H - M - 20 - y;
  const patronW = 444;
  const termsW = innerW - patronW - 22;
  const termsX = innerX + patronW + 22;

  // Yellow Terms Box
  ctx.fillStyle = '#fef9c3';
  ctx.fillRect(termsX, y, termsW, footerH);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.strokeRect(termsX, y, termsW, footerH);

  // Vertical/rotated "شرائط:" label on the right side of the yellow box
  const labelStripW = 46;
  ctx.strokeStyle = 'rgba(217,119,6,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(termsX + termsW - labelStripW, y + 8);
  ctx.lineTo(termsX + termsW - labelStripW, y + footerH - 8);
  ctx.stroke();

  ctx.save();
  ctx.translate(termsX + termsW - labelStripW / 2, y + footerH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#dc2626';
  ctx.font = getNastaliqFont(700, 22);
  ctx.textAlign = 'center';
  ctx.fillText('شرائط:', 0, 0);
  ctx.restore();

  // Render ALL 7 clauses across 2 clean columns with full word wrapping (ZERO truncation)
  const termsContentRight = termsX + termsW - labelStripW - 14;
  const colGap = 24;
  const colTermsW = (termsW - labelStripW - 28 - colGap) / 2;

  ctx.fillStyle = '#7f1d1d';
  ctx.font = getNastaliqFont(400, 14);
  ctx.textAlign = 'right';

  const rightClauses = st.termsUrdu.slice(0, 4);
  const leftClauses = st.termsUrdu.slice(4, 7);

  let ry = y + 24;
  for (const clause of rightClauses) {
    const wrapped = wrapAllTextLines(ctx, clause, colTermsW);
    for (const line of wrapped) {
      ctx.fillText(line, termsContentRight, ry);
      ry += 25;
    }
    ry += 2;
  }

  let ly = y + 24;
  const leftColRight = termsContentRight - colTermsW - colGap;
  for (const clause of leftClauses) {
    const wrapped = wrapAllTextLines(ctx, clause, colTermsW);
    for (const line of wrapped) {
      ctx.fillText(line, leftColRight, ly);
      ly += 25;
    }
    ly += 2;
  }

  // Patron Box (Left)
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(innerX, y, patronW, footerH);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.strokeRect(innerX, y, patronW, footerH);

  const pCenter = innerX + patronW / 2;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(pCenter - 110, y + 12, 220, 30);
  ctx.fillStyle = '#ffffff';
  ctx.font = getNastaliqFont(700, 15);
  ctx.textAlign = 'center';
  ctx.fillText(st.patronLabelUrdu, pCenter, y + 27);

  // Patron Name (Red outlined Nastaliq)
  ctx.font = getNastaliqFont(700, 29);
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeText(st.patronNameUrdu, pCenter, y + 70);
  ctx.restore();
  ctx.fillStyle = '#dc2626';
  ctx.fillText(st.patronNameUrdu, pCenter, y + 70);

  // Designation
  ctx.fillStyle = '#0f172a';
  ctx.font = getNastaliqFont(700, 15);
  ctx.fillText(fitText(ctx, st.patronDesignationUrdu, patronW - 20), pCenter, y + 110);

  // Wide bold phone
  ctx.fillStyle = '#0f172a';
  ctx.font = getCleanDataFont(700, 26);
  ctx.direction = 'ltr';
  ctx.fillText(st.patronPhone, pCenter, y + 148);
  ctx.direction = 'rtl';

  // Bottom complaint note
  ctx.fillStyle = '#334155';
  ctx.font = getNastaliqFont(600, 13);
  const noteLines = wrapAllTextLines(ctx, st.patronNoteUrdu, patronW - 24);
  noteLines.slice(0, 2).forEach((nl, nIdx) => {
    ctx.fillText(nl, pCenter, y + 182 + nIdx * 20);
  });

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
