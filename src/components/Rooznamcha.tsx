import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  formatCurrencyPKR,
  INCOME_CATEGORIES,
  translateCategory,
  TRANSLATIONS,
} from '../i18n';
import {
  AddaSettings,
  Language,
  PdfFolderCategory,
  RooznamchaEntry,
  RooznamchaType,
} from '../types';
import {
  downloadBlobLocally,
  generateRooznamchaPdfBlob,
} from '../services/pdfGenerator';
import { ConfirmModal } from './ConfirmModal';
import { MobileBottomSheet } from './MobileBottomSheet';
import { StepEntryWizard, WizardStepConfig } from './StepEntryWizard';

interface RooznamchaProps {
  entries: RooznamchaEntry[];
  settings: AddaSettings;
  lang: Language;
  autoStartWizard?: boolean;
  externalSubView?: 'list' | 'wizard';
  onSubViewChange?: (view: 'list' | 'wizard', options?: { replace?: boolean }) => void;
  onWizardClosed?: () => void;
  onAddEntry: (entry: Omit<RooznamchaEntry, 'id' | 'updatedAt'>) => void;
  onUpdateEntry: (entry: RooznamchaEntry) => void;
  onDeleteEntry: (id: string) => void;
  onSavePdfToDrive: (
    category: PdfFolderCategory,
    filename: string,
    blob: Blob
  ) => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export const Rooznamcha: React.FC<RooznamchaProps> = ({
  entries,
  settings,
  lang,
  autoStartWizard,
  externalSubView,
  onSubViewChange,
  onWizardClosed,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onSavePdfToDrive,
  onNotify,
}) => {
  const t = TRANSLATIONS[lang];

  const [wizardOpen, setWizardOpen] = useState(!!autoStartWizard);
  const [editingEntry, setEditingEntry] = useState<RooznamchaEntry | null>(null);

  useEffect(() => {
    if (autoStartWizard) {
      setEditingEntry(null);
      setWizardOpen(true);
    }
  }, [autoStartWizard]);

  useEffect(() => {
    if (externalSubView === 'list') {
      setWizardOpen(false);
      setEditingEntry(null);
    } else if (externalSubView === 'wizard') {
      setWizardOpen(true);
    }
  }, [externalSubView]);

  // Date & filter mode
  const [viewMode, setViewMode] = useState<'single' | 'range'>('single');
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [fromDate, setFromDate] = useState(getTodayDate());
  const [toDate, setToDate] = useState(getTodayDate());
  const [filterType, setFilterType] = useState<'all' | RooznamchaType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RooznamchaEntry | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);

  const activeMobileFilters =
    (viewMode === 'range' ? 1 : 0) + (filterType !== 'all' ? 1 : 0);

  const activeStart = viewMode === 'single' ? selectedDate : fromDate;
  const activeEnd = viewMode === 'single' ? selectedDate : toDate;

  const openingBalance = useMemo(() => {
    return entries.reduce((acc, e) => {
      if (e.date < activeStart) {
        return acc + (e.type === 'income' ? e.amount : -e.amount);
      }
      return acc;
    }, 0);
  }, [entries, activeStart]);

  const rangeEntries = useMemo(() => {
    return entries
      .filter((e) => e.date >= activeStart && e.date <= activeEnd)
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.updatedAt - a.updatedAt;
      });
  }, [entries, activeStart, activeEnd]);

  const totalIncome = useMemo(() => {
    return rangeEntries
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [rangeEntries]);

  const totalExpense = useMemo(() => {
    return rangeEntries
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [rangeEntries]);

  const closingBalance = openingBalance + totalIncome - totalExpense;

  const visibleEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rangeEntries.filter((e) => {
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (q) {
        const catLabel = translateCategory(e.category, lang).toLowerCase();
        const hay = `${e.description} ${e.reference} ${catLabel} ${e.date}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rangeEntries, filterType, searchQuery, lang]);

  const allCategoryOptions = useMemo(() => {
    return [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map((c) => ({
      value: c.key,
      label: lang === 'ur' ? c.ur : c.en,
    }));
  }, [lang]);

  const roozSteps: WizardStepConfig[] = [
    {
      key: 'type',
      label: t.entryType,
      type: 'select',
      selectOptions: [
        { value: 'income', label: t.incomeLabel },
        { value: 'expense', label: t.expenseLabel },
      ],
      presets: [
        { value: 'income', label: t.incomeLabel },
        { value: 'expense', label: t.expenseLabel },
      ],
      formatReviewValue: (val) =>
        val === 'expense' ? t.expenseLabel : val === 'income' ? t.incomeLabel : '',
    },
    {
      key: 'date',
      label: t.date,
      type: 'date',
    },
    {
      key: 'category',
      label: t.category,
      type: 'text',
      placeholder: lang === 'ur' ? 'کیٹیگری منتخب کریں یا لکھیں' : 'Select or type category',
      presets: allCategoryOptions,
      formatReviewValue: (val) => (val ? translateCategory(val, lang) : ''),
    },
    {
      key: 'description',
      label: t.description,
      type: 'text',
      placeholder: lang === 'ur' ? 'تفصیل درج کریں' : 'Details / party name',
    },
    {
      key: 'reference',
      label: t.reference,
      type: 'text',
      placeholder: '#300 / LES-4521',
    },
    {
      key: 'amount',
      label: t.amountPKR,
      type: 'number',
      placeholder: '2500',
      formatReviewValue: (val) => (val ? formatCurrencyPKR(Number(val) || 0) : ''),
    },
  ];

  const wizardInitialValues = useMemo(() => {
    if (editingEntry) {
      return {
        type: editingEntry.type,
        date: editingEntry.date,
        category: editingEntry.category,
        description: editingEntry.description,
        reference: editingEntry.reference,
        amount: editingEntry.amount ? String(editingEntry.amount) : '',
      };
    }
    return {
      type: 'income',
      date: viewMode === 'single' ? selectedDate : getTodayDate(),
      category: '',
      description: '',
      reference: '',
      amount: '',
    };
  }, [editingEntry, viewMode, selectedDate]);

  const closeWizard = () => {
    setWizardOpen(false);
    setEditingEntry(null);
    onSubViewChange?.('list', { replace: true });
    onWizardClosed?.();
  };

  const handleWizardSave = (vals: Record<string, string>) => {
    const typeVal: RooznamchaType = vals.type === 'expense' ? 'expense' : 'income';
    const payload = {
      date: vals.date?.trim() || getTodayDate(),
      type: typeVal,
      category: (vals.category || '').trim() || (typeVal === 'income' ? 'other_income' : 'fuel_maintenance'),
      description: (vals.description || '').trim(),
      reference: (vals.reference || '').trim(),
      amount: Math.max(0, Number(vals.amount) || 0),
    };

    if (editingEntry) {
      onUpdateEntry({
        ...payload,
        id: editingEntry.id,
        updatedAt: Date.now(),
      });
      onNotify(lang === 'ur' ? 'روزنامچہ اندراج اپڈیٹ ہو گیا۔' : 'Rooznamcha entry updated.', 'success');
    } else {
      onAddEntry(payload);
      onNotify(lang === 'ur' ? 'روزنامچہ میں اندراج محفوظ ہو گیا۔' : 'Entry added to Rooznamcha.', 'success');
    }
    closeWizard();
  };

  const handleExportPdf = async (saveToDrive: boolean) => {
    setIsExportingPdf(true);
    try {
      const label = viewMode === 'single' ? selectedDate : `${fromDate} -> ${toDate}`;
      const blob = await generateRooznamchaPdfBlob(
        visibleEntries,
        label,
        openingBalance,
        totalIncome,
        totalExpense,
        closingBalance,
        settings,
        lang
      );
      const filename =
        viewMode === 'single'
          ? `Rooznamcha_${selectedDate}.pdf`
          : `Rooznamcha_${fromDate}_to_${toDate}.pdf`;

      if (saveToDrive) {
        await onSavePdfToDrive('Rooznamcha', filename, blob);
      } else {
        downloadBlobLocally(blob, filename);
        onNotify(lang === 'ur' ? 'روزنامچہ پی ڈی ایف ڈاؤنلوڈ ہو گئی۔' : 'Rooznamcha PDF downloaded.', 'success');
      }
    } catch (err) {
      console.error(err);
      onNotify(lang === 'ur' ? 'پی ڈی ایف بنانے میں خرابی۔' : 'Failed to generate Rooznamcha PDF.', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {t.roozPageTitle}
          </h1>
          <p className="mt-1 hidden text-sm text-slate-600 sm:block">{t.roozPageSub}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Desktop Date Mode & Picker (Mobile moves into collapsible filter panel) */}
          <div className="hidden flex-wrap items-center gap-2 md:flex">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  viewMode === 'single'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.singleDayMode}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('range')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  viewMode === 'range'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.rangeMode}
              </button>
            </div>

            {viewMode === 'single' ? (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs font-medium text-slate-900 focus:border-blue-800 focus:outline-none"
              />
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  aria-label={t.fromDate}
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-mono text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
                />
                <span className="text-xs text-slate-400">—</span>
                <input
                  type="date"
                  aria-label={t.toDate}
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-mono text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
                />
              </div>
            )}
          </div>

          {!wizardOpen && (
            <button
              type="button"
              onClick={() => {
                setEditingEntry(null);
                setWizardOpen(true);
                onSubViewChange?.('wizard');
              }}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 whitespace-nowrap sm:min-h-[38px] sm:w-auto sm:text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>{t.newRoozBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* 4-Column Financial Summary Strip (2x2 on Mobile, 4x1 on Desktop) */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 lg:grid-cols-4">
        <div className="min-w-0 bg-white p-3 sm:p-4">
          <div className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
            {t.openingBalance}
          </div>
          <div className="mt-1 truncate font-mono text-base font-bold text-slate-900 tabular-nums sm:text-xl">
            {formatCurrencyPKR(openingBalance)}
          </div>
        </div>
        <div className="min-w-0 bg-white p-3 sm:p-4">
          <div className="flex items-center gap-1 truncate text-[11px] font-medium text-emerald-700 sm:gap-1.5 sm:text-xs">
            <ArrowDownLeft className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t.totalIncome}</span>
          </div>
          <div className="mt-1 truncate font-mono text-base font-bold text-emerald-700 tabular-nums sm:text-xl">
            {formatCurrencyPKR(totalIncome)}
          </div>
        </div>
        <div className="min-w-0 bg-white p-3 sm:p-4">
          <div className="flex items-center gap-1 truncate text-[11px] font-medium text-red-600 sm:gap-1.5 sm:text-xs">
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t.totalExpense}</span>
          </div>
          <div className="mt-1 truncate font-mono text-base font-bold text-red-600 tabular-nums sm:text-xl">
            {formatCurrencyPKR(totalExpense)}
          </div>
        </div>
        <div className="min-w-0 bg-slate-50 p-3 sm:p-4">
          <div className="truncate text-[11px] font-semibold text-blue-900 sm:text-xs">
            {t.closingBalance}
          </div>
          <div className="mt-1 truncate font-mono text-base font-bold text-blue-900 tabular-nums sm:text-xl">
            {formatCurrencyPKR(closingBalance)}
          </div>
        </div>
      </div>

      {wizardOpen ? (
        <StepEntryWizard
          key={editingEntry?.id || 'new-rooz'}
          title={editingEntry ? t.edit : t.newRoozBtn}
          steps={roozSteps}
          initialValues={wizardInitialValues}
          lang={lang}
          onCancel={closeWizard}
          onSave={handleWizardSave}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* Mobile Compact Search + Filter Toggle + Export Bottom Sheet Trigger */}
          <div className="border-b border-slate-200 p-3 md:hidden">
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-2.5 start-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 py-2 ps-9 pe-3 text-sm text-slate-900 focus:border-blue-800 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setMobileFiltersOpen((prev) => !prev)}
                className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                  mobileFiltersOpen || activeMobileFilters > 0
                    ? 'border-blue-900 bg-blue-50 text-blue-900'
                    : 'border-slate-300 bg-white text-slate-700'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>
                  {t.filtersBtn}
                  {activeMobileFilters > 0 ? ` (${activeMobileFilters})` : ''}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMobileActionsOpen(true)}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span>{t.actionsBtn}</span>
              </button>
            </div>

            {mobileFiltersOpen && (
              <div className="mt-3 space-y-2.5 border-t border-slate-100 pt-3">
                <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-slate-200 bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('single')}
                    className={`h-8 rounded-md text-xs font-semibold transition-colors ${
                      viewMode === 'single'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    {t.singleDayMode}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('range')}
                    className={`h-8 rounded-md text-xs font-semibold transition-colors ${
                      viewMode === 'range'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    {t.rangeMode}
                  </button>
                </div>

                {viewMode === 'single' ? (
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs font-medium text-slate-900 focus:border-blue-800 focus:outline-none"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-500">
                        {t.fromDate}
                      </label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2 font-mono text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-500">
                        {t.toDate}
                      </label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2 font-mono text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-slate-200 bg-slate-100 p-1">
                  {(['all', 'income', 'expense'] as const).map((typeOpt) => (
                    <button
                      key={typeOpt}
                      type="button"
                      onClick={() => setFilterType(typeOpt)}
                      className={`h-8 truncate rounded-md px-2 text-xs font-semibold transition-colors ${
                        filterType === typeOpt
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      {typeOpt === 'all'
                        ? t.allStatuses
                        : typeOpt === 'income'
                          ? t.incomeLabel
                          : t.expenseLabel}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Toolbar */}
          <div className="hidden flex-col gap-3 border-b border-slate-200 p-4 md:flex sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2.5">
              <div className="relative min-w-[200px] flex-1 max-w-sm">
                <Search className="pointer-events-none absolute top-2.5 start-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 ps-9 pe-3 text-sm text-slate-900 focus:border-blue-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
                {(['all', 'income', 'expense'] as const).map((typeOpt) => (
                  <button
                    key={typeOpt}
                    type="button"
                    onClick={() => setFilterType(typeOpt)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                      filterType === typeOpt
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {typeOpt === 'all'
                      ? t.allStatuses
                      : typeOpt === 'income'
                        ? t.incomeLabel
                        : t.expenseLabel}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isExportingPdf}
                onClick={() => handleExportPdf(false)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" />
                {t.exportPdf}
              </button>
              <button
                type="button"
                disabled={isExportingPdf}
                onClick={() => handleExportPdf(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-40 whitespace-nowrap"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                {t.savePdfDrive}
              </button>
            </div>
          </div>

          {visibleEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <FileText className="h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                {t.noRecordsTitle}
              </h3>
              <p className="mt-1 max-w-md text-xs text-slate-500">{t.noRecordsSub}</p>
            </div>
          ) : (
            <>
              {/* Mobile Rooznamcha Cards (< md) */}
              <div className="divide-y divide-slate-200 md:hidden">
                {visibleEntries.map((entry) => (
                  <div key={entry.id} className="space-y-2 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold ${
                              entry.type === 'income' ? 'text-emerald-700' : 'text-red-600'
                            }`}
                          >
                            {entry.type === 'income' ? (
                              <ArrowDownLeft className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <span className="truncate">
                              {translateCategory(entry.category, lang)}
                            </span>
                          </span>
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums">
                          {entry.date}
                          {entry.reference ? ` · ${entry.reference}` : ''}
                        </div>
                      </div>

                      <div
                        className={`shrink-0 font-mono text-sm font-bold tabular-nums ${
                          entry.type === 'income' ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {entry.type === 'income' ? '+' : '-'} {formatCurrencyPKR(entry.amount)}
                      </div>
                    </div>

                    {entry.description && (
                      <p className="text-xs text-slate-700 break-words">{entry.description}</p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEntry(entry);
                          setWizardOpen(true);
                          onSubViewChange?.('wizard');
                        }}
                        className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>{t.edit}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(entry)}
                        title={t.delete}
                        className="inline-flex min-h-[38px] min-w-[40px] items-center justify-center rounded-lg border border-red-200 bg-white px-2.5 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (>= md) */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-start text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="px-4 py-2.5 text-start whitespace-nowrap">{t.date}</th>
                      <th className="px-4 py-2.5 text-start whitespace-nowrap">{t.entryType}</th>
                      <th className="px-4 py-2.5 text-start whitespace-nowrap">{t.category}</th>
                      <th className="px-4 py-2.5 text-start whitespace-nowrap">{t.description}</th>
                      <th className="px-4 py-2.5 text-start whitespace-nowrap">{t.reference}</th>
                      <th className="px-4 py-2.5 text-end whitespace-nowrap">{t.amountPKR}</th>
                      <th className="px-4 py-2.5 text-end whitespace-nowrap">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                          {entry.date}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold ${
                              entry.type === 'income' ? 'text-emerald-700' : 'text-red-600'
                            }`}
                          >
                            {entry.type === 'income' ? (
                              <ArrowDownLeft className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            )}
                            {entry.type === 'income' ? t.incomeLabel : t.expenseLabel}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                          {translateCategory(entry.category, lang)}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">
                          {entry.description || '—'}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-600 whitespace-nowrap">
                          {entry.reference || '—'}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-end font-mono font-bold tabular-nums whitespace-nowrap ${
                            entry.type === 'income' ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {entry.type === 'income' ? '+' : '-'} {formatCurrencyPKR(entry.amount)}
                        </td>
                        <td className="px-4 py-2.5 text-end whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEntry(entry);
                                setWizardOpen(true);
                                onSubViewChange?.('wizard');
                              }}
                              title={t.edit}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(entry)}
                              title={t.delete}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Mobile Bottom Sheet for Rooznamcha PDF Export Actions */}
      <MobileBottomSheet
        open={mobileActionsOpen}
        title={t.roozPageTitle}
        onClose={() => setMobileActionsOpen(false)}
      >
        <div className="grid grid-cols-1 gap-2.5">
          <button
            type="button"
            disabled={isExportingPdf}
            onClick={() => {
              handleExportPdf(false);
              setMobileActionsOpen(false);
            }}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            <span>{t.exportPdf}</span>
          </button>
          <button
            type="button"
            disabled={isExportingPdf}
            onClick={() => {
              handleExportPdf(true);
              setMobileActionsOpen(false);
            }}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40"
          >
            <UploadCloud className="h-4 w-4" />
            <span>{t.savePdfDrive}</span>
          </button>
        </div>
      </MobileBottomSheet>

      <ConfirmModal
        open={!!deleteTarget}
        title={t.deleteRoozTitle}
        description={
          deleteTarget
            ? t.deleteRoozDesc
                .replace('{desc}', deleteTarget.description || translateCategory(deleteTarget.category, lang))
                .replace('{amount}', formatCurrencyPKR(deleteTarget.amount))
            : ''
        }
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteEntry(deleteTarget.id);
            setDeleteTarget(null);
            onNotify(lang === 'ur' ? 'اندراج حذف کر دیا گیا۔' : 'Entry deleted.', 'info');
          }
        }}
      />
    </div>
  );
};
