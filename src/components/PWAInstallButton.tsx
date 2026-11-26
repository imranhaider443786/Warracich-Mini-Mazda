import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { TRANSLATIONS } from '../i18n';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../types';

interface PWAInstallButtonProps {
  lang: Language;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const t = TRANSLATIONS[lang];

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900 transition-colors hover:bg-blue-100 whitespace-nowrap"
      >
        <Download className="h-3.5 w-3.5" />
        {t.installApp}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap"
        >
          <Download className="h-3.5 w-3.5" />
          {t.installIOS}
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 className="text-base font-semibold text-slate-900">
                {t.installIOS}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {lang === 'ur'
                  ? '1. سفاری براؤزر میں Share بٹن دبائیں۔ 2. نیچے اسکرول کر کے "Add to Home Screen" منتخب کریں۔'
                  : '1. Tap the Share button in Safari toolbar. 2. Scroll down and tap "Add to Home Screen".'}
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
