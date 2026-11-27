import { DEFAULT_BILTY_STATIONERY, DEFAULT_SETTINGS } from '../i18n';
import {
  BiltyRecord,
  BiltyStationerySettings,
  DriverEntry,
  LedgerDatabase,
  OrderEntry,
  PendingPdfJob,
} from '../types';

export function migrateStationerySettings(
  savedStationery?: Partial<BiltyStationerySettings>
): BiltyStationerySettings {
  const migratedBrandTitle =
    !savedStationery?.brandTitleUrdu ||
    savedStationery.brandTitleUrdu.trim() === 'وڑائچ گڈز سمندری'
      ? DEFAULT_BILTY_STATIONERY.brandTitleUrdu
      : savedStationery.brandTitleUrdu;

  const migratedBrandSubtitle =
    !savedStationery?.brandSubtitleUrdu ||
    savedStationery.brandSubtitleUrdu.trim() ===
      'گڈز ٹرانسپورٹ کمپنی اوکاڑہ بائی پاس 466 روڈ سمندری'
      ? DEFAULT_BILTY_STATIONERY.brandSubtitleUrdu
      : savedStationery.brandSubtitleUrdu;

  const rawPatronLabel = savedStationery?.patronLabelUrdu?.trim() || '';
  const migratedPatronLabel =
    !rawPatronLabel || rawPatronLabel === 'سرپرست اعلیٰ لاہور'
      ? DEFAULT_BILTY_STATIONERY.patronLabelUrdu
      : savedStationery!.patronLabelUrdu!;

  const rawPatronDesig = savedStationery?.patronDesignationUrdu?.trim() || '';
  const migratedPatronDesig =
    !rawPatronDesig ||
    rawPatronDesig === 'صدر پاکستان منی مزدا گڈز ایسوسی ایشن لاہور'
      ? DEFAULT_BILTY_STATIONERY.patronDesignationUrdu
      : savedStationery!.patronDesignationUrdu!;

  return {
    ...DEFAULT_BILTY_STATIONERY,
    ...(savedStationery || {}),
    brandTitleUrdu: migratedBrandTitle,
    brandSubtitleUrdu: migratedBrandSubtitle,
    patronLabelUrdu: migratedPatronLabel,
    patronNameUrdu:
      savedStationery?.patronNameUrdu?.trim() || DEFAULT_BILTY_STATIONERY.patronNameUrdu,
    patronDesignationUrdu: migratedPatronDesig,
    patronPhone:
      savedStationery?.patronPhone?.trim() || DEFAULT_BILTY_STATIONERY.patronPhone,
    patronNoteUrdu:
      savedStationery?.patronNoteUrdu?.trim() || DEFAULT_BILTY_STATIONERY.patronNoteUrdu,
  };
}

const DB_NAME = 'adda-ledger-pro-db';
const DB_VERSION = 1;
const STORE_STATE = 'app_state';
const STORE_PDF_QUEUE = 'pending_pdfs';
const STATE_KEY = 'ledger';

export function createEmptyDatabase(): LedgerDatabase {
  return {
    drivers: [],
    orders: [],
    bilties: [],
    rooznamcha: [],
    settings: {
      ...DEFAULT_SETTINGS,
      biltyStationery: { ...DEFAULT_BILTY_STATIONERY },
    },
    syncMeta: {
      pendingChanges: 0,
      lastLocalEditAt: 0,
      lastSyncedAt: null,
      lastDriveModifiedTime: null,
    },
  };
}

function normalizeDriver(d: DriverEntry): DriverEntry {
  return {
    ...d,
    weightCapacity: d.weightCapacity !== undefined && d.weightCapacity !== null ? String(d.weightCapacity) : '',
  };
}

function normalizeOrder(o: OrderEntry): OrderEntry {
  return {
    ...o,
    date: o.date ? String(o.date) : '',
    customerName: o.customerName ? String(o.customerName) : '',
    mobileNumber: o.mobileNumber ? String(o.mobileNumber) : '',
    goodsType: o.goodsType ? String(o.goodsType) : '',
    weight: o.weight ? String(o.weight) : '',
    pickupLocation: o.pickupLocation ? String(o.pickupLocation) : '',
    dropoffLocation: o.dropoffLocation ? String(o.dropoffLocation) : '',
    estimateFare: o.estimateFare !== undefined && o.estimateFare !== null ? String(o.estimateFare) : '',
    notes: o.notes ? String(o.notes) : '',
  };
}

function normalizeBilty(b: BiltyRecord): BiltyRecord {
  const freight = Number(b.freightAmount) || 0;
  const advance = Number(b.advancePaid) || 0;
  return {
    ...b,
    packagesCount: b.packagesCount !== undefined && b.packagesCount !== null ? String(b.packagesCount) : '',
    weight: b.weight !== undefined && b.weight !== null ? String(b.weight) : '',
    freightAmount: freight,
    advancePaid: advance,
    balanceDue: Number.isFinite(b.balanceDue) ? b.balanceDue : Math.max(0, freight - advance),
  };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_STATE)) {
        db.createObjectStore(STORE_STATE);
      }
      if (!db.objectStoreNames.contains(STORE_PDF_QUEUE)) {
        db.createObjectStore(STORE_PDF_QUEUE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadLedgerFromIndexedDb(): Promise<LedgerDatabase> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_STATE, 'readonly');
      const store = tx.objectStore(STORE_STATE);
      const req = store.get(STATE_KEY);
      req.onsuccess = () => {
        const val = req.result as LedgerDatabase | undefined;
        if (!val) {
          resolve(createEmptyDatabase());
        } else {
          const savedSettings = val.settings;
          const savedStationery = savedSettings?.biltyStationery;
          const migratedAddaNameUrdu =
            !savedSettings?.addaNameUrdu ||
            savedSettings.addaNameUrdu.trim() === 'وڑائچ گڈز سمندری'
              ? DEFAULT_SETTINGS.addaNameUrdu
              : savedSettings.addaNameUrdu;

          resolve({
            drivers: Array.isArray(val.drivers) ? val.drivers.map(normalizeDriver) : [],
            orders: Array.isArray(val.orders) ? val.orders.map(normalizeOrder) : [],
            bilties: Array.isArray(val.bilties) ? val.bilties.map(normalizeBilty) : [],
            rooznamcha: Array.isArray(val.rooznamcha) ? val.rooznamcha : [],
            settings: {
              ...DEFAULT_SETTINGS,
              ...(savedSettings || {}),
              addaNameUrdu: migratedAddaNameUrdu,
              biltyStationery: migrateStationerySettings(savedStationery),
            },
            syncMeta: {
              pendingChanges: val.syncMeta?.pendingChanges ?? 0,
              lastLocalEditAt: val.syncMeta?.lastLocalEditAt ?? 0,
              lastSyncedAt: val.syncMeta?.lastSyncedAt ?? null,
              lastDriveModifiedTime: val.syncMeta?.lastDriveModifiedTime ?? null,
            },
          });
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return createEmptyDatabase();
  }
}

export async function saveLedgerToIndexedDb(data: LedgerDatabase): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_STATE, 'readwrite');
      tx.objectStore(STORE_STATE).put(data, STATE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to persist state to IndexedDB:', err);
  }
}

export async function enqueuePendingPdf(job: PendingPdfJob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PDF_QUEUE, 'readwrite');
    tx.objectStore(STORE_PDF_QUEUE).put(job);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingPdfs(): Promise<PendingPdfJob[]> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PDF_QUEUE, 'readonly');
      const req = tx.objectStore(STORE_PDF_QUEUE).getAll();
      req.onsuccess = () => resolve((req.result as PendingPdfJob[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function removePendingPdf(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PDF_QUEUE, 'readwrite');
    tx.objectStore(STORE_PDF_QUEUE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
