import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  HelpCircle,
} from 'lucide-react';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Show Toast
  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Show Confirm (returns Promise<boolean>)
  const showConfirm = useCallback(
    ({
      title = 'Konfirmasi Tindakan',
      message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
      confirmText = 'Lanjutkan',
      cancelText = 'Batal',
      isDanger = false,
    } = {}) => {
      return new Promise((resolve) => {
        setConfirmDialog({
          title,
          message,
          confirmText,
          cancelText,
          isDanger,
          resolve: (val) => {
            setConfirmDialog(null);
            resolve(val);
          },
        });
      });
    },
    []
  );

  // Convenience toast shortcuts
  const toast = {
    success: (msg, dur) => showToast(msg, 'success', dur),
    error: (msg, dur) => showToast(msg, 'error', dur),
    info: (msg, dur) => showToast(msg, 'info', dur),
    warning: (msg, dur) => showToast(msg, 'warning', dur),
  };

  // Close confirm on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && confirmDialog) {
        confirmDialog.resolve(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmDialog]);

  return (
    <AlertContext.Provider value={{ showToast, toast, showConfirm }}>
      {children}

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  FLOATING TOASTS (TOP RIGHT)                               */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="fixed top-5 right-4 left-4 sm:left-auto sm:right-6 z-[10000] flex flex-col items-end gap-2.5 pointer-events-none sm:w-[400px] max-w-full">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto w-full flex items-start justify-between gap-3 p-4 rounded-2xl bg-white/95 backdrop-blur-md border shadow-xl transition-all duration-300 animate-in slide-in-from-top-2 sm:slide-in-from-right-4 fade-in ${
                isSuccess
                  ? 'border-emerald-200/90 shadow-emerald-900/5'
                  : isError
                  ? 'border-rose-200/90 shadow-rose-900/5'
                  : isWarning
                  ? 'border-amber-200/90 shadow-amber-900/5'
                  : 'border-[#E2E2D8] shadow-neutral-900/5'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    isSuccess
                      ? 'bg-emerald-50 text-emerald-600'
                      : isError
                      ? 'bg-rose-50 text-rose-600'
                      : isWarning
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {isSuccess && <CheckCircle2 className="w-5 h-5" />}
                  {isError && <AlertCircle className="w-5 h-5" />}
                  {isWarning && <AlertTriangle className="w-5 h-5" />}
                  {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5" />}
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-0.5">
                    {isSuccess ? 'Berhasil' : isError ? 'Pemberitahuan' : isWarning ? 'Peringatan' : 'Informasi'}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-neutral-800 leading-snug break-words">
                    {t.message}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer shrink-0 ml-1"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  CONFIRMATION DIALOG MODAL                                */}
      {/* ══════════════════════════════════════════════════════════ */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[10001] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl border border-[#EAEAE3] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  confirmDialog.isDanger
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-amber-50 text-amber-600 border border-amber-200'
                }`}
              >
                {confirmDialog.isDanger ? (
                  <AlertCircle className="w-6 h-6" />
                ) : (
                  <HelpCircle className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#F0F0EB]">
              <button
                type="button"
                onClick={() => confirmDialog.resolve(false)}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-2xl min-h-[44px] transition-colors cursor-pointer"
              >
                {confirmDialog.cancelText || 'Batal'}
              </button>
              <button
                type="button"
                onClick={() => confirmDialog.resolve(true)}
                className={`px-6 py-2.5 text-xs sm:text-sm font-bold text-white rounded-2xl min-h-[44px] transition-all cursor-pointer shadow-sm ${
                  confirmDialog.isDanger
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-neutral-900 hover:bg-neutral-800'
                }`}
              >
                {confirmDialog.confirmText || 'Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
