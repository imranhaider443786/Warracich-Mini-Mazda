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
  loadHalftoneTruckCanvas,
  TRUCK_WATERMARK_URL,
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
  return `${weight} ${size}px "Noto Nastaliq Urdu", "Gulzar", "Noto Sans Arabic", serif`;
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
  height = PAGE_H,
  scale = 1
): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d')!;
  if (scale !== 1) {
    ctx.scale(scale, scale);
  }
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
  orientation: 'portrait' | 'landscape' = 'portrait',
  compression: 'NONE' | 'FAST' = 'FAST'
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
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH, undefined, compression);
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
 * Generates an ultra-crisp 300 DPI (3508 x 2480) A4 Landscape Official Urdu PDF
 * matching Warraich Goods Samundri physical stationery edge-to-edge with zero blur.
 */
export async function generateBiltyPdfBlob(
  bilty: BiltyRecord,
  settings: AddaSettings,
  _lang: Language
): Promise<Blob> {
  if (typeof document !== 'undefined' && document.fonts) {
    await Promise.allSettled([
      document.fonts.load('400 18px "Gulzar"'),
      document.fonts.load('400 24px "Gulzar"'),
      document.fonts.load('400 72px "Gulzar"'),
      document.fonts.load('400 18px "Noto Nastaliq Urdu"'),
      document.fonts.load('700 24px "Noto Nastaliq Urdu"'),
      document.fonts.load('700 72px "Noto Nastaliq Urdu"'),
      document.fonts.load('700 32px "Oswald"'),
      document.fonts.load('700 28px "IBM Plex Mono"'),
      document.fonts.load('600 22px "Plus Jakarta Sans"'),
      document.fonts.ready,
    ]);
  }

  const truckRes = await Promise.allSettled([
    loadHalftoneTruckCanvas(TRUCK_WATERMARK_URL),
  ]);
  const truckCanvas =
    truckRes[0].status === 'fulfilled' ? truckRes[0].value : null;

  // Logical A4 landscape coordinates backed by 2x HiDPI (3508 x 2480 = 300 DPI)
  const W = 1754;
  const H = 1240;
  const M = 10;
  const { canvas, ctx } = createPageCanvas('ur', W, H, 2);
  const st = settings.biltyStationery;

  const innerX = M;
  const innerW = W - M * 2; // 1734px edge-to-edge
  const rightEdge = innerX + innerW; // 1744px
  let y = 14;

  // ── TOP BANNER (Compact Proportions Inside A4 Landscape) ──
  const rightHalfW = 985;
  const rightZoneStart = rightEdge - rightHalfW; // 759px
  const leftHalfW = innerW - rightHalfW - 18; // 731px

  // 1) Centered 786 alone at top of right panel
  const sloganClean = (st.topSloganUrdu || '').replace(/[·•]/g, ' ').trim();
  const isDefaultSlogan =
    sloganClean.includes('جیوے') && sloganClean.includes('786');
  const brandCenterX = rightZoneStart + rightHalfW / 2;

  ctx.fillStyle = '#0f172a';
  if (isDefaultSlogan || sloganClean.includes('786')) {
    ctx.font = getCleanDataFont(700, 28);
    ctx.direction = 'ltr';
    ctx.textAlign = 'center';
    ctx.fillText('786', brandCenterX, y + 18);
    ctx.direction = 'rtl';
  } else {
    ctx.font = getNastaliqFont(700, 20);
    ctx.textAlign = 'center';
    ctx.fillText(st.topSloganUrdu, brandCenterX, y + 18);
  }

  // 2) Masthead Row: Small جیوے (right, upper corner of وڑائچ) + Wide Business Name + Small رجسٹرڈ (left, upper corner of گڈز)
  const mastheadY = y + 90;
  const titleTrimmed = (st.brandTitleUrdu || '').trim();
  const hasSamundriSuffix =
    titleTrimmed.endsWith('سمندری') && titleTrimmed.length > 7;
  const mainMasthead = hasSamundriSuffix
    ? titleTrimmed.slice(0, titleTrimmed.length - 'سمندری'.length).trim()
    : titleTrimmed;
  const citySuffix = hasSamundriSuffix ? 'سمندری' : '';

  ctx.fillStyle = '#0f172a';
  ctx.font = getNastaliqFont(700, 24);
  const jeewayW = ctx.measureText('جیوے').width;
  const regW = ctx.measureText('رجسٹرڈ').width;

  ctx.textAlign = 'right';
  ctx.fillText('جیوے', rightEdge - 4, mastheadY - 22);
  ctx.textAlign = 'left';
  ctx.fillText('رجسٹرڈ', rightZoneStart + 4, mastheadY - 22);

  const mastheadLeftBound = rightZoneStart + regW + 18;
  const mastheadRightBound = rightEdge - jeewayW - 18;
  const mastheadCenterX = (mastheadLeftBound + mastheadRightBound) / 2;
  const targetMastheadW = Math.max(220, mastheadRightBound - mastheadLeftBound);

  ctx.save();
  ctx.translate(mastheadCenterX, mastheadY);
  ctx.rotate(-0.008);

  let mastFontSize = 62;
  const gapW = 14;
  const measureHeadline = (sz: number) => {
    ctx.font = getNastaliqFont(700, sz);
    const mW = ctx.measureText(mainMasthead).width;
    let cW = 0;
    if (citySuffix) {
      ctx.font = getNastaliqFont(700, Math.round(sz * 0.72));
      cW = ctx.measureText(citySuffix).width + gapW;
    }
    return {
      mW,
      cW,
      total: mW + cW,
    };
  };

  let dims = measureHeadline(mastFontSize);
  if (dims.total > targetMastheadW) {
    mastFontSize = Math.max(
      46,
      Math.floor(mastFontSize * (targetMastheadW / Math.max(1, dims.total)))
    );
    dims = measureHeadline(mastFontSize);
  }
  const stretchX = Math.max(
    0.88,
    Math.min(1.74, targetMastheadW / Math.max(1, dims.total))
  );
  ctx.scale(stretchX, 1);

  const startRight = dims.total / 2;
  const mainCenterX = startRight - dims.mW / 2;
  const cityCenterX =
    startRight - dims.mW - (dims.cW > 0 ? dims.cW / 2 : 0);

  ctx.font = getNastaliqFont(700, mastFontSize);
  ctx.textAlign = 'center';

  // Standout Business Name: Deep Crimson fill (#991b1b) + Thick Gold-Yellow outline (#fde047) + Dark 3D shadow
  ctx.save();
  ctx.shadowColor = '#0f172a';
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 10.5;
  ctx.lineJoin = 'round';
  ctx.strokeText(mainMasthead, mainCenterX, 0);
  ctx.restore();
  ctx.fillStyle = '#991b1b';
  ctx.fillText(mainMasthead, mainCenterX, 0);

  if (citySuffix) {
    ctx.font = getNastaliqFont(700, Math.round(mastFontSize * 0.72));
    ctx.save();
    ctx.shadowColor = '#0f172a';
    ctx.shadowOffsetX = 2.5;
    ctx.shadowOffsetY = 2.5;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4.5;
    ctx.lineJoin = 'round';
    ctx.strokeText(citySuffix, cityCenterX, 6);
    ctx.restore();
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(citySuffix, cityCenterX, 6);
  }

  ctx.restore();

  // 3) Deduplicated Subtitle flanked by triple horizontal rules
  const subY = y + 174;
  const subtitleClean = (st.brandSubtitleUrdu || '')
    .trim()
    .replace(/^گڈز\s+/, '');
  ctx.fillStyle = '#0f172a';
  ctx.font = getNastaliqFont(700, 19.5);
  ctx.textAlign = 'center';
  const subText = fitText(ctx, subtitleClean, rightHalfW - 140);
  const subTextW = ctx.measureText(subText).width;
  ctx.fillText(subText, brandCenterX, subY);

  const ruleGap = 14;
  const leftRuleEnd = brandCenterX - subTextW / 2 - ruleGap;
  const rightRuleStart = brandCenterX + subTextW / 2 + ruleGap;
  [-5, 0, 5].forEach((offset, i) => {
    ctx.strokeStyle = '#0f172a';
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

  // 4) Left Side Contact Cards (Edge-Fitted Imran Haider Box + Shorter Compact Paired Stickers)
  const badgeColW = 240; // Shorter/narrower compact sticker column
  const yellowW = leftHalfW - badgeColW - 12; // ~479px
  const yellowX = innerX + badgeColW + 12;
  const bannerBoxH = 188;

  // Yellow Box: Title & Numbers stretched edge-to-edge across box width
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(yellowX, y, yellowW, bannerBoxH);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.strokeRect(yellowX, y, yellowW, bannerBoxH);

  ctx.font = getNastaliqFont(700, 21.5);
  const rawTitleW = Math.max(1, ctx.measureText(st.primaryContactTitle).width);
  const titleScaleX = Math.max(0.88, Math.min(1.55, (yellowW - 14) / rawTitleW));
  ctx.save();
  ctx.translate(yellowX + yellowW / 2, y + 19);
  ctx.scale(titleScaleX, 1);
  ctx.fillStyle = '#dc2626';
  ctx.textAlign = 'center';
  ctx.fillText(st.primaryContactTitle, 0, 0);
  ctx.restore();

  ctx.fillStyle = '#dc2626';
  ctx.direction = 'ltr';
  st.primaryContactPhones.slice(0, 4).forEach((ph, idx) => {
    const py = y + 54 + idx * 36;
    ctx.font = getCondensedFont(700, 36);
    const numW = Math.max(1, ctx.measureText(ph).width);
    const numScaleX = Math.max(0.95, Math.min(1.68, (yellowW - 14) / numW));
    ctx.save();
    ctx.translate(yellowX + yellowW / 2, py);
    ctx.scale(numScaleX, 1);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#dc2626';
    ctx.fillText(ph, 0, 0);
    ctx.restore();
  });
  ctx.direction = 'rtl';

  // Paired Shorter Double-Bordered Rounded Rectangle Stickers (Red 43 Group Top + Green 24hr Service Bottom)
  const drawDoubleSticker = (
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    bgColor: string
  ) => {
    ctx.save();
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.roundRect(sx + 1.5, sy + 1.5, sw - 3, sh - 3, 11);
    ctx.stroke();

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(sx + 4.5, sy + 4.5, sw - 9, sh - 9, 8);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(sx + 5, sy + 5, sw - 10, sh - 10, 8);
    ctx.stroke();
    ctx.restore();
  };

  const stickerGap = 8;
  const stickerH = (bannerBoxH - stickerGap) / 2; // 90px each
  const badgeCx = innerX + badgeColW / 2;

  // Top Sticker: 43 گروپ قلندر پاک زندہ باد (Red)
  drawDoubleSticker(innerX, y, badgeColW, stickerH, '#dc2626');
  const groupText = (st.groupBadgeUrdu || '').trim();
  const groupParts = groupText.startsWith('43 گروپ')
    ? ['43 گروپ', groupText.slice('43 گروپ'.length).trim()]
    : [groupText];
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  if (groupParts.length === 2) {
    ctx.font = getNastaliqFont(700, 17);
    ctx.fillText(groupParts[0], badgeCx, y + stickerH / 2 - 15);
    ctx.font = getNastaliqFont(700, 15.5);
    ctx.fillText(
      fitText(ctx, groupParts[1], badgeColW - 22),
      badgeCx,
      y + stickerH / 2 + 15
    );
  } else {
    ctx.font = getNastaliqFont(700, 16.5);
    ctx.fillText(
      fitText(ctx, groupText, badgeColW - 22),
      badgeCx,
      y + stickerH / 2
    );
  }

  // Bottom Sticker: 24 گھنٹے سروس (Green, equal height)
  const sy2 = y + stickerH + stickerGap;
  drawDoubleSticker(innerX, sy2, badgeColW, stickerH, '#0f7a38');
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = getCleanDataFont(700, 24);
  ctx.fillText('24', badgeCx, sy2 + stickerH / 2 - 14);
  ctx.font = getNastaliqFont(700, 16.5);
  ctx.fillText('گھنٹے سروس', badgeCx, sy2 + stickerH / 2 + 16);

  y += bannerBoxH + 16;

  // ── COMPACT PHYSICAL-PAD METADATA LAYOUT ──
  const drawFieldLine = (
    xStartRight: number,
    width: number,
    yPos: number,
    label: string,
    val: string,
    mono = false,
    drawUnderline = true
  ) => {
    ctx.fillStyle = '#dc2626';
    ctx.font = getNastaliqFont(700, 20);
    ctx.textAlign = 'right';
    ctx.fillText(label, xStartRight, yPos);
    const labelW = ctx.measureText(label).width + 12;

    ctx.fillStyle = '#0f172a';
    ctx.font = mono ? getMonoFont(700, 22) : getCleanDataFont(700, 22);
    if (mono) ctx.direction = 'ltr';
    ctx.textAlign = mono ? 'left' : 'right';
    const valX = mono ? xStartRight - width + 10 : xStartRight - labelW;
    ctx.fillText(fitText(ctx, val || '', width - labelW - 14), valX, yPos);
    ctx.direction = 'rtl';

    if (drawUnderline) {
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xStartRight - width + 10, yPos + 18);
      ctx.lineTo(xStartRight, yPos + 18);
      ctx.stroke();
    }
  };

  // Upper 2-Column Split:
  // Right Half (845px): Bilty No on line 1, Az + Ta on line 2
  // Left Half (856px): Date + Gari No on line 1, Double-bordered Green Driver Box on line 2
  const rightMetaW = 845;
  const leftMetaW = innerW - rightMetaW - 25; // 856px

  // Line 1: Right = Bilty No (no colon, no underline) | Left = Date + Gari No
  drawFieldLine(rightEdge, 320, y, 'بلٹی نمبر', bilty.biltyNumber, true, false);
  drawFieldLine(innerX + leftMetaW, 410, y, 'تاریخ:', bilty.date, true);
  drawFieldLine(innerX + 425, 425, y, 'گاڑی نمبر:', bilty.gariNumber, true);

  y += 46;

  // Line 2: Right = Az + Ta | Left = Cream Double-Bordered 2-Line Driver Box
  drawFieldLine(rightEdge, 410, y + 4, 'از:', bilty.fromCity);
  drawFieldLine(rightEdge - 430, 415, y + 4, 'تا:', bilty.toCity);

  // Cream Double-Bordered 2-Line Driver Box
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(innerX, y - 22, leftMetaW, 52);
  ctx.fillStyle = '#fef9c3';
  ctx.fillRect(innerX + 3, y - 19, leftMetaW - 6, 46);
  ctx.strokeRect(innerX + 3, y - 19, leftMetaW - 6, 46);

  ctx.fillStyle = '#dc2626';
  ctx.font = getNastaliqFont(700, 15.5);
  ctx.textAlign = 'right';
  ctx.fillText('ڈرائیور کا نام', innerX + leftMetaW - 14, y - 6);
  ctx.fillText('اور موبائل نمبر:', innerX + leftMetaW - 14, y + 15);
  const drvLblW = 148;

  const drvLineLeft = innerX + 16;
  const drvLineRight = innerX + leftMetaW - drvLblW;
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(drvLineLeft, y - 1);
  ctx.lineTo(drvLineRight, y - 1);
  ctx.moveTo(drvLineLeft, y + 19);
  ctx.lineTo(drvLineRight, y + 19);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = getCleanDataFont(700, 19);
  ctx.fillText(
    fitText(
      ctx,
      [bilty.driverName, bilty.driverPhone].filter(Boolean).join(' · '),
      drvLineRight - drvLineLeft - 8
    ),
    drvLineRight,
    y - 9
  );

  y += 56;

  // Line 3: Side-by-Side Sender (بھیجنے والے:) + Receiver (وصول کرنے والے:) with IDENTICAL Blank Line Lengths
  const halfMetaW = (innerW - 24) / 2;
  const drawMatchedPartyField = (
    xStartRight: number,
    width: number,
    yPos: number,
    label: string,
    val: string
  ) => {
    const fixedLabelSlot = 136;
    ctx.fillStyle = '#dc2626';
    ctx.font = getNastaliqFont(700, 19);
    ctx.textAlign = 'right';
    ctx.fillText(label, xStartRight, yPos);

    const lineRight = xStartRight - fixedLabelSlot;
    const lineLeft = xStartRight - width + 10;

    ctx.fillStyle = '#0f172a';
    ctx.font = getCleanDataFont(700, 21);
    ctx.fillText(fitText(ctx, val || '', lineRight - lineLeft - 8), lineRight, yPos);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(lineLeft, yPos + 16);
    ctx.lineTo(lineRight, yPos + 16);
    ctx.stroke();
  };

  drawMatchedPartyField(
    rightEdge,
    halfMetaW,
    y,
    'بھیجنے والے:',
    [bilty.senderName, bilty.senderPhone].filter(Boolean).join(' · ')
  );
  drawMatchedPartyField(
    innerX + halfMetaW,
    halfMetaW,
    y,
    'وصول کرنے والے:',
    [bilty.receiverName, bilty.receiverPhone].filter(Boolean).join(' · ')
  );

  y += 26;

  // ── 6-COLUMN GREEN CONSIGNMENT TABLE (All 6 columns ALWAYS visible, total = 1726px) ──
  const totalFreight = Number(bilty.freightAmount) || 0;
  const advanceVal = Number(bilty.advancePaid) || 0;
  const payable = Math.max(0, totalFreight - advanceVal);

  const cols = [
    { label: 'تعداد', w: 172, val: bilty.packagesCount || '', mono: false },
    { label: 'تفصیل مال', w: 536, val: bilty.goodsDescription || '', mono: false },
    { label: 'وزن', w: 156, val: bilty.weight || '', mono: false },
    {
      label: 'کل کرایہ',
      w: 225,
      val: totalFreight > 0 ? totalFreight.toLocaleString('en-PK') : '',
      mono: true,
    },
    {
      label: 'پیشگی',
      w: 207,
      val: advanceVal > 0 ? advanceVal.toLocaleString('en-PK') : '',
      mono: true,
    },
    {
      label: 'کرایہ قابل ادا',
      w: 430,
      val: totalFreight > 0 || payable > 0 ? payable.toLocaleString('en-PK') : '',
      mono: true,
    },
  ];

  const headerH = 48;
  const bodyH = 384; // Shorter freight table height inside A4 Landscape

  // Green header fill + outer table border
  ctx.fillStyle = '#0f7a38';
  ctx.fillRect(innerX, y, innerW, headerH);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(innerX, y, innerW, headerH + bodyH);

  // Realistic Halftone Grayscale Truck Watermark spanning Tafseel Maal & Wazan center boundary
  if (truckCanvas) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    const wmSize = Math.min(310, bodyH - 16);
    const wmCenterX = rightEdge - (172 + 536 + 34);
    const wmX = wmCenterX - wmSize / 2;
    const wmY = y + headerH + (bodyH - wmSize) / 2 - 4;
    ctx.drawImage(truckCanvas, wmX, wmY, wmSize, wmSize);
    ctx.restore();
  }

  let cx = rightEdge;
  let tafseelCellRight = rightEdge;
  let tafseelCellW = 536;

  cols.forEach((col, idx) => {
    if (idx === 1) {
      tafseelCellRight = cx;
      tafseelCellW = col.w;
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = getNastaliqFont(700, 23);
    ctx.textAlign = 'center';
    ctx.fillText(col.label, cx - col.w / 2, y + headerH / 2 + 1);

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

    ctx.fillStyle = '#0f172a';
    if (col.mono) {
      ctx.font = getMonoFont(700, 32);
      ctx.direction = 'ltr';
      ctx.textAlign = 'center';
      ctx.fillText(col.val, cx - col.w / 2, y + headerH + 74);
      ctx.direction = 'rtl';
    } else {
      ctx.font = getCleanDataFont(700, 27);
      ctx.textAlign = 'center';
      const maxGoodsLines = Math.max(1, Math.floor((bodyH - 125) / 42));
      const lines = wrapTextLines(ctx, col.val, col.w - 30, maxGoodsLines);
      lines.forEach((ln, li) => {
        ctx.fillText(ln, cx - col.w / 2, y + headerH + 66 + li * 42);
      });
      if (idx === 1 && bilty.notes) {
        const noteStartY = y + headerH + 74 + lines.length * 42;
        if (noteStartY < y + headerH + bodyH - 58) {
          ctx.fillStyle = '#334155';
          ctx.font = getCleanDataFont(400, 17);
          const noteLines = wrapTextLines(ctx, bilty.notes, col.w - 36, 2);
          noteLines.forEach((nl, nli) => {
            const ny = noteStartY + nli * 24;
            if (ny < y + headerH + bodyH - 44) {
              ctx.fillText(nl, cx - col.w / 2, ny);
            }
          });
        }
      }
    }

    cx -= col.w;
  });

  // Motto + Manager Signature inside bottom of Tafseel Maal cell (single clean instance)
  const mottoClean = (st.mottoUrdu || '')
    .replace(/\s*[☆★]?\s*دستخط منیجر\s*$/, '')
    .trim();
  const mottoY = y + headerH + bodyH - 20;
  ctx.fillStyle = '#dc2626';
  ctx.font = getNastaliqFont(700, 17);
  ctx.textAlign = 'right';
  ctx.fillText(`${mottoClean} ★`, tafseelCellRight - 14, mottoY);

  ctx.textAlign = 'left';
  ctx.fillText('دستخط منیجر _________', tafseelCellRight - tafseelCellW + 14, mottoY);

  y += headerH + bodyH + 10;

  // ── SHORTER COMPACT FOOTER: TOP-RIGHT BOLD شرائط + BOLD FLOWING PARAGRAPH + PATRON BOX ──
  const footerH = 166;
  const patronW = 450;
  const termsW = innerW - patronW - 16;
  const termsX = innerX + patronW + 16;

  // Yellow Terms Box (Shorter Height)
  ctx.fillStyle = '#fef9c3';
  ctx.fillRect(termsX, y, termsW, footerH);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.strokeRect(termsX, y, termsW, footerH);

  // Top-right BOLD "شرائط:" label
  ctx.fillStyle = '#dc2626';
  ctx.font = getNastaliqFont(700, 18.5);
  ctx.textAlign = 'right';
  ctx.fillText('شرائط:', termsX + termsW - 14, y + 20);

  // Compact Flowing Bold Paragraph for all 7 clauses (line 1 clears top-right "شرائط:")
  const termsContentRight = termsX + termsW - 14;
  const fullTermsW = termsW - 28;
  const firstLineIndent = 72;
  const allTermsText = st.termsUrdu.join('  ');

  const wrapIndentedBoldParagraph = (fontSize: number) => {
    ctx.font = getNastaliqFont(700, fontSize);
    const words = allTermsText.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const limit = lines.length === 0 ? fullTermsW - firstLineIndent : fullTermsW;
      const next = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(next).width <= limit) {
        cur = next;
      } else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  };

  let termFontSize = 14.2;
  let wrappedParagraph = wrapIndentedBoldParagraph(termFontSize);
  while (wrappedParagraph.length > 5 && termFontSize > 11.5) {
    termFontSize = Number((termFontSize - 0.6).toFixed(1));
    wrappedParagraph = wrapIndentedBoldParagraph(termFontSize);
  }

  ctx.fillStyle = '#7f1d1d';
  ctx.font = getNastaliqFont(700, termFontSize);
  ctx.textAlign = 'right';
  const pLineStep = Math.min(34, Math.floor((footerH - 22) / Math.max(1, wrappedParagraph.length)));
  wrappedParagraph.forEach((line, lIdx) => {
    const ty = y + 20 + lIdx * pLineStep;
    if (ty <= y + footerH - 8) {
      const rx = lIdx === 0 ? termsContentRight - firstLineIndent : termsContentRight;
      ctx.fillText(line, rx, ty);
    }
  });

  // Patron Box (Left) matching shorter footer height
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(innerX, y, patronW, footerH);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.strokeRect(innerX, y, patronW, footerH);

  const pCenter = innerX + patronW / 2;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(pCenter - 110, y + 8, 220, 26);
  ctx.fillStyle = '#ffffff';
  ctx.font = getNastaliqFont(700, 14);
  ctx.textAlign = 'center';
  ctx.fillText(st.patronLabelUrdu, pCenter, y + 21);

  ctx.font = getNastaliqFont(700, 25);
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';
  ctx.strokeText(st.patronNameUrdu, pCenter, y + 57);
  ctx.restore();
  ctx.fillStyle = '#dc2626';
  ctx.fillText(st.patronNameUrdu, pCenter, y + 57);

  ctx.fillStyle = '#0f172a';
  ctx.font = getNastaliqFont(700, 13.5);
  ctx.fillText(fitText(ctx, st.patronDesignationUrdu, patronW - 20), pCenter, y + 92);

  ctx.fillStyle = '#0f172a';
  ctx.font = getCleanDataFont(700, 22);
  ctx.direction = 'ltr';
  ctx.fillText(st.patronPhone, pCenter, y + 122);
  ctx.direction = 'rtl';

  ctx.fillStyle = '#334155';
  ctx.font = getNastaliqFont(600, 12);
  ctx.fillText(fitText(ctx, st.patronNoteUrdu, patronW - 18), pCenter, y + 148);

  return canvasesToPdfBlob([canvas], 'landscape', 'NONE');
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
