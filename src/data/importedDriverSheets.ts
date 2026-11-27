import { DriverEntry } from '../types';

interface RawSheetRow {
  id: string;
  date: string;
  gariNumber: string;
  gariFeet: string;
  city: string;
  driverName: string;
  mobileNumber: string;
  weightCapacity: string;
  updatedAt: number;
}

export function normalizePakistaniMobile(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return trimmed;
  if (digits.startsWith('0092') && digits.length >= 14) {
    return `0${digits.slice(4)}`;
  }
  if (digits.startsWith('92') && digits.length === 12) {
    return `0${digits.slice(2)}`;
  }
  if (digits.startsWith('3') && digits.length === 10) {
    return `0${digits}`;
  }
  if (digits.startsWith('03') && digits.length === 11) {
    return digits;
  }
  return trimmed;
}

// Base timestamps ensure newest sheet (November) displays above October and September while preserving row order
const SEP_BASE = Date.UTC(2026, 8, 1, 8, 0, 0);
const OCT_BASE = Date.UTC(2026, 9, 1, 8, 0, 0);
const NOV_BASE = Date.UTC(2026, 10, 1, 8, 0, 0);

const SEPTEMBER_ROWS: RawSheetRow[] = [
  { id: 'drv_sheet_2026_09_01', date: '2026-09-14', gariNumber: 'CAE 700', gariFeet: '', city: '', driverName: 'niamat', mobileNumber: '3216950320', weightCapacity: '12', updatedAt: SEP_BASE + 26 * 60_000 },
  { id: 'drv_sheet_2026_09_02', date: '2026-09-15', gariNumber: 'TKX 094', gariFeet: '18', city: 'چشتیاں', driverName: 'جواد', mobileNumber: '3006988025', weightCapacity: '', updatedAt: SEP_BASE + 25 * 60_000 },
  { id: 'drv_sheet_2026_09_03', date: '', gariNumber: 'EA 8510', gariFeet: '18', city: 'hasilpur', driverName: 'sajjad', mobileNumber: '3039676368', weightCapacity: '', updatedAt: SEP_BASE + 24 * 60_000 },
  { id: 'drv_sheet_2026_09_04', date: '', gariNumber: 'LES 1833', gariFeet: '', city: 'pakpattan', driverName: 'rizwan', mobileNumber: '3071833786', weightCapacity: '', updatedAt: SEP_BASE + 23 * 60_000 },
  { id: 'drv_sheet_2026_09_05', date: '', gariNumber: 'FDK 5488', gariFeet: '20', city: '', driverName: '', mobileNumber: '3078975686', weightCapacity: '', updatedAt: SEP_BASE + 22 * 60_000 },
  { id: 'drv_sheet_2026_09_06', date: '', gariNumber: 'BNB 3388', gariFeet: '18', city: 'Pakpatan', driverName: '', mobileNumber: '3228009331', weightCapacity: '', updatedAt: SEP_BASE + 21 * 60_000 },
  { id: 'drv_sheet_2026_09_07', date: '', gariNumber: 'CAC 5186', gariFeet: 'Bedford', city: 'khushab', driverName: '', mobileNumber: '3016098261', weightCapacity: '', updatedAt: SEP_BASE + 20 * 60_000 },
  { id: 'drv_sheet_2026_09_08', date: '', gariNumber: '', gariFeet: '', city: 'Manfa', driverName: '', mobileNumber: '0303-8525498', weightCapacity: '', updatedAt: SEP_BASE + 19 * 60_000 },
  { id: 'drv_sheet_2026_09_09', date: '', gariNumber: 'TAH 729', gariFeet: '16', city: 'arifwala', driverName: '', mobileNumber: '3065073571', weightCapacity: '', updatedAt: SEP_BASE + 18 * 60_000 },
  { id: 'drv_sheet_2026_09_10', date: '2026-09-17', gariNumber: 'MHI 4939', gariFeet: '18', city: 'haronabad', driverName: 'azan', mobileNumber: '03076987554', weightCapacity: '10', updatedAt: SEP_BASE + 17 * 60_000 },
  { id: 'drv_sheet_2026_09_11', date: '2026-09-19', gariNumber: 'LES 8311', gariFeet: '', city: 'lahore', driverName: 'shabeer', mobileNumber: '3450818079', weightCapacity: '', updatedAt: SEP_BASE + 16 * 60_000 },
  { id: 'drv_sheet_2026_09_12', date: '2026-09-20', gariNumber: 'TAD 528', gariFeet: '18', city: 'Fortabas', driverName: 'irshad', mobileNumber: '3201366763', weightCapacity: '10', updatedAt: SEP_BASE + 15 * 60_000 },
  { id: 'drv_sheet_2026_09_13', date: '2026-09-23', gariNumber: '', gariFeet: '18', city: 'rahimyarkhan', driverName: '', mobileNumber: '03082266601', weightCapacity: '', updatedAt: SEP_BASE + 14 * 60_000 },
  { id: 'drv_sheet_2026_09_14', date: '2026-09-23', gariNumber: '', gariFeet: '18', city: 'mandi dhaban', driverName: 'Juty bro', mobileNumber: '03070403569', weightCapacity: '', updatedAt: SEP_BASE + 13 * 60_000 },
  { id: 'drv_sheet_2026_09_15', date: '2026-09-23', gariNumber: '', gariFeet: '18', city: 'arifwala', driverName: '', mobileNumber: '03280827191', weightCapacity: '', updatedAt: SEP_BASE + 12 * 60_000 },
  { id: 'drv_sheet_2026_09_16', date: '2026-09-23', gariNumber: '', gariFeet: '18', city: 'sahiwal', driverName: '', mobileNumber: '03054624724', weightCapacity: '', updatedAt: SEP_BASE + 11 * 60_000 },
  { id: 'drv_sheet_2026_09_17', date: '2026-09-24', gariNumber: '', gariFeet: '20', city: 'Rahimyarkhan', driverName: '', mobileNumber: '03009660916', weightCapacity: '', updatedAt: SEP_BASE + 10 * 60_000 },
  { id: 'drv_sheet_2026_09_18', date: '2026-09-24', gariNumber: 'JY 8469', gariFeet: '14', city: 'Chishtiyan', driverName: 'Naeem', mobileNumber: '03039697909', weightCapacity: '5', updatedAt: SEP_BASE + 9 * 60_000 },
  { id: 'drv_sheet_2026_09_19', date: '2026-09-24', gariNumber: 'EA 7441', gariFeet: '17', city: 'arifwala', driverName: 'Ali imran', mobileNumber: '03003315176', weightCapacity: '', updatedAt: SEP_BASE + 8 * 60_000 },
  { id: 'drv_sheet_2026_09_20', date: '2026-09-25', gariNumber: '', gariFeet: 'B.F', city: 'khusab', driverName: '', mobileNumber: '03025790456', weightCapacity: '', updatedAt: SEP_BASE + 7 * 60_000 },
  { id: 'drv_sheet_2026_09_21', date: '', gariNumber: '', gariFeet: 'B.F', city: 'rajahana', driverName: 'imran', mobileNumber: '03049634287', weightCapacity: '', updatedAt: SEP_BASE + 6 * 60_000 },
  { id: 'drv_sheet_2026_09_22', date: '2026-09-27', gariNumber: '', gariFeet: 'B.F', city: 'chishtiyan', driverName: 'ashraf', mobileNumber: '03029020166', weightCapacity: '', updatedAt: SEP_BASE + 5 * 60_000 },
  { id: 'drv_sheet_2026_09_23', date: '2026-09-27', gariNumber: 'LZR 6411', gariFeet: '22', city: 'Lahore', driverName: 'zafar', mobileNumber: '03064044258', weightCapacity: '', updatedAt: SEP_BASE + 4 * 60_000 },
  { id: 'drv_sheet_2026_09_24', date: '2026-09-28', gariNumber: 'CAY 3534', gariFeet: '17', city: 'hasilpur', driverName: 'boota', mobileNumber: '03013332870', weightCapacity: '12', updatedAt: SEP_BASE + 3 * 60_000 },
  { id: 'drv_sheet_2026_09_25', date: '2026-09-29', gariNumber: 'LES 3861', gariFeet: '20', city: 'Aatoch', driverName: 'Sharaft', mobileNumber: '03332313742', weightCapacity: '', updatedAt: SEP_BASE + 2 * 60_000 },
  { id: 'drv_sheet_2026_09_26', date: '2026-09-30', gariNumber: '', gariFeet: '', city: 'Rahimyarkhan', driverName: '', mobileNumber: '03067651722', weightCapacity: '', updatedAt: SEP_BASE + 1 * 60_000 },
];

const OCTOBER_ROWS: RawSheetRow[] = [
  { id: 'drv_sheet_2026_10_01', date: '2026-10-01', gariNumber: 'LPT 7776', gariFeet: '16', city: 'Rahimyarkhan', driverName: 'liaqut', mobileNumber: '3018599180', weightCapacity: '10', updatedAt: OCT_BASE + 22 * 60_000 },
  { id: 'drv_sheet_2026_10_02', date: '', gariNumber: 'ML 8272', gariFeet: '12', city: 'kamalia', driverName: 'A.Qayoum', mobileNumber: '3437528619', weightCapacity: '4', updatedAt: OCT_BASE + 21 * 60_000 },
  { id: 'drv_sheet_2026_10_03', date: '2026-10-07', gariNumber: 'CBB 8777', gariFeet: '22', city: 'rahimyarkhan', driverName: 'M.Ramzan', mobileNumber: '3257401011', weightCapacity: '', updatedAt: OCT_BASE + 20 * 60_000 },
  { id: 'drv_sheet_2026_10_04', date: '2026-10-07', gariNumber: 'LOK 5568', gariFeet: '18', city: 'Rahimyarkhan', driverName: 'Asim', mobileNumber: '3450629045', weightCapacity: '6', updatedAt: OCT_BASE + 19 * 60_000 },
  { id: 'drv_sheet_2026_10_05', date: '2026-10-08', gariNumber: 'CAE 700', gariFeet: '12', city: 'Lahore', driverName: 'M.Akram', mobileNumber: '3004333354', weightCapacity: '', updatedAt: OCT_BASE + 18 * 60_000 },
  { id: 'drv_sheet_2026_10_06', date: '2026-10-11', gariNumber: 'CBP 122', gariFeet: 'H', city: 'Faisalabad', driverName: 'Adnan', mobileNumber: '3075801546', weightCapacity: '', updatedAt: OCT_BASE + 17 * 60_000 },
  { id: 'drv_sheet_2026_10_07', date: '2026-10-14', gariNumber: '', gariFeet: '', city: 'yazman', driverName: '', mobileNumber: '3013199393', weightCapacity: '', updatedAt: OCT_BASE + 16 * 60_000 },
  { id: 'drv_sheet_2026_10_08', date: '2026-10-14', gariNumber: '', gariFeet: '', city: 'chishtiyan', driverName: '', mobileNumber: '3070561628', weightCapacity: '', updatedAt: OCT_BASE + 15 * 60_000 },
  { id: 'drv_sheet_2026_10_09', date: '2026-10-14', gariNumber: 'LEI 5562', gariFeet: '16', city: 'S.garh', driverName: 'Nadeem', mobileNumber: '3001105562', weightCapacity: '', updatedAt: OCT_BASE + 14 * 60_000 },
  { id: 'drv_sheet_2026_10_10', date: '2026-10-14', gariNumber: '', gariFeet: '20', city: 'chishtiyan', driverName: '', mobileNumber: '3007549248', weightCapacity: '', updatedAt: OCT_BASE + 13 * 60_000 },
  { id: 'drv_sheet_2026_10_11', date: '2026-10-17', gariNumber: 'LZR 6846', gariFeet: '18', city: 'Lahore', driverName: 'babar', mobileNumber: '3033701788', weightCapacity: '', updatedAt: OCT_BASE + 12 * 60_000 },
  { id: 'drv_sheet_2026_10_12', date: '2026-10-21', gariNumber: 'LES 1483', gariFeet: '18', city: 'Minchanabad', driverName: 'Tanveer', mobileNumber: '3281301483', weightCapacity: '12', updatedAt: OCT_BASE + 11 * 60_000 },
  { id: 'drv_sheet_2026_10_13', date: '2026-10-21', gariNumber: 'LES 8086', gariFeet: '18', city: 'Haronabad', driverName: 'Haider', mobileNumber: '3049827712', weightCapacity: '12', updatedAt: OCT_BASE + 10 * 60_000 },
  { id: 'drv_sheet_2026_10_14', date: '', gariNumber: 'LES 160', gariFeet: '18', city: 'Faisalabad', driverName: 'shafeeq', mobileNumber: '', weightCapacity: '', updatedAt: OCT_BASE + 9 * 60_000 },
  { id: 'drv_sheet_2026_10_15', date: '2026-10-22', gariNumber: 'TAP 503', gariFeet: '20', city: 'Faisalabad', driverName: 'asif', mobileNumber: '3258220107', weightCapacity: '', updatedAt: OCT_BASE + 8 * 60_000 },
  { id: 'drv_sheet_2026_10_16', date: '2026-10-23', gariNumber: 'CAB 8155', gariFeet: 'H', city: 'Talagang', driverName: 'Tayyab', mobileNumber: '3474967820', weightCapacity: '3', updatedAt: OCT_BASE + 7 * 60_000 },
  { id: 'drv_sheet_2026_10_17', date: '2026-10-26', gariNumber: 'GAS 1504', gariFeet: '20', city: 'samundri', driverName: 'Nadeem', mobileNumber: '3094063117', weightCapacity: '10', updatedAt: OCT_BASE + 6 * 60_000 },
  { id: 'drv_sheet_2026_10_18', date: '2026-10-27', gariNumber: 'CAE 224', gariFeet: 'H', city: 'Mandi b.D', driverName: 'Mursleen', mobileNumber: '3188044180', weightCapacity: '80', updatedAt: OCT_BASE + 5 * 60_000 },
  { id: 'drv_sheet_2026_10_19', date: '2026-10-29', gariNumber: '3275', gariFeet: 'Rakt', city: '', driverName: '', mobileNumber: '3057676410', weightCapacity: '', updatedAt: OCT_BASE + 4 * 60_000 },
  { id: 'drv_sheet_2026_10_20', date: '', gariNumber: 'LES 2093', gariFeet: '18', city: 'ملتان', driverName: 'ابراہیم', mobileNumber: '3241146407', weightCapacity: '10', updatedAt: OCT_BASE + 3 * 60_000 },
  { id: 'drv_sheet_2026_10_21', date: '2026-10-31', gariNumber: 'CAD 116', gariFeet: '18', city: 'فورٹعباس', driverName: 'شبریز', mobileNumber: '3234201822', weightCapacity: '12', updatedAt: OCT_BASE + 2 * 60_000 },
  { id: 'drv_sheet_2026_10_22', date: '', gariNumber: '', gariFeet: '20', city: 'پشاور', driverName: '', mobileNumber: '3176192956', weightCapacity: '', updatedAt: OCT_BASE + 1 * 60_000 },
];

const NOVEMBER_ROWS: RawSheetRow[] = [
  { id: 'drv_sheet_2026_11_01', date: '2026-11-27', gariNumber: 'K 8553', gariFeet: '20', city: 'D.ismail', driverName: 'abdulah', mobileNumber: '3199024376', weightCapacity: '', updatedAt: NOV_BASE + 15 * 60_000 },
  { id: 'drv_sheet_2026_11_02', date: '2026-11-27', gariNumber: 'CAW 9536', gariFeet: '18', city: 'liyah', driverName: 'musharaf', mobileNumber: '3194322073', weightCapacity: '10', updatedAt: NOV_BASE + 14 * 60_000 },
  { id: 'drv_sheet_2026_11_03', date: '2026-11-27', gariNumber: 'MNI 338', gariFeet: '20', city: 'threng mor', driverName: 'waheed', mobileNumber: '3148822386', weightCapacity: '', updatedAt: NOV_BASE + 13 * 60_000 },
  { id: 'drv_sheet_2026_11_04', date: '2026-11-27', gariNumber: 'CAA 933', gariFeet: '18', city: 'Sial kot', driverName: 'Sadeeq', mobileNumber: '3076987554', weightCapacity: '', updatedAt: NOV_BASE + 12 * 60_000 },
  { id: 'drv_sheet_2026_11_05', date: '2026-11-27', gariNumber: '', gariFeet: '20', city: 'Lahore', driverName: '', mobileNumber: '3024313386', weightCapacity: '', updatedAt: NOV_BASE + 11 * 60_000 },
  { id: 'drv_sheet_2026_11_06', date: '2026-11-27', gariNumber: '', gariFeet: '18', city: 'fortabbas', driverName: '', mobileNumber: '0303 2054783', weightCapacity: '', updatedAt: NOV_BASE + 10 * 60_000 },
  { id: 'drv_sheet_2026_11_07', date: '2026-11-27', gariNumber: '', gariFeet: '18+20', city: 'Pindi', driverName: '', mobileNumber: '3015132249', weightCapacity: '', updatedAt: NOV_BASE + 9 * 60_000 },
  { id: 'drv_sheet_2026_11_08', date: '', gariNumber: 'LXK 9846', gariFeet: '22', city: 'Raiwind', driverName: 'sultan', mobileNumber: '3024055314', weightCapacity: '', updatedAt: NOV_BASE + 8 * 60_000 },
  { id: 'drv_sheet_2026_11_09', date: '2026-11-06', gariNumber: 'EA 4268', gariFeet: '18', city: 'Peshawar', driverName: 'Dawood.k', mobileNumber: '3149748510', weightCapacity: '6', updatedAt: NOV_BASE + 7 * 60_000 },
  { id: 'drv_sheet_2026_11_10', date: '', gariNumber: 'CAD 831', gariFeet: '18', city: 'Hasilpur', driverName: 'Saleem', mobileNumber: '3014881886', weightCapacity: '', updatedAt: NOV_BASE + 6 * 60_000 },
  { id: 'drv_sheet_2026_11_11', date: '', gariNumber: '505', gariFeet: '20', city: 'Faisalabad', driverName: '', mobileNumber: '0325 8220107', weightCapacity: '', updatedAt: NOV_BASE + 5 * 60_000 },
  { id: 'drv_sheet_2026_11_12', date: '', gariNumber: '', gariFeet: '', city: 'Chamrail', driverName: 'shah', mobileNumber: '3467608943', weightCapacity: '', updatedAt: NOV_BASE + 4 * 60_000 },
  { id: 'drv_sheet_2026_11_13', date: '2026-11-20', gariNumber: 'CBP 6225', gariFeet: 'H', city: 'Talaganag', driverName: 'Saqib', mobileNumber: '3025682531', weightCapacity: '', updatedAt: NOV_BASE + 3 * 60_000 },
  { id: 'drv_sheet_2026_11_14', date: '2026-11-22', gariNumber: 'LEI 4515', gariFeet: '18', city: 'Chowk azam', driverName: 'Rizwan', mobileNumber: '3023143009', weightCapacity: '9', updatedAt: NOV_BASE + 2 * 60_000 },
  { id: 'drv_sheet_2026_11_15', date: '', gariNumber: 'TAG 078', gariFeet: '16', city: 'Depalpur', driverName: 'Waseem', mobileNumber: '3060328800', weightCapacity: '15', updatedAt: NOV_BASE + 1 * 60_000 },
];

export const IMPORTED_DRIVER_SHEET_ENTRIES: DriverEntry[] = [
  ...NOVEMBER_ROWS,
  ...OCTOBER_ROWS,
  ...SEPTEMBER_ROWS,
].map((row) => ({
  id: row.id,
  date: row.date,
  time: '',
  gariNumber: row.gariNumber.toUpperCase(),
  gariFeet: row.gariFeet,
  city: row.city,
  driverName: row.driverName,
  mobileNumber: normalizePakistaniMobile(row.mobileNumber),
  weightCapacity: row.weightCapacity,
  weightUnit: 'Tons',
  status: 'Available',
  notes: '',
  updatedAt: row.updatedAt,
}));
