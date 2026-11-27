import React, { useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  FileSpreadsheet,
  FolderSync,
  Plus,
  Truck,
} from 'lucide-react';
import { formatCurrencyPKR, TRANSLATIONS } from '../i18n';
import {
  BiltyRecord,
  DriverEntry,
  Language,
  OrderEntry,
  RooznamchaEntry,
  WorkspaceTab,
} from '../types';

interface DashboardProps {
  lang: Language;
  drivers: DriverEntry[];
  orders: OrderEntry[];
  bilties: BiltyRecord[];
  rooznamcha: RooznamchaEntry[];
  onNavigate: (tab: WorkspaceTab, startWizard?: boolean) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  lang,
  drivers,
  orders,
  bilties,
  rooznamcha,
  onNavigate,
}) => {
  const t = TRANSLATIONS[lang];
  const today = new Date().toISOString().slice(0, 10);

  const todayDriversCount = useMemo(
    () => drivers.filter((d) => d.date === today).length,
    [drivers, today]
  );

  const todayOrdersCount = useMemo(
    () => orders.filter((o) => o.date === today).length,
    [orders, today]
  );

  const netCashBalance = useMemo(() => {
    return rooznamcha.reduce(
      (sum, e) => sum + (e.type === 'income' ? e.amount : -e.amount),
      0
    );
  }, [rooznamcha]);

  const cards = [
    {
      id: 'drivers' as WorkspaceTab,
      title: t.dashBtn1Title,
      desc: t.dashBtn1Sub,
      metricLabel:
        lang === 'ur'
          ? `آج: ${todayDriversCount} · کل: ${drivers.length}`
          : `Today: ${todayDriversCount} · Total: ${drivers.length}`,
      icon: <Truck className="h-5 w-5 text-blue-900 sm:h-7 sm:w-7" />,
      accentBg: 'bg-blue-50 border-blue-200',
    },
    {
      id: 'orders' as WorkspaceTab,
      title: t.dashBtnOrdersTitle,
      desc: t.dashBtnOrdersSub,
      metricLabel:
        lang === 'ur'
          ? `آج: ${todayOrdersCount} · کل: ${orders.length}`
          : `Today: ${todayOrdersCount} · Total: ${orders.length}`,
      icon: <ClipboardList className="h-5 w-5 text-indigo-800 sm:h-7 sm:w-7" />,
      accentBg: 'bg-indigo-50 border-indigo-200',
    },
    {
      id: 'rooznamcha' as WorkspaceTab,
      title: t.dashBtn2Title,
      desc: t.dashBtn2Sub,
      metricLabel: `${formatCurrencyPKR(netCashBalance)}`,
      icon: <BookOpen className="h-5 w-5 text-emerald-700 sm:h-7 sm:w-7" />,
      accentBg: 'bg-emerald-50 border-emerald-200',
    },
    {
      id: 'bilty' as WorkspaceTab,
      title: t.dashBtn3Title,
      desc: t.dashBtn3Sub,
      metricLabel:
        lang === 'ur' ? `کل بلٹیاں: ${bilties.length}` : `Saved: ${bilties.length}`,
      icon: <FileSpreadsheet className="h-5 w-5 text-amber-700 sm:h-7 sm:w-7" />,
      accentBg: 'bg-amber-50 border-amber-200',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-7">
      <div className="flex items-center justify-between gap-2 sm:items-end sm:gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t.dashboardHeading}
          </h1>
          <p className="mt-1 hidden text-sm text-slate-600 sm:block">
            {t.dashboardSub}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('drive')}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap sm:gap-2 sm:px-4 sm:py-2 sm:text-xs"
        >
          <FolderSync className="h-3.5 w-3.5 text-blue-900 sm:h-4 sm:w-4" />
          <span>{t.navDrive}</span>
        </button>
      </div>

      {/* 4 Primary Action Cards in 2x2 Grid Fitted Cleanly for Mobile & Desktop */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-5">
        {cards.map((card) => (
          <div
            key={card.id}
            className="flex min-w-0 flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 transition-shadow hover:shadow-md sm:p-6"
          >
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-1.5 sm:gap-4">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border sm:h-14 sm:w-14 sm:rounded-xl ${card.accentBg}`}
                >
                  {card.icon}
                </div>
                <span className="min-w-0 truncate font-mono text-[10px] font-semibold text-slate-500 tabular-nums sm:text-xs">
                  {card.metricLabel}
                </span>
              </div>

              <h2 className="mt-2.5 truncate text-sm font-bold leading-snug text-slate-900 sm:mt-5 sm:text-xl">
                {card.title}
              </h2>
              <p className="mt-2 hidden text-sm leading-relaxed text-slate-600 sm:block">
                {card.desc}
              </p>
            </div>

            <div className="mt-3 flex flex-col gap-1.5 border-t border-slate-100 pt-2.5 sm:mt-6 sm:gap-2.5 sm:pt-5">
              <button
                type="button"
                onClick={() => onNavigate(card.id, true)}
                className="flex min-h-[40px] w-full items-center justify-center gap-1 rounded-lg bg-blue-900 px-2 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap sm:gap-2 sm:px-4 sm:py-3 sm:text-sm"
              >
                <Plus className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate sm:hidden">{t.dashStartShort}</span>
                <span className="hidden sm:inline">{t.dashStartEntry}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate(card.id, false)}
                className="flex min-h-[38px] w-full items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap sm:gap-2 sm:px-4 sm:py-2.5 sm:text-xs"
              >
                <span className="truncate sm:hidden">{t.dashOpenShort}</span>
                <span className="hidden sm:inline">{t.dashOpenSection}</span>
                <ArrowRight className="h-3 w-3 shrink-0 rtl:rotate-180 sm:h-3.5 sm:w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
