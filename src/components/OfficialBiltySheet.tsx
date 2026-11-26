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

const SHEET_WIDTH = 1123; // 297mm @ 96 DPI (A4 Landscape)
const SHEET_HEIGHT = 794; // 210mm @ 96 DPI (A4 Landscape)

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
  const [scale, setScale] = useState(1);
  const [mastheadScaleX, setMastheadScaleX] = useState(1);
  const [truckUrl, setTruckUrl] = useState<string>(TRUCK_WATERMARK_URL);

  const st = settings.biltyStationery;

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

    const measureMasthead = () => {
      if (cancelled) return;
      const box = mastheadBoxRef.current;
      const txt = mastheadTextRef.current;
      if (!box || !txt) return;
      const boxW = box.clientWidth;
      const txtW = txt.scrollWidth;
      if (boxW > 0 && txtW > 0) {
        const targetW = boxW * 0.96;
        const nextScale = Math.max(0.75, Math.min(1.58, targetW / txtW));
        setMastheadScaleX(nextScale);
      }
    };

    measureMasthead();
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(measureMasthead);
    }
    const raf = requestAnimationFrame(measureMasthead);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [st.brandTitleUrdu]);

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
      className="print-sheet-scaler relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100/60 shadow-xs print:rounded-none print:border-0 print:bg-white print:shadow-none"
      style={{ height: `${Math.round(SHEET_HEIGHT * scale)}px` }}
    >
      <div
        dir="rtl"
        className="print-surface absolute top-0 left-1/2 flex flex-col justify-between bg-white px-3 pt-2 pb-1.5 text-slate-900"
        style={{
          width: `${SHEET_WIDTH}px`,
          height: `${SHEET_HEIGHT}px`,
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        {/* Top Stationery Banner */}
        <div className="grid grid-cols-12 gap-3 pb-0.5">
          {/* Right Side: Centered 786, Small جیوے + Elongated Crimson/Gold Headline + Small رجسٹرڈ, Deduplicated Subtitle */}
          <div className="col-span-7 flex flex-col justify-between">
            {/* Top Row: Centered 786 */}
            <div className="flex items-center justify-center pt-0.5">
              {isDefaultSlogan || sloganClean.includes('786') ? (
                <span
                  className="font-sans text-[22px] font-black leading-none tracking-wide text-slate-900 tabular-nums"
                  dir="ltr"
                >
                  786
                </span>
              ) : (
                <span className="font-nastaliq text-sm font-bold leading-[1.6] text-slate-900">
                  {st.topSloganUrdu}
                </span>
              )}
            </div>

            {/* Main Masthead Row: Small جیوے (right) + Elongated Crimson/Gold Business Name + Small رجسٹرڈ (left) */}
            <div className="mt-0.5 mb-2 flex items-baseline justify-between gap-2.5">
              <span className="font-nastaliq shrink-0 text-[18px] font-bold leading-[1.6] text-slate-900">
                جیوے
              </span>

              <div
                ref={mastheadBoxRef}
                className="flex min-w-0 flex-1 items-center justify-center overflow-visible"
              >
                <div
                  ref={mastheadTextRef}
                  className="inline-flex origin-center items-baseline justify-center gap-2 whitespace-nowrap"
                  style={{
                    transform: `rotate(-0.6deg) scaleX(${mastheadScaleX})`,
                  }}
                >
                  <h2 className="font-nastaliq font-bold leading-[1.42]">
                    <DualOutlineUrdu
                      text={mainMasthead}
                      sizeClass="text-[36px]"
                      backClass="bilty-outline-back-lg"
                      frontColorClass="text-[#991b1b]"
                    />
                  </h2>
                  {citySuffix && (
                    <span className="bilty-masthead-outline font-nastaliq text-[28px] font-bold leading-[1.42]">
                      {citySuffix}
                    </span>
                  )}
                </div>
              </div>

              <span className="font-nastaliq shrink-0 text-[18px] font-bold leading-[1.6] text-slate-900">
                رجسٹرڈ
              </span>
            </div>

            {/* Triple-Rule Deduplicated Subtitle */}
            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex flex-1 flex-col gap-[2px]">
                <span className="h-[1.5px] w-full bg-slate-900" />
                <span className="h-[1px] w-full bg-slate-700" />
                <span className="h-[1.5px] w-full bg-slate-900" />
              </div>
              <div className="font-nastaliq shrink-0 text-center text-[12px] font-bold leading-[1.8] text-slate-900">
                {subtitleClean}
              </div>
              <div className="flex flex-1 flex-col gap-[2px]">
                <span className="h-[1.5px] w-full bg-slate-900" />
                <span className="h-[1px] w-full bg-slate-700" />
                <span className="h-[1.5px] w-full bg-slate-900" />
              </div>
            </div>
          </div>

          {/* Left Side: Fitted Yellow Imran Haider Card (No WhatsApp/Ufone) + Paired Double-Bordered Red/Green Stickers */}
          <div className="col-span-5 grid grid-cols-12 gap-2">
            <div className="col-span-7 flex flex-col justify-between border-[1.5px] border-[#d97706] bg-[#fef3c7] px-2 py-1 text-center">
              <div className="font-nastaliq pb-0.5 text-[12.5px] font-bold leading-[1.75] text-[#dc2626]">
                {st.primaryContactTitle}
              </div>
              <div
                className="flex flex-1 flex-col justify-evenly font-condensed text-[26px] font-bold leading-[1.02] tracking-tight text-[#dc2626] tabular-nums"
                dir="ltr"
              >
                {st.primaryContactPhones.map((ph, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-center"
                  >
                    <span className="inline-block origin-center scale-x-110">
                      {ph}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-5 flex flex-col justify-between gap-1.5">
              {/* Top Sticker: 43 Group (Double-Bordered Red Rounded Rectangle) */}
              <div className="flex flex-1 rounded-lg border-2 border-[#dc2626] p-[2px]">
                <div className="flex w-full flex-col items-center justify-center rounded-[5px] border border-white/95 bg-[#dc2626] px-2 py-1 text-center text-white">
                  {groupParts.map((part, idx) => (
                    <span
                      key={idx}
                      className={`font-nastaliq font-bold leading-[1.65] ${
                        idx === 0 ? 'text-[12px]' : 'text-[11px]'
                      }`}
                    >
                      {part}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Sticker: 24 Hours Service (Equal-Height Double-Bordered Green Rounded Rectangle) */}
              <div className="flex flex-1 rounded-lg border-2 border-[#0f7a38] p-[2px]">
                <div className="flex w-full flex-col items-center justify-center rounded-[5px] border border-white/95 bg-[#0f7a38] px-2 py-1 text-center text-white">
                  <span className="font-sans text-[18px] font-black leading-none tracking-wide">
                    24
                  </span>
                  <span className="font-nastaliq mt-0.5 text-[11.5px] font-bold leading-[1.55]">
                    گھنٹے سروس
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Physical-Pad Metadata Grid (Cream 2-Line Driver Box + Clean Spacing) */}
        <div className="mt-1 space-y-1 text-xs text-slate-900">
          <div className="grid grid-cols-12 items-start gap-3">
            {/* Right Zone: Bilty No (no colon, no underline) + Az / Ta */}
            <div className="col-span-6 space-y-1.5 pt-0.5">
              <div className="flex items-baseline gap-3">
                <span className="font-nastaliq shrink-0 text-[12px] font-bold leading-[1.75] text-slate-800">
                  بلٹی نمبر
                </span>
                <span
                  className="font-mono text-[15px] font-extrabold text-slate-900 tabular-nums"
                  dir="ltr"
                >
                  {bilty.biltyNumber}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
                  <span className="font-nastaliq shrink-0 text-[11.5px] font-bold leading-[1.75] text-[#dc2626]">
                    از:
                  </span>
                  <span className="truncate font-sans text-[12.5px] font-bold text-slate-900">
                    {bilty.fromCity || ''}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
                  <span className="font-nastaliq shrink-0 text-[11.5px] font-bold leading-[1.75] text-[#dc2626]">
                    تا:
                  </span>
                  <span className="truncate font-sans text-[12.5px] font-bold text-slate-900">
                    {bilty.toCity || ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Left Zone: Date + Gari No on top, Cream Double-Bordered 2-Line Driver Box below */}
            <div className="col-span-6 space-y-1.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
                  <span className="font-nastaliq shrink-0 text-[11.5px] font-bold leading-[1.75] text-[#dc2626]">
                    تاریخ:
                  </span>
                  <span
                    className="font-mono text-[12px] font-bold text-slate-900 tabular-nums"
                    dir="ltr"
                  >
                    {bilty.date || ''}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
                  <span className="font-nastaliq shrink-0 text-[11.5px] font-bold leading-[1.75] text-[#dc2626]">
                    گاڑی نمبر:
                  </span>
                  <span
                    className="truncate font-mono text-[12px] font-bold text-slate-900"
                    dir="ltr"
                  >
                    {bilty.gariNumber || ''}
                  </span>
                </div>
              </div>

              <div className="border-[1.5px] border-[#15803d] p-[1.5px]">
                <div className="flex items-center gap-2.5 border border-[#15803d] bg-[#fef9c3] px-2.5 py-1">
                  <div className="font-nastaliq shrink-0 text-right text-[9.5px] font-bold leading-[1.45] text-[#dc2626]">
                    <div>ڈرائیور کا نام</div>
                    <div>اور موبائل نمبر:</div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                    <div className="min-h-[16px] truncate border-b border-slate-700 font-sans text-[12px] font-bold leading-tight text-slate-900">
                      {[bilty.driverName, bilty.driverPhone]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    <div className="h-[10px] border-b border-slate-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Sender + Receiver directly above table header */}
          <div className="grid grid-cols-12 gap-3 pt-0.5">
            <div className="col-span-6 flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
              <span className="font-nastaliq shrink-0 text-[11.5px] font-bold leading-[1.75] text-[#dc2626]">
                بھیجنے والے کا نام و موبائل نمبر:
              </span>
              <span className="truncate font-sans text-[12.5px] font-bold text-slate-900">
                {[bilty.senderName, bilty.senderPhone].filter(Boolean).join(' · ')}
              </span>
            </div>
            <div className="col-span-6 flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
              <span className="font-nastaliq shrink-0 text-[11.5px] font-bold leading-[1.75] text-[#dc2626]">
                وصول کرنے والے کا نام اور موبائل نمبر:
              </span>
              <span className="truncate font-sans text-[12.5px] font-bold text-slate-900">
                {[bilty.receiverName, bilty.receiverPhone]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          </div>
        </div>

        {/* Main 6-Column Consignment Table + Transparent Halftone Truck Watermark */}
        <div className="relative mt-1 flex-1 overflow-hidden border-[1.5px] border-slate-900">
          {/* Alpha-transparent halftone truck watermark centered over Tafseel Maal & Wazan boundary */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-8 right-[41%] bottom-1 z-0 flex translate-x-1/2 items-center justify-center"
          >
            <img
              src={truckUrl}
              alt=""
              className="h-[205px] w-auto object-contain opacity-[0.34] select-none"
            />
          </div>

          <table className="relative z-10 h-full w-full table-fixed border-collapse text-center text-sm">
            <thead>
              <tr className="bg-[#0f7a38] font-nastaliq text-[13px] font-bold leading-[1.9] text-white">
                <th className="w-[10%] border-e border-white/60 px-1.5 py-0.5">
                  تعداد
                </th>
                <th className="w-[31%] border-e border-white/60 px-2.5 py-0.5">
                  تفصیل مال
                </th>
                <th className="w-[9%] border-e border-white/60 px-1.5 py-0.5">
                  وزن
                </th>
                <th className="w-[13%] border-e border-white/60 px-1.5 py-0.5">
                  کل کرایہ
                </th>
                <th className="w-[12%] border-e border-white/60 px-1.5 py-0.5">
                  پیشگی
                </th>
                <th className="w-[25%] px-2 py-0.5">کرایہ قابل ادا</th>
              </tr>
            </thead>
            <tbody>
              <tr className="align-top">
                <td className="border-e border-slate-800 px-2 pt-3 pb-4 font-sans text-sm font-bold text-slate-900">
                  {bilty.packagesCount || ''}
                </td>
                <td className="relative border-e border-slate-800 px-3 pt-3 pb-9 text-base font-bold text-slate-900">
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {bilty.goodsDescription || ''}
                  </div>
                  {bilty.notes && (
                    <div className="mt-1.5 text-xs font-medium text-slate-700">
                      {bilty.notes}
                    </div>
                  )}

                  <div className="absolute inset-x-2 bottom-1 flex items-center justify-between gap-2 text-[10.5px] font-bold">
                    <span className="font-nastaliq leading-[1.75] text-[#dc2626]">
                      {mottoClean} ★
                    </span>
                    <span className="font-nastaliq leading-[1.75] text-[#dc2626]">
                      دستخط منیجر{' '}
                      <span className="font-sans text-slate-800">________</span>
                    </span>
                  </div>
                </td>
                <td className="border-e border-slate-800 px-2 pt-3 pb-4 font-sans text-sm font-bold text-slate-900">
                  {bilty.weight || ''}
                </td>
                <td
                  className="border-e border-slate-800 px-2 pt-3 pb-4 font-mono text-base font-bold text-slate-900 tabular-nums"
                  dir="ltr"
                >
                  {totalFreight > 0 ? totalFreight.toLocaleString('en-PK') : ''}
                </td>
                <td
                  className="border-e border-slate-800 px-2 pt-3 pb-4 font-mono text-base font-bold text-slate-900 tabular-nums"
                  dir="ltr"
                >
                  {advanceVal > 0 ? advanceVal.toLocaleString('en-PK') : ''}
                </td>
                <td
                  className="px-2 pt-3 pb-4 font-mono text-xl font-extrabold text-slate-900 tabular-nums"
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

        {/* Expanded Lower-Edge Footer: Top-Left شرائط + 7 Bold Single-Line Clauses + Expanded Patron Box */}
        <div className="mt-1.5 grid grid-cols-12 gap-2">
          <div className="relative col-span-9 flex flex-col justify-between border-[1.5px] border-[#d97706] bg-[#fef9c3] px-2.5 py-1.5 text-[#7f1d1d]">
            <span className="font-nastaliq pointer-events-none absolute top-1 left-2.5 text-[11.5px] font-bold leading-[1.6] text-[#dc2626]">
              شرائط:
            </span>
            <div className="font-nastaliq flex flex-1 flex-col justify-between pl-11 text-right text-[9.6px] font-bold leading-[1.82]">
              {st.termsUrdu.map((clause, idx) => (
                <div key={idx} className="whitespace-nowrap">
                  {clause}
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-3 flex flex-col justify-between border-[1.5px] border-slate-700 bg-[#fef3c7] px-2.5 py-2 text-center">
            <div className="space-y-1">
              <div className="font-nastaliq inline-block rounded-xs bg-slate-900 px-3 py-0.5 text-[10px] font-bold leading-[1.65] text-white">
                {st.patronLabelUrdu}
              </div>
              <div className="font-nastaliq font-bold leading-[1.75]">
                <DualOutlineUrdu
                  text={st.patronNameUrdu}
                  sizeClass="text-[18px]"
                  frontColorClass="text-[#dc2626]"
                />
              </div>
              <div className="font-nastaliq text-[9.8px] font-bold leading-[1.75] text-slate-900">
                {st.patronDesignationUrdu}
              </div>
            </div>
            <div className="mt-1 space-y-0.5">
              <div
                className="font-sans text-[16.5px] font-black tracking-wide text-slate-900 tabular-nums"
                dir="ltr"
              >
                {st.patronPhone}
              </div>
              <div className="font-nastaliq text-[9.2px] font-semibold leading-[1.7] text-slate-800">
                {st.patronNoteUrdu}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
