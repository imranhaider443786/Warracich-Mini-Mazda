import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  DownloadCloud,
  ExternalLink,
  FileText,
  FolderOpen,
  LogOut,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n';
import {
  AddaSettings,
  BiltyStationerySettings,
  DriveFileItem,
  Language,
  PendingPdfJob,
  SyncMetadata,
} from '../types';
import { ConfirmModal } from './ConfirmModal';

interface DriveSettingsProps {
  lang: Language;
  isOnline: boolean;
  user: User | null;
  hasToken: boolean;
  isSyncing: boolean;
  syncMeta: SyncMetadata;
  pendingPdfs: PendingPdfJob[];
  driveFiles: DriveFileItem[];
  settings: AddaSettings;
  onGoogleLogin: () => Promise<void>;
  onGoogleLogout: () => Promise<void>;
  onSyncNow: (confirmedOverwrite?: boolean) => Promise<void>;
  onRestoreFromDrive: () => Promise<void>;
  onRefreshDriveFiles: () => Promise<void>;
  onFlushPendingPdfs: () => Promise<void>;
  onDeleteDriveFile: (fileId: string) => Promise<void>;
  onUpdateSettings: (nextSettings: AddaSettings) => void;
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const DriveSettings: React.FC<DriveSettingsProps> = ({
  lang,
  isOnline,
  user,
  hasToken,
  isSyncing,
  syncMeta,
  pendingPdfs,
  driveFiles,
  settings,
  onGoogleLogin,
  onGoogleLogout,
  onSyncNow,
  onRestoreFromDrive,
  onRefreshDriveFiles,
  onFlushPendingPdfs,
  onDeleteDriveFile,
  onUpdateSettings,
  onNotify,
}) => {
  const t = TRANSLATIONS[lang];

  const [formSettings, setFormSettings] = useState<AddaSettings>(settings);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<DriveFileItem | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formSettings);
    onNotify(lang === 'ur' ? 'اڈہ سیٹنگز محفوظ ہو گئیں۔' : 'Adda settings saved.', 'success');
  };

  const updateTemplateField = (
    idx: number,
    field: 'bodyEn' | 'bodyUr',
    value: string
  ) => {
    setFormSettings((prev) => ({
      ...prev,
      whatsappTemplates: prev.whatsappTemplates.map((tpl, i) =>
        i === idx ? { ...tpl, [field]: value } : tpl
      ),
    }));
  };

  const updateStationery = <K extends keyof BiltyStationerySettings>(
    key: K,
    value: BiltyStationerySettings[K]
  ) => {
    setFormSettings((prev) => ({
      ...prev,
      biltyStationery: {
        ...prev.biltyStationery,
        [key]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t.drivePageTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{t.drivePageSub}</p>
      </div>

      {/* Google Drive Auth & Sync Panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {t.driveConnectionCard}
            </h2>
            {user && hasToken ? (
              <p className="mt-1 text-xs text-slate-600">
                {t.signedInAs}: <strong className="text-slate-900">{user.email}</strong>
                {syncMeta.lastSyncedAt && (
                  <>
                    {' '}
                    · {t.syncedLabel}:{' '}
                    <span className="font-mono">
                      {new Date(syncMeta.lastSyncedAt).toLocaleString()}
                    </span>
                  </>
                )}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-600">{t.driveNotConnected}</p>
            )}
          </div>

          <div>
            {!hasToken ? (
              <button
                type="button"
                onClick={onGoogleLogin}
                disabled={!isOnline}
                className="gsi-material-button"
              >
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      style={{ display: 'block' }}
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">{t.signInGoogle}</span>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={onGoogleLogout}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t.signOut}
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!hasToken || !isOnline || isSyncing}
            onClick={() => onSyncNow(false)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-40 whitespace-nowrap"
          >
            <UploadCloud className="h-4 w-4" />
            {isSyncing ? t.syncing : t.syncBackupNow}
            {syncMeta.pendingChanges > 0 && ` (${syncMeta.pendingChanges})`}
          </button>

          <button
            type="button"
            disabled={!hasToken || !isOnline || isSyncing}
            onClick={() => setConfirmRestoreOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap"
          >
            <DownloadCloud className="h-4 w-4" />
            {t.restoreFromDrive}
          </button>

          <button
            type="button"
            disabled={!hasToken || !isOnline || isSyncing}
            onClick={onRefreshDriveFiles}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {t.refreshDriveFiles}
          </button>
        </div>

        {/* Pending Offline PDFs Queue */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              {t.pendingPdfQueueTitle} ({pendingPdfs.length})
            </h3>
            {pendingPdfs.length > 0 && (
              <button
                type="button"
                disabled={!hasToken || !isOnline || isSyncing}
                onClick={onFlushPendingPdfs}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-100 disabled:opacity-40"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                {t.flushQueueBtn}
              </button>
            )}
          </div>
          {pendingPdfs.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">{t.noPendingPdfs}</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-amber-200 bg-amber-50/40">
              {pendingPdfs.map((job) => (
                <li
                  key={job.id}
                  className="flex items-center justify-between px-4 py-2.5 text-xs"
                >
                  <span className="font-mono font-medium text-slate-800">
                    {job.folder}/{job.filename}
                  </span>
                  <span className="font-mono text-amber-800">
                    {new Date(job.createdAt).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Google Drive Files Browser */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-semibold text-slate-900">
            {t.driveFilesTitle} ({settings.driveFolderName})
          </h3>
          {driveFiles.length === 0 ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <FolderOpen className="h-4 w-4 text-slate-400" />
              <span>{t.noDriveFiles}</span>
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full border-collapse text-start text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                    <th className="px-3 py-2 text-start">File</th>
                    <th className="px-3 py-2 text-start">Folder</th>
                    <th className="px-3 py-2 text-start">Modified</th>
                    <th className="px-3 py-2 text-end">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {driveFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono font-medium text-slate-900">
                        <span className="inline-flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          {file.name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{file.folderLabel}</td>
                      <td className="px-3 py-2 font-mono text-slate-500 tabular-nums">
                        {file.modifiedTime
                          ? new Date(file.modifiedTime).toLocaleString()
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-end whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-100"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {t.openInDrive}
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteFile(file)}
                            className="inline-flex items-center rounded border border-red-200 p-1 text-red-600 hover:bg-red-50"
                            title={t.delete}
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
      </div>

      {/* Adda Profile, Official Urdu Bilty Stationery & WhatsApp Templates */}
      <form
        onSubmit={handleSaveProfile}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6"
      >
        <h2 className="border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
          {t.addaProfileTitle}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              {t.addaNameEn}
            </label>
            <input
              type="text"
              value={formSettings.addaName}
              onChange={(e) =>
                setFormSettings({ ...formSettings, addaName: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              {t.addaNameUr}
            </label>
            <input
              type="text"
              dir="rtl"
              value={formSettings.addaNameUrdu}
              onChange={(e) =>
                setFormSettings({ ...formSettings, addaNameUrdu: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              {t.addaAddressEn}
            </label>
            <input
              type="text"
              value={formSettings.address}
              onChange={(e) =>
                setFormSettings({ ...formSettings, address: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              {t.addaAddressUr}
            </label>
            <input
              type="text"
              dir="rtl"
              value={formSettings.addressUrdu}
              onChange={(e) =>
                setFormSettings({ ...formSettings, addressUrdu: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              {t.addaPhoneLabel}
            </label>
            <input
              type="tel"
              value={formSettings.phone}
              onChange={(e) =>
                setFormSettings({ ...formSettings, phone: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-800 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                {t.driveFolderLabel}
              </label>
              <input
                type="text"
                value={formSettings.driveFolderName}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, driveFolderName: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                {t.nextBiltyNoLabel}
              </label>
              <input
                type="number"
                min="1"
                value={formSettings.nextBiltyNumber}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    nextBiltyNumber: Number(e.target.value) || 1,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-800 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Editable Warraich Goods Samundri Official Bilty Stationery */}
        <div className="border-t border-slate-100 pt-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            {t.biltyStationeryTitle}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Bilty Main Title (Urdu)
              </label>
              <input
                type="text"
                dir="rtl"
                value={formSettings.biltyStationery.brandTitleUrdu}
                onChange={(e) => updateStationery('brandTitleUrdu', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Bilty Subtitle / Address (Urdu)
              </label>
              <input
                type="text"
                dir="rtl"
                value={formSettings.biltyStationery.brandSubtitleUrdu}
                onChange={(e) => updateStationery('brandSubtitleUrdu', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Primary Contact Box Name
              </label>
              <input
                type="text"
                dir="rtl"
                value={formSettings.biltyStationery.primaryContactTitle}
                onChange={(e) => updateStationery('primaryContactTitle', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-none"
              />
              <label className="mb-1 mt-2 block text-xs font-medium text-slate-500">
                Primary Contact Phones (comma-separated)
              </label>
              <input
                type="text"
                value={formSettings.biltyStationery.primaryContactPhones.join(', ')}
                onChange={(e) =>
                  updateStationery(
                    'primaryContactPhones',
                    e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Secondary Contact Box Name
              </label>
              <input
                type="text"
                dir="rtl"
                value={formSettings.biltyStationery.secondaryContactTitle}
                onChange={(e) => updateStationery('secondaryContactTitle', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-none"
              />
              <label className="mb-1 mt-2 block text-xs font-medium text-slate-500">
                Secondary Contact Phones (comma-separated)
              </label>
              <input
                type="text"
                value={formSettings.biltyStationery.secondaryContactPhones.join(', ')}
                onChange={(e) =>
                  updateStationery(
                    'secondaryContactPhones',
                    e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Patron Name (سرپرست اعلیٰ)
              </label>
              <input
                type="text"
                dir="rtl"
                value={formSettings.biltyStationery.patronNameUrdu}
                onChange={(e) => updateStationery('patronNameUrdu', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Patron Phone
              </label>
              <input
                type="text"
                value={formSettings.biltyStationery.patronPhone}
                onChange={(e) => updateStationery('patronPhone', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-800 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Marketing Templates */}
        <div className="border-t border-slate-100 pt-5">
          <h3 className="text-sm font-semibold text-slate-900">
            {t.whatsappTemplatesTitle}
          </h3>
          <p className="mt-1 font-mono text-xs text-slate-500">{t.placeholdersHint}</p>

          <div className="mt-4 space-y-4">
            {formSettings.whatsappTemplates.map((tpl, idx) => (
              <div
                key={tpl.id}
                className="grid grid-cols-1 gap-3 border-b border-slate-100 pb-4 sm:grid-cols-2 last:border-b-0"
              >
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    {tpl.nameEn} (English)
                  </label>
                  <textarea
                    rows={2}
                    value={tpl.bodyEn}
                    onChange={(e) => updateTemplateField(idx, 'bodyEn', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    {tpl.nameUr} (اردو)
                  </label>
                  <textarea
                    rows={2}
                    dir="rtl"
                    value={tpl.bodyUr}
                    onChange={(e) => updateTemplateField(idx, 'bodyUr', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <Save className="h-4 w-4" />
            {t.saveSettingsBtn}
          </button>
        </div>
      </form>

      <ConfirmModal
        open={confirmRestoreOpen}
        title={t.confirmRestoreDriveTitle}
        description={t.confirmRestoreDriveDesc}
        confirmLabel={t.confirm}
        cancelLabel={t.cancel}
        variant="primary"
        onCancel={() => setConfirmRestoreOpen(false)}
        onConfirm={() => {
          setConfirmRestoreOpen(false);
          onRestoreFromDrive();
        }}
      />

      <ConfirmModal
        open={!!confirmDeleteFile}
        title={t.confirmDeleteDriveFileTitle}
        description={
          confirmDeleteFile
            ? t.confirmDeleteDriveFileDesc.replace('{name}', confirmDeleteFile.name)
            : ''
        }
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        variant="danger"
        onCancel={() => setConfirmDeleteFile(null)}
        onConfirm={() => {
          if (confirmDeleteFile) {
            onDeleteDriveFile(confirmDeleteFile.id);
            setConfirmDeleteFile(null);
          }
        }}
      />
    </div>
  );
};
