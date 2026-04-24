import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Red/coral styling for destructive actions like Delete */
  destructive?: boolean;
}

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmModalProps) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button when modal opens (accessibility)
  useEffect(() => {
    if (isOpen) cancelRef.current?.focus();
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      {/* Modal panel */}
      <div
        className="w-full max-w-sm relative"
        style={{
          background: "var(--surface-container)",
          borderRadius: "var(--radius-2xl)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          animation: "slideUp 0.22s var(--ease-out) both",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
          style={{ color: "var(--outline)" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-container-high)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
          aria-label="Close"
        >
          <X size={15} />
        </button>

        {/* Content */}
        <div className="px-6 pt-6 pb-5">
          {/* Icon */}
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: destructive ? "rgba(255,115,83,0.12)" : "rgba(63,255,129,0.08)",
            }}
          >
            <AlertTriangle
              size={20}
              style={{ color: destructive ? "var(--secondary)" : "var(--primary)" }}
            />
          </div>

          <h2
            id="confirm-modal-title"
            className="text-base font-bold mb-2"
            style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
          >
            {title}
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-body)" }}
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-3 px-6 pb-5"
        >
          {/* Cancel (default focus) */}
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "var(--surface-container-high)",
              color: "var(--on-surface-variant)",
              fontFamily: "var(--font-body)",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-container-highest)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-container-high)"}
          >
            {cancelLabel}
          </button>

          {/* Confirm */}
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: destructive
                ? "var(--secondary)"
                : "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
              color: destructive ? "var(--on-secondary)" : "var(--on-primary)",
              fontFamily: "var(--font-display)",
              boxShadow: destructive
                ? "0 4px 20px rgba(255,115,83,0.25)"
                : "0 4px 20px rgba(63,255,129,0.2)",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.9"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
