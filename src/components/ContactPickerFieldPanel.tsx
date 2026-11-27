import React, { useEffect, useMemo, useState } from 'react';
import { BookUser, CheckCircle2, Search, Smartphone, User, X } from 'lucide-react';
import { TRANSLATIONS } from '../i18n';
import {
  DirectoryContact,
  normalizeContactPhone,
  supportsNativeContactPicker,
} from '../services/contacts';
import { Language } from '../types';

interface ContactPickerFieldPanelProps {
  lang: Language;
  contacts: DirectoryContact[];
  currentName: string;
  currentPhone: string;
  onSelectContact: (name: string, phone: string) => void;
  onNotify?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

interface NativeSelectedContact {
  name?: string[];
  tel?: string[];
}

export const ContactPickerFieldPanel: React.FC<ContactPickerFieldPanelProps> = ({
  lang,
  contacts,
  currentName,
  currentPhone,
  onSelectContact,
  onNotify,
}) => {
  const t = TRANSLATIONS[lang];
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [linkedByContact, setLinkedByContact] = useState(false);

  const hasNativeContacts = useMemo(() => supportsNativeContactPicker(), []);

  useEffect(() => {
    if (!directoryOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDirectoryOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [directoryOpen]);

  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      `${c.name} ${c.phone} ${c.context}`.toLowerCase().includes(q)
    );
  }, [contacts, query]);

  const handleOpenPhoneContacts = async () => {
    if (!hasNativeContacts) {
      onNotify?.(t.phoneContactsUnavailable, 'info');
      setDirectoryOpen(true);
      return;
    }

    try {
      const nav = navigator as Navigator & {
        contacts?: {
          select: (
            props: string[],
            opts?: { multiple?: boolean }
          ) => Promise<NativeSelectedContact[]>;
        };
      };
      const picked = await nav.contacts?.select(['name', 'tel'], { multiple: false });
      if (!picked || picked.length === 0) return;

      const first = picked[0];
      const rawPhone = (first.tel && first.tel[0]) || '';
      const rawName = (first.name && first.name[0]) || '';
      const normalizedPhone = normalizeContactPhone(rawPhone);
      const cleanName = rawName.trim();

      if (normalizedPhone || cleanName) {
        onSelectContact(cleanName, normalizedPhone);
        setLinkedByContact(true);
        onNotify?.(t.contactSelectedNotice, 'success');
      }
    } catch (err: unknown) {
      const errName =
        typeof err === 'object' && err !== null && 'name' in err
          ? String((err as { name?: unknown }).name)
          : '';
      if (errName === 'AbortError') return;
      onNotify?.(t.phoneContactsUnavailable, 'info');
      setDirectoryOpen(true);
    }
  };

  const handlePickDirectoryContact = (contact: DirectoryContact) => {
    onSelectContact(contact.name, contact.phone);
    setLinkedByContact(true);
    setDirectoryOpen(false);
    setQuery('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {hasNativeContacts && (
          <button
            type="button"
            onClick={handleOpenPhoneContacts}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-900 transition-colors hover:bg-blue-100 whitespace-nowrap sm:flex-initial"
          >
            <Smartphone className="h-4 w-4 shrink-0" />
            <span>{t.pickFromPhoneContacts}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setDirectoryOpen(true)}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 whitespace-nowrap sm:flex-initial"
        >
          <BookUser className="h-4 w-4 shrink-0 text-blue-900" />
          <span>
            {t.pickFromDirectory}
            {contacts.length > 0 ? ` (${contacts.length})` : ''}
          </span>
        </button>
      </div>

      {(linkedByContact || currentName.trim()) && currentPhone.trim() && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-950">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
          <span className="min-w-0 truncate">
            {t.contactLinkedNameHint}:{' '}
            <strong className="font-bold">{currentName.trim() || '—'}</strong>
          </span>
        </div>
      )}

      {directoryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px]"
            onClick={() => setDirectoryOpen(false)}
          />
          <div className="relative z-10 flex max-h-[82dvh] w-full flex-col rounded-t-3xl border border-slate-200 bg-white shadow-2xl pb-safe md:max-w-lg md:rounded-2xl">
            <div className="flex justify-center pt-2.5 pb-1 md:hidden">
              <span className="h-1.5 w-10 rounded-full bg-slate-300" aria-hidden="true" />
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <h3 className="min-w-0 truncate text-sm font-bold text-slate-900">
                {t.contactsDirectoryTitle}
              </h3>
              <button
                type="button"
                onClick={() => setDirectoryOpen(false)}
                aria-label={t.cancel}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-slate-100 px-4 py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-3 start-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.contactsSearchPlaceholder}
                  className="h-10 w-full rounded-xl border border-slate-300 bg-slate-50 py-2 ps-9 pe-3 text-sm text-slate-900 focus:border-blue-800 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredContacts.length === 0 ? (
                <div className="px-4 py-10 text-center text-xs text-slate-500">
                  {t.noContactsFound}
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <button
                    key={contact.key}
                    type="button"
                    onClick={() => handlePickDirectoryContact(contact)}
                    className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-3 text-start transition-colors hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <User className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {contact.name || t.unnamedContact}
                        </div>
                        {contact.context && (
                          <div className="truncate text-xs text-slate-500">
                            {contact.context}
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      dir="ltr"
                      className="shrink-0 font-mono text-xs font-semibold text-blue-900 tabular-nums"
                    >
                      {contact.phone}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
