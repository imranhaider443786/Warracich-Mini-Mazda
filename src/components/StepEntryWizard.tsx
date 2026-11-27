import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Pencil,
  SkipForward,
  X,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n';
import { Language } from '../types';

export interface WizardOption {
  value: string;
  label: string;
}

export interface WizardStepConfig {
  key: string;
  label: string;
  type: 'text' | 'tel' | 'number' | 'date' | 'select' | 'textarea';
  placeholder?: string;
  presets?: WizardOption[];
  selectOptions?: WizardOption[];
  helperText?: string;
  /** Optional custom panel rendered under the input (e.g., Kiraya calculator or Driver quick-picker) */
  renderExtra?: (
    values: Record<string, string>,
    setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
  ) => React.ReactNode;
  formatReviewValue?: (val: string, values: Record<string, string>) => string;
}

interface StepEntryWizardProps {
  title: string;
  steps: WizardStepConfig[];
  initialValues: Record<string, string>;
  lang: Language;
  saveButtonLabel?: string;
  onCancel: () => void;
  onSave: (values: Record<string, string>) => void;
}

export const StepEntryWizard: React.FC<StepEntryWizardProps> = ({
  title,
  steps,
  initialValues,
  lang,
  saveButtonLabel,
  onCancel,
  onSave,
}) => {
  const t = TRANSLATIONS[lang];
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [inReview, setInReview] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(
    null
  );

  const activeStep = steps[stepIndex];
  const progressPct = inReview
    ? 100
    : Math.round(((stepIndex + 1) / steps.length) * 100);

  useEffect(() => {
    if (!inReview && inputRef.current) {
      inputRef.current.focus();
    }
  }, [stepIndex, inReview]);

  const goNext = () => {
    if (stepIndex + 1 < steps.length) {
      setStepIndex((prev) => prev + 1);
    } else {
      setInReview(true);
    }
  };

  const handleSkip = () => {
    if (!activeStep) return;
    setValues((prev) => ({ ...prev, [activeStep.key]: '' }));
    goNext();
  };

  const handleBack = () => {
    if (inReview) {
      setInReview(false);
      setStepIndex(steps.length - 1);
      return;
    }
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && activeStep?.type !== 'textarea') {
      e.preventDefault();
      goNext();
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6">
      {/* Header & Progress Bar */}
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">{title}</h2>
            <p className="mt-0.5 font-mono text-xs font-medium text-slate-500">
              {inReview
                ? t.wizardReviewTitle
                : t.wizardStepOf
                    .replace('{current}', String(stepIndex + 1))
                    .replace('{total}', String(steps.length))}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 whitespace-nowrap"
          >
            <X className="h-3.5 w-3.5" />
            <span>{t.wizardCancel}</span>
          </button>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-blue-900 transition-all duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Step Input Body OR Final Review Screen */}
      {!inReview && activeStep ? (
        <div className="py-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-base font-bold text-slate-900">
              {activeStep.label}
            </label>
            <span className="text-xs font-medium text-slate-500">
              {t.wizardOptionalHint}
            </span>
          </div>

          <div className="mt-4">
            {activeStep.type === 'select' && activeStep.selectOptions ? (
              <select
                ref={(el) => {
                  inputRef.current = el;
                }}
                value={values[activeStep.key] ?? ''}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [activeStep.key]: e.target.value,
                  }))
                }
                onKeyDown={handleKeyDown}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-900 focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/15"
              >
                <option value="">—</option>
                {activeStep.selectOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : activeStep.type === 'textarea' ? (
              <textarea
                ref={(el) => {
                  inputRef.current = el;
                }}
                rows={3}
                value={values[activeStep.key] ?? ''}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [activeStep.key]: e.target.value,
                  }))
                }
                placeholder={activeStep.placeholder}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/15"
              />
            ) : (
              <input
                ref={(el) => {
                  inputRef.current = el;
                }}
                type={activeStep.type}
                step={activeStep.type === 'number' ? 'any' : undefined}
                value={values[activeStep.key] ?? ''}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [activeStep.key]: e.target.value,
                  }))
                }
                onKeyDown={handleKeyDown}
                placeholder={activeStep.placeholder}
                className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base font-medium text-slate-900 focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/15 ${
                  activeStep.type === 'number' ||
                  activeStep.type === 'tel' ||
                  activeStep.type === 'date'
                    ? 'font-mono tabular-nums'
                    : ''
                }`}
              />
            )}
          </div>

          {/* Optional Preset Quick-Select Buttons */}
          {activeStep.presets && activeStep.presets.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {activeStep.presets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() =>
                    setValues((prev) => ({
                      ...prev,
                      [activeStep.key]: preset.value,
                    }))
                  }
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    values[activeStep.key] === preset.value
                      ? 'border-blue-900 bg-blue-50 text-blue-900'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          {activeStep.helperText && (
            <p className="mt-2.5 text-xs text-slate-500">{activeStep.helperText}</p>
          )}

          {activeStep.renderExtra && (
            <div className="mt-4">{activeStep.renderExtra(values, setValues)}</div>
          )}

          {/* Wizard Navigation Footer */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 sm:mt-8 sm:gap-3 sm:pt-5">
            <button
              type="button"
              disabled={stepIndex === 0}
              onClick={handleBack}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 sm:px-4"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              <span>{t.wizardBack}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:px-4"
              >
                <SkipForward className="h-4 w-4" />
                <span>{t.wizardSkip}</span>
              </button>

              <button
                type="button"
                onClick={goNext}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 sm:px-5"
              >
                <span>{t.wizardNext}</span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Final Review Screen */
        <div className="py-5">
          <p className="mb-4 text-xs text-slate-600">{t.wizardReviewSub}</p>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {steps.map((step, idx) => {
              const rawVal = values[step.key] ?? '';
              const displayVal = step.formatReviewValue
                ? step.formatReviewValue(rawVal, values)
                : rawVal;
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => {
                    setStepIndex(idx);
                    setInReview(false);
                  }}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-start transition-colors hover:bg-slate-50"
                >
                  <span className="text-xs font-semibold text-slate-600">
                    {idx + 1}. {step.label}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        displayVal ? 'text-slate-900' : 'italic text-slate-400'
                      }`}
                    >
                      {displayVal || t.wizardSkippedValue}
                    </span>
                    <Pencil className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              <span>{t.wizardBack}</span>
            </button>

            <button
              type="button"
              onClick={() => onSave(values)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 sm:px-6"
            >
              <Check className="h-4 w-4" />
              <span>{saveButtonLabel || t.wizardSaveFinal}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
