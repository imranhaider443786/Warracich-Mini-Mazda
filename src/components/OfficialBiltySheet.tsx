import React from 'react';
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

export const OfficialBiltySheet: React.FC<OfficialBiltySheetProps> = ({
  bilty,
  settings,
}) => {
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
      dir="rtl"
      className="print-surface mx-auto flex w-full max-w-[1140px] flex-col justify-between border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-xs"
    >
      {/* Top Stationery Banner — Tight Edge-to-Edge Proportions */}
      <div className="grid grid-cols-1 gap-2.5 pb-1.5 md:grid-cols-12 print:grid-cols-12">
        {/* Right Side: Flag, 24hr Oval, 3D-Extruded Masthead & Triple-Line Subtitle */}
        <div className="flex flex-col justify-between md:col-span-7 print:col-span-7">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              {isDefaultSlogan ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-nastaliq text-lg font-bold leading-none text-slate-900">
                    جیوے
                  </span>
                  <span className="font-sans text-xl font-black tracking-tight text-slate-900 tabular-nums">
                    786
                  </span>
                  <img
                    src={PAKISTAN_FLAG_DATA_URL}
                    alt="Pakistan Flag"
                    className="h-8 w-12 shrink-0 object-contain"
                  />
                  <span className="font-nastaliq -rotate-6 ps-1 text-xl font-bold leading-none text-slate-900">
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

            <div className="flex h-11 min-w-[76px] flex-col items-center justify-center rounded-[50%] bg-[#0f7a38] px-3 text-center text-white">
              <span className="font-sans text-sm font-extrabold leading-none">
                24
              </span>
              <span className="font-nastaliq text-[10px] font-bold leading-tight">
                گھنٹے سروس
              </span>
            </div>
          </div>

          {/* 3D Extruded Calligraphic Masthead */}
          <div className="my-0.5 flex flex-wrap items-baseline justify-center gap-2 text-center">
            <h2 className="bilty-masthead-red font-nastaliq text-[42px] font-bold leading-[1.3] sm:text-[54px] print:text-[54px]">
              {mainMasthead}
            </h2>
            {citySuffix && (
              <span className="bilty-masthead-outline font-nastaliq text-[28px] font-bold leading-[1.35] sm:text-[36px] print:text-[34px]">
                {citySuffix}
              </span>
            )}
          </div>

          {/* Triple-Rule Subtitle */}
          <div className="flex items-center gap-2">
            <div className="flex flex-1 flex-col gap-[2px]">
              <span className="h-[1.5px] w-full bg-slate-900" />
              <span className="h-[1px] w-full bg-slate-700" />
              <span className="h-[1.5px] w-full bg-slate-900" />
            </div>
            <div className="font-nastaliq shrink-0 text-center text-xs font-bold leading-[1.55] text-slate-900 sm:text-[13px]">
              {st.brandSubtitleUrdu}
            </div>
            <div className="flex flex-1 flex-col gap-[2px]">
              <span className="h-[1.5px] w-full bg-slate-900" />
              <span className="h-[1px] w-full bg-slate-700" />
              <span className="h-[1.5px] w-full bg-slate-900" />
            </div>
          </div>
        </div>

        {/* Left Side: Yellow Imran Haider Card + Red 43 Group Oval + Green Asghar Mughal Card */}
        <div className="grid grid-cols-12 gap-1.5 md:col-span-5 print:col-span-5">
          <div className="col-span-7 flex flex-col justify-between border-[1.5px] border-[#d97706] bg-[#fef3c7] px-2 py-1 text-center">
            <div className="font-nastaliq border-b border-[#d97706]/50 pb-0.5 text-xs font-bold leading-[1.55] text-[#dc2626] sm:text-[13px]">
              {st.primaryContactTitle}
            </div>
            <div
              className="mt-0.5 flex flex-1 flex-col justify-center space-y-0 font-condensed text-[22px] font-bold leading-[1.06] tracking-tight text-[#dc2626] tabular-nums sm:text-[26px] print:text-[25px]"
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
                      className="h-3.5 w-3.5 shrink-0"
                    />
                  )}
                  {idx === 2 && (
                    <span className="rounded-xs bg-orange-600 px-1 py-[1px] font-sans text-[8px] font-extrabold leading-none text-white">
                      Ufone
                    </span>
                  )}
                  <span>{ph}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-5 flex flex-col justify-between gap-1">
            <div className="flex flex-col items-center justify-center rounded-[50%] bg-[#dc2626] px-2 py-1 text-center text-white">
              {groupParts.map((part, idx) => (
                <span
                  key={idx}
                  className="font-nastaliq text-[10px] font-bold leading-[1.45] sm:text-[11px]"
                >
                  {part}
                </span>
              ))}
            </div>
            <div className="flex flex-1 flex-col justify-between border-[1.5px] border-[#15803d] bg-[#dcfce7] px-1.5 py-1 text-center">
              <div className="bilty-calligraphy-red-outline font-nastaliq text-sm font-bold leading-[1.45] sm:text-base">
                {st.secondaryContactTitle}
              </div>
              <div
                className="space-y-0 font-condensed text-[18px] font-bold leading-[1.08] tracking-tight text-[#dc2626] tabular-nums sm:text-[21px] print:text-[20px]"
                dir="ltr"
              >
                {st.secondaryContactPhones.map((ph, idx) => (
                  <div key={idx}>{ph}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Physical-Pad Metadata Grid (Zero Empty Rows) */}
      <div className="mt-1 space-y-1.5 text-xs text-slate-900">
        {/* Upper 2-Column Split matching photo:
            Right: Bilty No + Az/Ta
            Left: Date/Gari No + Green Double-Bordered Driver Box */}
        <div className="grid grid-cols-1 items-center gap-2.5 md:grid-cols-12 print:grid-cols-12">
          {/* Right Zone (Bilty No stacked/inline + Az/Ta) */}
          <div className="space-y-1 md:col-span-6 print:col-span-6">
            <div className="flex items-baseline gap-2">
              <span className="font-nastaliq shrink-0 text-xs font-bold leading-[1.5] text-[#dc2626]">
                بلٹی نمبر:
              </span>
              <span
                className="font-mono text-sm font-extrabold text-slate-900 tabular-nums"
                dir="ltr"
              >
                {bilty.biltyNumber}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
                <span className="font-nastaliq shrink-0 text-xs font-bold leading-[1.5] text-[#dc2626]">
                  از:
                </span>
                <span className="font-sans text-sm font-bold text-slate-900">
                  {bilty.fromCity || ''}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
                <span className="font-nastaliq shrink-0 text-xs font-bold leading-[1.5] text-[#dc2626]">
                  تا:
                </span>
                <span className="font-sans text-sm font-bold text-slate-900">
                  {bilty.toCity || ''}
                </span>
              </div>
            </div>
          </div>

          {/* Left Zone (Date + Gari No on top, Green Double-Bordered Driver Box below) */}
          <div className="space-y-1 md:col-span-6 print:col-span-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
                <span className="font-nastaliq shrink-0 text-xs font-bold leading-[1.5] text-[#dc2626]">
                  تاریخ:
                </span>
                <span
                  className="font-mono text-xs font-bold text-slate-900 tabular-nums"
                  dir="ltr"
                >
                  {bilty.date || ''}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 border-b border-slate-700 pb-0.5">
                <span className="font-nastaliq shrink-0 text-xs font-bold leading-[1.5] text-[#dc2626]">
                  گاڑی نمبر:
                </span>
                <span
                  className="font-mono text-xs font-bold text-slate-900"
                  dir="ltr"
                >
                  {bilty.gariNumber || ''}
                </span>
              </div>
            </div>

            {/* Double-bordered Green Driver Box */}
            <div className="border-[1.5px] border-[#15803d] p-[1.5px]">
              <div className="flex flex-wrap items-center gap-2 border border-[#15803d] bg-[#f0fdf4] px-2 py-0.5">
                <span className="font-nastaliq shrink-0 text-[11px] font-bold leading-[1.5] text-[#dc2626]">
                  ڈرائیور کا نام و موبائل نمبر:
                </span>
                <span className="font-sans text-xs font-bold text-slate-900">
                  {[bilty.driverName, bilty.driverPhone]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Side-by-Side Row: Sender (Right) + Receiver (Left) */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 print:grid-cols-12">
          <div className="flex flex-wrap items-baseline gap-1.5 border-b border-slate-700 pb-0.5 md:col-span-6 print:col-span-6">
            <span className="font-nastaliq shrink-0 text-xs font-bold leading-[1.5] text-[#dc2626]">
              بھیجنے والے کا نام و موبائل نمبر:
            </span>
            <span className="font-sans text-xs font-bold text-slate-900 sm:text-sm">
              {[bilty.senderName, bilty.senderPhone].filter(Boolean).join(' · ')}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 border-b border-slate-700 pb-0.5 md:col-span-6 print:col-span-6">
            <span className="font-nastaliq shrink-0 text-xs font-bold leading-[1.5] text-[#dc2626]">
              لینے والے کا نام اور موبائل نمبر:
            </span>
            <span className="font-sans text-xs font-bold text-slate-900 sm:text-sm">
              {[bilty.receiverName, bilty.receiverPhone]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </div>
        </div>
      </div>

      {/* Main 6-Column Consignment Table + Realistic Halftone Truck Watermark */}
      <div className="relative mt-2 flex-1 overflow-hidden border-[1.5px] border-slate-800">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-9 bottom-2 z-0 flex items-center justify-center"
        >
          <img
            src={TRUCK_WATERMARK_URL}
            alt=""
            className="h-52 w-auto object-contain opacity-[0.26] mix-blend-multiply select-none print:h-[68mm]"
          />
        </div>

        <table className="relative z-10 h-full w-full table-fixed border-collapse text-center text-sm">
          <thead>
            <tr className="bg-[#0f7a38] font-nastaliq text-xs font-bold leading-[1.7] text-white sm:text-sm">
              <th className="w-[11%] border-e border-white/60 px-2 py-1">
                تعداد
              </th>
              <th className="w-[34%] border-e border-white/60 px-3 py-1">
                تفصیل مال
              </th>
              <th className="w-[11%] border-e border-white/60 px-2 py-1">
                وزن
              </th>
              <th className="w-[14%] border-e border-white/60 px-2 py-1">
                کل کرایہ
              </th>
              <th className="w-[13%] border-e border-white/60 px-2 py-1">
                پیشگی
              </th>
              <th className="w-[17%] px-2 py-1">کرایہ قابل ادا</th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-56 align-top print:h-[76mm]">
              <td className="border-e border-slate-700 px-2 py-3.5 font-sans text-sm font-bold text-slate-900">
                {bilty.packagesCount || ''}
              </td>
              <td className="relative border-e border-slate-700 px-3 py-3.5 text-base font-bold text-slate-900">
                <div className="whitespace-pre-wrap leading-relaxed">
                  {bilty.goodsDescription || ''}
                </div>
                {bilty.notes && (
                  <div className="mt-2 text-xs font-medium text-slate-700">
                    {bilty.notes}
                  </div>
                )}

                <div className="absolute inset-x-2 bottom-1 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
                  <span className="font-nastaliq leading-[1.55] text-[#dc2626]">
                    {mottoClean} ★
                  </span>
                  <span className="font-nastaliq leading-[1.55] text-[#dc2626]">
                    دستخط منیجر{' '}
                    <span className="font-sans text-slate-800">_________</span>
                  </span>
                </div>
              </td>
              <td className="border-e border-slate-700 px-2 py-3.5 font-sans text-sm font-bold text-slate-900">
                {bilty.weight || ''}
              </td>
              <td
                className="border-e border-slate-700 px-2 py-3.5 font-mono text-base font-bold text-slate-900 tabular-nums"
                dir="ltr"
              >
                {totalFreight > 0 ? totalFreight.toLocaleString('en-PK') : ''}
              </td>
              <td
                className="border-e border-slate-700 px-2 py-3.5 font-mono text-base font-bold text-slate-900 tabular-nums"
                dir="ltr"
              >
                {advanceVal > 0 ? advanceVal.toLocaleString('en-PK') : ''}
              </td>
              <td
                className="px-2 py-3.5 font-mono text-lg font-extrabold text-slate-900 tabular-nums"
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

      {/* Dense Bottom Footer Strip: Terms + Patron Box */}
      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-12 print:grid-cols-12">
        <div className="flex border-[1.5px] border-[#d97706] bg-[#fef9c3] px-2 py-1.5 text-[#7f1d1d] md:col-span-9 print:col-span-9">
          <div className="flex w-6 shrink-0 items-center justify-center border-e border-[#d97706]/30 pe-1">
            <span className="font-nastaliq -rotate-90 whitespace-nowrap text-sm font-bold text-[#dc2626]">
              شرائط:
            </span>
          </div>
          <div className="font-nastaliq grid flex-1 grid-cols-1 gap-x-3 gap-y-0 ps-2 text-[10px] leading-[1.7] sm:grid-cols-2 print:grid-cols-2 sm:text-[10.5px]">
            {st.termsUrdu.map((clause, idx) => (
              <div key={idx}>{clause}</div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between border-[1.5px] border-slate-600 bg-[#fef3c7] px-2 py-1.5 text-center md:col-span-3 print:col-span-3">
          <div>
            <div className="font-nastaliq inline-block rounded-xs bg-slate-800 px-3 py-0.5 text-[10.5px] font-bold leading-[1.45] text-white">
              {st.patronLabelUrdu}
            </div>
            <div className="bilty-calligraphy-red-outline font-nastaliq mt-0.5 text-lg font-bold leading-[1.45]">
              {st.patronNameUrdu}
            </div>
            <div className="font-nastaliq text-[10px] font-bold leading-[1.5] text-slate-900">
              {st.patronDesignationUrdu}
            </div>
          </div>
          <div className="mt-0.5">
            <div
              className="font-sans text-base font-black tracking-wide text-slate-900 tabular-nums"
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
  );
};
