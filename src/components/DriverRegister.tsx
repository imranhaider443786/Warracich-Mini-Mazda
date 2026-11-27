import React, { useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import {
  GARI_FEET_PRESETS,
  normalizePhoneForWhatsApp,
  translateDriverStatus,
  translateUnit,
  TRANSLATIONS,
} from '../i18n';
import {
  AddaSettings,
  DriverEntry,
  DriverStatus,
  Language,
  PdfFolderCategory,
  WeightUnit,
} from '../types';
import {
  downloadBlobLocally,
  generateDriverRegisterPdfBlob,
} from '../services/pdfGenerator';
import { ConfirmModal } from './ConfirmModal';
import { MobileBottomSheet } from './MobileBottomSheet';
import { StepEntryWizard, WizardStepConfig } from './StepEntryWizard';

interface DriverRegisterProps {
  drivers: DriverEntry[];
  settings: AddaSettings;
  lang: Language;
  autoStartWizard?: boolean;
  externalSubView?: 'list' | 'wizard';
  onSubViewChange?: (view: 'list' | 'wizard', options?: { replace?: boolean }) => void;
  onWizardClosed?: () => void;
  onAddDriver: (entry: Omit<DriverEntry, 'id' | 'updatedAt'>) => void;
  onUpdateDriver: (entry: DriverEntry) => void;
  onDeleteDriver: (id: string) => void;
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

function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export const DriverRegister: React.FC<DriverRegisterProps> = ({
  drivers,
  settings,
  lang,
  autoStartWizard,
  externalSubView,
  onSubViewChange,
  onWizardClosed,
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver,
  onSavePdfToDrive,
  onNotify,
}) => {
  const t = TRANSLATIONS[lang];

  const [wizardOpen, setWizardOpen] = useState(!!autoStartWizard);
  const [editingDriver, setEditingDriver] = useState<DriverEntry | null>(null);

  useEffect(() => {
    if (autoStartWizard) {
      setEditingDriver(null);
      setWizardOpen(true);
    }
  }, [autoStartWizard]);

  useEffect(() => {
    if (externalSubView === 'list') {
      setWizardOpen(false);
      setEditingDriver(null);
    } else if (externalSubView === 'wizard') {
      setWizardOpen(true);
    }
  }, [externalSubView]);

  // Filters & marketing selection
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterCity, setFilterCity] = useState<string>('');
  const [filterFeet, setFilterFeet] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    settings.whatsappTemplates[0]?.id || 'tpl_load_available'
  );
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DriverEntry | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);

  const activeFilterCount = [filterDate, filterCity, filterFeet, filterStatus].filter(Boolean).length;

  const uniqueCities = useMemo(() => {
    const set = new Set(drivers.map((d) => d.city.trim()).filter(Boolean));
    return Array.from(set).sort();
  }, [drivers]);

  const uniqueFeet = useMemo(() => {
    const set = new Set(drivers.map((d) => d.gariFeet.trim()).filter(Boolean));
    return Array.from(set).sort();
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return drivers
      .filter((d) => {
        if (filterDate && d.date !== filterDate) return false;
        if (filterCity && d.city.trim() !== filterCity) return false;
        if (filterFeet && d.gariFeet.trim() !== filterFeet) return false;
        if (filterStatus && d.status !== filterStatus) return false;
        if (q) {
          const hay = `${d.gariNumber} ${d.driverName} ${d.city} ${d.mobileNumber} ${d.gariFeet}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [drivers, searchQuery, filterDate, filterCity, filterFeet, filterStatus]);

  const selectedDrivers = useMemo(() => {
    if (selectedIds.length > 0) {
      return filteredDrivers.filter((d) => selectedIds.includes(d.id));
    }
    return filteredDrivers;
  }, [filteredDrivers, selectedIds]);

  const availableCount = useMemo(
    () => filteredDrivers.filter((d) => d.status === 'Available').length,
    [filteredDrivers]
  );

  const driverWizardSteps: WizardStepConfig[] = [
    {
      key: 'date',
      label: t.date,
      type: 'date',
    },
    {
      key: 'gariNumber',
      label: t.gariNumber,
      type: 'text',
      placeholder: 'LES-4521',
    },
    {
      key: 'gariFeet',
      label: t.gariFeet,
      type: 'text',
      placeholder: t.customFeetPlaceholder,
      presets: GARI_FEET_PRESETS.map((p) => ({ value: p, label: p })),
    },
    {
      key: 'city',
      label: t.city,
      type: 'text',
      placeholder: lang === 'ur' ? 'لاہور / کراچی' : 'Lahore / Karachi',
    },
    {
      key: 'driverName',
      label: t.driverName,
      type: 'text',
      placeholder: lang === 'ur' ? 'محمد اکرم' : 'Muhammad Akram',
    },
    {
      key: 'mobileNumber',
      label: t.mobileNumber,
      type: 'tel',
      placeholder: '0300-1234567',
    },
    {
      key: 'weightCapacity',
      label: t.weightCapacity,
      type: 'text',
      placeholder: lang === 'ur' ? 'مثلاً 15 یا 400' : 'e.g. 15',
    },
    {
      key: 'weightUnit',
      label: t.weightUnit,
      type: 'select',
      selectOptions: [
        { value: 'Tons', label: translateUnit('Tons', lang) },
        { value: 'Mann', label: translateUnit('Mann', lang) },
        { value: 'Kg', label: translateUnit('Kg', lang) },
      ],
      presets: [
        { value: 'Tons', label: translateUnit('Tons', lang) },
        { value: 'Mann', label: translateUnit('Mann', lang) },
        { value: 'Kg', label: translateUnit('Kg', lang) },
      ],
    },
    {
      key: 'status',
      label: t.status,
      type: 'select',
      selectOptions: [
        { value: 'Available', label: translateDriverStatus('Available', lang) },
        { value: 'Loaded', label: translateDriverStatus('Loaded', lang) },
        { value: 'Dispatched', label: translateDriverStatus('Dispatched', lang) },
      ],
      presets: [
        { value: 'Available', label: translateDriverStatus('Available', lang) },
        { value: 'Loaded', label: translateDriverStatus('Loaded', lang) },
        { value: 'Dispatched', label: translateDriverStatus('Dispatched', lang) },
      ],
    },
    {
      key: 'notes',
      label: t.notes,
      type: 'textarea',
      placeholder: lang === 'ur' ? 'واپسی / لوڈ تفصیل' : 'Return load / remarks',
    },
  ];

  const wizardInitialValues = useMemo(() => {
    if (editingDriver) {
      return {
        date: editingDriver.date,
        gariNumber: editingDriver.gariNumber,
        gariFeet: editingDriver.gariFeet,
        city: editingDriver.city,
        driverName: editingDriver.driverName,
        mobileNumber: editingDriver.mobileNumber,
        weightCapacity: editingDriver.weightCapacity,
        weightUnit: editingDriver.weightUnit,
        status: editingDriver.status,
        notes: editingDriver.notes,
      };
    }
    return {
      date: getTodayDate(),
      gariNumber: '',
      gariFeet: '',
      city: '',
      driverName: '',
      mobileNumber: '',
      weightCapacity: '',
      weightUnit: 'Tons',
      status: 'Available',
      notes: '',
    };
  }, [editingDriver]);

  const closeWizard = () => {
    setWizardOpen(false);
    setEditingDriver(null);
    onSubViewChange?.('list', { replace: true });
    onWizardClosed?.();
  };

  const handleWizardSave = (vals: Record<string, string>) => {
    const payload = {
      date: vals.date?.trim() || getTodayDate(),
      time: editingDriver?.time || getCurrentTime(),
      gariNumber: (vals.gariNumber || '').trim().toUpperCase(),
      gariFeet: (vals.gariFeet || '').trim(),
      city: (vals.city || '').trim(),
      driverName: (vals.driverName || '').trim(),
      mobileNumber: (vals.mobileNumber || '').trim(),
      weightCapacity: (vals.weightCapacity || '').trim(),
      weightUnit: ((vals.weightUnit as WeightUnit) || 'Tons'),
      status: ((vals.status as DriverStatus) || 'Available'),
      notes: (vals.notes || '').trim(),
    };

    if (editingDriver) {
      onUpdateDriver({
        ...payload,
        id: editingDriver.id,
        updatedAt: Date.now(),
      });
      onNotify(lang === 'ur' ? 'ڈرائیور کا اندراج اپڈیٹ ہو گیا۔' : 'Driver entry updated.', 'success');
    } else {
      onAddDriver(payload);
      onNotify(lang === 'ur' ? 'نیا ڈرائیور محفوظ ہو گیا۔' : 'Driver arrival logged.', 'success');
    }
    closeWizard();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDrivers.length && filteredDrivers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDrivers.map((d) => d.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const buildWhatsAppMessage = (driver: DriverEntry): string => {
    const tpl =
      settings.whatsappTemplates.find((item) => item.id === selectedTemplateId) ||
      settings.whatsappTemplates[0];
    const raw = lang === 'ur' ? tpl.bodyUr : tpl.bodyEn;
    const addaName = lang === 'ur' ? settings.addaNameUrdu : settings.addaName;
    return raw
      .replace(/\{driverName\}/g, driver.driverName || 'Driver')
      .replace(/\{gariNumber\}/g, driver.gariNumber || '—')
      .replace(/\{gariFeet\}/g, driver.gariFeet || '—')
      .replace(/\{city\}/g, driver.city || '—')
      .replace(/\{addaName\}/g, addaName)
      .replace(/\{addaPhone\}/g, settings.phone);
  };

  const handleOpenWhatsApp = (driver: DriverEntry) => {
    const phone = normalizePhoneForWhatsApp(driver.mobileNumber);
    if (!phone) return;
    const text = encodeURIComponent(buildWhatsAppMessage(driver));
    const url = `https://wa.me/${phone}?text=${text}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  const handleCopyNumbers = async () => {
    const nums = Array.from(
      new Set(selectedDrivers.map((d) => d.mobileNumber.trim()).filter(Boolean))
    );
    if (nums.length === 0) return;
    try {
      await navigator.clipboard.writeText(nums.join('\n'));
      onNotify(`${t.numbersCopied} (${nums.length})`, 'success');
    } catch {
      onNotify(nums.join(', '), 'info');
    }
  };

  const handleExportCsv = () => {
    if (selectedDrivers.length === 0) return;
    const headers = [
      'Date',
      'Time',
      'Gari Number',
      'Gari Feet',
      'City',
      'Driver Name',
      'Mobile Number',
      'WhatsApp Number',
      'Weight Capacity',
      'Unit',
      'Status',
      'Notes',
    ];
    const rows = selectedDrivers.map((d) => [
      d.date,
      d.time,
      d.gariNumber,
      d.gariFeet,
      d.city,
      d.driverName,
      d.mobileNumber,
      normalizePhoneForWhatsApp(d.mobileNumber),
      d.weightCapacity,
      d.weightUnit,
      d.status,
      d.notes,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlobLocally(blob, `Adda_Drivers_Contacts_${filterDate || getTodayDate()}.csv`);
    onNotify(lang === 'ur' ? 'CSV فائل ڈاؤنلوڈ ہو گئی۔' : 'Driver contacts CSV downloaded.', 'success');
  };

  const handleExportPdf = async (saveToDrive: boolean) => {
    if (selectedDrivers.length === 0) return;
    setIsExportingPdf(true);
    try {
      const summaryParts = [
        filterDate || t.allDates,
        filterCity || t.allCities,
        `${selectedDrivers.length} ${t.totalVehicles}`,
      ];
      const blob = await generateDriverRegisterPdfBlob(
        selectedDrivers,
        summaryParts.join(' · '),
        settings,
        lang
      );
      const filename = `Driver_Register_${filterDate || getTodayDate()}.pdf`;
      if (saveToDrive) {
        await onSavePdfToDrive('Drivers', filename, blob);
      } else {
        downloadBlobLocally(blob, filename);
        onNotify(lang === 'ur' ? 'پی ڈی ایف ڈاؤنلوڈ ہو گئی۔' : 'Driver Register PDF downloaded.', 'success');
      }
    } catch (err) {
      console.error(err);
      onNotify(lang === 'ur' ? 'پی ڈی ایف بنانے میں خرابی۔' : 'Failed to generate PDF.', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header + KPI Strip + New Entry Button */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t.driverPageTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{t.driverPageSub}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="grid w-full grid-cols-3 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-white sm:w-auto">
            <div className="min-w-0 px-2.5 py-2 sm:px-3.5">
              <div className="truncate text-[11px] font-medium text-slate-500">{t.totalVehicles}</div>
              <div className="font-mono text-base font-bold text-slate-900 tabular-nums">
                {filteredDrivers.length}
              </div>
            </div>
            <div className="min-w-0 px-2.5 py-2 sm:px-3.5">
              <div className="truncate text-[11px] font-medium text-slate-500">{t.availableVehicles}</div>
              <div className="font-mono text-base font-bold text-emerald-700 tabular-nums">
                {availableCount}
              </div>
            </div>
            <div className="min-w-0 px-2.5 py-2 sm:px-3.5">
              <div className="truncate text-[11px] font-medium text-slate-500">{t.totalCapacityLogged}</div>
              <div className="font-mono text-base font-bold text-blue-900 tabular-nums">
                {uniqueCities.length}
              </div>
            </div>
          </div>

          {!wizardOpen && (
            <button
              type="button"
              onClick={() => {
                setEditingDriver(null);
                setWizardOpen(true);
                onSubViewChange?.('wizard');
              }}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>{t.newDriverBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* One-by-One Step Wizard */}
      {wizardOpen ? (
        <StepEntryWizard
          key={editingDriver?.id || 'new-driver'}
          title={editingDriver ? `${t.edit}: ${editingDriver.gariNumber}` : t.newDriverBtn}
          steps={driverWizardSteps}
          initialValues={wizardInitialValues}
          lang={lang}
          onCancel={closeWizard}
          onSave={handleWizardSave}
        />
      ) : (
        /* Filter + Marketing Action Toolbar + Mobile Cards / Desktop Table */
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* Mobile Compact Search + Collapsible Filter + Bottom-Sheet Actions */}
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
                  mobileFiltersOpen || activeFilterCount > 0
                    ? 'border-blue-900 bg-blue-50 text-blue-900'
                    : 'border-slate-300 bg-white text-slate-700'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>
                  {t.filtersBtn}
                  {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMobileActionsOpen(true)}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span>{t.actionsBtn}</span>
              </button>
            </div>

            {mobileFiltersOpen && (
              <div className="mt-3 space-y-2.5 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 font-mono text-xs text-slate-800 focus:border-blue-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFilterDate(filterDate === getTodayDate() ? '' : getTodayDate())
                    }
                    className={`h-10 shrink-0 rounded-lg border px-3 text-xs font-semibold whitespace-nowrap ${
                      filterDate === getTodayDate()
                        ? 'border-blue-900 bg-blue-50 text-blue-900'
                        : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    {filterDate ? t.allDates : t.todayOnly}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 focus:border-blue-800 focus:outline-none"
                  >
                    <option value="">{t.allCities}</option>
                    {uniqueCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterFeet}
                    onChange={(e) => setFilterFeet(e.target.value)}
                    className="h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 focus:border-blue-800 focus:outline-none"
                  >
                    <option value="">{t.allFeet}</option>
                    {uniqueFeet.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 focus:border-blue-800 focus:outline-none"
                  >
                    <option value="">{t.allStatuses}</option>
                    <option value="Available">{translateDriverStatus('Available', lang)}</option>
                    <option value="Loaded">{translateDriverStatus('Loaded', lang)}</option>
                    <option value="Dispatched">{translateDriverStatus('Dispatched', lang)}</option>
                  </select>

                  {(activeFilterCount > 0 || searchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setFilterDate('');
                        setFilterCity('');
                        setFilterFeet('');
                        setFilterStatus('');
                      }}
                      className="h-10 shrink-0 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      {t.clear}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Filter & Marketing Strip */}
          <div className="hidden md:block">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-2.5">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="pointer-events-none absolute top-2.5 start-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 ps-9 pe-3 text-sm text-slate-900 focus:border-blue-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-mono text-xs text-slate-800 focus:border-blue-800 focus:outline-none"
                  />
                  {filterDate ? (
                    <button
                      type="button"
                      onClick={() => setFilterDate('')}
                      className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      {t.allDates}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setFilterDate(getTodayDate())}
                      className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap"
                    >
                      {t.todayOnly}
                    </button>
                  )}
                </div>

                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-800 focus:border-blue-800 focus:outline-none"
                >
                  <option value="">{t.allCities}</option>
                  {uniqueCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={filterFeet}
                  onChange={(e) => setFilterFeet(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-800 focus:border-blue-800 focus:outline-none"
                >
                  <option value="">{t.allFeet}</option>
                  {uniqueFeet.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-800 focus:border-blue-800 focus:outline-none"
                >
                  <option value="">{t.allStatuses}</option>
                  <option value="Available">{translateDriverStatus('Available', lang)}</option>
                  <option value="Loaded">{translateDriverStatus('Loaded', lang)}</option>
                  <option value="Dispatched">{translateDriverStatus('Dispatched', lang)}</option>
                </select>
              </div>
            </div>

            {/* Marketing & Export Strip */}
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">
                  {t.whatsappMarketingTitle}
                </span>
                <span className="text-slate-300" aria-hidden="true">
                  ·
                </span>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  aria-label={t.chooseTemplate}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-800 focus:outline-none"
                >
                  {settings.whatsappTemplates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {lang === 'ur' ? tpl.nameUr : tpl.nameEn}
                    </option>
                  ))}
                </select>
                {selectedIds.length > 0 && (
                  <span className="font-mono text-xs font-semibold text-blue-900 tabular-nums">
                    {selectedIds.length} {t.marketingSelected}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyNumbers}
                  disabled={selectedDrivers.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 whitespace-nowrap"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {t.copyNumbers}
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={selectedDrivers.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 whitespace-nowrap"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  {t.exportCsv}
                </button>
                <button
                  type="button"
                  onClick={() => handleExportPdf(false)}
                  disabled={selectedDrivers.length === 0 || isExportingPdf}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 whitespace-nowrap"
                >
                  <Download className="h-3.5 w-3.5" />
                  {t.exportPdf}
                </button>
                <button
                  type="button"
                  onClick={() => handleExportPdf(true)}
                  disabled={selectedDrivers.length === 0 || isExportingPdf}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-40 whitespace-nowrap"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  {t.savePdfDrive}
                </button>
              </div>
            </div>
          </div>

          {filteredDrivers.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <FileText className="h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                {t.noRecordsTitle}
              </h3>
              <p className="mt-1 max-w-md text-xs text-slate-500">{t.noRecordsSub}</p>
            </div>
          ) : (
            <>
              {/* Mobile Driver Cards (< md, Zero Horizontal Scroll) */}
              <div className="divide-y divide-slate-200 md:hidden">
                {filteredDrivers.map((d) => {
                  const isChecked = selectedIds.includes(d.id);
                  return (
                    <div
                      key={d.id}
                      className={`space-y-2.5 p-3.5 ${isChecked ? 'bg-blue-50/40' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectOne(d.id)}
                            aria-label={`Select ${d.gariNumber || d.driverName}`}
                            className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-900 focus:ring-blue-800"
                          />
                          <div className="min-w-0">
                            <div className="truncate font-mono text-sm font-bold text-slate-900 tabular-nums">
                              {d.gariNumber || '—'}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                              {d.date || '—'}
                              {d.time ? ` · ${d.time}` : ''}
                            </div>
                          </div>
                        </div>

                        <select
                          value={d.status}
                          onChange={(e) =>
                            onUpdateDriver({
                              ...d,
                              status: e.target.value as DriverStatus,
                              updatedAt: Date.now(),
                            })
                          }
                          className={`h-8 shrink-0 rounded-md border px-2 text-xs font-semibold focus:outline-none ${
                            d.status === 'Available'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : d.status === 'Loaded'
                                ? 'border-amber-200 bg-amber-50 text-amber-800'
                                : 'border-slate-200 bg-slate-100 text-slate-700'
                          }`}
                        >
                          <option value="Available">{translateDriverStatus('Available', lang)}</option>
                          <option value="Loaded">{translateDriverStatus('Loaded', lang)}</option>
                          <option value="Dispatched">{translateDriverStatus('Dispatched', lang)}</option>
                        </select>
                      </div>

                      <div className="space-y-1 text-xs text-slate-700">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium text-slate-900">
                          <span>{d.driverName || '—'}</span>
                          {d.city && (
                            <>
                              <span className="text-slate-300" aria-hidden="true">·</span>
                              <span>{d.city}</span>
                            </>
                          )}
                          {d.mobileNumber && (
                            <>
                              <span className="text-slate-300" aria-hidden="true">·</span>
                              <span dir="ltr" className="font-mono tabular-nums text-slate-700">
                                {d.mobileNumber}
                              </span>
                            </>
                          )}
                        </div>
                        {(d.gariFeet || d.weightCapacity) && (
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                            {d.gariFeet && <span>{d.gariFeet}</span>}
                            {d.gariFeet && d.weightCapacity && (
                              <span className="text-slate-300" aria-hidden="true">·</span>
                            )}
                            {d.weightCapacity && (
                              <span className="font-mono font-semibold text-slate-700 tabular-nums">
                                {d.weightCapacity} {translateUnit(d.weightUnit, lang)}
                              </span>
                            )}
                          </div>
                        )}
                        {d.notes && (
                          <p className="text-[11px] text-slate-500 break-words">{d.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 pt-0.5">
                        {d.mobileNumber && (
                          <>
                            <a
                              href={`tel:${d.mobileNumber}`}
                              className="inline-flex min-h-[38px] flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              <span>{t.callDriver}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleOpenWhatsApp(d)}
                              className="inline-flex min-h-[38px] flex-1 items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDriver(d);
                            setWizardOpen(true);
                            onSubViewChange?.('wizard');
                          }}
                          title={t.edit}
                          className="inline-flex min-h-[38px] min-w-[40px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-slate-700 hover:bg-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(d)}
                          title={t.delete}
                          className="inline-flex min-h-[38px] min-w-[40px] items-center justify-center rounded-lg border border-red-200 bg-white px-2.5 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table (>= md) */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-start text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="w-10 px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={
                            selectedIds.length === filteredDrivers.length &&
                            filteredDrivers.length > 0
                          }
                          onChange={toggleSelectAll}
                          aria-label={t.selectAll}
                          className="h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-800"
                        />
                      </th>
                      <th className="px-3 py-2.5 text-start whitespace-nowrap">{t.date}</th>
                      <th className="px-3 py-2.5 text-start whitespace-nowrap">{t.gariNumber}</th>
                      <th className="px-3 py-2.5 text-start whitespace-nowrap">{t.gariFeet}</th>
                      <th className="px-3 py-2.5 text-start whitespace-nowrap">{t.city}</th>
                      <th className="px-3 py-2.5 text-start whitespace-nowrap">{t.driverName}</th>
                      <th className="px-3 py-2.5 text-start whitespace-nowrap">{t.mobileNumber}</th>
                      <th className="px-3 py-2.5 text-end whitespace-nowrap">{t.weightCapacity}</th>
                      <th className="px-3 py-2.5 text-start whitespace-nowrap">{t.status}</th>
                      <th className="px-3 py-2.5 text-end whitespace-nowrap">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDrivers.map((d) => {
                      const isChecked = selectedIds.includes(d.id);
                      return (
                        <tr
                          key={d.id}
                          className={`transition-colors hover:bg-slate-50/80 ${
                            isChecked ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectOne(d.id)}
                              aria-label={`Select ${d.gariNumber || d.driverName}`}
                              className="h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-800"
                            />
                          </td>
                          <td className="px-3 py-2.5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                            {d.date || '—'}
                            {d.time && <span className="ms-1.5 text-slate-400">{d.time}</span>}
                          </td>
                          <td className="px-3 py-2.5 font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                            {d.gariNumber || '—'}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-700 whitespace-nowrap">
                            {d.gariFeet || '—'}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-900 whitespace-nowrap">
                            {d.city || '—'}
                          </td>
                          <td className="px-3 py-2.5 text-slate-800 whitespace-nowrap">
                            <div>{d.driverName || '—'}</div>
                            {d.notes && (
                              <div className="max-w-[180px] truncate text-xs text-slate-400">
                                {d.notes}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-xs font-medium text-slate-800 tabular-nums whitespace-nowrap">
                            {d.mobileNumber || '—'}
                          </td>
                          <td className="px-3 py-2.5 text-end font-mono text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                            {d.weightCapacity
                              ? `${d.weightCapacity} ${translateUnit(d.weightUnit, lang)}`
                              : '—'}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <select
                              value={d.status}
                              onChange={(e) =>
                                onUpdateDriver({
                                  ...d,
                                  status: e.target.value as DriverStatus,
                                  updatedAt: Date.now(),
                                })
                              }
                              className={`rounded-md border px-2 py-1 text-xs font-semibold focus:outline-none ${
                                d.status === 'Available'
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                  : d.status === 'Loaded'
                                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                                    : 'border-slate-200 bg-slate-100 text-slate-700'
                              }`}
                            >
                              <option value="Available">{translateDriverStatus('Available', lang)}</option>
                              <option value="Loaded">{translateDriverStatus('Loaded', lang)}</option>
                              <option value="Dispatched">{translateDriverStatus('Dispatched', lang)}</option>
                            </select>
                          </td>
                          <td className="px-3 py-2.5 text-end whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              {d.mobileNumber && (
                                <>
                                  <a
                                    href={`tel:${d.mobileNumber}`}
                                    title={t.callDriver}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100"
                                  >
                                    <Phone className="h-3.5 w-3.5" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenWhatsApp(d)}
                                    title={t.sendWhatsapp}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDriver(d);
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
                                onClick={() => setDeleteTarget(d)}
                                title={t.delete}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Mobile Bottom Sheet for WhatsApp Marketing & Export Actions */}
      <MobileBottomSheet
        open={mobileActionsOpen}
        title={t.whatsappMarketingTitle}
        onClose={() => setMobileActionsOpen(false)}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <span className="text-xs font-semibold text-slate-700">
              {selectedIds.length > 0
                ? `${selectedIds.length} ${t.marketingSelected}`
                : `${filteredDrivers.length} ${t.totalVehicles}`}
            </span>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-xs font-bold text-blue-900 hover:underline"
            >
              {selectedIds.length === filteredDrivers.length && filteredDrivers.length > 0
                ? t.clear
                : t.selectAll}
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              {t.chooseTemplate}
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 focus:border-blue-800 focus:outline-none"
            >
              {settings.whatsappTemplates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {lang === 'ur' ? tpl.nameUr : tpl.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <button
              type="button"
              onClick={() => {
                handleCopyNumbers();
                setMobileActionsOpen(false);
              }}
              disabled={selectedDrivers.length === 0}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40"
            >
              <Copy className="h-4 w-4" />
              <span>{t.copyNumbers}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleExportCsv();
                setMobileActionsOpen(false);
              }}
              disabled={selectedDrivers.length === 0}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>{t.exportCsv}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleExportPdf(false);
                setMobileActionsOpen(false);
              }}
              disabled={selectedDrivers.length === 0 || isExportingPdf}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              <span>{t.exportPdf}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleExportPdf(true);
                setMobileActionsOpen(false);
              }}
              disabled={selectedDrivers.length === 0 || isExportingPdf}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40"
            >
              <UploadCloud className="h-4 w-4" />
              <span>{t.savePdfDrive}</span>
            </button>
          </div>
        </div>
      </MobileBottomSheet>

      <ConfirmModal
        open={!!deleteTarget}
        title={t.deleteDriverTitle}
        description={
          deleteTarget
            ? t.deleteDriverDesc
                .replace('{gari}', deleteTarget.gariNumber || '—')
                .replace('{driver}', deleteTarget.driverName || '—')
            : ''
        }
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteDriver(deleteTarget.id);
            setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
            setDeleteTarget(null);
            onNotify(lang === 'ur' ? 'اندراج حذف کر دیا گیا۔' : 'Driver entry deleted.', 'info');
          }
        }}
      />
    </div>
  );
};
