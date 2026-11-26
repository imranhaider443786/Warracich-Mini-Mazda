import React, { useEffect, useRef, useState } from 'react';
import {
  PAKISTAN_FLAG_DATA_URL,
  TRUCK_WATERMARK_URL,
  WHATSAPP_ICON_DATA_URL,
} from '../services/biltyArtwork';
import { AddaSettings, BiltyRecord } from '../types';

interface OfficialBiltySheetProps {
  bilty: BiltyRecord;
  settings: AddaSettings;
}

const SHEET_WIDTH = 1123; // 297mm @ 96 DPI (A4 Landscape)
const SHEET_HEIGHT = 794; // 210mm @ 96 DPI (A4 Landscape)

export const OfficialBiltySheet: React.FC<OfficialBiltySheetProps> = ({
  bilty,
  settings,
}) => {
  const scalerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

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

  const st = settings.biltyStationery;
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
        className="print-surface absolute top-0 left-1/2 flex flex-col justify-between bg-white px-4 py-3 text-slate-900"
        style={{
          width: `${SHEET_WIDTH}px`,
          height: `${SHEET_HEIGHT}px`,
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        {/* Top Stationery Banner — Exact Physical Proportions */}
        <div className="grid grid-cols-12 gap-3 pb-1">
          {/* Right Side: Flag, 24hr Oval, Bold Tilted 3D Masthead & Triple-Line Subtitle */}
          <div className="col-span-7 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                {isDefaultSlogan ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-nastaliq text-[17px] font-bold leading-none text-slate-900">
                      جیوے
                    </span>
                    <span className="font-sans text-[20px] font-black tracking-tight text-slate-900 tabular-nums">
                      786
                    </span>
                    <img
                      src={PAKISTAN_FLAG_DATA_URL}
                      alt="Pakistan Flag"
                      className="h-9 w-14 shrink-0 object-contain"
                    />
                    <span className="font-nastaliq -rotate-6 ps-1 text-[21px] font-bold leading-none text-slate-900">
                      رجسٹرڈ
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-nastaliq text-sm font-bold text-slate-900">
                      {st.topSloganUrdu}
                    </span>
                    <img
                      src={PAKISTAN_FLAG_DATA_URL}
                      alt="Pakistan Flag"
                      className="h-8 w-12 shrink-0 object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="flex h-12 min-w-[78px] flex-col items-center justify-center rounded-[50%] bg-[#0f7a38] px-3 text-center text-white">
                <span className="font-sans text-[15px] font-extrabold leading-none">
                  24
                </span>
                <span className="font-nastaliq text-[10px] font-bold leading-tight">
                  گھنٹے سروس
                </span>
              </div>
            </div>

            {/* Bold 3D Calligraphic Masthead */}
            <div className="my-0.5 flex -rotate-2 items-baseline justify-center gap-2.5 text-center">
              <h2 className="bilty-masthead-red font-nastaliq text-[50px] font-bold leading-[1.32]">
                {mainMasthead}
              </h2>
              {citySuffix && (
                <span className="bilty-masthead-outline font-nastaliq text-[32px] font-bold leading-[1.35]">
                  {citySuffix}
                </span>
              )}
            </div>

            {/* Triple-Rule Subtitle */}
            <div className="flex items-center gap-2">
              <div className="flex flex-1 flex-col gap-[2.5px]">
                <span className="h-[1.5px] w-full bg-slate-900" />
                <span className="h-[1px] w-full bg-slate-700" />
                <span className="h-[1.5px] w-full bg-slate-900" />
              </div>
              <div className="font-nastaliq shrink-0 text-center text-[13px] font-bold leading-[1.6] text-slate-900">
                {st.brandSubtitleUrdu}
              </div>
              <div className="flex flex-1 flex-col gap-[2.5px]">
                <span className="h-[1.5px] w-full bg-slate-900" />
                <span className="h-[1px] w-full bg-slate-700" />
                <span className="h-[1.5px] w-full bg-slate-900" />
              </div>
            </div>
          </div>

          {/* Left Side: Yellow Imran Haider Card + Red 43 Group Oval + Green Asghar Mughal Card */}
          <div className="col-span-5 grid grid-cols-12 gap-2">
            <div className="col-span-7 flex flex-col justify-between border-[1.5px] border-[#d97706] bg-[#fef3c7] px-1.5 py-1 text-center">
              <div className="font-nastaliq text-[13px] font-bold leading-[1.5] text-[#dc2626]">
                {st.primaryContactTitle}
              </div>
              <div
                className="flex flex-1 flex-col justify-evenly font-condensed text-[27px] font-bold leading-[0.98] tracking-tight text-[#dc2626] tabular-nums"
                dir="ltr"
              >
                {st.primaryContactPhones.map((ph, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-center gap-1"
                  >
                    {idx === 1 && (
                      <img
                        src={WHATSAPP_ICON_DATA_URL}
                        alt="WhatsApp"
                        className="h-4 w-4 shrink-0"
                      />
                    )}
                    {idx === 2 && (
                      <span className="font-sans text-[9px] font-extrabold leading-none text-slate-900">
                        <span className="text-orange-600">u</span>fone
                      </span>
                    )}
                    <span className="inline-block origin-center scale-x-105">
                      {ph}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-5 flex flex-col justify-between gap-1.5">
              <div className="flex flex-col items-center justify-center rounded-[50%] bg-[#dc2626] px-2 py-1.5 text-center text-white">
                {groupParts.map((part, idx) => (
                  <span
                    key={idx}
                    className="font-nastaliq text-[11px] font-bold leading-[1.45]"
                  >
                    {part}
                  </span>
                ))}
              </div>
              <div className="flex flex-1 flex-col justify-between border-[1.5px] border-[#15803d] bg-[#dcfce7] px-1.5 py-1 text-center">
                <div className="bilty-calligraphy-red-outline font-nastaliq text-[17px] font-bold leading-[1.45]">
                  {st.secondaryContactTitle}
                </div>
                <div
                  className="flex flex-1 flex-col justify-evenly font-condensed text-[22px] font-bold leading-[1.02] tracking-tight text-[#dc2626] tabular-nums"
                  dir="ltr"
                >
                  {st.secondaryContactPhones.map((ph, idx) => (
                    <div key={idx} className="origin-center scale-x-105">
                      {ph}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Physical-Pad Metadata Grid */}
        <div className="mt-1 space-y-1.5 text-xs text-slate-900">
          <div className="grid grid-cols-12 items-center gap-3">
            {/* Right Zone: Bilty No (no underline) + Az / Ta */}
            <div className="col-span-6 space-y-1">
              <div className="flex items-baseline gap-2.5">
                <span className="font-nastaliq shrink-0 text-[12px] font-bold leading-[1.5] text-[#dc2626]">
                  بلٹی نمبر:
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
                  <span className="font-nastaliq shrink-0 text-[12px] font-bold leading-[1.5] text-[#dc2626]">
                    از:
                  </span>
                  <span className="font-sans text-[13px] font-bold text-slate-900">
                    {bilty.fromCity || ''}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
                  <span className="font-nastaliq shrink-0 text-[12px] font-bold leading-[1.5] text-[#dc2626]">
                    تا:
                  </span>
                  <span className="font-sans text-[13px] font-bold text-slate-900">
                    {bilty.toCity || ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Left Zone: Date + Gari No on top, Green Double-Bordered Driver Box below */}
            <div className="col-span-6 space-y-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
                  <span className="font-nastaliq shrink-0 text-[12px] font-bold leading-[1.5] text-[#dc2626]">
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
                  <span className="font-nastaliq shrink-0 text-[12px] font-bold leading-[1.5] text-[#dc2626]">
                    گاڑی نمبر:
                  </span>
                  <span
                    className="font-mono text-[12px] font-bold text-slate-900"
                    dir="ltr"
                  >
                    {bilty.gariNumber || ''}
                  </span>
                </div>
              </div>

              <div className="border-[1.5px] border-[#15803d] p-[1.5px]">
                <div className="flex items-center gap-2 border border-[#15803d] bg-[#f0fdf4] px-2.5 py-0.5">
                  <span className="font-nastaliq shrink-0 text-[11px] font-bold leading-[1.5] text-[#dc2626]">
                    ڈرائیور کا نام و موبائل نمبر:
                  </span>
                  <span className="truncate font-sans text-[12px] font-bold text-slate-900">
                    {[bilty.driverName, bilty.driverPhone]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Sender + Receiver right above table header */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-6 flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
              <span className="font-nastaliq shrink-0 text-[12px] font-bold leading-[1.5] text-[#dc2626]">
                بھیجنے والے کا نام و موبائل نمبر:
              </span>
              <span className="truncate font-sans text-[13px] font-bold text-slate-900">
                {[bilty.senderName, bilty.senderPhone].filter(Boolean).join(' · ')}
              </span>
            </div>
            <div className="col-span-6 flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
              <span className="font-nastaliq shrink-0 text-[12px] font-bold leading-[1.5] text-[#dc2626]">
                لینے والے کا نام اور موبائل نمبر:
              </span>
              <span className="truncate font-sans text-[13px] font-bold text-slate-900">
                {[bilty.receiverName, bilty.receiverPhone]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          </div>
        </div>

        {/* Main 6-Column Consignment Table + Realistic Halftone Truck Watermark */}
        <div className="relative mt-2 flex-1 overflow-hidden border-[1.5px] border-slate-900">
          {/* Halftone truck watermark spanning Tafseel Maal & Wazan center boundary */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-9 bottom-2 left-[42%] z-0 flex -translate-x-1/2 items-center justify-center"
          >
            <img
              src={TRUCK_WATERMARK_URL}
              alt=""
              className="h-[245px] w-auto object-contain opacity-[0.28] mix-blend-multiply select-none"
            />
          </div>

          <table className="relative z-10 h-full w-full table-fixed border-collapse text-center text-sm">
            <thead>
              <tr className="bg-[#0f7a38] font-nastaliq text-[13px] font-bold leading-[1.75] text-white">
                <th className="w-[10%] border-e border-white/60 px-1.5 py-1">
                  تعداد
                </th>
                <th className="w-[31%] border-e border-white/60 px-2.5 py-1">
                  تفصیل مال
                </th>
                <th className="w-[9%] border-e border-white/60 px-1.5 py-1">
                  وزن
                </th>
                <th className="w-[13%] border-e border-white/60 px-1.5 py-1">
                  کل کرایہ
                </th>
                <th className="w-[12%] border-e border-white/60 px-1.5 py-1">
                  پیشگی
                </th>
                <th className="w-[25%] px-2 py-1">کرایہ قابل ادا</th>
              </tr>
            </thead>
            <tbody>
              <tr className="align-top">
                <td className="border-e border-slate-800 px-2 py-4 font-sans text-sm font-bold text-slate-900">
                  {bilty.packagesCount || ''}
                </td>
                <td className="relative border-e border-slate-800 px-3 py-4 text-base font-bold text-slate-900">
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {bilty.goodsDescription || ''}
                  </div>
                  {bilty.notes && (
                    <div className="mt-2 text-xs font-medium text-slate-700">
                      {bilty.notes}
                    </div>
                  )}

                  <div className="absolute inset-x-2 bottom-1 flex items-center justify-between gap-2 text-[11px] font-bold">
                    <span className="font-nastaliq leading-[1.55] text-[#dc2626]">
                      {mottoClean} ★
                    </span>
                    <span className="font-nastaliq leading-[1.55] text-[#dc2626]">
                      دستخط منیجر{' '}
                      <span className="font-sans text-slate-800">________</span>
                    </span>
                  </div>
                </td>
                <td className="border-e border-slate-800 px-2 py-4 font-sans text-sm font-bold text-slate-900">
                  {bilty.weight || ''}
                </td>
                <td
                  className="border-e border-slate-800 px-2 py-4 font-mono text-base font-bold text-slate-900 tabular-nums"
                  dir="ltr"
                >
                  {totalFreight > 0 ? totalFreight.toLocaleString('en-PK') : ''}
                </td>
                <td
                  className="border-e border-slate-800 px-2 py-4 font-mono text-base font-bold text-slate-900 tabular-nums"
                  dir="ltr"
                >
                  {advanceVal > 0 ? advanceVal.toLocaleString('en-PK') : ''}
                </td>
                <td
                  className="px-2 py-4 font-mono text-xl font-extrabold text-slate-900 tabular-nums"
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

        {/* Dense Bottom Footer Strip: Yellow Terms + Cream Patron */}
        <div className="mt-2 grid grid-cols-12 gap-2">
          <div className="relative col-span-9 flex border-[1.5px] border-[#d97706] bg-[#fef9c3] px-2.5 py-1.5 text-[#7f1d1d]">
            <div className="font-nastaliq grid flex-1 grid-cols-2 gap-x-3 gap-y-0.5 pe-6 text-[10px] leading-[1.82]">
              {st.termsUrdu.map((clause, idx) => (
                <div key={idx}>{clause}</div>
              ))}
            </div>
            <span className="font-nastaliq pointer-events-none absolute end-2 bottom-2 -rotate-12 text-xs font-bold text-[#dc2626]">
              شرائط:
            </span>
          </div>

          <div className="col-span-3 flex flex-col justify-between border-[1.5px] border-slate-700 bg-[#fef3c7] px-2 py-1.5 text-center">
            <div>
              <div className="font-nastaliq inline-block rounded-xs bg-slate-900 px-3 py-0.5 text-[10.5px] font-bold leading-[1.45] text-white">
                {st.patronLabelUrdu}
              </div>
              <div className="bilty-calligraphy-red-outline font-nastaliq mt-0.5 text-[19px] font-bold leading-[1.45]">
                {st.patronNameUrdu}
              </div>
              <div className="font-nastaliq text-[10px] font-bold leading-[1.55] text-slate-900">
                {st.patronDesignationUrdu}
              </div>
            </div>
            <div className="mt-0.5">
              <div
                className="font-sans text-[17px] font-black tracking-wide text-slate-900 tabular-nums"
                dir="ltr"
              >
                {st.patronPhone}
              </div>
              <div className="font-nastaliq text-[9.5px] font-semibold leading-[1.45] text-slate-800">
                {st.patronNoteUrdu}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
