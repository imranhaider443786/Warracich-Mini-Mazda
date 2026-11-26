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

const SHEET_WIDTH = 1123; // 297mm @ 96 DPI (A4 Landscape width)
const SHEET_HEIGHT = 626; // Compact proportional Bilty slip height inside A4 Landscape

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

  const [scale, setScale] = useState(1);
  const [mastheadScaleX, setMastheadScaleX] = useState(1);
  const [imranTitleScaleX, setImranTitleScaleX] = useState(1);
  const [imranNumScaleX, setImranNumScaleX] = useState(1.15);
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

    const measureFits = () => {
      if (cancelled) return;

      const box = mastheadBoxRef.current;
      const txt = mastheadTextRef.current;
      if (box && txt && box.clientWidth > 0 && txt.scrollWidth > 0) {
        const targetW = box.clientWidth * 0.97;
        setMastheadScaleX(
          Math.max(0.8, Math.min(1.7, targetW / txt.scrollWidth))
        );
      }

      const iBox = imranBoxRef.current;
      const iTitle = imranTitleRef.current;
      const iNum = imranNumRef.current;
      if (iBox && iBox.clientWidth > 20) {
        const usableW = iBox.clientWidth - 10;
        if (iTitle && iTitle.scrollWidth > 0) {
          setImranTitleScaleX(
            Math.max(0.88, Math.min(1.42, usableW / iTitle.scrollWidth))
          );
        }
        if (iNum && iNum.scrollWidth > 0) {
          setImranNumScaleX(
            Math.max(0.95, Math.min(1.52, usableW / iNum.scrollWidth))
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
  }, [st.brandTitleUrdu, st.primaryContactTitle, st.primaryContactPhones]);

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

  const termsParagraph = st.termsUrdu.join('  ');

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
        {/* Top Stationery Banner (Compact Height) */}
        <div className="grid grid-cols-12 items-stretch gap-2.5 pb-0.5">
          {/* Right Side: Top Row (جیوے above وڑائچ + 786 + رجسٹرڈ above گڈز), Full-Width Headline, Deduplicated Subtitle */}
          <div className="col-span-7 flex flex-col justify-between">
            {/* Top Row: جیوے directly above right start of وڑائچ, centered 786, رجسٹرڈ directly above left end of گڈز */}
            <div className="flex items-center justify-between px-0.5">
              <span className="font-nastaliq text-[15.5px] font-bold leading-[1.45] text-slate-900">
                جیوے
              </span>
              {isDefaultSlogan || sloganClean.includes('786') ? (
                <span
                  className="font-sans text-[19px] font-black leading-none tracking-wide text-slate-900 tabular-nums"
                  dir="ltr"
                >
                  786
                </span>
              ) : (
                <span className="font-nastaliq text-xs font-bold leading-[1.45] text-slate-900">
                  {st.topSloganUrdu}
                </span>
              )}
              <span className="font-nastaliq text-[15.5px] font-bold leading-[1.45] text-slate-900">
                رجسٹرڈ
              </span>
            </div>

            {/* Full-Width Standout Business Name: Deep Crimson + Thick Gold-Yellow Outline + 3D Shadow */}
            <div
              ref={mastheadBoxRef}
              className="my-0.5 flex w-full items-center justify-center overflow-visible"
            >
              <div
                ref={mastheadTextRef}
                className="inline-flex origin-center items-baseline justify-center gap-2 whitespace-nowrap"
                style={{
                  transform: `rotate(-0.45deg) scaleX(${mastheadScaleX})`,
                }}
              >
                <h2 className="font-nastaliq font-bold leading-[1.35]">
                  <DualOutlineUrdu
                    text={mainMasthead}
                    sizeClass="text-[35px]"
                    backClass="bilty-outline-back-lg"
                    frontColorClass="text-[#991b1b]"
                  />
                </h2>
                {citySuffix && (
                  <span className="bilty-masthead-outline font-nastaliq text-[27px] font-bold leading-[1.35]">
                    {citySuffix}
                  </span>
                )}
              </div>
            </div>

            {/* Triple-Rule Deduplicated Subtitle */}
            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex flex-1 flex-col gap-[2px]">
                <span className="h-[1.5px] w-full bg-slate-900" />
                <span className="h-[1px] w-full bg-slate-700" />
                <span className="h-[1.5px] w-full bg-slate-900" />
              </div>
              <div className="font-nastaliq shrink-0 text-center text-[11.5px] font-bold leading-[1.7] text-slate-900">
                {subtitleClean}
              </div>
              <div className="flex flex-1 flex-col gap-[2px]">
                <span className="h-[1.5px] w-full bg-slate-900" />
                <span className="h-[1px] w-full bg-slate-700" />
                <span className="h-[1.5px] w-full bg-slate-900" />
              </div>
            </div>
          </div>

          {/* Left Side: Edge-Fitted Yellow Imran Haider Box + Shorter Compact Paired Stickers */}
          <div className="col-span-5 grid grid-cols-12 gap-2">
            <div
              ref={imranBoxRef}
              className="col-span-8 flex h-[146px] flex-col justify-between overflow-hidden border-[1.5px] border-[#d97706] bg-[#fef3c7] px-1 py-1 text-center"
            >
              <div className="flex items-center justify-center overflow-hidden">
                <div
                  ref={imranTitleRef}
                  className="font-nastaliq inline-block origin-center whitespace-nowrap text-[13px] font-bold leading-[1.6] text-[#dc2626]"
                  style={{ transform: `scaleX(${imranTitleScaleX})` }}
                >
                  {st.primaryContactTitle}
                </div>
              </div>
              <div
                className="flex flex-1 flex-col justify-between pt-0.5 font-condensed text-[25px] font-bold leading-[0.96] tracking-tight text-[#dc2626] tabular-nums"
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

            <div className="col-span-4 flex h-[146px] flex-col justify-between gap-1">
              {/* Top Sticker: Shorter 43 Group (Double-Bordered Red Rounded Rectangle) */}
              <div className="flex flex-1 rounded-md border-2 border-[#dc2626] p-[1.5px]">
                <div className="flex w-full flex-col items-center justify-center rounded-[4px] border border-white/95 bg-[#dc2626] px-1 py-0.5 text-center text-white">
                  {groupParts.map((part, idx) => (
                    <span
                      key={idx}
                      className={`font-nastaliq font-bold leading-[1.48] ${
                        idx === 0 ? 'text-[11px]' : 'text-[9.8px]'
                      }`}
                    >
                      {part}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Sticker: Shorter 24 Hours Service (Equal-Height Double-Bordered Green Rounded Rectangle) */}
              <div className="flex flex-1 rounded-md border-2 border-[#0f7a38] p-[1.5px]">
                <div className="flex w-full flex-col items-center justify-center rounded-[4px] border border-white/95 bg-[#0f7a38] px-1 py-0.5 text-center text-white">
                  <span className="font-sans text-[16px] font-black leading-none tracking-wide">
                    24
                  </span>
                  <span className="font-nastaliq mt-0.5 text-[10.5px] font-bold leading-[1.45]">
                    گھنٹے سروس
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Physical-Pad Metadata Grid */}
        <div className="mt-1 space-y-1 text-xs text-slate-900">
          <div className="grid grid-cols-12 items-start gap-3">
            {/* Right Zone: Bilty No + Az / Ta */}
            <div className="col-span-6 space-y-1 pt-0.5">
              <div className="flex items-baseline gap-3">
                <span className="font-nastaliq shrink-0 text-[12px] font-bold leading-[1.65] text-slate-800">
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
                  <span className="font-nastaliq shrink-0 text-[11.5px] font-bold leading-[1.65] text-[#dc2626]">
                    از:
                  </span>
                  <span className="truncate font-sans text-[12.5px] font-bold text-slate-900">
                    {bilty.fromCity || ''}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
                  <span className="font-nastaliq shrink-0 text-[11.5px] font-bold leading-[1.65] text-[#dc2626]">
                    تا:
                  </span>
                  <span className="truncate font-sans text-[12.5px] font-bold text-slate-900">
                    {bilty.toCity || ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Left Zone: Date + Gari No on top, Cream Double-Bordered 2-Line Driver Box below */}
            <div className="col-span-6 space-y-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
                  <span className="font-nastaliq shrink-0 text-[11.5px] font-bold leading-[1.65] text-[#dc2626]">
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
                  <span className="font-nastaliq shrink-0 text-[11.5px] font-bold leading-[1.65] text-[#dc2626]">
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
                <div className="flex items-center gap-2.5 border border-[#15803d] bg-[#fef9c3] px-2.5 py-0.5">
                  <div className="font-nastaliq shrink-0 text-right text-[9.5px] font-bold leading-[1.4] text-[#dc2626]">
                    <div>ڈرائیور کا نام</div>
                    <div>اور موبائل نمبر:</div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <div className="min-h-[15px] truncate border-b border-slate-700 font-sans text-[12px] font-bold leading-tight text-slate-900">
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
          <div className="grid grid-cols-12 gap-3 pt-0.5">
            <div className="col-span-6 flex items-baseline gap-2">
              <span className="font-nastaliq w-[86px] shrink-0 text-right text-[11.5px] font-bold leading-[1.65] text-[#dc2626]">
                بھیجنے والے:
              </span>
              <span className="min-h-[19px] min-w-0 flex-1 truncate border-b border-slate-700 pb-0.5 font-sans text-[12.5px] font-bold text-slate-900">
                {[bilty.senderName, bilty.senderPhone].filter(Boolean).join(' · ')}
              </span>
            </div>
            <div className="col-span-6 flex items-baseline gap-2">
              <span className="font-nastaliq w-[86px] shrink-0 text-right text-[11.5px] font-bold leading-[1.65] text-[#dc2626]">
                وصول کرنے والے:
              </span>
              <span className="min-h-[19px] min-w-0 flex-1 truncate border-b border-slate-700 pb-0.5 font-sans text-[12.5px] font-bold text-slate-900">
                {[bilty.receiverName, bilty.receiverPhone]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          </div>
        </div>

        {/* Shorter 6-Column Consignment / Freight Table (کرایہ والا باکس) + Transparent Halftone Truck Watermark */}
        <div className="relative mt-1 h-[226px] overflow-hidden border-[1.5px] border-slate-900">
          {/* Alpha-transparent halftone truck watermark centered over Tafseel Maal & Wazan boundary */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-7 right-[41%] bottom-1 z-0 flex translate-x-1/2 items-center justify-center"
          >
            <img
              src={truckUrl}
              alt=""
              className="h-[164px] w-auto object-contain opacity-[0.34] select-none"
            />
          </div>

          <table className="relative z-10 h-full w-full table-fixed border-collapse text-center text-sm">
            <thead>
              <tr className="bg-[#0f7a38] font-nastaliq text-[13px] font-bold leading-[1.85] text-white">
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
                <td className="border-e border-slate-800 px-2 pt-2.5 pb-3 font-sans text-sm font-bold text-slate-900">
                  {bilty.packagesCount || ''}
                </td>
                <td className="relative border-e border-slate-800 px-3 pt-2.5 pb-8 text-base font-bold text-slate-900">
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {bilty.goodsDescription || ''}
                  </div>
                  {bilty.notes && (
                    <div className="mt-1 text-xs font-medium text-slate-700">
                      {bilty.notes}
                    </div>
                  )}

                  <div className="absolute inset-x-2 bottom-1 flex items-center justify-between gap-2 text-[10.5px] font-bold">
                    <span className="font-nastaliq leading-[1.7] text-[#dc2626]">
                      {mottoClean} ★
                    </span>
                    <span className="font-nastaliq leading-[1.7] text-[#dc2626]">
                      دستخط منیجر{' '}
                      <span className="font-sans text-slate-800">________</span>
                    </span>
                  </div>
                </td>
                <td className="border-e border-slate-800 px-2 pt-2.5 pb-3 font-sans text-sm font-bold text-slate-900">
                  {bilty.weight || ''}
                </td>
                <td
                  className="border-e border-slate-800 px-2 pt-2.5 pb-3 font-mono text-base font-bold text-slate-900 tabular-nums"
                  dir="ltr"
                >
                  {totalFreight > 0 ? totalFreight.toLocaleString('en-PK') : ''}
                </td>
                <td
                  className="border-e border-slate-800 px-2 pt-2.5 pb-3 font-mono text-base font-bold text-slate-900 tabular-nums"
                  dir="ltr"
                >
                  {advanceVal > 0 ? advanceVal.toLocaleString('en-PK') : ''}
                </td>
                <td
                  className="px-2 pt-2.5 pb-3 font-mono text-xl font-extrabold text-slate-900 tabular-nums"
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

        {/* Shorter Compact Footer: Top-Right Bold شرائط + Flowing Bold Paragraph + Compact Patron Box */}
        <div className="mt-1 grid grid-cols-12 items-stretch gap-2">
          <div className="relative col-span-9 flex items-center border-[1.5px] border-[#d97706] bg-[#fef9c3] px-2.5 py-1.5 text-[#7f1d1d]">
            <span className="font-nastaliq pointer-events-none absolute top-1 right-2.5 text-[11.5px] font-bold leading-[1.6] text-[#dc2626]">
              شرائط:
            </span>
            <p className="font-nastaliq w-full indent-11 text-justify text-[9.6px] font-bold leading-[1.78]">
              {termsParagraph}
            </p>
          </div>

          <div className="col-span-3 flex flex-col justify-between border-[1.5px] border-slate-700 bg-[#fef3c7] px-2 py-1.5 text-center">
            <div className="space-y-0.5">
              <div className="font-nastaliq inline-block rounded-xs bg-slate-900 px-3 py-0.5 text-[9.5px] font-bold leading-[1.55] text-white">
                {st.patronLabelUrdu}
              </div>
              <div className="font-nastaliq font-bold leading-[1.65]">
                <DualOutlineUrdu
                  text={st.patronNameUrdu}
                  sizeClass="text-[16.5px]"
                  frontColorClass="text-[#dc2626]"
                />
              </div>
              <div className="font-nastaliq text-[9.2px] font-bold leading-[1.65] text-slate-900">
                {st.patronDesignationUrdu}
              </div>
            </div>
            <div className="mt-0.5">
              <div
                className="font-sans text-[15px] font-black tracking-wide text-slate-900 tabular-nums"
                dir="ltr"
              >
                {st.patronPhone}
              </div>
              <div className="font-nastaliq text-[8.8px] font-semibold leading-[1.55] text-slate-800">
                {st.patronNoteUrdu}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
