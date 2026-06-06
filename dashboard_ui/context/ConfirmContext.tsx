"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ModalOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "default" | "info";
  hideCancel?: boolean;
}

interface ModalState extends ModalOptions {
  resolve: (value: boolean) => void;
}

interface ToastItem {
  id: number;
  title: string;
  message: string;
}

interface ConfirmContextValue {
  confirm: (opts: ModalOptions) => Promise<boolean>;
  notify: (title: string, message: string) => Promise<void>;
  toast: (title: string, message: string) => void;
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

const TOAST_DURATION = 4000;

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const confirm = (opts: ModalOptions): Promise<boolean> =>
    new Promise((resolve) => setState({ ...opts, resolve }));

  const notify = (title: string, message: string): Promise<void> =>
    new Promise((resolve) =>
      setState({
        title,
        message,
        confirmLabel: "OK",
        hideCancel: true,
        resolve: () => resolve(),
      })
    );

  const toast = (title: string, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_DURATION);
  };

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm, notify, toast }}>
      {children}

      {/* Blocking modal */}
      {state && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={state.hideCancel ? handleConfirm : handleCancel}
          />
          <div className="border border-gray-400 relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {state.title}
              </h2>
              <hr className="text-gray-300 mt-1.5 mb-2!" />
              <p className="text-sm text-gray-500 mt-1">{state.message}</p>
            </div>
            <div className="flex justify-end gap-2">
              {!state.hideCancel && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-150 cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm font-semibold rounded-lg text-white transition-all duration-150 cursor-pointer ${
                  state.variant === "danger"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-[#d22624] hover:bg-[#2a1311]"
                }`}
              >
                {state.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Non-blocking toasts */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 w-72 flex flex-col gap-0.5 animate-fade-in"
          >
            <p className="text-sm font-semibold text-gray-800">{t.title}</p>
            <p className="text-xs text-gray-500">{t.message}</p>
          </div>
        ))}
      </div>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
