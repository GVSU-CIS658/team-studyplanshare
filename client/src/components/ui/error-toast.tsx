import React, { useEffect } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type ErrorToastProps = {
  message: string | null;
  onClose: () => void;
  className?: string;
};

export function ErrorToast({
  message,
  onClose,
  className,
}: Readonly<ErrorToastProps>) {
  useEffect(() => {
    if (!message) return;

    const timer = globalThis.setTimeout(() => {
      onClose();
    }, 3500);

    return () => globalThis.clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      aria-live="polite"
      className={cn(
        "fixed inset-x-4 top-4 z-50 mx-auto flex w-full max-w-md items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-white px-5 py-4 text-base text-rose-700 shadow-lg",
        className,
      )}
      role="alert"
    >
      <p className="leading-6">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="p-1 transition-colors rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-700"
        aria-label="Close error message"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
