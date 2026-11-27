import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ClipboardList,
  Pencil,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { formatCurrencyPKR, GOODS_TYPE_PRESETS, TRANSLATIONS } from '../i18n';
import { Language, OrderEntry } from '../types';
import { DirectoryContact } from '../services/contacts';
import { ConfirmModal } from './ConfirmModal';
import { ContactPickerFieldPanel } from './ContactPickerFieldPanel';
import { StepEntryWizard, WizardStepConfig } from './StepEntryWizard';

interface OrderRegisterProps {
  orders: OrderEntry[];
  contacts: DirectoryContact[];
  lang: Language;
  autoStartWizard?: boolean;
  externalSubView?: 'list' | 'wizard';
  onSubViewChange?: (view: 'list' | 'wizard', options?: { replace?: boolean }) => void;
  onWizardClosed?: () => void;
  onAddOrder: (entry: Omit<OrderEntry, 'id' | 'updatedAt'>) => void;
  onUpdateOrder: (entry: OrderEntry) => void;
  onDeleteOrder: (id: string) => void;
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export const OrderRegister: React.FC<OrderRegisterProps> = ({
  orders,
  contacts,
  lang,
  autoStartWizard,
  externalSubView,
  onSubViewChange,
  onWizardClosed,
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder,
  onNotify,
}) => {
  const t = TRANSLATIONS[lang];

  const [wizardOpen, setWizardOpen] = useState(!!autoStartWizard);
  const [editingOrder, setEditingOrder] = useState<OrderEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<OrderEntry | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (autoStartWizard) {
      setEditingOrder(null);
      setWizardOpen(true);
    }
  }, [autoStartWizard]);

  useEffect(() => {
    if (externalSubView === 'list') {
      setWizardOpen(false);
      setEditingOrder(null);
    } else if (externalSubView === 'wizard') {
      setWizardOpen(true);
    }
  }, [externalSubView]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders
      .filter((o) => {
        if (filterDate && o.date !== filterDate) return false;
        if (q) {
          const hay =
            `${o.date} ${o.customerName} ${o.mobileNumber} ${o.goodsType} ${o.weight} ${o.pickupLocation} ${o.dropoffLocation} ${o.estimateFare} ${o.notes}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return (b.date || '').localeCompare(a.date || '');
        return b.updatedAt - a.updatedAt;
      });
  }, [orders, searchQuery, filterDate]);

  const orderWizardSteps: WizardStepConfig[] = [
    {
      key: 'date',
      label: t.date,
      type: 'date',
    },
    {
      key: 'mobileNumber',
      label: t.customerMobileLabel,
      type: 'tel',
      placeholder: '0300-1234567',
      renderExtra: (vals, setVals) => (
        <ContactPickerFieldPanel
          lang={lang}
          contacts={contacts}
          currentName={vals.customerName || ''}
          currentPhone={vals.mobileNumber || ''}
          onNotify={onNotify}
          onSelectContact={(pickedName, pickedPhone) =>
            setVals((prev) => ({
              ...prev,
              mobileNumber: pickedPhone || prev.mobileNumber,
              customerName: pickedName || prev.customerName,
            }))
          }
        />
      ),
    },
    {
      key: 'customerName',
      label: t.customerNameLabel,
      type: 'text',
      placeholder: lang === 'ur' ? 'مثلاً حاجی اکرم / بلال ٹریڈرز' : 'e.g. Haji Akram / Bilal Traders',
    },
    {
      key: 'goodsType',
      label: t.goodsTypeLabel,
      type: 'text',
      placeholder: lang === 'ur' ? 'مثلاً گندم، کھاد، سیمنٹ، کریانہ' : 'e.g. Wheat, Fertilizer, Cement',
      presets: GOODS_TYPE_PRESETS.map((g) => ({
        value: lang === 'ur' ? g.ur : g.en,
        label: lang === 'ur' ? g.ur : g.en,
      })),
    },
    {
      key: 'weight',
      label: t.orderWeightLabel,
      type: 'text',
      placeholder: t.orderWeightPlaceholder,
    },
    {
      key: 'pickupLocation',
      label: t.pickupLocationLabel,
      type: 'text',
      placeholder: lang === 'ur' ? 'مثلاً سمندری غلہ منڈی' : 'e.g. Samundri Grain Market',
    },
    {
      key: 'dropoffLocation',
      label: t.dropoffLocationLabel,
      type: 'text',
      placeholder: lang === 'ur' ? 'مثلاً لاہور / کراچی / ملتان' : 'e.g. Lahore / Karachi / Multan',
    },
    {
      key: 'estimateFare',
      label: t.estimateFareLabel,
      type: 'number',
      placeholder: '0',
      formatReviewValue: (val) => {
        const n = Number(val);
        return val && Number.isFinite(n) && n > 0 ? formatCurrencyPKR(n) : val || '';
      },
    },
    {
      key: 'notes',
      label: t.orderNotesLabel,
      type: 'textarea',
      placeholder: lang === 'ur' ? 'کوئی اضافی ہدایت یا وقت کی تفصیل...' : 'Any extra pickup instructions or timing...',
    },
  ];

  const wizardInitialValues = useMemo(() => {
    if (editingOrder) {
      return {
        date: editingOrder.date,
        customerName: editingOrder.customerName,
        mobileNumber: editingOrder.mobileNumber,
        goodsType: editingOrder.goodsType,
        weight: editingOrder.weight,
        pickupLocation: editingOrder.pickupLocation,
        dropoffLocation: editingOrder.dropoffLocation,
        estimateFare: editingOrder.estimateFare,
        notes: editingOrder.notes,
      };
    }
    return {
      date: filterDate || getTodayDate(),
      customerName: '',
      mobileNumber: '',
      goodsType: '',
      weight: '',
      pickupLocation: '',
      dropoffLocation: '',
      estimateFare: '',
      notes: '',
    };
  }, [editingOrder, filterDate]);

  const closeWizard = () => {
    setWizardOpen(false);
    setEditingOrder(null);
    onSubViewChange?.('list', { replace: true });
    onWizardClosed?.();
  };

  const handleWizardSave = (vals: Record<string, string>) => {
    const payload = {
      date: (vals.date || '').trim(),
      customerName: (vals.customerName || '').trim(),
      mobileNumber: (vals.mobileNumber || '').trim(),
      goodsType: (vals.goodsType || '').trim(),
      weight: (vals.weight || '').trim(),
      pickupLocation: (vals.pickupLocation || '').trim(),
      dropoffLocation: (vals.dropoffLocation || '').trim(),
      estimateFare: (vals.estimateFare || '').trim(),
      notes: (vals.notes || '').trim(),
    };

    if (editingOrder) {
      onUpdateOrder({
        ...payload,
        id: editingOrder.id,
        updatedAt: Date.now(),
      });
      onNotify(lang === 'ur' ? 'آرڈر اپڈیٹ ہو گیا۔' : 'Order updated.', 'success');
    } else {
      onAddOrder(payload);
      onNotify(lang === 'ur' ? 'نیا آرڈر محفوظ ہو گیا۔' : 'Order saved.', 'success');
    }
    closeWizard();
  };

  if (wizardOpen) {
    return (
      <div className="space-y-4">
        <StepEntryWizard
          key={editingOrder?.id || 'new-order'}
          title={editingOrder ? `${t.edit} — ${t.orderPageTitle}` : t.newOrderBtn}
          steps={orderWizardSteps}
          initialValues={wizardInitialValues}
          lang={lang}
          onCancel={closeWizard}
          onSave={handleWizardSave}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t.orderPageTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{t.orderPageSub}</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingOrder(null);
            setWizardOpen(true);
            onSubViewChange?.('wizard');
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>{t.newOrderBtn}</span>
        </button>
      </div>

      {/* Per-Date & Search Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        {/* Mobile Compact Search + Collapsible Date Filter */}
        <div className="md:hidden">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-2.5 start-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.orderSearchPlaceholder}
                className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 py-2 ps-9 pe-3 text-sm text-slate-900 focus:border-blue-800 focus:bg-white focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
              className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                mobileFiltersOpen || filterDate
                  ? 'border-blue-900 bg-blue-50 text-blue-900'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{t.filtersBtn}{filterDate ? ' (1)' : ''}</span>
            </button>
          </div>

          {mobileFiltersOpen && (
            <div className="mt-3 space-y-2.5 border-t border-slate-100 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFilterDate('')}
                  className={`h-10 rounded-lg border text-xs font-semibold transition-colors ${
                    filterDate === ''
                      ? 'border-blue-900 bg-blue-50 text-blue-900'
                      : 'border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {t.allDates}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterDate(getTodayDate())}
                  className={`h-10 rounded-lg border text-xs font-semibold transition-colors ${
                    filterDate === getTodayDate()
                      ? 'border-blue-900 bg-blue-50 text-blue-900'
                      : 'border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {t.todayOnly}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex min-w-0 flex-1 items-center">
                  <Calendar className="pointer-events-none absolute start-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 py-1.5 ps-8 pe-2.5 font-mono text-xs text-slate-900 focus:border-blue-800 focus:bg-white focus:outline-none"
                  />
                </div>
                {(searchQuery || filterDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterDate('');
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

        {/* Desktop Filter Bar */}
        <div className="hidden flex-col gap-3 md:flex md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-2.5 start-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.orderSearchPlaceholder}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 ps-9 pe-3 text-sm text-slate-900 focus:border-blue-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setFilterDate('')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  filterDate === ''
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.allDates}
              </button>
              <button
                type="button"
                onClick={() => setFilterDate(getTodayDate())}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  filterDate === getTodayDate()
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.todayOnly}
              </button>
            </div>

            <div className="relative flex items-center">
              <Calendar className="pointer-events-none absolute start-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="rounded-lg border border-slate-300 bg-slate-50 py-1.5 ps-8 pe-2.5 font-mono text-xs text-slate-900 focus:border-blue-800 focus:bg-white focus:outline-none"
              />
            </div>

            {(searchQuery || filterDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterDate('');
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                {t.clear}
              </button>
            )}
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500 sm:mt-3 sm:pt-2.5">
          <span>
            {t.totalOrdersLabel}:{' '}
            <strong className="font-mono text-slate-900 tabular-nums">
              {filteredOrders.length}
            </strong>
          </span>
          {filterDate && (
            <span className="font-mono font-semibold text-blue-900 tabular-nums">
              {filterDate}
            </span>
          )}
        </div>
      </div>

      {/* Simple Daily Order Log Table (Edit & Delete only, no status badges) */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <ClipboardList className="h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              {t.noRecordsTitle}
            </h3>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              {t.noRecordsSub}
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingOrder(null);
                setWizardOpen(true);
                onSubViewChange?.('wizard');
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t.newOrderBtn}</span>
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Order Cards (< md) */}
            <div className="divide-y divide-slate-200 md:hidden">
              {filteredOrders.map((order) => {
                const numericFare = Number(order.estimateFare);
                const hasNumericFare =
                  Boolean(order.estimateFare) &&
                  Number.isFinite(numericFare) &&
                  numericFare > 0;
                const routeText =
                  order.pickupLocation || order.dropoffLocation
                    ? `${order.pickupLocation || '—'} → ${order.dropoffLocation || '—'}`
                    : '';

                return (
                  <div key={order.id} className="space-y-2 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-slate-900">
                          {order.customerName || '—'}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                          {order.date || '—'}
                        </div>
                      </div>
                      {(hasNumericFare || order.estimateFare) && (
                        <div className="shrink-0 font-mono text-sm font-bold text-blue-900 tabular-nums">
                          {hasNumericFare ? formatCurrencyPKR(numericFare) : order.estimateFare}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-slate-700">
                      {(order.goodsType || order.weight) && (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium text-slate-800">
                          {order.goodsType && <span>{order.goodsType}</span>}
                          {order.goodsType && order.weight && (
                            <span className="text-slate-300" aria-hidden="true">·</span>
                          )}
                          {order.weight && <span className="text-slate-600">{order.weight}</span>}
                        </div>
                      )}
                      {routeText && (
                        <div className="text-xs font-medium text-slate-700 break-words">
                          {routeText}
                        </div>
                      )}
                      {order.notes && (
                        <p className="text-[11px] text-slate-500 break-words">{order.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {order.mobileNumber && (
                        <a
                          href={`tel:${order.mobileNumber}`}
                          className="inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span dir="ltr" className="truncate font-mono tabular-nums">
                            {order.mobileNumber}
                          </span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingOrder(order);
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
                        onClick={() => setDeleteTarget(order)}
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
                    <th className="px-3 py-2.5 text-start whitespace-nowrap">{t.date}</th>
                    <th className="px-3 py-2.5 text-start whitespace-nowrap">{t.customerNameLabel}</th>
                    <th className="px-3 py-2.5 text-start whitespace-nowrap">{t.goodsTypeLabel}</th>
                    <th className="px-3 py-2.5 text-start whitespace-nowrap">{t.routeLabel}</th>
                    <th className="px-3 py-2.5 text-end whitespace-nowrap">{t.estimateFareLabel}</th>
                    <th className="px-3 py-2.5 text-start whitespace-nowrap">{t.notes}</th>
                    <th className="px-3 py-2.5 text-end whitespace-nowrap">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => {
                    const numericFare = Number(order.estimateFare);
                    const hasNumericFare =
                      Boolean(order.estimateFare) &&
                      Number.isFinite(numericFare) &&
                      numericFare > 0;
                    const routeText =
                      order.pickupLocation || order.dropoffLocation
                        ? `${order.pickupLocation || '—'} → ${order.dropoffLocation || '—'}`
                        : '—';

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80">
                        <td className="px-3 py-3 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                          {order.date || '—'}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">
                            {order.customerName || '—'}
                          </div>
                          {order.mobileNumber && (
                            <div className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs text-slate-600 tabular-nums">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span dir="ltr">{order.mobileNumber}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="font-medium text-slate-900">
                            {order.goodsType || '—'}
                          </div>
                          {order.weight && (
                            <div className="text-xs text-slate-500">{order.weight}</div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs font-medium text-slate-800 whitespace-nowrap">
                          {routeText}
                        </td>
                        <td className="px-3 py-3 text-end font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                          {hasNumericFare
                            ? formatCurrencyPKR(numericFare)
                            : order.estimateFare || '—'}
                        </td>
                        <td className="max-w-[200px] truncate px-3 py-3 text-xs text-slate-600">
                          {order.notes || '—'}
                        </td>
                        <td className="px-3 py-3 text-end whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOrder(order);
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
                              onClick={() => setDeleteTarget(order)}
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

      <ConfirmModal
        open={!!deleteTarget}
        title={t.deleteOrderTitle}
        description={
          deleteTarget
            ? t.deleteOrderDesc.replace(
                '{name}',
                deleteTarget.customerName ||
                  deleteTarget.goodsType ||
                  deleteTarget.date ||
                  'Order'
              )
            : ''
        }
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteOrder(deleteTarget.id);
            setDeleteTarget(null);
            onNotify(lang === 'ur' ? 'آرڈر حذف ہو گیا۔' : 'Order deleted.', 'info');
          }
        }}
      />
    </div>
  );
};
