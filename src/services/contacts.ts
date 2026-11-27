import { normalizePakistaniMobile } from '../data/importedDriverSheets';
import { BiltyRecord, DriverEntry, OrderEntry } from '../types';

export interface DirectoryContact {
  key: string;
  name: string;
  phone: string;
  context: string;
}

export function normalizeContactPhone(rawPhone: string): string {
  return normalizePakistaniMobile(rawPhone);
}

function phoneFingerprint(phone: string): string {
  const normalized = normalizeContactPhone(phone);
  return normalized.replace(/\D/g, '');
}

export function buildSavedContactsDirectory(
  drivers: DriverEntry[],
  orders: OrderEntry[],
  bilties: BiltyRecord[]
): DirectoryContact[] {
  const byPhone = new Map<string, DirectoryContact>();

  const upsert = (rawName: string, rawPhone: string, contextParts: string[]) => {
    const phone = normalizeContactPhone(rawPhone);
    const fp = phoneFingerprint(phone);
    if (!fp) return;

    const name = rawName.trim();
    const context = contextParts.map((p) => p.trim()).filter(Boolean).join(' · ');
    const existing = byPhone.get(fp);

    if (!existing) {
      byPhone.set(fp, {
        key: fp,
        name,
        phone,
        context,
      });
      return;
    }

    if (!existing.name && name) {
      existing.name = name;
    }
    if (!existing.context && context) {
      existing.context = context;
    }
  };

  for (const d of drivers) {
    upsert(d.driverName, d.mobileNumber, [d.gariNumber, d.city]);
  }

  for (const o of orders) {
    upsert(o.customerName, o.mobileNumber, [o.goodsType, o.dropoffLocation || o.pickupLocation]);
  }

  for (const b of bilties) {
    upsert(b.driverName, b.driverPhone, [b.gariNumber, b.toCity]);
    upsert(b.senderName, b.senderPhone, [b.fromCity]);
    upsert(b.receiverName, b.receiverPhone, [b.toCity]);
  }

  return Array.from(byPhone.values()).sort((a, b) => {
    if (a.name && !b.name) return -1;
    if (!a.name && b.name) return 1;
    if (a.name && b.name) {
      const cmp = a.name.localeCompare(b.name);
      if (cmp !== 0) return cmp;
    }
    return a.phone.localeCompare(b.phone);
  });
}

export function supportsNativeContactPicker(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & {
    contacts?: { select?: (...args: unknown[]) => Promise<unknown[]> };
  };
  return typeof nav.contacts?.select === 'function';
}
