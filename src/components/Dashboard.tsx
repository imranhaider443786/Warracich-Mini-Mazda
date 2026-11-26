import React, { useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
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
  RooznamchaEntry,
  WorkspaceTab,
} from '../types';

interface DashboardProps {
  lang: Language;
  drivers: DriverEntry[];
  bilties: BiltyRecord[];
  rooznamcha: RooznamchaEntry[];
  onNavigate: (tab: WorkspaceTab, startWizard?: boolean) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  lang,
  drivers,
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
        lang === 'ur' ? `آج: ${todayDriversCount} · کل: ${drivers.length}` : `Today: ${todayDriversCount} · Total: ${drivers.length}`,
      icon: <Truck className="h-7 w-7 text-blue-900" />,
      accentBg: 'bg-blue-50 border-blue-200',
    },
    {
      id: 'rooznamcha' as WorkspaceTab,
      title: t.dashBtn2Title,
      desc: t.dashBtn2Sub,
      metricLabel: `${t.closingBalance}: ${formatCurrencyPKR(netCashBalance)}`,
      icon: <BookOpen className="h-7 w-7 text-emerald-700" />,
      accentBg: 'bg-emerald-50 border-emerald-200',
    },
    {
      id: 'bilty' as WorkspaceTab,
      title: t.dashBtn3Title,
      desc: t.dashBtn3Sub,
      metricLabel:
        lang === 'ur' ? `کل بلٹیاں: ${bilties.length}` : `Saved Bilties: ${bilties.length}`,
      icon: <FileSpreadsheet className="h-7 w-7 text-amber-700" />,
      accentBg: 'bg-amber-50 border-amber-200',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t.dashboardHeading}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">{t.dashboardSub}</p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('drive')}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap sm:self-auto"
        >
          <FolderSync className="h-4 w-4 text-blue-900" />
          <span>{t.navDrive}</span>
        </button>
      </div>

      {/* 3 Primary Action Cards: 1. Register, 2. Rooznamcha, 3. Bilty */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.id}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-4">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl border ${card.accentBg}`}
                >
                  {card.icon}
                </div>
                <span className="font-mono text-xs font-semibold text-slate-500 tabular-nums">
                  {card.metricLabel}
                </span>
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                {card.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {card.desc}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2.5 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => onNavigate(card.id, true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
              >
                <Plus className="h-4 w-4" />
                <span>{t.dashStartEntry}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate(card.id, false)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <span>{t.dashOpenSection}</span>
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
