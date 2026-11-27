export type Language = 'en' | 'ur';

export type WorkspaceTab = 'dashboard' | 'drivers' | 'orders' | 'bilty' | 'rooznamcha' | 'drive';

export type WeightUnit = 'Tons' | 'Mann' | 'Kg';

export type DriverStatus = 'Available' | 'Loaded' | 'Dispatched';

export interface DriverEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  gariNumber: string;
  gariFeet: string;
  city: string;
  driverName: string;
  mobileNumber: string;
  weightCapacity: string;
  weightUnit: WeightUnit;
  status: DriverStatus;
  notes: string;
  updatedAt: number;
}

export type PaymentType = 'To-Pay' | 'Paid';

export interface BiltyRecord {
  id: string;
  biltyNumber: string;
  date: string; // YYYY-MM-DD
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  fromCity: string;
  toCity: string;
  gariNumber: string;
  driverName: string;
  driverPhone: string;
  goodsDescription: string; // Tafseel Maal
  packagesCount: string; // Tadad / Nagg (supports numeric & alphabetic)
  weight: string; // Wazan (supports numeric & alphabetic)
  freightAmount: number; // Total Kiraya
  advancePaid: number; // 0 means not entered -> hidden on Bilty
  balanceDue: number; // Kiraya Qabil-e-Ada
  paymentType: PaymentType;
  notes: string;
  updatedAt: number;
}

export type RooznamchaType = 'income' | 'expense';

export interface RooznamchaEntry {
  id: string;
  date: string; // YYYY-MM-DD
  type: RooznamchaType;
  category: string;
  description: string;
  reference: string;
  amount: number;
  updatedAt: number;
}

export interface OrderEntry {
  id: string;
  date: string; // YYYY-MM-DD (optional)
  customerName: string;
  mobileNumber: string;
  goodsType: string; // Qisam Maal
  weight: string; // Wazan
  pickupLocation: string;
  dropoffLocation: string;
  estimateFare: string;
  notes: string;
  updatedAt: number;
}

export interface WhatsAppTemplate {
  id: string;
  nameEn: string;
  nameUr: string;
  bodyEn: string;
  bodyUr: string;
}

export interface BiltyStationerySettings {
  topSloganUrdu: string;
  serviceBadgeUrdu: string;
  brandTitleUrdu: string;
  brandSubtitleUrdu: string;
  groupBadgeUrdu: string;
  primaryContactTitle: string;
  primaryContactPhones: string[];
  secondaryContactTitle: string;
  secondaryContactPhones: string[];
  patronLabelUrdu: string;
  patronNameUrdu: string;
  patronDesignationUrdu: string;
  patronPhone: string;
  patronNoteUrdu: string;
  mottoUrdu: string;
  termsUrdu: string[];
}

export interface AddaSettings {
  addaName: string;
  addaNameUrdu: string;
  phone: string;
  address: string;
  addressUrdu: string;
  driveFolderName: string;
  nextBiltyNumber: number;
  whatsappTemplates: WhatsAppTemplate[];
  biltyStationery: BiltyStationerySettings;
}

export interface SyncMetadata {
  pendingChanges: number;
  lastLocalEditAt: number;
  lastSyncedAt: number | null;
  lastDriveModifiedTime: string | null;
}

export interface LedgerDatabase {
  drivers: DriverEntry[];
  orders: OrderEntry[];
  bilties: BiltyRecord[];
  rooznamcha: RooznamchaEntry[];
  settings: AddaSettings;
  syncMeta: SyncMetadata;
}

export type PdfFolderCategory = 'Drivers' | 'Bilties' | 'Rooznamcha';

export interface PendingPdfJob {
  id: string;
  filename: string;
  folder: PdfFolderCategory;
  blob: Blob;
  createdAt: number;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  folderLabel: string;
}

export type SyncStatusState =
  | 'idle'
  | 'syncing'
  | 'synced'
  | 'offline_pending'
  | 'auth_needed'
  | 'error';
