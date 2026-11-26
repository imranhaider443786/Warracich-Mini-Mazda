import {
  AddaSettings,
  BiltyRecord,
  DriveFileItem,
  DriverEntry,
  PdfFolderCategory,
  RooznamchaEntry,
} from '../types';

const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const BACKUP_FILENAME = 'adda_ledger_backup.json';

export interface DriveFolderTree {
  rootId: string;
  dataBackupsId: string;
  pdfRootId: string;
  driversPdfId: string;
  biltiesPdfId: string;
  rooznamchaPdfId: string;
}

export interface DriveBackupPayload {
  version: number;
  exportedAt: string;
  drivers: DriverEntry[];
  bilties: BiltyRecord[];
  rooznamcha: RooznamchaEntry[];
  settings: AddaSettings;
}

async function driveFetch(url: string, token: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    if (res.status === 401) {
      throw new Error('AUTH_EXPIRED');
    }
    let message = errText || res.statusText;
    try {
      const parsed = JSON.parse(errText) as { error?: { message?: string } };
      if (parsed?.error?.message) {
        message = parsed.error.message;
      }
    } catch {
      // keep raw errText
    }
    throw new Error(`Google Drive error (${res.status}): ${message}`);
  }
  return res;
}

function escapeDriveQuery(val: string): string {
  return val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function findOrCreateFolder(
  token: string,
  name: string,
  parentId?: string
): Promise<string> {
  const safeName = escapeDriveQuery(name.trim() || 'Adda Ledger Pro');
  const parentClause = parentId ? ` and '${parentId}' in parents` : ` and 'root' in parents`;
  const q = `name='${safeName}' and mimeType='${FOLDER_MIME}' and trashed=false${parentClause}`;
  const searchUrl = `${DRIVE_FILES_URL}?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive`;
  const searchRes = await driveFetch(searchUrl, token);
  const searchJson = (await searchRes.json()) as { files?: Array<{ id: string }> };

  if (searchJson.files && searchJson.files.length > 0) {
    return searchJson.files[0].id;
  }

  const metadata: Record<string, unknown> = {
    name: name.trim() || 'Adda Ledger Pro',
    mimeType: FOLDER_MIME,
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const createRes = await driveFetch(`${DRIVE_FILES_URL}?fields=id`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });
  const created = (await createRes.json()) as { id: string };
  return created.id;
}

export async function ensureFolderHierarchy(
  token: string,
  rootFolderName: string
): Promise<DriveFolderTree> {
  const rootId = await findOrCreateFolder(token, rootFolderName || 'Adda Ledger Pro');
  const [dataBackupsId, pdfRootId] = await Promise.all([
    findOrCreateFolder(token, 'Data_Backups', rootId),
    findOrCreateFolder(token, 'PDF_Reports', rootId),
  ]);
  const [driversPdfId, biltiesPdfId, rooznamchaPdfId] = await Promise.all([
    findOrCreateFolder(token, 'Drivers', pdfRootId),
    findOrCreateFolder(token, 'Bilties', pdfRootId),
    findOrCreateFolder(token, 'Rooznamcha', pdfRootId),
  ]);

  return {
    rootId,
    dataBackupsId,
    pdfRootId,
    driversPdfId,
    biltiesPdfId,
    rooznamchaPdfId,
  };
}

export async function findBackupFile(
  token: string,
  dataBackupsFolderId: string
): Promise<{ id: string; modifiedTime: string; size?: string } | null> {
  const q = `name='${BACKUP_FILENAME}' and '${dataBackupsFolderId}' in parents and trashed=false`;
  const url = `${DRIVE_FILES_URL}?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc`;
  const res = await driveFetch(url, token);
  const json = (await res.json()) as {
    files?: Array<{ id: string; modifiedTime: string; size?: string }>;
  };
  return json.files && json.files.length > 0 ? json.files[0] : null;
}

export async function downloadDriveBackup(
  token: string,
  fileId: string
): Promise<DriveBackupPayload> {
  const res = await driveFetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, token);
  return (await res.json()) as DriveBackupPayload;
}

async function multipartUpload(
  token: string,
  metadata: Record<string, unknown>,
  blob: Blob,
  existingFileId?: string
): Promise<{ id: string; modifiedTime: string; webViewLink?: string }> {
  const boundary = `-------adda_ledger_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const metaPart = JSON.stringify(metadata);

  const bodyBlob = new Blob(
    [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
      metaPart,
      `\r\n--${boundary}\r\nContent-Type: ${blob.type || 'application/octet-stream'}\r\n\r\n`,
      blob,
      `\r\n--${boundary}--`,
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const url = existingFileId
    ? `${DRIVE_UPLOAD_URL}/${existingFileId}?uploadType=multipart&fields=id,modifiedTime,webViewLink`
    : `${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id,modifiedTime,webViewLink`;

  const res = await driveFetch(url, token, {
    method: existingFileId ? 'PATCH' : 'POST',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: bodyBlob,
  });

  return (await res.json()) as { id: string; modifiedTime: string; webViewLink?: string };
}

export async function uploadJsonBackupToDrive(
  token: string,
  dataBackupsFolderId: string,
  payload: DriveBackupPayload,
  existingFileId?: string
): Promise<{ id: string; modifiedTime: string }> {
  const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const metadata: Record<string, unknown> = existingFileId
    ? { name: BACKUP_FILENAME, mimeType: 'application/json' }
    : { name: BACKUP_FILENAME, mimeType: 'application/json', parents: [dataBackupsFolderId] };

  const result = await multipartUpload(token, metadata, jsonBlob, existingFileId);
  return { id: result.id, modifiedTime: result.modifiedTime };
}

export async function uploadPdfBlobToDrive(
  token: string,
  tree: DriveFolderTree,
  category: PdfFolderCategory,
  filename: string,
  pdfBlob: Blob
): Promise<{ id: string; webViewLink?: string }> {
  const targetFolderId =
    category === 'Drivers'
      ? tree.driversPdfId
      : category === 'Bilties'
        ? tree.biltiesPdfId
        : tree.rooznamchaPdfId;

  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  // Check if file with same name exists in this subfolder to update cleanly
  const q = `name='${escapeDriveQuery(safeFilename)}' and '${targetFolderId}' in parents and trashed=false`;
  const checkRes = await driveFetch(
    `${DRIVE_FILES_URL}?q=${encodeURIComponent(q)}&fields=files(id)`,
    token
  );
  const checkJson = (await checkRes.json()) as { files?: Array<{ id: string }> };
  const existingId = checkJson.files?.[0]?.id;

  const metadata: Record<string, unknown> = existingId
    ? { name: safeFilename, mimeType: 'application/pdf' }
    : { name: safeFilename, mimeType: 'application/pdf', parents: [targetFolderId] };

  const res = await multipartUpload(token, metadata, pdfBlob, existingId);
  return { id: res.id, webViewLink: res.webViewLink };
}

export async function listAllAddaDriveFiles(
  token: string,
  tree: DriveFolderTree
): Promise<DriveFileItem[]> {
  const folders: Array<{ id: string; label: string }> = [
    { id: tree.dataBackupsId, label: 'Data_Backups' },
    { id: tree.driversPdfId, label: 'PDF_Reports / Drivers' },
    { id: tree.biltiesPdfId, label: 'PDF_Reports / Bilties' },
    { id: tree.rooznamchaPdfId, label: 'PDF_Reports / Rooznamcha' },
  ];

  const results = await Promise.all(
    folders.map(async (f) => {
      const q = `'${f.id}' in parents and trashed=false and mimeType!='${FOLDER_MIME}'`;
      const url = `${DRIVE_FILES_URL}?q=${encodeURIComponent(
        q
      )}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=50`;
      const res = await driveFetch(url, token);
      const json = (await res.json()) as {
        files?: Array<{
          id: string;
          name: string;
          mimeType: string;
          size?: string;
          modifiedTime?: string;
          webViewLink?: string;
        }>;
      };
      return (json.files || []).map((file) => ({
        ...file,
        folderLabel: f.label,
      }));
    })
  );

  return results
    .flat()
    .sort((a, b) => (b.modifiedTime || '').localeCompare(a.modifiedTime || ''));
}

export async function deleteDriveFile(token: string, fileId: string): Promise<void> {
  await driveFetch(`${DRIVE_FILES_URL}/${fileId}`, token, {
    method: 'DELETE',
  });
}
