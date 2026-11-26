import React from 'react';
import { Truck } from 'lucide-react';
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
  const hasAdvance = Number(bilty.advancePaid) > 0;
  const totalFreight = Number(bilty.freightAmount) || 0;
  const advanceVal = Number(bilty.advancePaid) || 0;
  const payable = Math.max(0, totalFreight - advanceVal);

  return (
    <div
      dir="rtl"
      className="print-surface mx-auto w-full max-w-[980px] border-2 border-slate-800 bg-white p-5 text-slate-900 shadow-xs"
      style={{ fontFamily: '"Noto Sans Arabic", sans-serif' }}
    >
      {/* Top Stationery Banner */}
      <div className="grid grid-cols-1 gap-3 border-b-2 border-slate-800 pb-3 md:grid-cols-12">
        {/* Right Side (Urdu Brand & Header) */}
        <div className="md:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="text-slate-800">{st.topSloganUrdu}</span>
              {/* Pakistan Flag Emblem */}
              <svg
                viewBox="0 0 36 24"
                className="h-5 w-7 border border-slate-300"
                aria-hidden="true"
              >
                <rect width="9" height="24" x="27" fill="#ffffff" />
                <rect width="27" height="24" x="0" fill="#01411C" />
                <circle cx="13.5" cy="12" r="6" fill="#ffffff" />
                <circle cx="15.2" cy="10.8" r="5" fill="#01411C" />
                <polygon
                  points="17,8.5 17.7,10.5 19.8,10.5 18.1,11.8 18.7,13.8 17,12.5 15.3,13.8 15.9,11.8 14.2,10.5 16.3,10.5"
                  fill="#ffffff"
                />
              </svg>
            </div>
            <span className="rounded-full bg-[#0f7a38] px-3 py-1 text-[11px] font-bold text-white">
              {st.serviceBadgeUrdu}
            </span>
          </div>

          <h2
            className="mt-2 text-center text-3xl font-extrabold tracking-tight text-[#d91c1c] sm:text-4xl"
            style={{
              textShadow: '1px 1px 0 #1e293b',
            }}
          >
            {st.brandTitleUrdu}
          </h2>
          <div className="mt-1.5 border-y border-slate-400 bg-slate-50 py-1 text-center text-xs font-bold text-slate-900">
            {st.brandSubtitleUrdu}
          </div>
        </div>

        {/* Left Side (Yellow + Green Contact Cards + Red Group Badge) */}
        <div className="grid grid-cols-12 gap-2 md:col-span-6">
          {/* Primary Yellow Contact Box */}
          <div className="col-span-7 border border-[#d97706] bg-[#fef3c7] p-2 text-center">
            <div className="border-b border-[#d97706]/40 pb-0.5 text-xs font-bold text-[#b91c1c]">
              {st.primaryContactTitle}
            </div>
            <div className="mt-1 space-y-0.5 font-mono text-sm font-extrabold text-[#b91c1c] tabular-nums" dir="ltr">
              {st.primaryContactPhones.map((ph, idx) => (
                <div key={idx}>{ph}</div>
              ))}
            </div>
          </div>

          {/* Secondary Green Box + Red Group Badge */}
          <div className="col-span-5 flex flex-col justify-between gap-1.5">
            <div className="rounded-full bg-[#dc2626] px-2 py-1 text-center text-[11px] font-bold text-white">
              {st.groupBadgeUrdu}
            </div>
            <div className="border border-[#15803d] bg-[#dcfce7] p-2 text-center">
              <div className="text-xs font-bold text-[#b91c1c]">
                {st.secondaryContactTitle}
              </div>
              <div className="mt-0.5 space-y-0.5 font-mono text-xs font-extrabold text-[#b91c1c] tabular-nums" dir="ltr">
                {st.secondaryContactPhones.map((ph, idx) => (
                  <div key={idx}>{ph}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Strip (Bilty No, From, To, Date, Gari No, Driver, Sender, Receiver) */}
      <div className="mt-3 space-y-2 text-xs font-bold text-slate-900">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
          <div className="flex items-center gap-2 border-b border-slate-500 pb-1 sm:col-span-2">
            <span className="text-[#b91c1c]">بلٹی نمبر:</span>
            <span className="font-mono text-sm font-extrabold text-slate-900 tabular-nums" dir="ltr">
              {bilty.biltyNumber}
            </span>
          </div>
          <div className="flex items-center gap-2 border-b border-slate-500 pb-1 sm:col-span-3">
            <span className="text-[#b91c1c]">از:</span>
            <span className="font-semibold text-slate-900">{bilty.fromCity || ''}</span>
          </div>
          <div className="flex items-center gap-2 border-b border-slate-500 pb-1 sm:col-span-3">
            <span className="text-[#b91c1c]">تا:</span>
            <span className="font-semibold text-slate-900">{bilty.toCity || ''}</span>
          </div>
          <div className="flex items-center gap-2 border-b border-slate-500 pb-1 sm:col-span-2">
            <span className="text-[#b91c1c]">تاریخ:</span>
            <span className="font-mono text-xs text-slate-900 tabular-nums" dir="ltr">
              {bilty.date || ''}
            </span>
          </div>
          <div className="flex items-center gap-2 border-b border-slate-500 pb-1 sm:col-span-2">
            <span className="text-[#b91c1c]">گاڑی نمبر:</span>
            <span className="font-mono text-xs font-bold text-slate-900" dir="ltr">
              {bilty.gariNumber || ''}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-500 pb-1 sm:col-span-7">
            <span className="text-[#b91c1c]">بھیجنے والے کا نام و موبائل نمبر:</span>
            <span className="font-semibold text-slate-900">
              {[bilty.senderName, bilty.senderPhone].filter(Boolean).join(' · ')}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded border border-[#15803d] bg-[#f0fdf4] px-2.5 py-1 sm:col-span-5">
            <span className="text-[#b91c1c]">ڈرائیور کا نام و موبائل نمبر:</span>
            <span className="font-semibold text-slate-900">
              {[bilty.driverName, bilty.driverPhone].filter(Boolean).join(' · ')}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-500 pb-1">
          <span className="text-[#b91c1c]">لینے والے کا نام اور موبائل نمبر:</span>
          <span className="font-semibold text-slate-900">
            {[bilty.receiverName, bilty.receiverPhone].filter(Boolean).join(' · ')}
          </span>
        </div>
      </div>

      {/* Main Consignment Table (Green Header) */}
      <div className="relative mt-3 overflow-hidden border-2 border-slate-800">
        <table className="w-full border-collapse text-center text-sm">
          <thead>
            <tr className="bg-[#0f7a38] text-xs font-bold text-white">
              <th className="w-28 border-e border-white/40 px-2 py-2">تعداد</th>
              <th className="border-e border-white/40 px-3 py-2">تفصیل مال</th>
              <th className="w-28 border-e border-white/40 px-2 py-2">وزن</th>
              <th className="w-32 border-e border-white/40 px-2 py-2">کل کرایہ</th>
              {hasAdvance && (
                <th className="w-28 border-e border-white/40 px-2 py-2">پیشگی</th>
              )}
              <th className="w-36 px-2 py-2">کرایہ قابل ادا</th>
            </tr>
          </thead>
          <tbody>
            <tr className="relative h-44 align-top">
              <td className="border-e border-slate-700 px-2 py-4 font-semibold text-slate-900">
                {bilty.packagesCount || ''}
              </td>
              <td className="relative border-e border-slate-700 px-3 py-4 text-base font-bold text-slate-900">
                <div className="relative z-10 whitespace-pre-wrap">
                  {bilty.goodsDescription || ''}
                </div>
                {bilty.notes && (
                  <div className="relative z-10 mt-2 text-xs font-normal text-slate-600">
                    {bilty.notes}
                  </div>
                )}
                {/* Subtle printed-form truck emblem */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.07]">
                  <Truck className="h-28 w-28 text-slate-900" />
                </div>
              </td>
              <td className="border-e border-slate-700 px-2 py-4 font-semibold text-slate-900">
                {bilty.weight || ''}
              </td>
              <td className="border-e border-slate-700 px-2 py-4 font-mono text-base font-bold text-slate-900 tabular-nums" dir="ltr">
                {totalFreight > 0 ? totalFreight.toLocaleString('en-PK') : ''}
              </td>
              {hasAdvance && (
                <td className="border-e border-slate-700 px-2 py-4 font-mono text-base font-bold text-slate-900 tabular-nums" dir="ltr">
                  {advanceVal.toLocaleString('en-PK')}
                </td>
              )}
              <td className="px-2 py-4 font-mono text-lg font-extrabold text-slate-900 tabular-nums" dir="ltr">
                {totalFreight > 0 || payable > 0 ? payable.toLocaleString('en-PK') : ''}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-slate-300 bg-white px-3 py-1.5 text-[11px] font-bold text-[#b91c1c]">
          <span>{st.mottoUrdu}</span>
          <span className="text-slate-600">دستخط منیجر: ____________________</span>
        </div>
      </div>

      {/* Bottom Footer Strip: Terms + Patron Box */}
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-12">
        <div className="border border-[#d97706] bg-[#fef9c3] p-2.5 text-[10px] leading-relaxed text-[#7f1d1d] md:col-span-9">
          <div className="mb-1 text-xs font-extrabold text-[#dc2626]">شرائط:</div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2">
            {st.termsUrdu.map((clause, idx) => (
              <div key={idx}>{clause}</div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between border border-slate-400 bg-[#fef3c7] p-2.5 text-center md:col-span-3">
          <div>
            <div className="inline-block rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white">
              {st.patronLabelUrdu}
            </div>
            <div className="mt-1 text-base font-extrabold text-[#b91c1c]">
              {st.patronNameUrdu}
            </div>
            <div className="text-[10px] font-semibold text-slate-800">
              {st.patronDesignationUrdu}
            </div>
          </div>
          <div className="mt-1">
            <div className="font-mono text-sm font-extrabold text-slate-900 tabular-nums" dir="ltr">
              {st.patronPhone}
            </div>
            <div className="text-[9px] text-slate-700">{st.patronNoteUrdu}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
