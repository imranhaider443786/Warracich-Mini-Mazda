import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Cloud,
  CloudOff,
  FileSpreadsheet,
  FolderSync,
  Languages,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Truck,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { BiltyMaker } from './components/BiltyMaker';
import { ConfirmModal } from './components/ConfirmModal';
import { Dashboard } from './components/Dashboard';
import { DriveSettings } from './components/DriveSettings';
import { DriverRegister } from './components/DriverRegister';
import { OrderRegister } from './components/OrderRegister';
import { PWAInstallButton } from './components/PWAInstallButton';
import { Rooznamcha } from './components/Rooznamcha';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { TRANSLATIONS } from './i18n';
import {
  clearAccessToken,
  formatAuthError,
  getAccessToken,
  googleSignIn,
  initAuth,
  logout,
} from './services/auth';
import {
  deleteDriveFile,
  downloadDriveBackup,
  DriveFolderTree,
  ensureFolderHierarchy,
  findBackupFile,
  listAllAddaDriveFiles,
  uploadJsonBackupToDrive,
  uploadPdfBlobToDrive,
} from './services/driveSync';
import { buildSavedContactsDirectory } from './services/contacts';
import {
  createEmptyDatabase,
  enqueuePendingPdf,
  getPendingPdfs,
  loadLedgerFromIndexedDb,
  mergeImportedDriverSheets,
  migrateStationerySettings,
  removePendingPdf,
  saveLedgerToIndexedDb,
} from './services/offlineDb';
import {
  AddaSettings,
  BiltyRecord,
  DriveFileItem,
  DriverEntry,
  Language,
  LedgerDatabase,
  OrderEntry,
  PdfFolderCategory,
  PendingPdfJob,
  RooznamchaEntry,
  WorkspaceTab,
} from './types';

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'info' | 'error';
}

type SubViewMode = 'main' | 'list' | 'wizard' | 'preview';

interface AppHistoryState {
  addaRoot?: boolean;
  addaNav?: boolean;
  tab?: WorkspaceTab;
  subView?: SubViewMode;
  drawer?: boolean;
}

export default function App() {
  const isOnline = useOnlineStatus();
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('adda_ui_lang');
    return saved === 'ur' ? 'ur' : 'en';
  });
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('dashboard');
  const [subView, setSubView] = useState<SubViewMode>('main');
  const [startWizardTab, setStartWizardTab] = useState<WorkspaceTab | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeTabRef = useRef<WorkspaceTab>(activeTab);
  const subViewRef = useRef<SubViewMode>(subView);
  const mobileMenuOpenRef = useRef<boolean>(mobileMenuOpen);
  const lastExitPressRef = useRef<number>(0);
  const rearmTimerRef = useRef<number | null>(null);

  activeTabRef.current = activeTab;
  subViewRef.current = subView;
  mobileMenuOpenRef.current = mobileMenuOpen;

  // Core offline-first ledger state
  const [dbReady, setDbReady] = useState(false);
  const [ledger, setLedger] = useState<LedgerDatabase>(() => createEmptyDatabase());
  const [pendingPdfs, setPendingPdfs] = useState<PendingPdfJob[]>([]);

  // Auth & Google Drive state
  const [user, setUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const folderTreeRef = useRef<DriveFolderTree | null>(null);
  const isSyncingRef = useRef(false);

  const [overwritePrompt, setOverwritePrompt] = useState<{
    open: boolean;
    driveModifiedTime: string;
    backupFileId: string;
  } | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const notify = useCallback(
    (text: string, type: 'success' | 'info' | 'error' = 'info') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-2), { id, text, type }]);
      setTimeout(
        () => {
          setToasts((prev) => prev.filter((item) => item.id !== id));
        },
        type === 'error' ? 9000 : 4200
      );
    },
    []
  );

  useEffect(() => {
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('adda_ui_lang', lang);
  }, [lang]);

  const langRef = useRef<Language>(lang);
  langRef.current = lang;

  useEffect(() => {
    const currentState = (window.history.state || {}) as AppHistoryState;
    if (!currentState.addaNav) {
      window.history.replaceState({ addaRoot: true } satisfies AppHistoryState, '');
      window.history.pushState(
        {
          addaNav: true,
          tab: activeTabRef.current,
          subView: subViewRef.current,
        } satisfies AppHistoryState,
        ''
      );
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = (event.state || {}) as AppHistoryState;

      if (mobileMenuOpenRef.current && !state.drawer) {
        setMobileMenuOpen(false);
      } else if (state.drawer) {
        setMobileMenuOpen(true);
      }

      if (state.addaNav && state.tab) {
        if (rearmTimerRef.current !== null) {
          window.clearTimeout(rearmTimerRef.current);
          rearmTimerRef.current = null;
        }
        lastExitPressRef.current = 0;
        setStartWizardTab(null);
        setActiveTab(state.tab);
        setSubView(state.subView || 'main');
        return;
      }

      // Landed on root sentinel (addaRoot) or bottom of browser stack
      if (activeTabRef.current !== 'dashboard' || subViewRef.current !== 'main') {
        lastExitPressRef.current = 0;
        setStartWizardTab(null);
        setActiveTab('dashboard');
        setSubView('main');
        window.history.pushState(
          { addaNav: true, tab: 'dashboard', subView: 'main' } satisfies AppHistoryState,
          ''
        );
        return;
      }

      // Already on Home Page (dashboard): double back within 2 seconds exits
      const now = Date.now();
      if (now - lastExitPressRef.current < 2000) {
        if (rearmTimerRef.current !== null) {
          window.clearTimeout(rearmTimerRef.current);
          rearmTimerRef.current = null;
        }
        return;
      }

      lastExitPressRef.current = now;
      notify(TRANSLATIONS[langRef.current].pressBackAgainToExit, 'info');

      if (rearmTimerRef.current !== null) {
        window.clearTimeout(rearmTimerRef.current);
      }
      rearmTimerRef.current = window.setTimeout(() => {
        rearmTimerRef.current = null;
        lastExitPressRef.current = 0;
        if (
          activeTabRef.current === 'dashboard' &&
          subViewRef.current === 'main' &&
          !((window.history.state || {}) as AppHistoryState).addaNav
        ) {
          window.history.pushState(
            { addaNav: true, tab: 'dashboard', subView: 'main' } satisfies AppHistoryState,
            ''
          );
        }
      }, 2000);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (rearmTimerRef.current !== null) {
        window.clearTimeout(rearmTimerRef.current);
      }
    };
  }, [notify]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [loadedLedger, queuedPdfs] = await Promise.all([
        loadLedgerFromIndexedDb(),
        getPendingPdfs(),
      ]);
      if (!mounted) return;
      setLedger(loadedLedger);
      setPendingPdfs(queuedPdfs);
      setDbReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const updateLedger = useCallback(
    (updater: (prev: LedgerDatabase) => LedgerDatabase) => {
      setLedger((prev) => {
        const next = updater(prev);
        saveLedgerToIndexedDb(next);
        return next;
      });
    },
    []
  );

  useEffect(() => {
    const unsub = initAuth(
      (signedInUser) => {
        setUser(signedInUser);
        setHasToken(!!getAccessToken());
      },
      (firebaseUser) => {
        setUser(firebaseUser);
        setHasToken(false);
        folderTreeRef.current = null;
      }
    );
    return () => unsub();
  }, []);

  const getOrInitFolderTree = useCallback(
    async (token: string, folderName: string): Promise<DriveFolderTree> => {
      if (folderTreeRef.current) return folderTreeRef.current;
      const tree = await ensureFolderHierarchy(token, folderName);
      folderTreeRef.current = tree;
      return tree;
    },
    []
  );

  const handleRefreshDriveFiles = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !isOnline) return;
    try {
      const tree = await getOrInitFolderTree(token, ledger.settings.driveFolderName);
      const files = await listAllAddaDriveFiles(token, tree);
      setDriveFiles(files);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'AUTH_EXPIRED') {
        clearAccessToken();
        setHasToken(false);
      }
    }
  }, [getOrInitFolderTree, isOnline, ledger.settings.driveFolderName]);

  const flushPendingPdfQueue = useCallback(
    async (token: string, tree: DriveFolderTree): Promise<number> => {
      const jobs = await getPendingPdfs();
      let uploaded = 0;
      for (const job of jobs) {
        await uploadPdfBlobToDrive(token, tree, job.folder, job.filename, job.blob);
        await removePendingPdf(job.id);
        uploaded += 1;
      }
      setPendingPdfs(await getPendingPdfs());
      return uploaded;
    },
    []
  );

  const handleSyncToDrive = useCallback(
    async (confirmedOverwrite = false) => {
      const token = getAccessToken();
      if (!token || !isOnline || isSyncingRef.current) return;

      isSyncingRef.current = true;
      setIsSyncing(true);
      try {
        const tree = await getOrInitFolderTree(token, ledger.settings.driveFolderName);
        const existingBackup = await findBackupFile(token, tree.dataBackupsId);

        if (
          existingBackup &&
          !confirmedOverwrite &&
          ledger.syncMeta.lastDriveModifiedTime &&
          existingBackup.modifiedTime !== ledger.syncMeta.lastDriveModifiedTime
        ) {
          setOverwritePrompt({
            open: true,
            driveModifiedTime: new Date(existingBackup.modifiedTime).toLocaleString(),
            backupFileId: existingBackup.id,
          });
          return;
        }

        const payload = {
          version: 1,
          exportedAt: new Date().toISOString(),
          drivers: ledger.drivers,
          orders: ledger.orders,
          bilties: ledger.bilties,
          rooznamcha: ledger.rooznamcha,
          settings: ledger.settings,
        };

        const result = await uploadJsonBackupToDrive(
          token,
          tree.dataBackupsId,
          payload,
          existingBackup?.id
        );

        const uploadedPdfs = await flushPendingPdfQueue(token, tree);

        updateLedger((prev) => ({
          ...prev,
          syncMeta: {
            pendingChanges: 0,
            lastLocalEditAt: prev.syncMeta.lastLocalEditAt,
            lastSyncedAt: Date.now(),
            lastDriveModifiedTime: result.modifiedTime,
          },
        }));

        const files = await listAllAddaDriveFiles(token, tree);
        setDriveFiles(files);

        notify(
          lang === 'ur'
            ? `گوگل ڈرائیو پر سنک مکمل (${uploadedPdfs} پی ڈی ایف اپلوڈ)۔`
            : `Synced to Google Drive${uploadedPdfs > 0 ? ` (${uploadedPdfs} queued PDFs uploaded)` : ''}.`,
          'success'
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'AUTH_EXPIRED') {
          clearAccessToken();
          setHasToken(false);
          notify(
            lang === 'ur'
              ? 'گوگل سیشن ختم ہو گیا۔ دوبارہ سائن ان کریں۔'
              : 'Google session expired. Please sign in again to sync.',
            'info'
          );
        } else {
          console.error('Drive sync failed:', err);
          notify(
            lang === 'ur' ? 'ڈرائیو سنک میں خرابی آئی۔' : 'Drive sync failed. Changes remain safe locally.',
            'error'
          );
        }
      } finally {
        isSyncingRef.current = false;
        setIsSyncing(false);
      }
    },
    [
      flushPendingPdfQueue,
      getOrInitFolderTree,
      isOnline,
      lang,
      ledger,
      notify,
      updateLedger,
    ]
  );

  useEffect(() => {
    if (!dbReady || !isOnline || !hasToken) return;
    if (ledger.syncMeta.pendingChanges === 0 && pendingPdfs.length === 0) return;

    const timer = setTimeout(() => {
      handleSyncToDrive(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [
    dbReady,
    isOnline,
    hasToken,
    ledger.syncMeta.pendingChanges,
    pendingPdfs.length,
    handleSyncToDrive,
  ]);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    let result: { user: User; accessToken: string };
    try {
      result = await googleSignIn();
    } catch (err) {
      console.error('Google Sign-In error:', err);
      const formatted = formatAuthError(err, lang);
      setAuthError(formatted);
      notify(formatted, 'error');
      return;
    }

    setUser(result.user);
    setHasToken(true);
    folderTreeRef.current = null;

    try {
      const hasLocalUserData =
        ledger.syncMeta.lastLocalEditAt > 0 ||
        ledger.orders.length > 0 ||
        ledger.bilties.length > 0 ||
        ledger.rooznamcha.length > 0;

      const tree = await getOrInitFolderTree(
        result.accessToken,
        ledger.settings.driveFolderName
      );
      const existing = await findBackupFile(result.accessToken, tree.dataBackupsId);

      if (!hasLocalUserData && existing) {
        const remote = await downloadDriveBackup(result.accessToken, existing.id);
        const { merged } = mergeImportedDriverSheets(remote.drivers || []);
        updateLedger((prev) => ({
          drivers: merged,
          orders: remote.orders || [],
          bilties: remote.bilties || [],
          rooznamcha: remote.rooznamcha || [],
          settings: {
            ...prev.settings,
            ...(remote.settings || {}),
            biltyStationery: migrateStationerySettings({
              ...prev.settings.biltyStationery,
              ...(remote.settings?.biltyStationery || {}),
            }),
          },
          syncMeta: {
            pendingChanges: 0,
            lastLocalEditAt: Date.now(),
            lastSyncedAt: Date.now(),
            lastDriveModifiedTime: existing.modifiedTime,
          },
        }));
        notify(
          lang === 'ur'
            ? 'گوگل ڈرائیو سے محفوظ شدہ ریکارڈ لوڈ ہو گیا۔'
            : 'Loaded existing Adda backup from Google Drive.',
          'success'
        );
      } else {
        notify(
          lang === 'ur' ? 'گوگل ڈرائیو سے منسلک ہو گیا۔' : 'Connected to Google Drive.',
          'success'
        );
      }
      const files = await listAllAddaDriveFiles(result.accessToken, tree);
      setDriveFiles(files);
    } catch (driveErr) {
      console.error('Google Drive setup error after sign-in:', driveErr);
      const detail = driveErr instanceof Error ? driveErr.message : String(driveErr || '');
      const msg =
        lang === 'ur'
          ? `سائن ان ہو گیا لیکن گوگل ڈرائیو فولڈر تک رسائی ناکام رہی: ${detail}`
          : `Signed in, but Google Drive folder access failed: ${detail}`;
      setAuthError(msg);
      notify(msg, 'error');
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setUser(null);
    setHasToken(false);
    setAuthError(null);
    setDriveFiles([]);
    folderTreeRef.current = null;
    notify(lang === 'ur' ? 'گوگل اکاؤنٹ سائن آؤٹ ہو گیا۔' : 'Signed out of Google.', 'info');
  };

  const handleRestoreFromDrive = async () => {
    const token = getAccessToken();
    if (!token || !isOnline) return;
    setIsSyncing(true);
    try {
      const tree = await getOrInitFolderTree(token, ledger.settings.driveFolderName);
      const existing = await findBackupFile(token, tree.dataBackupsId);
      if (!existing) {
        notify(
          lang === 'ur'
            ? 'گوگل ڈرائیو پر کوئی بیک اپ فائل نہیں ملی۔'
            : 'No backup file found in Google Drive yet.',
          'info'
        );
        return;
      }
      const remote = await downloadDriveBackup(token, existing.id);
      updateLedger((prev) => ({
        drivers: remote.drivers || [],
        orders: remote.orders || [],
        bilties: remote.bilties || [],
        rooznamcha: remote.rooznamcha || [],
        settings: {
          ...prev.settings,
          ...(remote.settings || {}),
          biltyStationery: migrateStationerySettings({
            ...prev.settings.biltyStationery,
            ...(remote.settings?.biltyStationery || {}),
          }),
        },
        syncMeta: {
          pendingChanges: 0,
          lastLocalEditAt: Date.now(),
          lastSyncedAt: Date.now(),
          lastDriveModifiedTime: existing.modifiedTime,
        },
      }));
      notify(
        lang === 'ur' ? 'ڈرائیو سے ڈیٹا بحال ہو گیا۔' : 'Restored ledger data from Google Drive.',
        'success'
      );
    } catch (err) {
      console.error(err);
      notify(lang === 'ur' ? 'ڈیٹا بحال کرنے میں خرابی۔' : 'Failed to restore from Drive.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFlushPendingPdfs = async () => {
    const token = getAccessToken();
    if (!token || !isOnline) return;
    setIsSyncing(true);
    try {
      const tree = await getOrInitFolderTree(token, ledger.settings.driveFolderName);
      const count = await flushPendingPdfQueue(token, tree);
      const files = await listAllAddaDriveFiles(token, tree);
      setDriveFiles(files);
      notify(
        lang === 'ur'
          ? `${count} پی ڈی ایف فائلیں ڈرائیو پر اپلوڈ ہو گئیں۔`
          : `Uploaded ${count} queued PDF(s) to Google Drive.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      notify(lang === 'ur' ? 'پی ڈی ایف اپلوڈ نہ ہو سکی۔' : 'Failed to upload queued PDFs.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteDriveFile = async (fileId: string) => {
    const token = getAccessToken();
    if (!token || !isOnline) return;
    setIsSyncing(true);
    try {
      await deleteDriveFile(token, fileId);
      setDriveFiles((prev) => prev.filter((f) => f.id !== fileId));
      notify(lang === 'ur' ? 'فائل گوگل ڈرائیو سے حذف ہو گئی۔' : 'File deleted from Google Drive.', 'info');
    } catch (err) {
      console.error(err);
      notify(lang === 'ur' ? 'فائل حذف کرنے میں خرابی۔' : 'Failed to delete Drive file.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSavePdfToDrive = async (
    category: PdfFolderCategory,
    filename: string,
    blob: Blob
  ) => {
    const token = getAccessToken();
    if (isOnline && token) {
      setIsSyncing(true);
      try {
        const tree = await getOrInitFolderTree(token, ledger.settings.driveFolderName);
        await uploadPdfBlobToDrive(token, tree, category, filename, blob);
        const files = await listAllAddaDriveFiles(token, tree);
        setDriveFiles(files);
        notify(
          lang === 'ur'
            ? `پی ڈی ایف گوگل ڈرائیو (${category}) میں محفوظ ہو گئی۔`
            : `Saved ${filename} to Google Drive (${category}).`,
          'success'
        );
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'AUTH_EXPIRED') {
          clearAccessToken();
          setHasToken(false);
        }
      } finally {
        setIsSyncing(false);
      }
    }

    const job: PendingPdfJob = {
      id: createId('pdf'),
      filename,
      folder: category,
      blob,
      createdAt: Date.now(),
    };
    await enqueuePendingPdf(job);
    setPendingPdfs(await getPendingPdfs());
    notify(
      lang === 'ur'
        ? 'آف لائن قطار میں محفوظ: انٹرنیٹ/سائن ان ہوتے ہی ڈرائیو پر اپلوڈ ہو جائے گی۔'
        : 'Queued for Google Drive: will upload automatically once online & signed in.',
      'info'
    );
  };

  // Domain CRUD Handlers
  const handleAddDriver = (entry: Omit<DriverEntry, 'id' | 'updatedAt'>) => {
    const record: DriverEntry = {
      ...entry,
      id: createId('drv'),
      updatedAt: Date.now(),
    };
    updateLedger((prev) => ({
      ...prev,
      drivers: [record, ...prev.drivers],
      syncMeta: {
        ...prev.syncMeta,
        pendingChanges: prev.syncMeta.pendingChanges + 1,
        lastLocalEditAt: Date.now(),
      },
    }));
  };

  const handleUpdateDriver = (entry: DriverEntry) => {
    updateLedger((prev) => ({
      ...prev,
      drivers: prev.drivers.map((d) => (d.id === entry.id ? entry : d)),
      syncMeta: {
        ...prev.syncMeta,
        pendingChanges: prev.syncMeta.pendingChanges + 1,
        lastLocalEditAt: Date.now(),
      },
    }));
  };

  const handleDeleteDriver = (id: string) => {
    updateLedger((prev) => ({
      ...prev,
      drivers: prev.drivers.filter((d) => d.id !== id),
      syncMeta: {
        ...prev.syncMeta,
        pendingChanges: prev.syncMeta.pendingChanges + 1,
        lastLocalEditAt: Date.now(),
      },
    }));
  };

  const handleAddOrder = (entry: Omit<OrderEntry, 'id' | 'updatedAt'>) => {
    const created: OrderEntry = {
      ...entry,
      id: createId('ord'),
      updatedAt: Date.now(),
    };
    updateLedger((prev) => ({
      ...prev,
      orders: [created, ...prev.orders],
      syncMeta: {
        ...prev.syncMeta,
        pendingChanges: prev.syncMeta.pendingChanges + 1,
        lastLocalEditAt: Date.now(),
      },
    }));
  };

  const handleUpdateOrder = (entry: OrderEntry) => {
    updateLedger((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === entry.id ? entry : o)),
      syncMeta: {
        ...prev.syncMeta,
        pendingChanges: prev.syncMeta.pendingChanges + 1,
        lastLocalEditAt: Date.now(),
      },
    }));
  };

  const handleDeleteOrder = (id: string) => {
    updateLedger((prev) => ({
      ...prev,
      orders: prev.orders.filter((o) => o.id !== id),
      syncMeta: {
        ...prev.syncMeta,
        pendingChanges: prev.syncMeta.pendingChanges + 1,
        lastLocalEditAt: Date.now(),
      },
    }));
  };

  const handleSaveBilty = (
    record: Omit<BiltyRecord, 'id' | 'updatedAt'>,
    incrementCounter: boolean
  ): BiltyRecord => {
    const created: BiltyRecord = {
      ...record,
      id: createId('blt'),
      updatedAt: Date.now(),
    };
    updateLedger((prev) => ({
      ...prev,
      bilties: [created, ...prev.bilties],
      settings: incrementCounter
        ? { ...prev.settings, nextBiltyNumber: prev.settings.nextBiltyNumber + 1 }
        : prev.settings,
      syncMeta: {
        ...prev.syncMeta,
        pendingChanges: prev.syncMeta.pendingChanges + 1,
        lastLocalEditAt: Date.now(),
      },
    }));
    return created;
  };

  const handleUpdateBilty = (record: BiltyRecord) => {
    updateLedger((prev) => ({
      ...prev,
      bilties: prev.bilties.map((b) => (b.id === record.id ? record : b)),
      syncMeta: {
        ...prev.syncMeta,
        pendingChanges: prev.syncMeta.pendingChanges + 1,
        lastLocalEditAt: Date.now(),
      },
    }));
  };

  const handleDeleteBilty = (id: string) => {
    updateLedger((prev) => ({
      ...prev,
      bilties: prev.bilties.filter((b) => b.id !== id),
      syncMeta: {
        ...prev.syncMeta,
        pendingChanges: prev.syncMeta.pendingChanges + 1,
        lastLocalEditAt: Date.now(),
      },
    }));
  };

  const handleAddRooznamcha = (entry: Omit<RooznamchaEntry, 'id' | 'updatedAt'>) => {
    const created: RooznamchaEntry = {
      ...entry,
      id: createId('rooz'),
      updatedAt: Date.now(),
    };
    updateLedger((prev) => ({
      ...prev,
      rooznamcha: [created, ...prev.rooznamcha],
      syncMeta: {
        ...prev.syncMeta,
        pendingChanges: prev.syncMeta.pendingChanges + 1,
        lastLocalEditAt: Date.now(),
      },
    }));
  };

  const handleUpdateRooznamcha = (entry: RooznamchaEntry) => {
    updateLedger((prev) => ({
      ...prev,
      rooznamcha: prev.rooznamcha.map((r) => (r.id === entry.id ? entry : r)),
      syncMeta: {
        ...prev.syncMeta,
        pendingChanges: prev.syncMeta.pendingChanges + 1,
        lastLocalEditAt: Date.now(),
      },
    }));
  };

  const handleDeleteRooznamcha = (id: string) => {
    updateLedger((prev) => ({
      ...prev,
      rooznamcha: prev.rooznamcha.filter((r) => r.id !== id),
      syncMeta: {
        ...prev.syncMeta,
        pendingChanges: prev.syncMeta.pendingChanges + 1,
        lastLocalEditAt: Date.now(),
      },
    }));
  };

  const handleUpdateSettings = (nextSettings: AddaSettings) => {
    if (nextSettings.driveFolderName !== ledger.settings.driveFolderName) {
      folderTreeRef.current = null;
    }
    updateLedger((prev) => ({
      ...prev,
      settings: nextSettings,
      syncMeta: {
        ...prev.syncMeta,
        pendingChanges: prev.syncMeta.pendingChanges + 1,
        lastLocalEditAt: Date.now(),
      },
    }));
  };

  const pushOrReplaceNav = useCallback(
    (
      tab: WorkspaceTab,
      nextSubView: SubViewMode,
      options?: { replace?: boolean; drawer?: boolean }
    ) => {
      if (rearmTimerRef.current !== null) {
        window.clearTimeout(rearmTimerRef.current);
        rearmTimerRef.current = null;
      }
      lastExitPressRef.current = 0;

      const curHistory = (window.history.state || {}) as AppHistoryState;
      if (curHistory.addaRoot && (tab !== 'dashboard' || nextSubView !== 'main' || options?.drawer)) {
        window.history.pushState(
          { addaNav: true, tab: 'dashboard', subView: 'main' } satisfies AppHistoryState,
          ''
        );
      }

      const nextState: AppHistoryState = {
        addaNav: true,
        tab,
        subView: nextSubView,
        ...(options?.drawer ? { drawer: true } : {}),
      };

      if (options?.replace) {
        window.history.replaceState(nextState, '');
      } else if (
        tab !== activeTabRef.current ||
        nextSubView !== subViewRef.current ||
        Boolean(options?.drawer) !== mobileMenuOpenRef.current ||
        curHistory.addaRoot
      ) {
        window.history.pushState(nextState, '');
      }

      setActiveTab(tab);
      setSubView(nextSubView);
    },
    []
  );

  const handleDashboardNavigate = (tab: WorkspaceTab, startWizard = false) => {
    const nextSubView: SubViewMode =
      tab === 'dashboard' || tab === 'drive'
        ? 'main'
        : startWizard
          ? 'wizard'
          : tab === 'bilty' && ledger.bilties.length === 0
            ? 'wizard'
            : 'list';

    const curHistory = (window.history.state || {}) as AppHistoryState;
    const wasDrawerOpen = Boolean(curHistory.drawer);
    setMobileMenuOpen(false);
    setStartWizardTab(startWizard ? tab : null);
    pushOrReplaceNav(tab, nextSubView, { replace: wasDrawerOpen });
  };

  const handleSubViewChange = (
    tab: WorkspaceTab,
    nextSubView: 'list' | 'wizard' | 'preview',
    options?: { replace?: boolean }
  ) => {
    pushOrReplaceNav(tab, nextSubView, options);
  };

  const handleOpenMobileMenu = () => {
    setMobileMenuOpen(true);
    pushOrReplaceNav(activeTabRef.current, subViewRef.current, { drawer: true });
  };

  const handleCloseMobileMenu = () => {
    setMobileMenuOpen(false);
    const curHistory = (window.history.state || {}) as AppHistoryState;
    if (curHistory.drawer) {
      window.history.back();
    }
  };

  const t = TRANSLATIONS[lang];
  const totalPendingCount = ledger.syncMeta.pendingChanges + pendingPdfs.length;
  const contactsDirectory = useMemo(
    () => buildSavedContactsDirectory(ledger.drivers, ledger.orders, ledger.bilties),
    [ledger.drivers, ledger.orders, ledger.bilties]
  );

  const navItems: Array<{
    id: WorkspaceTab;
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'dashboard', label: t.navDashboard, icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'drivers', label: t.navDrivers, icon: <Truck className="h-4 w-4" /> },
    { id: 'orders', label: t.navOrders, icon: <ClipboardList className="h-4 w-4" /> },
    { id: 'rooznamcha', label: t.navRooznamcha, icon: <BookOpen className="h-4 w-4" /> },
    { id: 'bilty', label: t.navBilty, icon: <FileSpreadsheet className="h-4 w-4" /> },
    { id: 'drive', label: t.navDrive, icon: <FolderSync className="h-4 w-4" /> },
  ];

  const bottomNavItems: Array<{
    id: WorkspaceTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'dashboard',
      label: t.navDashboard,
      shortLabel: t.navShortDashboard,
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      id: 'drivers',
      label: t.navDrivers,
      shortLabel: t.navShortDrivers,
      icon: <Truck className="h-5 w-5" />,
    },
    {
      id: 'orders',
      label: t.navOrders,
      shortLabel: t.navShortOrders,
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      id: 'rooznamcha',
      label: t.navRooznamcha,
      shortLabel: t.navShortRooznamcha,
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      id: 'bilty',
      label: t.navBilty,
      shortLabel: t.navShortBilty,
      icon: <FileSpreadsheet className="h-5 w-5" />,
    },
  ];

  const activeNavTitle =
    navItems.find((item) => item.id === activeTab)?.label || t.appTitle;

  return (
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-clip bg-slate-50 text-slate-900 print:min-h-0 print:overflow-visible print:bg-white">
      <div className="flex min-h-[100dvh] w-full min-w-0 print:block print:min-h-0">
        {/* Desktop Sidebar */}
        <aside className="no-print hidden w-64 shrink-0 flex-col border-e border-slate-200 bg-white lg:flex">
          <button
            type="button"
            onClick={() => handleDashboardNavigate('dashboard', false)}
            className="flex h-16 items-center border-b border-slate-200 px-5 text-start"
          >
            <span className="truncate text-lg font-bold tracking-tight text-slate-900">
              {t.appTitle}
            </span>
          </button>

          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleDashboardNavigate(item.id, false)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-blue-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Connectivity & PWA Install Footer */}
          <div className="space-y-3 border-t border-slate-200 p-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                  {isOnline ? (
                    <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <WifiOff className="h-3.5 w-3.5 text-amber-600" />
                  )}
                  {isOnline ? t.onlineStatus : t.offlineStatus}
                </span>
                {totalPendingCount > 0 && (
                  <span className="font-mono font-semibold text-amber-700 tabular-nums">
                    {totalPendingCount} {t.pendingChangesLabel}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-slate-500">
                {hasToken ? (
                  <Cloud className="h-3.5 w-3.5 text-blue-800" />
                ) : (
                  <CloudOff className="h-3.5 w-3.5 text-slate-400" />
                )}
                <span className="truncate">
                  {hasToken && user?.email ? user.email : t.signInGoogle}
                </span>
              </div>
            </div>

            <PWAInstallButton lang={lang} />
          </div>
        </aside>

        {/* Mobile More Drawer */}
        {mobileMenuOpen && (
          <div className="no-print fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px]"
              onClick={handleCloseMobileMenu}
            />
            <aside className="relative z-10 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl pb-safe">
              <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
                <span className="truncate text-base font-bold text-slate-900">{t.appTitle}</span>
                <button
                  type="button"
                  onClick={handleCloseMobileMenu}
                  aria-label="Close"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      handleDashboardNavigate(item.id, false);
                    }}
                    className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </nav>
              <div className="space-y-3 border-t border-slate-200 p-4">
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                      {isOnline ? (
                        <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <WifiOff className="h-3.5 w-3.5 text-amber-600" />
                      )}
                      {isOnline ? t.onlineStatus : t.offlineStatus}
                    </span>
                    {totalPendingCount > 0 && (
                      <span className="font-mono font-semibold text-amber-700 tabular-nums">
                        {totalPendingCount} {t.pendingChangesLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    {hasToken ? (
                      <Cloud className="h-3.5 w-3.5 shrink-0 text-blue-800" />
                    ) : (
                      <CloudOff className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    )}
                    <span className="truncate">
                      {hasToken && user?.email ? user.email : t.signInGoogle}
                    </span>
                  </div>
                </div>
                <PWAInstallButton lang={lang} />
              </div>
            </aside>
          </div>
        )}

        {/* Main Viewport */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Compact Single-Row Top Bar (48px on mobile, 64px on desktop) */}
          <header className="no-print sticky top-0 z-30 flex h-12 items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 backdrop-blur-md sm:h-14 sm:px-6 lg:h-16 lg:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleOpenMobileMenu}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
                aria-label={t.moreMenuLabel}
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800">
                <button
                  type="button"
                  onClick={() => handleDashboardNavigate('dashboard', false)}
                  className="hidden shrink-0 text-slate-500 hover:text-slate-900 sm:inline"
                >
                  {lang === 'ur' ? ledger.settings.addaNameUrdu : ledger.settings.addaName}
                </button>
                <span className="hidden text-slate-300 sm:inline" aria-hidden="true">
                  /
                </span>
                <span className="truncate text-sm font-bold text-slate-900 sm:font-semibold">
                  {activeNavTitle}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
              <button
                type="button"
                onClick={() => setLang((prev) => (prev === 'en' ? 'ur' : 'en'))}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap sm:h-9 sm:gap-1.5 sm:px-3"
              >
                <Languages className="h-3.5 w-3.5 text-blue-900" />
                <span>{lang === 'en' ? 'اردو' : 'EN'}</span>
              </button>

              {hasToken ? (
                <button
                  type="button"
                  disabled={!isOnline || isSyncing}
                  onClick={() => handleSyncToDrive(false)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-blue-900 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap sm:h-9 sm:gap-1.5 sm:px-3.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="sm:hidden">
                    {isSyncing
                      ? '...'
                      : totalPendingCount > 0
                        ? `${t.syncShort} (${totalPendingCount})`
                        : t.syncShort}
                  </span>
                  <span className="hidden sm:inline">
                    {isSyncing
                      ? t.syncing
                      : totalPendingCount > 0
                        ? `${t.syncNow} (${totalPendingCount})`
                        : t.syncNow}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!isOnline}
                  onClick={handleGoogleLogin}
                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-blue-900 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap sm:h-9 sm:gap-1.5 sm:px-3.5"
                >
                  <Cloud className="h-3.5 w-3.5" />
                  <span className="sm:hidden">
                    {totalPendingCount > 0 ? `${t.syncShort} (${totalPendingCount})` : t.signInShort}
                  </span>
                  <span className="hidden sm:inline">
                    {totalPendingCount > 0 ? t.authNeededBtn : t.signInGoogle}
                  </span>
                </button>
              )}
            </div>
          </header>

          {!isOnline && (
            <div className="no-print border-b border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-900 sm:px-6 sm:py-2.5 sm:text-xs">
              <div className="flex items-center gap-2">
                <WifiOff className="h-3.5 w-3.5 shrink-0 text-amber-700 sm:h-4 sm:w-4" />
                <span className="min-w-0 leading-snug">{t.offlineBanner}</span>
              </div>
            </div>
          )}

          {isOnline && !hasToken && totalPendingCount > 0 && (
            <div className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-medium text-blue-950 sm:gap-3 sm:px-6 sm:py-2.5 sm:text-xs">
              <span className="min-w-0 flex-1 leading-snug">{t.backOnlineAuthPrompt}</span>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="shrink-0 rounded-md bg-blue-900 px-3 py-1.5 font-semibold text-white hover:bg-blue-800"
              >
                {t.signInShort}
              </button>
            </div>
          )}

          <main className="print-main-reset mx-auto w-full min-w-0 max-w-6xl flex-1 px-3 py-3 pb-24 sm:p-6 lg:pb-6">
            {!dbReady ? (
              <div className="space-y-4">
                <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200" />
                <div className="h-48 w-full animate-pulse rounded-xl bg-slate-200" />
                <div className="h-64 w-full animate-pulse rounded-xl bg-slate-200" />
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <Dashboard
                    lang={lang}
                    drivers={ledger.drivers}
                    orders={ledger.orders}
                    bilties={ledger.bilties}
                    rooznamcha={ledger.rooznamcha}
                    onNavigate={handleDashboardNavigate}
                  />
                )}

                {activeTab === 'drivers' && (
                  <DriverRegister
                    drivers={ledger.drivers}
                    contacts={contactsDirectory}
                    settings={ledger.settings}
                    lang={lang}
                    autoStartWizard={startWizardTab === 'drivers'}
                    externalSubView={subView === 'wizard' || subView === 'list' ? subView : 'list'}
                    onSubViewChange={(next, opts) => handleSubViewChange('drivers', next, opts)}
                    onWizardClosed={() => setStartWizardTab(null)}
                    onAddDriver={handleAddDriver}
                    onUpdateDriver={handleUpdateDriver}
                    onDeleteDriver={handleDeleteDriver}
                    onSavePdfToDrive={handleSavePdfToDrive}
                    onNotify={notify}
                  />
                )}

                {activeTab === 'orders' && (
                  <OrderRegister
                    orders={ledger.orders}
                    contacts={contactsDirectory}
                    lang={lang}
                    autoStartWizard={startWizardTab === 'orders'}
                    externalSubView={subView === 'wizard' || subView === 'list' ? subView : 'list'}
                    onSubViewChange={(next, opts) => handleSubViewChange('orders', next, opts)}
                    onWizardClosed={() => setStartWizardTab(null)}
                    onAddOrder={handleAddOrder}
                    onUpdateOrder={handleUpdateOrder}
                    onDeleteOrder={handleDeleteOrder}
                    onNotify={notify}
                  />
                )}

                {activeTab === 'rooznamcha' && (
                  <Rooznamcha
                    entries={ledger.rooznamcha}
                    settings={ledger.settings}
                    lang={lang}
                    autoStartWizard={startWizardTab === 'rooznamcha'}
                    externalSubView={subView === 'wizard' || subView === 'list' ? subView : 'list'}
                    onSubViewChange={(next, opts) => handleSubViewChange('rooznamcha', next, opts)}
                    onWizardClosed={() => setStartWizardTab(null)}
                    onAddEntry={handleAddRooznamcha}
                    onUpdateEntry={handleUpdateRooznamcha}
                    onDeleteEntry={handleDeleteRooznamcha}
                    onSavePdfToDrive={handleSavePdfToDrive}
                    onNotify={notify}
                  />
                )}

                {activeTab === 'bilty' && (
                  <BiltyMaker
                    bilties={ledger.bilties}
                    drivers={ledger.drivers}
                    settings={ledger.settings}
                    lang={lang}
                    autoStartWizard={startWizardTab === 'bilty'}
                    externalSubView={
                      subView === 'wizard' || subView === 'list' || subView === 'preview'
                        ? subView
                        : undefined
                    }
                    onSubViewChange={(next, opts) => handleSubViewChange('bilty', next, opts)}
                    onWizardClosed={() => setStartWizardTab(null)}
                    onSaveBilty={handleSaveBilty}
                    onUpdateBilty={handleUpdateBilty}
                    onDeleteBilty={handleDeleteBilty}
                    onSavePdfToDrive={handleSavePdfToDrive}
                    onNotify={notify}
                  />
                )}

                {activeTab === 'drive' && (
                  <DriveSettings
                    lang={lang}
                    isOnline={isOnline}
                    user={user}
                    hasToken={hasToken}
                    isSyncing={isSyncing}
                    authError={authError}
                    syncMeta={ledger.syncMeta}
                    pendingPdfs={pendingPdfs}
                    driveFiles={driveFiles}
                    settings={ledger.settings}
                    onGoogleLogin={handleGoogleLogin}
                    onGoogleLogout={handleGoogleLogout}
                    onSyncNow={handleSyncToDrive}
                    onRestoreFromDrive={handleRestoreFromDrive}
                    onRefreshDriveFiles={handleRefreshDriveFiles}
                    onFlushPendingPdfs={handleFlushPendingPdfs}
                    onDeleteDriveFile={handleDeleteDriveFile}
                    onUpdateSettings={handleUpdateSettings}
                    onNotify={notify}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <ConfirmModal
        open={!!overwritePrompt?.open}
        title={t.confirmOverwriteDriveTitle}
        description={
          overwritePrompt
            ? t.confirmOverwriteDriveDesc.replace(
                '{driveTime}',
                overwritePrompt.driveModifiedTime
              )
            : ''
        }
        confirmLabel={t.confirm}
        cancelLabel={t.cancel}
        variant="primary"
        onCancel={() => setOverwritePrompt(null)}
        onConfirm={() => {
          setOverwritePrompt(null);
          handleSyncToDrive(true);
        }}
      />

      {/* Mobile Fixed Bottom Navigation Bar (56px + safe inset) */}
      <nav
        aria-label="Mobile Navigation"
        className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md pb-safe lg:hidden"
      >
        <div className="grid h-14 grid-cols-5 items-stretch">
          {bottomNavItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleDashboardNavigate(item.id, false)}
                className={`relative flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 transition-colors ${
                  active ? 'text-blue-900' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {active && (
                  <span
                    className="absolute top-0 inset-x-3 h-0.5 rounded-b-full bg-blue-900"
                    aria-hidden="true"
                  />
                )}
                {item.icon}
                <span className="max-w-full truncate text-[10px] font-semibold tracking-tight">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="no-print fixed bottom-20 inset-x-3 z-50 flex flex-col gap-2 sm:inset-x-auto sm:bottom-4 sm:end-4 lg:bottom-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold shadow-lg ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : toast.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-900'
                  : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">{toast.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
