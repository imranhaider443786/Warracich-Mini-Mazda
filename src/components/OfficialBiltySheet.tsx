import React, { useEffect, useRef, useState } from 'react';
import {
  loadHalftoneTruckDataUrl,
  TRUCK_WATERMARK_URL,
} from '../services/biltyArtwork';
import { AddaSettings, BiltyRecord } from '../types';

interface OfficialBiltySheetProps {
  bilty: BiltyRecord;
  settings: AddaSettings;
}

const SHEET_WIDTH = 794; // 210mm @ 96 DPI (A4 Portrait width)
const SHEET_HEIGHT = 1123; // 297mm @ 96 DPI (Full A4 Portrait height)

const DualOutlineUrdu: React.FC<{
  text: string;
  sizeClass: string;
  backClass?: string;
  frontColorClass?: string;
}> = ({
  text,
  sizeClass,
  backClass = 'bilty-outline-back-sm',
  frontColorClass = 'text-[#dc2626]',
}) => (
  <span className={`relative inline-block ${sizeClass}`}>
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 select-none ${backClass}`}
    >
      {text}
    </span>
    <span className={`relative z-10 ${frontColorClass}`}>{text}</span>
  </span>
);

export const OfficialBiltySheet: React.FC<OfficialBiltySheetProps> = ({
  bilty,
  settings,
}) => {
  const scalerRef = useRef<HTMLDivElement | null>(null);
  const mastheadBoxRef = useRef<HTMLDivElement | null>(null);
  const mastheadTextRef = useRef<HTMLDivElement | null>(null);
  const imranBoxRef = useRef<HTMLDivElement | null>(null);
  const imranTitleRef = useRef<HTMLDivElement | null>(null);
  const imranNumRef = useRef<HTMLSpanElement | null>(null);
  const termsBoxRef = useRef<HTMLDivElement | null>(null);
  const termLineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const patronBoxRef = useRef<HTMLDivElement | null>(null);
  const patronNameRef = useRef<HTMLSpanElement | null>(null);
  const patronUnionLineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const patronPhoneRef = useRef<HTMLSpanElement | null>(null);

  const [scale, setScale] = useState(1);
  const [mastheadScaleX, setMastheadScaleX] = useState(1);
  const [imranTitleScaleX, setImranTitleScaleX] = useState(1);
  const [imranNumScaleX, setImranNumScaleX] = useState(1.1);
  const [termLineScales, setTermLineScales] = useState<number[]>([]);
  const [patronNameScaleX, setPatronNameScaleX] = useState(1);
  const [patronUnionScales, setPatronUnionScales] = useState<number[]>([1, 1]);
  const [patronPhoneScaleX, setPatronPhoneScaleX] = useState(1);
  const [truckUrl, setTruckUrl] = useState<string>(TRUCK_WATERMARK_URL);

  const st = settings.biltyStationery;
  const patronUnionLines = (st.patronDesignationUrdu || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  useEffect(() => {
    let active = true;
    loadHalftoneTruckDataUrl(TRUCK_WATERMARK_URL)
      .then((url) => {
        if (active && url) setTruckUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const el = scalerRef.current;
    if (!el) return;

    const updateScale = () => {
      const available = el.clientWidth;
      if (available > 0) {
        setScale(Math.min(1, available / SHEET_WIDTH));
      }
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    window.addEventListener('resize', updateScale);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const measureFits = () => {
      if (cancelled) return;

      const box = mastheadBoxRef.current;
      const txt = mastheadTextRef.current;
      if (box && txt && box.clientWidth > 0 && txt.scrollWidth > 0) {
        const targetW = box.clientWidth * 0.99;
        setMastheadScaleX(
          Math.max(0.72, Math.min(2.05, targetW / txt.scrollWidth))
        );
      }

      const iBox = imranBoxRef.current;
      const iTitle = imranTitleRef.current;
      const iNum = imranNumRef.current;
      if (iBox && iBox.clientWidth > 20) {
        const usableW = iBox.clientWidth - 6;
        if (iTitle && iTitle.scrollWidth > 0) {
          setImranTitleScaleX(
            Math.max(0.75, Math.min(2.0, usableW / iTitle.scrollWidth))
          );
        }
        if (iNum && iNum.scrollWidth > 0) {
          setImranNumScaleX(
            Math.max(0.85, Math.min(2.2, usableW / iNum.scrollWidth))
          );
        }
      }

      const tBox = termsBoxRef.current;
      if (tBox && tBox.clientWidth > 40) {
        const usableTermW = tBox.clientWidth - 2;
        const nextScales = st.termsUrdu.map((_, idx) => {
          const spanEl = termLineRefs.current[idx];
          if (!spanEl || spanEl.scrollWidth <= 0) return 1;
          if (spanEl.scrollWidth <= usableTermW) return 1;
          return Math.max(0.55, usableTermW / spanEl.scrollWidth);
        });
        setTermLineScales(nextScales);
      }

      const pBox = patronBoxRef.current;
      if (pBox && pBox.clientWidth > 40) {
        const usablePatronW = pBox.clientWidth - 16;
        const pName = patronNameRef.current;
        if (pName && pName.scrollWidth > 0) {
          setPatronNameScaleX(
            Math.max(0.75, Math.min(1.75, (usablePatronW * 0.96) / pName.scrollWidth))
          );
        }

        const unionCount = (st.patronDesignationUrdu || '')
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean).length;
        const nextUnionScales = Array.from({ length: unionCount }, (_, idx) => {
          const uEl = patronUnionLineRefs.current[idx];
          if (!uEl || uEl.scrollWidth <= 0) return 1;
          if (uEl.scrollWidth <= usablePatronW * 0.97) return 1;
          return Math.max(0.6, (usablePatronW * 0.97) / uEl.scrollWidth);
        });
        setPatronUnionScales(nextUnionScales);

        const pPhone = patronPhoneRef.current;
        if (pPhone && pPhone.scrollWidth > 0) {
          setPatronPhoneScaleX(
            Math.max(0.85, Math.min(1.9, (usablePatronW * 0.96) / pPhone.scrollWidth))
          );
        }
      }
    };

    measureFits();
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(measureFits);
    }
    const raf = requestAnimationFrame(measureFits);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [
    st.brandTitleUrdu,
    st.primaryContactTitle,
    st.primaryContactPhones,
    st.termsUrdu,
    st.patronLabelUrdu,
    st.patronNameUrdu,
    st.patronDesignationUrdu,
    st.patronPhone,
    st.patronNoteUrdu,
  ]);

  const totalFreight = Number(bilty.freightAmount) || 0;
  const advanceVal = Number(bilty.advancePaid) || 0;
  const payable = Math.max(0, totalFreight - advanceVal);

  const titleTrimmed = (st.brandTitleUrdu || '').trim();
  const hasSamundriSuffix =
    titleTrimmed.endsWith('سمندری') && titleTrimmed.length > 7;
  const mainMasthead = hasSamundriSuffix
    ? titleTrimmed.slice(0, titleTrimmed.length - 'سمندری'.length).trim()
    : titleTrimmed;
  const citySuffix = hasSamundriSuffix ? 'سمندری' : '';

  const subtitleClean = (st.brandSubtitleUrdu || '')
    .trim()
    .replace(/^گڈز\s+/, '');

  const mottoClean = (st.mottoUrdu || '')
    .replace(/\s*[☆★]?\s*دستخط منیجر\s*$/, '')
    .trim();

  const groupText = (st.groupBadgeUrdu || '').trim();
  const groupParts = groupText.startsWith('43 گروپ')
    ? ['43 گروپ', groupText.slice('43 گروپ'.length).trim()]
    : [groupText];

  const sloganClean = (st.topSloganUrdu || '').replace(/[·•]/g, ' ').trim();
  const isDefaultSlogan =
    sloganClean.includes('جیوے') && sloganClean.includes('786');

  return (
    <div
      ref={scalerRef}
      dir="ltr"
      className="print-sheet-scaler relative mx-auto w-full max-w-[794px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100/60 shadow-xs print:max-w-none print:rounded-none print:border-0 print:bg-white print:shadow-none"
      style={{ height: `${Math.round(SHEET_HEIGHT * scale)}px` }}
    >
      <div
        dir="rtl"
        className="print-surface absolute top-0 left-1/2 flex flex-col bg-white px-3 pt-2.5 pb-2.5 text-slate-900"
        style={{
          width: `${SHEET_WIDTH}px`,
          height: `${SHEET_HEIGHT}px`,
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        {/* Top Stationery Banner (Same Side-by-Side Placement Scaled Cleanly for A4 Portrait) */}
        <div className="grid grid-cols-12 items-stretch gap-2 pb-1">
          {/* Right Side: Centered 786 Alone, Masthead with جیوے & رجسٹرڈ Flanking Business Name, Deduplicated Subtitle */}
          <div className="col-span-7 flex flex-col justify-between">
            {/* Top Row: Centered 786 alone */}
            <div className="flex items-center justify-center">
              {isDefaultSlogan || sloganClean.includes('786') ? (
                <span
                  className="font-sans text-[16px] font-black leading-none tracking-wide text-slate-900 tabular-nums"
                  dir="ltr"
                >
                  786
                </span>
              ) : (
                <span className="font-nastaliq text-[11px] font-bold leading-[1.35] text-slate-900">
                  {st.topSloganUrdu}
                </span>
              )}
            </div>

            {/* Masthead Block: جیوے above start of وڑائچ, رجسٹرڈ above end of گڈز, Full-Width Business Name */}
            <div className="relative w-full pt-2.5">
              <span className="font-nastaliq pointer-events-none absolute top-0 right-0.5 z-20 text-[12px] font-bold leading-none text-slate-900">
                جیوے
              </span>
              <span className="font-nastaliq pointer-events-none absolute top-0 left-0.5 z-20 text-[12px] font-bold leading-none text-slate-900">
                رجسٹرڈ
              </span>

              <div
                ref={mastheadBoxRef}
                className="flex w-full items-center justify-center overflow-visible"
              >
                <div
                  ref={mastheadTextRef}
                  className="inline-flex origin-center items-baseline justify-center gap-1.5 whitespace-nowrap"
                  style={{
                    transform: `rotate(-0.4deg) scaleX(${mastheadScaleX})`,
                  }}
                >
                  <h2 className="font-nastaliq font-bold leading-[1.28]">
                    <DualOutlineUrdu
                      text={mainMasthead}
                      sizeClass="text-[29px]"
                      backClass="bilty-outline-back-lg"
                      frontColorClass="bilty-masthead-yellow-bold"
                    />
                  </h2>
                  {citySuffix && (
                    <span className="bilty-masthead-outline font-nastaliq text-[21px] font-bold leading-[1.28]">
                      {citySuffix}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Triple-Rule Deduplicated Subtitle */}
            <div className="flex items-center gap-1.5">
              <div className="flex min-w-[14px] flex-1 flex-col gap-[2px]">
                <span className="h-[1.5px] w-full bg-slate-900" />
                <span className="h-[1px] w-full bg-slate-700" />
                <span className="h-[1.5px] w-full bg-slate-900" />
              </div>
              <div className="font-nastaliq shrink-0 text-center text-[9.2px] font-bold leading-[1.55] text-slate-900">
                {subtitleClean}
              </div>
              <div className="flex min-w-[14px] flex-1 flex-col gap-[2px]">
                <span className="h-[1.5px] w-full bg-slate-900" />
                <span className="h-[1px] w-full bg-slate-700" />
                <span className="h-[1.5px] w-full bg-slate-900" />
              </div>
            </div>
          </div>

          {/* Left Side: Width-Edge Fitted Yellow Imran Haider Box + Double-Bordered Paired Stickers */}
          <div className="col-span-5 grid grid-cols-12 gap-1.5">
            <div
              ref={imranBoxRef}
              className="col-span-8 flex h-[126px] flex-col justify-between overflow-hidden border-[1.5px] border-[#d97706] bg-[#fef3c7] px-1 pt-1 pb-1 text-center"
            >
              <div className="flex shrink-0 items-center justify-center overflow-hidden pb-1">
                <div
                  ref={imranTitleRef}
                  className="font-nastaliq inline-block origin-center whitespace-nowrap text-[11px] font-bold leading-[1.55] text-[#dc2626]"
                  style={{ transform: `scaleX(${imranTitleScaleX})` }}
                >
                  {st.primaryContactTitle}
                </div>
              </div>
              <div
                className="flex flex-1 flex-col justify-between pt-0.5 font-condensed text-[20px] font-bold leading-[0.95] tracking-tight text-[#dc2626] tabular-nums"
                dir="ltr"
              >
                {st.primaryContactPhones.map((ph, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-center overflow-hidden"
                  >
                    <span
                      ref={idx === 0 ? imranNumRef : undefined}
                      className="inline-block origin-center whitespace-nowrap"
                      style={{ transform: `scaleX(${imranNumScaleX})` }}
                    >
                      {ph}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-4 flex h-[126px] flex-col justify-between gap-1">
              {/* Top Sticker: 43 Group (Double-Bordered Red Rounded Rectangle) */}
              <div className="flex flex-1 rounded-md border-2 border-[#dc2626] p-[1.5px]">
                <div className="flex w-full flex-col items-center justify-center rounded-[4px] border border-white/95 bg-[#dc2626] px-1 py-0.5 text-center text-white">
                  {groupParts.map((part, idx) => (
                    <span
                      key={idx}
                      className={`font-nastaliq font-bold leading-[1.3] ${
                        idx === 0 ? 'text-[9.5px]' : 'text-[8px]'
                      }`}
                    >
                      {part}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Sticker: 24 Hours Service (Equal-Height Double-Bordered Green Rounded Rectangle) */}
              <div className="flex flex-1 rounded-md border-2 border-[#0f7a38] p-[1.5px]">
                <div className="flex w-full flex-col items-center justify-center rounded-[4px] border border-white/95 bg-[#0f7a38] px-1 py-0.5 text-center text-white">
                  <span className="font-sans text-[13px] font-black leading-none tracking-wide">
                    24
                  </span>
                  <span className="font-nastaliq mt-0.5 text-[8.8px] font-bold leading-[1.3]">
                    گھنٹے سروس
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Physical-Pad Metadata Grid (Same Placement & Equal Blank Lines) */}
        <div className="mt-1.5 space-y-1.5 text-xs text-slate-900">
          <div className="grid grid-cols-12 items-start gap-2.5">
            {/* Right Zone: Bilty No + Az / Ta */}
            <div className="col-span-6 space-y-1.5 pt-0.5">
              <div className="flex items-baseline gap-2.5">
                <span className="font-nastaliq shrink-0 text-[11.5px] font-bold leading-[1.65] text-slate-800">
                  بلٹی نمبر
                </span>
                <span
                  className="font-mono text-[15px] font-extrabold text-slate-900 tabular-nums"
                  dir="ltr"
                >
                  {bilty.biltyNumber}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
                  <span className="font-nastaliq shrink-0 text-[11px] font-bold leading-[1.65] text-[#dc2626]">
                    از:
                  </span>
                  <span className="truncate font-sans text-[12px] font-bold text-slate-900">
                    {bilty.fromCity || ''}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
                  <span className="font-nastaliq shrink-0 text-[11px] font-bold leading-[1.65] text-[#dc2626]">
                    تا:
                  </span>
                  <span className="truncate font-sans text-[12px] font-bold text-slate-900">
                    {bilty.toCity || ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Left Zone: Date + Gari No on top, Cream Double-Bordered 2-Line Driver Box below */}
            <div className="col-span-6 space-y-1">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
                  <span className="font-nastaliq shrink-0 text-[11px] font-bold leading-[1.65] text-[#dc2626]">
                    تاریخ:
                  </span>
                  <span
                    className="truncate font-mono text-[11.5px] font-bold text-slate-900 tabular-nums"
                    dir="ltr"
                  >
                    {bilty.date || ''}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
                  <span className="font-nastaliq shrink-0 text-[11px] font-bold leading-[1.65] text-[#dc2626]">
                    گاڑی نمبر:
                  </span>
                  <span
                    className="truncate font-mono text-[11.5px] font-bold text-slate-900"
                    dir="ltr"
                  >
                    {bilty.gariNumber || ''}
                  </span>
                </div>
              </div>

              <div className="border-[1.5px] border-[#15803d] p-[1.5px]">
                <div className="flex items-center gap-2 border border-[#15803d] bg-[#fef9c3] px-2 py-0.5">
                  <div className="font-nastaliq shrink-0 text-right text-[9px] font-bold leading-[1.4] text-[#dc2626]">
                    <div>ڈرائیور کا نام</div>
                    <div>اور موبائل نمبر:</div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <div className="min-h-[15px] truncate border-b border-slate-700 font-sans text-[11.5px] font-bold leading-tight text-slate-900">
                      {[bilty.driverName, bilty.driverPhone]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    <div className="h-[9px] border-b border-slate-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Sender (بھیجنے والے:) + Receiver (وصول کرنے والے:) with IDENTICAL Blank Line Lengths */}
          <div className="grid grid-cols-12 gap-2.5 pt-0.5">
            <div className="col-span-6 flex items-baseline gap-1.5">
              <span className="font-nastaliq w-[78px] shrink-0 text-right text-[11px] font-bold leading-[1.6] text-[#dc2626]">
                بھیجنے والے:
              </span>
              <span className="min-h-[18px] min-w-0 flex-1 truncate border-b border-slate-700 pb-0.5 font-sans text-[12px] font-bold text-slate-900">
                {[bilty.senderName, bilty.senderPhone].filter(Boolean).join(' · ')}
              </span>
            </div>
            <div className="col-span-6 flex items-baseline gap-1.5">
              <span className="font-nastaliq w-[78px] shrink-0 text-right text-[11px] font-bold leading-[1.6] text-[#dc2626]">
                وصول کرنے والے:
              </span>
              <span className="min-h-[18px] min-w-0 flex-1 truncate border-b border-slate-700 pb-0.5 font-sans text-[12px] font-bold text-slate-900">
                {[bilty.receiverName, bilty.receiverPhone]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          </div>
        </div>

        {/* Full-Height 6-Column Consignment / Freight Table Filling Remaining A4 Portrait Space */}
        <div className="relative mt-2 flex-1 min-h-0 overflow-hidden border-[1.5px] border-slate-900">
          {/* Alpha-transparent halftone truck watermark centered over Tafseel Maal & Wazan boundary */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-10 right-[41%] bottom-4 z-0 flex translate-x-1/2 items-center justify-center"
          >
            <img
              src={truckUrl}
              alt=""
              className="h-[240px] w-auto object-contain opacity-[0.32] select-none"
            />
          </div>

          <table className="relative z-10 h-full w-full table-fixed border-collapse text-center text-sm">
            <thead>
              <tr className="h-[36px] bg-[#0f7a38] font-nastaliq text-[12px] font-bold leading-[1.8] text-white">
                <th className="w-[10%] border-e border-white/60 px-1 py-0.5">
                  تعداد
                </th>
                <th className="w-[31%] border-e border-white/60 px-2 py-0.5">
                  تفصیل مال
                </th>
                <th className="w-[9%] border-e border-white/60 px-1 py-0.5">
                  وزن
                </th>
                <th className="w-[13%] border-e border-white/60 px-1 py-0.5">
                  کل کرایہ
                </th>
                <th className="w-[12%] border-e border-white/60 px-1 py-0.5">
                  پیشگی
                </th>
                <th className="w-[25%] px-1.5 py-0.5">کرایہ قابل ادا</th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-full align-top">
                <td className="border-e border-slate-800 px-1.5 pt-4 pb-3 font-sans text-sm font-bold text-slate-900">
                  {bilty.packagesCount || ''}
                </td>
                <td className="relative border-e border-slate-800 px-2.5 pt-4 pb-10 text-[15px] font-bold text-slate-900">
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {bilty.goodsDescription || ''}
                  </div>
                  {bilty.notes && (
                    <div className="mt-2 text-xs font-medium text-slate-700">
                      {bilty.notes}
                    </div>
                  )}

                  <div className="absolute inset-x-2 bottom-1.5 flex items-center justify-between gap-1 text-[9.5px] font-bold">
                    <span className="font-nastaliq leading-[1.7] text-[#dc2626]">
                      {mottoClean} ★
                    </span>
                    <span className="font-nastaliq leading-[1.7] text-[#dc2626]">
                      دستخط منیجر{' '}
                      <span className="font-sans text-slate-800">______</span>
                    </span>
                  </div>
                </td>
                <td className="border-e border-slate-800 px-1.5 pt-4 pb-3 font-sans text-sm font-bold text-slate-900">
                  {bilty.weight || ''}
                </td>
                <td
                  className="border-e border-slate-800 px-1.5 pt-4 pb-3 font-mono text-[15px] font-bold text-slate-900 tabular-nums"
                  dir="ltr"
                >
                  {totalFreight > 0 ? totalFreight.toLocaleString('en-PK') : ''}
                </td>
                <td
                  className="border-e border-slate-800 px-1.5 pt-4 pb-3 font-mono text-[15px] font-bold text-slate-900 tabular-nums"
                  dir="ltr"
                >
                  {advanceVal > 0 ? advanceVal.toLocaleString('en-PK') : ''}
                </td>
                <td
                  className="px-1.5 pt-4 pb-3 font-mono text-lg font-extrabold text-slate-900 tabular-nums"
                  dir="ltr"
                >
                  {totalFreight > 0 || payable > 0
                    ? payable.toLocaleString('en-PK')
                    : ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer: Bold Top-Right شرائط with Bold 1-Line-Per-Sentence Terms + Filled Patron Box */}
        <div className="mt-2 grid grid-cols-[1fr_218px] items-stretch gap-2">
          <div className="border-[1.5px] border-[#d97706] bg-[#fef9c3] px-2.5 py-1.5 text-[#7f1d1d]">
            <div className="font-nastaliq bilty-bold-urdu text-right text-[11px] font-bold leading-[1.5] text-[#dc2626]">
              شرائط:
            </div>
            <div ref={termsBoxRef} className="mt-0.5 w-full space-y-0.5 overflow-hidden">
              {st.termsUrdu.map((clause, idx) => (
                <div key={idx} className="w-full overflow-hidden text-right">
                  <span
                    ref={(el) => {
                      termLineRefs.current[idx] = el;
                    }}
                    className="font-nastaliq bilty-bold-urdu inline-block origin-right whitespace-nowrap text-[9.8px] font-bold leading-[1.58] text-[#7f1d1d]"
                    style={{
                      transform: `scaleX(${termLineScales[idx] ?? 1})`,
                    }}
                  >
                    {clause}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            ref={patronBoxRef}
            className="flex flex-col justify-between overflow-hidden border-[1.5px] border-slate-700 bg-[#fef3c7] px-2 py-1.5 text-center"
          >
            {/* Upper Designation: مرکزی صدر */}
            <div className="font-nastaliq w-full rounded-xs bg-slate-900 px-2 py-0.5 text-[12px] font-bold leading-[1.45] text-white">
              {st.patronLabelUrdu}
            </div>

            {/* Name (Larger, Red Outlined): شہزاد حیدر وڑائچ */}
            <div className="flex items-center justify-center overflow-hidden pt-0.5">
              <span
                ref={patronNameRef}
                className="font-nastaliq inline-block origin-center whitespace-nowrap font-bold leading-[1.35]"
                style={{ transform: `scaleX(${patronNameScaleX})` }}
              >
                <DualOutlineUrdu
                  text={st.patronNameUrdu}
                  sizeClass="text-[22px]"
                  frontColorClass="text-[#dc2626]"
                />
              </span>
            </div>

            {/* Union Name (Smaller than Name, 2 Lines) */}
            <div className="flex flex-col items-center justify-center">
              {patronUnionLines.map((line, idx) => (
                <div key={idx} className="w-full overflow-hidden text-center">
                  <span
                    ref={(el) => {
                      patronUnionLineRefs.current[idx] = el;
                    }}
                    className="font-nastaliq inline-block origin-center whitespace-nowrap text-[11px] font-bold leading-[1.48] text-slate-900"
                    style={{
                      transform: `scaleX(${patronUnionScales[idx] ?? 1})`,
                    }}
                  >
                    {line}
                  </span>
                </div>
              ))}
            </div>

            {/* Mobile Number (Edge-Fitted Condensed Bold) */}
            <div className="flex items-center justify-center overflow-hidden">
              <span
                ref={patronPhoneRef}
                className="font-condensed inline-block origin-center whitespace-nowrap text-[27px] font-bold leading-[0.95] tracking-tight text-slate-900 tabular-nums"
                dir="ltr"
                style={{ transform: `scaleX(${patronPhoneScaleX})` }}
              >
                {st.patronPhone}
              </span>
            </div>

            {/* Bottom Complaint Note */}
            <div className="font-nastaliq text-[9.5px] font-bold leading-[1.42] text-slate-900">
              {st.patronNoteUrdu}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
