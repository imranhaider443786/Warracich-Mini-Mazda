import React from 'react';
import {
  PAKISTAN_FLAG_DATA_URL,
  TRUCK_WATERMARK_DATA_URL,
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

  // Split masthead "وڑائچ گڈز سمندری" into red main title + outlined city suffix if present
  const titleTrimmed = (st.brandTitleUrdu || '').trim();
  const hasSamundriSuffix = titleTrimmed.endsWith('سمندری') && titleTrimmed.length > 7;
  const mainMasthead = hasSamundriSuffix
    ? titleTrimmed.slice(0, titleTrimmed.length - 'سمندری'.length).trim()
    : titleTrimmed;
  const citySuffix = hasSamundriSuffix ? 'سمندری' : '';

  // Avoid duplicating "دستخط منیجر" if stored in legacy settings
  const mottoClean = (st.mottoUrdu || '')
    .replace(/\s*[☆★]?\s*دستخط منیجر\s*$/, '')
    .trim();

  // Split group badge nicely for the 2-line oval look ("43 گروپ" / "قلندر پاک زندہ باد")
  const groupText = (st.groupBadgeUrdu || '').trim();
  const groupParts = groupText.startsWith('43 گروپ')
    ? ['43 گروپ', groupText.slice('43 گروپ'.length).trim()]
    : [groupText];

  // Split top slogan ("جیوے 786" / "رجسٹرڈ")
  const sloganClean = (st.topSloganUrdu || '').replace(/[·•]/g, ' ').trim();
  const isDefaultSlogan =
    sloganClean.includes('جیوے') && sloganClean.includes('786');

  return (
    <div
      dir="rtl"
      className="print-surface mx-auto w-full max-w-[1040px] border-2 border-slate-800 bg-white px-5 py-4 text-slate-900 shadow-xs"
    >
      {/* Top Stationery Banner */}
      <div className="grid grid-cols-1 gap-3 pb-2 md:grid-cols-12">
        {/* Right Side: Flag, 24hr Oval, Calligraphic Masthead & Triple-Line Subtitle */}
        <div className="flex flex-col justify-between md:col-span-7">
          {/* Top-most Slogan + Pakistan Flag + Registered + 24hr Green Oval */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2.5">
              {isDefaultSlogan ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-nastaliq text-base font-bold leading-none text-slate-800">
                    جیوے
                  </span>
                  <span className="font-sans text-lg font-extrabold tracking-tight text-slate-900 tabular-nums">
                    786
                  </span>
                  <img
                    src={PAKISTAN_FLAG_DATA_URL}
                    alt="Pakistan Flag"
                    className="h-7 w-11 shrink-0 object-contain"
                  />
                  <span className="font-nastaliq -rotate-6 ps-1 text-lg font-bold leading-none text-slate-800">
                    رجسٹرڈ
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-nastaliq text-sm font-bold text-slate-800">
                    {st.topSloganUrdu}
                  </span>
                  <img
                    src={PAKISTAN_FLAG_DATA_URL}
                    alt="Pakistan Flag"
                    className="h-7 w-11 shrink-0 object-contain"
                  />
                </div>
              )}
            </div>

            {/* Circular/Oval Green 24-Hour Badge */}
            <div className="flex h-11 min-w-[74px] flex-col items-center justify-center rounded-[50%] bg-[#0f7a38] px-3 text-center text-white shadow-2xs">
              <span className="font-sans text-sm font-extrabold leading-none">
                24
              </span>
              <span className="font-nastaliq text-[10px] font-bold leading-snug">
                گھنٹے سروس
              </span>
            </div>
          </div>

          {/* Calligraphic Masthead */}
          <div className="my-1 flex flex-wrap items-baseline justify-center gap-2 text-center">
            <h2 className="bilty-masthead-red font-nastaliq text-4xl font-bold leading-[1.45] sm:text-5xl">
              {mainMasthead}
            </h2>
            {citySuffix && (
              <span className="bilty-masthead-outline font-nastaliq text-2xl font-bold leading-[1.5] sm:text-3xl">
                {citySuffix}
              </span>
            )}
          </div>

          {/* Subtitle flanked by triple horizontal lines */}
          <div className="flex items-center gap-2">
            <div className="flex flex-1 flex-col gap-[2px]">
              <span className="h-[1.5px] w-full bg-slate-800" />
              <span className="h-[1px] w-full bg-slate-700" />
              <span className="h-[1.5px] w-full bg-slate-800" />
            </div>
            <div className="font-nastaliq shrink-0 text-center text-xs font-bold leading-[1.7] text-slate-900 sm:text-[13px]">
              {st.brandSubtitleUrdu}
            </div>
            <div className="flex flex-1 flex-col gap-[2px]">
              <span className="h-[1.5px] w-full bg-slate-800" />
              <span className="h-[1px] w-full bg-slate-700" />
              <span className="h-[1.5px] w-full bg-slate-800" />
            </div>
          </div>
        </div>

        {/* Left Side: Yellow Imran Haider Box + Red 43 Group Oval + Green Asghar Mughal Box */}
        <div className="grid grid-cols-12 gap-2 md:col-span-5">
          {/* Primary Yellow Contact Card */}
          <div className="col-span-7 flex flex-col justify-between border-[1.5px] border-[#d97706] bg-[#fef3c7] px-2 py-1.5 text-center">
            <div className="font-nastaliq border-b border-[#d97706]/50 pb-1 text-xs font-bold leading-[1.7] text-[#dc2626] sm:text-[13px]">
              {st.primaryContactTitle}
            </div>
            <div
              className="mt-1 flex flex-1 flex-col justify-center space-y-0.5 font-condensed text-[21px] font-bold leading-[1.12] tracking-tight text-[#dc2626] tabular-nums sm:text-[24px]"
              dir="ltr"
            >
              {st.primaryContactPhones.map((ph, idx) => (
                <div
                  key={idx}
                  className="relative flex items-center justify-center gap-1"
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

          {/* Secondary Green Card + Red Oval Group Badge */}
          <div className="col-span-5 flex flex-col justify-between gap-1.5">
            <div className="flex flex-col items-center justify-center rounded-[50%] bg-[#dc2626] px-2 py-1.5 text-center text-white shadow-2xs">
              {groupParts.map((part, idx) => (
                <span
                  key={idx}
                  className="font-nastaliq text-[10px] font-bold leading-[1.55] sm:text-[11px]"
                >
                  {part}
                </span>
              ))}
            </div>
            <div className="flex flex-1 flex-col justify-between border-[1.5px] border-[#15803d] bg-[#dcfce7] px-1.5 py-1.5 text-center">
              <div className="bilty-calligraphy-red-outline font-nastaliq text-sm font-bold leading-[1.6] sm:text-base">
                {st.secondaryContactTitle}
              </div>
              <div
                className="mt-0.5 space-y-0.5 font-condensed text-[17px] font-bold leading-[1.12] tracking-tight text-[#dc2626] tabular-nums sm:text-[19px]"
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

      {/* Metadata Lines */}
      <div className="mt-2 space-y-2 text-xs text-slate-900">
        {/* Row 1: Bilty No, Az, Ta, Date, Gari No */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
          <div className="flex items-baseline gap-2 border-b border-slate-700 pb-0.5 sm:col-span-2">
            <span className="font-nastaliq shrink-0 text-xs font-bold leading-[1.7] text-[#dc2626]">
              بلٹی نمبر:
            </span>
            <span
              className="font-mono text-sm font-bold text-slate-900 tabular-nums"
              dir="ltr"
            >
              {bilty.biltyNumber}
            </span>
          </div>
          <div className="flex items-baseline gap-2 border-b border-slate-700 pb-0.5 sm:col-span-3">
            <span className="font-nastaliq shrink-0 text-xs font-bold leading-[1.7] text-[#dc2626]">
              از:
            </span>
            <span className="font-sans text-sm font-semibold text-slate-900">
              {bilty.fromCity || ''}
            </span>
          </div>
          <div className="flex items-baseline gap-2 border-b border-slate-700 pb-0.5 sm:col-span-3">
            <span className="font-nastaliq shrink-0 text-xs font-bold leading-[1.7] text-[#dc2626]">
              تا:
            </span>
            <span className="font-sans text-sm font-semibold text-slate-900">
              {bilty.toCity || ''}
            </span>
          </div>
          <div className="flex items-baseline gap-2 border-b border-slate-700 pb-0.5 sm:col-span-2">
            <span className="font-nastaliq shrink-0 text-xs font-bold leading-[1.7] text-[#dc2626]">
              تاریخ:
            </span>
            <span
              className="font-mono text-xs font-semibold text-slate-900 tabular-nums"
              dir="ltr"
            >
              {bilty.date || ''}
            </span>
          </div>
          <div className="flex items-baseline gap-2 border-b border-slate-700 pb-0.5 sm:col-span-2">
            <span className="font-nastaliq shrink-0 text-xs font-bold leading-[1.7] text-[#dc2626]">
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

        {/* Row 2: Sender (Right) + Green-bordered Driver Box (Left) */}
        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-12">
          <div className="flex flex-wrap items-baseline gap-2 border-b border-slate-700 pb-0.5 sm:col-span-7">
            <span className="font-nastaliq shrink-0 text-xs font-bold leading-[1.7] text-[#dc2626]">
              بھیجنے والے کا نام و موبائل نمبر:
            </span>
            <span className="font-sans text-sm font-semibold text-slate-900">
              {[bilty.senderName, bilty.senderPhone].filter(Boolean).join(' · ')}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-[1.5px] border-[#15803d] bg-[#f0fdf4] px-2.5 py-1 sm:col-span-5">
            <span className="font-nastaliq shrink-0 text-[11px] font-bold leading-[1.7] text-[#dc2626]">
              ڈرائیور کا نام و موبائل نمبر:
            </span>
            <span className="font-sans text-xs font-bold text-slate-900">
              {[bilty.driverName, bilty.driverPhone].filter(Boolean).join(' · ')}
            </span>
          </div>
        </div>

        {/* Row 3: Receiver */}
        <div className="flex flex-wrap items-baseline gap-2 border-b border-slate-700 pb-0.5">
          <span className="font-nastaliq shrink-0 text-xs font-bold leading-[1.7] text-[#dc2626]">
            لینے والے کا نام اور موبائل نمبر:
          </span>
          <span className="font-sans text-sm font-semibold text-slate-900">
            {[bilty.receiverName, bilty.receiverPhone].filter(Boolean).join(' · ')}
          </span>
        </div>
      </div>

      {/* Main 6-Column Consignment Table (All 6 columns always displayed) */}
      <div className="relative mt-2.5 overflow-hidden border-[1.5px] border-slate-800">
        {/* Realistic Grayscale Truck Watermark across the middle of the table body */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-10 bottom-7 z-0 flex items-center justify-center"
        >
          <img
            src={TRUCK_WATERMARK_DATA_URL}
            alt=""
            className="h-44 w-auto object-contain opacity-[0.20] select-none"
          />
        </div>

        <table className="relative z-10 w-full table-fixed border-collapse text-center text-sm">
          <thead>
            <tr className="bg-[#0f7a38] font-nastaliq text-xs font-bold leading-[1.85] text-white sm:text-sm">
              <th className="w-[11%] border-e border-white/60 px-2 py-1.5">
                تعداد
              </th>
              <th className="w-[34%] border-e border-white/60 px-3 py-1.5">
                تفصیل مال
              </th>
              <th className="w-[11%] border-e border-white/60 px-2 py-1.5">
                وزن
              </th>
              <th className="w-[14%] border-e border-white/60 px-2 py-1.5">
                کل کرایہ
              </th>
              <th className="w-[13%] border-e border-white/60 px-2 py-1.5">
                پیشگی
              </th>
              <th className="w-[17%] px-2 py-1.5">کرایہ قابل ادا</th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-48 align-top sm:h-52">
              <td className="border-e border-slate-700 px-2 py-4 font-sans text-sm font-bold text-slate-900">
                {bilty.packagesCount || ''}
              </td>
              <td className="relative border-e border-slate-700 px-3 py-4 text-base font-bold text-slate-900">
                <div className="whitespace-pre-wrap leading-relaxed">
                  {bilty.goodsDescription || ''}
                </div>
                {bilty.notes && (
                  <div className="mt-2 text-xs font-medium text-slate-700">
                    {bilty.notes}
                  </div>
                )}

                {/* Bottom motto + signature line inside Tafseel Maal matching physical form */}
                <div className="absolute inset-x-2 bottom-1 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
                  <span className="font-nastaliq leading-[1.7] text-[#dc2626]">
                    {mottoClean} ★
                  </span>
                  <span className="font-nastaliq leading-[1.7] text-[#dc2626]">
                    دستخط منیجر{' '}
                    <span className="font-sans text-slate-800">_________</span>
                  </span>
                </div>
              </td>
              <td className="border-e border-slate-700 px-2 py-4 font-sans text-sm font-bold text-slate-900">
                {bilty.weight || ''}
              </td>
              <td
                className="border-e border-slate-700 px-2 py-4 font-mono text-base font-bold text-slate-900 tabular-nums"
                dir="ltr"
              >
                {totalFreight > 0 ? totalFreight.toLocaleString('en-PK') : ''}
              </td>
              <td
                className="border-e border-slate-700 px-2 py-4 font-mono text-base font-bold text-slate-900 tabular-nums"
                dir="ltr"
              >
                {advanceVal > 0 ? advanceVal.toLocaleString('en-PK') : ''}
              </td>
              <td
                className="px-2 py-4 font-mono text-lg font-extrabold text-slate-900 tabular-nums"
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

      {/* Bottom Footer Strip: Terms (Right) + Patron Box (Left) */}
      <div className="mt-2.5 grid grid-cols-1 gap-2 md:grid-cols-12">
        {/* Yellow Terms Box with vertical red "شرائط:" label and full unwrapped clauses */}
        <div className="flex border-[1.5px] border-[#d97706] bg-[#fef9c3] p-2 text-[#7f1d1d] md:col-span-9">
          <div className="flex w-7 shrink-0 items-center justify-center border-e border-[#d97706]/30 pe-1">
            <span className="font-nastaliq -rotate-90 whitespace-nowrap text-sm font-bold text-[#dc2626]">
              شرائط:
            </span>
          </div>
          <div className="font-nastaliq grid flex-1 grid-cols-1 gap-x-4 gap-y-0.5 ps-2 text-[10px] leading-[1.9] sm:grid-cols-2 sm:text-[10.5px]">
            {st.termsUrdu.map((clause, idx) => (
              <div key={idx}>{clause}</div>
            ))}
          </div>
        </div>

        {/* Cream Patron Box */}
        <div className="flex flex-col justify-between border-[1.5px] border-slate-600 bg-[#fef3c7] px-2.5 py-2 text-center md:col-span-3">
          <div>
            <div className="font-nastaliq inline-block rounded-xs bg-slate-800 px-3 py-0.5 text-[10.5px] font-bold leading-[1.6] text-white">
              {st.patronLabelUrdu}
            </div>
            <div className="bilty-calligraphy-red-outline font-nastaliq mt-1 text-lg font-bold leading-[1.6]">
              {st.patronNameUrdu}
            </div>
            <div className="font-nastaliq text-[10px] font-bold leading-[1.7] text-slate-900">
              {st.patronDesignationUrdu}
            </div>
          </div>
          <div className="mt-1">
            <div
              className="font-sans text-base font-black tracking-wide text-slate-900 tabular-nums"
              dir="ltr"
            >
              {st.patronPhone}
            </div>
            <div className="font-nastaliq text-[9.5px] font-semibold leading-[1.6] text-slate-800">
              {st.patronNoteUrdu}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
