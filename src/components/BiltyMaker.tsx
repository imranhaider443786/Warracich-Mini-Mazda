import React, { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  Download,
  Eye,
  FileText,
  MessageSquare,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import {
  formatCurrencyPKR,
  normalizePhoneForWhatsApp,
  TRANSLATIONS,
} from '../i18n';
import {
  AddaSettings,
  BiltyRecord,
  DriverEntry,
  Language,
  PdfFolderCategory,
} from '../types';
import { downloadBlobLocally, generateBiltyPdfBlob } from '../services/pdfGenerator';
import { ConfirmModal } from './ConfirmModal';
import { OfficialBiltySheet } from './OfficialBiltySheet';
import { StepEntryWizard, WizardStepConfig } from './StepEntryWizard';

interface BiltyMakerProps {
  bilties: BiltyRecord[];
  drivers: DriverEntry[];
  settings: AddaSettings;
  lang: Language;
  autoStartWizard?: boolean;
  externalSubView?: 'list' | 'wizard' | 'preview';
  onSubViewChange?: (
    view: 'list' | 'wizard' | 'preview',
    options?: { replace?: boolean }
  ) => void;
  onWizardClosed?: () => void;
  onSaveBilty: (
    record: Omit<BiltyRecord, 'id' | 'updatedAt'>,
    incrementCounter: boolean
  ) => BiltyRecord;
  onUpdateBilty: (record: BiltyRecord) => void;
  onDeleteBilty: (id: string) => void;
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

export const BiltyMaker: React.FC<BiltyMakerProps> = ({
  bilties,
  drivers,
  settings,
  lang,
  autoStartWizard,
  externalSubView,
  onSubViewChange,
  onWizardClosed,
  onSaveBilty,
  onUpdateBilty,
  onDeleteBilty,
  onSavePdfToDrive,
  onNotify,
}) => {
  const t = TRANSLATIONS[lang];
  const [subTab, setSubTab] = useState<'wizard' | 'list' | 'preview'>(
    autoStartWizard
      ? 'wizard'
      : externalSubView || (bilties.length > 0 ? 'list' : 'wizard')
  );
  const [editingBilty, setEditingBilty] = useState<BiltyRecord | null>(null);
  const [previewRecord, setPreviewRecord] = useState<BiltyRecord | null>(
    bilties[0] || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BiltyRecord | null>(null);

  useEffect(() => {
    if (autoStartWizard) {
      setEditingBilty(null);
      setSubTab('wizard');
    }
  }, [autoStartWizard]);

  useEffect(() => {
    if (!externalSubView) return;
    if (externalSubView === 'preview' && !previewRecord) {
      setSubTab('list');
    } else {
      if (externalSubView !== 'wizard') {
        setEditingBilty(null);
      }
      setSubTab(externalSubView);
    }
  }, [externalSubView, previewRecord]);

  const filteredBilties = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bilties
      .filter((b) => {
        if (!q) return true;
        return `${b.biltyNumber} ${b.senderName} ${b.receiverName} ${b.gariNumber} ${b.driverName} ${b.fromCity} ${b.toCity} ${b.goodsDescription}`
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [bilties, searchQuery]);

  const biltySteps: WizardStepConfig[] = useMemo(
    () => [
      {
        key: 'date',
        label: t.date,
        type: 'date',
      },
      {
        key: 'driverName',
        label: t.driverName,
        type: 'text',
        placeholder: lang === 'ur' ? 'ڈرائیور کا نام' : 'Driver name',
        renderExtra: (_vals, setVals) =>
          drivers.length > 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                {t.pickDriverLabel}
              </label>
              <select
                defaultValue=""
                onChange={(e) => {
                  const found = drivers.find((d) => d.id === e.target.value);
                  if (!found) return;
                  setVals((prev) => ({
                    ...prev,
                    driverName: found.driverName || prev.driverName,
                    driverPhone: found.mobileNumber || prev.driverPhone,
                    gariNumber: found.gariNumber || prev.gariNumber,
                    toCity: prev.toCity || found.city || '',
                  }));
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-800 focus:outline-none"
              >
                <option value="">{t.pickDriverPlaceholder}</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.gariNumber || '—'} · {d.driverName || '—'} ({d.city || '—'})
                  </option>
                ))}
              </select>
            </div>
          ) : null,
      },
      {
        key: 'driverPhone',
        label: t.mobileNumber,
        type: 'tel',
        placeholder: '0300-1234567',
      },
      {
        key: 'gariNumber',
        label: t.gariNumber,
        type: 'text',
        placeholder: 'GAM-718 / LES-6543',
      },
      {
        key: 'fromCity',
        label: t.fromCity,
        type: 'text',
        placeholder: lang === 'ur' ? 'مریدوالا / سمندری' : 'Samundri / Muridwala',
      },
      {
        key: 'toCity',
        label: t.toCity,
        type: 'text',
        placeholder: lang === 'ur' ? 'راولپنڈی / لاہور' : 'Lahore / Rawalpindi',
      },
      {
        key: 'senderName',
        label: t.senderName,
        type: 'text',
        placeholder: lang === 'ur' ? 'بھیجنے والے کا نام / پتہ' : 'Sender name or address',
      },
      {
        key: 'senderPhone',
        label: t.senderPhone,
        type: 'tel',
        placeholder: '0301-7188167',
      },
      {
        key: 'receiverName',
        label: t.receiverName,
        type: 'text',
        placeholder: lang === 'ur' ? 'وصول کرنے والے کا نام' : 'Receiver name',
      },
      {
        key: 'receiverPhone',
        label: t.receiverPhone,
        type: 'tel',
        placeholder: '0300-0000000',
      },
      {
        key: 'packagesCount',
        label: t.tadadLabel,
        type: 'text',
        placeholder: t.tadadPlaceholder,
        presets: [
          { value: 'خود مزدا', label: 'خود مزدا' },
          { value: '2 گاریاں', label: '2 گاریاں' },
          { value: '10 نگ', label: '10 نگ' },
          { value: 'Khud Mazda', label: 'Khud Mazda' },
        ],
      },
      {
        key: 'goodsDescription',
        label: t.tafseelMaalLabel,
        type: 'textarea',
        placeholder: lang === 'ur' ? 'ڈنگر / گائے / چاول بوریاں' : 'Goods description',
      },
      {
        key: 'weight',
        label: t.wazanLabel,
        type: 'text',
        placeholder: t.wazanPlaceholder,
      },
      {
        key: 'freightAmount',
        label: t.kirayaLabel,
        type: 'number',
        placeholder: '26000',
        formatReviewValue: (val) => (val ? formatCurrencyPKR(Number(val) || 0) : ''),
      },
      {
        key: 'advancePaid',
        label: t.advanceLabel,
        type: 'number',
        placeholder: '0',
        helperText: t.advanceOmitHint,
        formatReviewValue: (val, allVals) => {
          const adv = Number(val) || 0;
          const total = Number(allVals.freightAmount) || 0;
          const net = Math.max(0, total - adv);
          if (adv <= 0) return '';
          return `${formatCurrencyPKR(adv)} (${t.balanceDue}: ${formatCurrencyPKR(net)})`;
        },
        renderExtra: (vals) => {
          const total = Number(vals.freightAmount) || 0;
          const adv = Number(vals.advancePaid) || 0;
          const net = Math.max(0, total - adv);
          return (
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <Calculator className="h-4 w-4" />
                <span>{t.kirayaCalculatorLabel}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                  <div className="text-[11px] text-slate-500">{t.kirayaLabel}</div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-slate-900 tabular-nums">
                    {formatCurrencyPKR(total)}
                  </div>
                </div>
                <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                  <div className="text-[11px] text-slate-500">{t.advanceLabel}</div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-amber-700 tabular-nums">
                    - {formatCurrencyPKR(adv)}
                  </div>
                </div>
                <div className="rounded-lg bg-blue-900 p-2.5 text-white">
                  <div className="text-[11px] text-blue-100">{t.balanceDue}</div>
                  <div className="mt-0.5 font-mono text-sm font-bold tabular-nums">
                    {formatCurrencyPKR(net)}
                  </div>
                </div>
              </div>
            </div>
          );
        },
      },
    ],
    [drivers, lang, t]
  );

  const wizardInitialValues = useMemo(() => {
    if (editingBilty) {
      return {
        date: editingBilty.date,
        driverName: editingBilty.driverName,
        driverPhone: editingBilty.driverPhone,
        gariNumber: editingBilty.gariNumber,
        fromCity: editingBilty.fromCity,
        toCity: editingBilty.toCity,
        senderName: editingBilty.senderName,
        senderPhone: editingBilty.senderPhone,
        receiverName: editingBilty.receiverName,
        receiverPhone: editingBilty.receiverPhone,
        packagesCount: editingBilty.packagesCount,
        goodsDescription: editingBilty.goodsDescription,
        weight: editingBilty.weight,
        freightAmount: editingBilty.freightAmount ? String(editingBilty.freightAmount) : '',
        advancePaid: editingBilty.advancePaid > 0 ? String(editingBilty.advancePaid) : '',
      };
    }
    return {
      date: getTodayDate(),
      driverName: '',
      driverPhone: '',
      gariNumber: '',
      fromCity: '',
      toCity: '',
      senderName: '',
      senderPhone: '',
      receiverName: '',
      receiverPhone: '',
      packagesCount: '',
      goodsDescription: '',
      weight: '',
      freightAmount: '',
      advancePaid: '',
    };
  }, [editingBilty]);

  const handleWizardSave = (vals: Record<string, string>) => {
    const freight = Math.max(0, Number(vals.freightAmount) || 0);
    const advance = Math.max(0, Number(vals.advancePaid) || 0);
    const balance = Math.max(0, freight - advance);

    const payload = {
      biltyNumber: editingBilty
        ? editingBilty.biltyNumber
        : String(settings.nextBiltyNumber),
      date: (vals.date || '').trim() || getTodayDate(),
      senderName: (vals.senderName || '').trim(),
      senderPhone: (vals.senderPhone || '').trim(),
      receiverName: (vals.receiverName || '').trim(),
      receiverPhone: (vals.receiverPhone || '').trim(),
      fromCity: (vals.fromCity || '').trim(),
      toCity: (vals.toCity || '').trim(),
      gariNumber: (vals.gariNumber || '').trim().toUpperCase(),
      driverName: (vals.driverName || '').trim(),
      driverPhone: (vals.driverPhone || '').trim(),
      goodsDescription: (vals.goodsDescription || '').trim(),
      packagesCount: (vals.packagesCount || '').trim(),
      weight: (vals.weight || '').trim(),
      freightAmount: freight,
      advancePaid: advance,
      balanceDue: balance,
      paymentType: (balance === 0 && freight > 0 ? 'Paid' : 'To-Pay') as 'Paid' | 'To-Pay',
      notes: editingBilty?.notes || '',
    };

    if (editingBilty) {
      const updated: BiltyRecord = {
        ...payload,
        id: editingBilty.id,
        updatedAt: Date.now(),
      };
      onUpdateBilty(updated);
      setPreviewRecord(updated);
      onNotify(lang === 'ur' ? 'بلٹی اپڈیٹ ہو گئی۔' : 'Bilty updated.', 'success');
    } else {
      const saved = onSaveBilty(payload, true);
      setPreviewRecord(saved);
      onNotify(
        lang === 'ur' ? `بلٹی #${saved.biltyNumber} محفوظ ہو گئی۔` : `Bilty #${saved.biltyNumber} saved.`,
        'success'
      );
    }
    setEditingBilty(null);
    setSubTab('preview');
    onSubViewChange?.('preview', { replace: true });
    onWizardClosed?.();
  };

  const handleExportPdf = async (record: BiltyRecord, saveToDrive: boolean) => {
    setIsExportingPdf(true);
    try {
      const blob = await generateBiltyPdfBlob(record, settings, lang);
      const safeVehicle = (record.gariNumber || 'Truck').replace(/[^a-zA-Z0-9-_]/g, '');
      const filename = `Bilty_${record.biltyNumber}_${safeVehicle}.pdf`;
      if (saveToDrive) {
        await onSavePdfToDrive('Bilties', filename, blob);
      } else {
        downloadBlobLocally(blob, filename);
        onNotify(lang === 'ur' ? 'آفیشل بلٹی پی ڈی ایف ڈاؤنلوڈ ہو گئی۔' : 'Official Bilty PDF downloaded.', 'success');
      }
    } catch (err) {
      console.error(err);
      onNotify(lang === 'ur' ? 'پی ڈی ایف بنانے میں خرابی۔' : 'Failed to generate Bilty PDF.', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleShareWhatsApp = (record: BiltyRecord) => {
    const hasAdv = Number(record.advancePaid) > 0;
    const msg =
      `*${settings.biltyStationery.brandTitleUrdu}*\n` +
      `بلٹی نمبر: #${record.biltyNumber}\n` +
      (record.date ? `تاریخ: ${record.date}\n` : '') +
      (record.fromCity || record.toCity ? `روٹ: ${record.fromCity || '—'} تا ${record.toCity || '—'}\n` : '') +
      (record.gariNumber ? `گاڑی نمبر: ${record.gariNumber}\n` : '') +
      (record.driverName || record.driverPhone ? `ڈرائیور: ${record.driverName} ${record.driverPhone}\n` : '') +
      (record.senderName ? `بھیجنے والا: ${record.senderName} ${record.senderPhone}\n` : '') +
      (record.receiverName ? `وصول کرنے والا: ${record.receiverName} ${record.receiverPhone}\n` : '') +
      (record.packagesCount ? `تعداد: ${record.packagesCount}\n` : '') +
      (record.goodsDescription ? `تفصیل مال: ${record.goodsDescription}\n` : '') +
      (record.weight ? `وزن: ${record.weight}\n` : '') +
      (record.freightAmount > 0 ? `کل کرایہ: ${formatCurrencyPKR(record.freightAmount)}\n` : '') +
      (hasAdv ? `پیشگی: ${formatCurrencyPKR(record.advancePaid)}\n` : '') +
      `کرایہ قابل ادا: ${formatCurrencyPKR(record.balanceDue)}`;

    const targetPhone =
      normalizePhoneForWhatsApp(record.receiverPhone) ||
      normalizePhoneForWhatsApp(record.senderPhone) ||
      normalizePhoneForWhatsApp(record.driverPhone);
    const url = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t.biltyPageTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{t.biltyPageSub}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setEditingBilty(null);
                setSubTab('wizard');
                onSubViewChange?.('wizard');
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                subTab === 'wizard'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t.newBiltyBtn}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSubTab('list');
                onSubViewChange?.('list');
              }}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                subTab === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.savedBiltiesTab} ({bilties.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setSubTab('preview');
                onSubViewChange?.('preview');
              }}
              disabled={!previewRecord}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 whitespace-nowrap ${
                subTab === 'preview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.previewBiltyTab}
            </button>
          </div>
        </div>
      </div>

      {/* Step-by-Step Bilty Entry Wizard */}
      {subTab === 'wizard' && (
        <div className="no-print">
          <StepEntryWizard
            key={editingBilty?.id || 'new-bilty'}
            title={
              editingBilty
                ? `${t.edit} ${t.biltyNumber} #${editingBilty.biltyNumber}`
                : `${t.newBiltyBtn} (#${settings.nextBiltyNumber})`
            }
            steps={biltySteps}
            initialValues={wizardInitialValues}
            lang={lang}
            saveButtonLabel={t.wizardSaveAndPrint}
            onCancel={() => {
              const next = previewRecord ? 'preview' : 'list';
              setEditingBilty(null);
              setSubTab(next);
              onSubViewChange?.(next, { replace: true });
              onWizardClosed?.();
            }}
            onSave={handleWizardSave}
          />
        </div>
      )}

      {/* Saved Bilties Table */}
      {subTab === 'list' && (
        <div className="no-print rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute top-2.5 start-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 ps-9 pe-3 text-sm text-slate-900 focus:border-blue-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {filteredBilties.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <FileText className="h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                {t.noRecordsTitle}
              </h3>
              <p className="mt-1 max-w-md text-xs text-slate-500">{t.noRecordsSub}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-start text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="px-3 py-2.5 text-start whitespace-nowrap">{t.biltyNumber}</th>
                    <th className="px-3 py-2.5 text-start whitespace-nowrap">{t.date}</th>
                    <th className="px-3 py-2.5 text-start whitespace-nowrap">{t.fromCity} → {t.toCity}</th>
                    <th className="px-3 py-2.5 text-start whitespace-nowrap">{t.driverName} / {t.gariNumber}</th>
                    <th className="px-3 py-2.5 text-start whitespace-nowrap">{t.tafseelMaalLabel}</th>
                    <th className="px-3 py-2.5 text-end whitespace-nowrap">{t.balanceDue}</th>
                    <th className="px-3 py-2.5 text-end whitespace-nowrap">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBilties.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2.5 font-mono font-bold text-blue-900 tabular-nums whitespace-nowrap">
                        #{b.biltyNumber}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {b.date || '—'}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="font-medium text-slate-900">
                          {b.fromCity || '—'} → {b.toCity || '—'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {b.senderName || '—'} / {b.receiverName || '—'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="font-mono text-xs font-semibold text-slate-900">
                          {b.gariNumber || '—'}
                        </div>
                        <div className="text-xs text-slate-500">{b.driverName || '—'}</div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-700">
                        <div>{b.goodsDescription || '—'}</div>
                        <div className="text-slate-400">
                          {[b.packagesCount, b.weight].filter(Boolean).join(' · ')}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-end whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 tabular-nums">
                          {formatCurrencyPKR(b.balanceDue)}
                        </div>
                        {b.advancePaid > 0 && (
                          <div className="font-mono text-[11px] text-amber-700 tabular-nums">
                            {t.advanceLabel}: {formatCurrencyPKR(b.advancePaid)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-end whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewRecord(b);
                              setSubTab('preview');
                              onSubViewChange?.('preview');
                            }}
                            title={t.previewBiltyTab}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(b)}
                            title={t.shareWhatsappBilty}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBilty(b);
                              setSubTab('wizard');
                              onSubViewChange?.('wizard');
                            }}
                            title={t.edit}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(b)}
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
          )}
        </div>
      )}

      {/* Official Urdu Warraich Goods Samundri Bilty Preview & Print */}
      {subTab === 'preview' && previewRecord && (
        <div className="space-y-4">
          <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <span className="font-mono text-xs font-bold text-slate-700">
              {t.biltyNumber} #{previewRecord.biltyNumber}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
              >
                <Printer className="h-3.5 w-3.5" />
                {t.printBilty}
              </button>
              <button
                type="button"
                onClick={() => handleShareWhatsApp(previewRecord)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 whitespace-nowrap"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {t.shareWhatsappBilty}
              </button>
              <button
                type="button"
                disabled={isExportingPdf}
                onClick={() => handleExportPdf(previewRecord, false)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" />
                {t.exportPdf}
              </button>
              <button
                type="button"
                disabled={isExportingPdf}
                onClick={() => handleExportPdf(previewRecord, true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-40 whitespace-nowrap"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                {t.savePdfDrive}
              </button>
            </div>
          </div>

          <OfficialBiltySheet bilty={previewRecord} settings={settings} />
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title={t.deleteBiltyTitle}
        description={
          deleteTarget
            ? t.deleteBiltyDesc.replace('{num}', deleteTarget.biltyNumber)
            : ''
        }
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteBilty(deleteTarget.id);
            if (previewRecord?.id === deleteTarget.id) {
              setPreviewRecord(null);
              setSubTab('list');
            }
            setDeleteTarget(null);
            onNotify(lang === 'ur' ? 'بلٹی حذف کر دی گئی۔' : 'Bilty deleted.', 'info');
          }
        }}
      />
    </div>
  );
};
