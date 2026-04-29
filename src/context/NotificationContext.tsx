import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

type NotificationType = "success" | "error" | "info";

type Notification = {
  id: number;
  type: NotificationType;
  message: string;
};

type NotificationContextValue = {
  showNotification: (message: string, type?: NotificationType) => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

let nextId = 0;
const DURATION = 3000; // ms

/* ── Per-toast component ─────────────────────────────────────────────────── */
const Toast = ({
  n,
  onDismiss,
}: {
  n: Notification;
  onDismiss: (id: number) => void;
}) => {
  const [exiting, setExiting] = useState(false);
  const [paused, setPaused] = useState(false);
  const elapsed = useRef(0);
  const startTime = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setExiting(true);
    setTimeout(() => onDismiss(n.id), 320);
  }, [n.id, onDismiss]);

  // Schedule auto-dismiss
  const schedule = useCallback((remaining: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    startTime.current = Date.now();
    timerRef.current = setTimeout(dismiss, remaining);
  }, [dismiss]);

  useEffect(() => {
    schedule(DURATION);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [schedule]);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    elapsed.current += Date.now() - startTime.current;
    setPaused(true);
  };

  const handleMouseLeave = () => {
    const remaining = Math.max(0, DURATION - elapsed.current);
    setPaused(false);
    schedule(remaining);
  };

  const cfg = {
    success: {
      icon: <CheckCircle size={18} />,
      accent: "#3fff81",
      glow: "rgba(63,255,129,0.12)",
      bar: "linear-gradient(90deg, #3fff81, #00ee70)",
      iconColor: "#3fff81",
    },
    error: {
      icon: <XCircle size={18} />,
      accent: "#ff716c",
      glow: "rgba(255,113,108,0.12)",
      bar: "linear-gradient(90deg, #ff716c, #ff4a44)",
      iconColor: "#ff716c",
    },
    info: {
      icon: <Info size={18} />,
      accent: "#7c8aff",
      glow: "rgba(124,138,255,0.12)",
      bar: "linear-gradient(90deg, #7c8aff, #5c6bff)",
      iconColor: "#7c8aff",
    },
  }[n.type];

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "stretch",
        minWidth: 300,
        maxWidth: 380,
        borderRadius: 16,
        overflow: "hidden",
        background: "rgba(18,18,18,0.92)",
        backdropFilter: "blur(24px) saturate(1.5)",
        WebkitBackdropFilter: "blur(24px) saturate(1.5)",
        border: `1px solid rgba(255,255,255,0.07)`,
        boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03), inset 0 0 32px ${cfg.glow}`,
        animation: exiting
          ? "toastOut 0.32s cubic-bezier(0.4,0,1,1) both"
          : "toastIn 0.38s cubic-bezier(0.16,1,0.3,1) both",
        cursor: "default",
      }}
    >
      {/* Left accent stripe */}
      <div style={{
        width: 4,
        flexShrink: 0,
        background: cfg.bar,
        borderRadius: "16px 0 0 16px",
      }} />

      {/* Body */}
      <div style={{ flex: 1, padding: "14px 12px 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Top row: icon + message + close */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ color: cfg.iconColor, flexShrink: 0, marginTop: 1, filter: `drop-shadow(0 0 6px ${cfg.accent}66)` }}>
            {cfg.icon}
          </span>
          <p style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.45,
            color: "#ffffff",
            fontFamily: "var(--font-body)",
            letterSpacing: "0.01em",
          }}>
            {n.message}
          </p>
          <button
            onClick={dismiss}
            style={{
              flexShrink: 0,
              background: "none",
              border: "none",
              padding: "2px 2px",
              color: "rgba(255,255,255,0.3)",
              cursor: "pointer",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              transition: "color 0.15s",
              marginTop: -2,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{
          height: 3,
          borderRadius: 99,
          background: "rgba(255,255,255,0.07)",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            borderRadius: 99,
            background: cfg.bar,
            boxShadow: `0 0 8px ${cfg.accent}80`,
            transformOrigin: "left center",
            animation: `toastProgress ${DURATION}ms linear forwards`,
            animationPlayState: paused ? "paused" : "running",
          }} />
        </div>
      </div>
    </div>
  );
};

/* ── Provider ─────────────────────────────────────────────────────────────── */
export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismiss = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback((message: string, type: NotificationType = "info") => {
    const id = nextId++;
    setNotifications((prev) => [...prev, { id, type, message }]);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}

      {/* Toast stack */}
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: "fixed",
          top: 76,      /* just below TopBar (h-16 = 64px + 12px gap) */
          right: 16,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          alignItems: "flex-end",
          pointerEvents: "none",
        }}
      >
        {notifications.map((n) => (
          <div key={n.id} style={{ pointerEvents: "auto" }}>
            <Toast n={n} onDismiss={dismiss} />
          </div>
        ))}
      </div>

      {/* Keyframes injected once */}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(110%) scale(0.92); }
          to   { opacity: 1; transform: translateX(0)   scale(1); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0) scale(1); max-height: 120px; margin-bottom: 0; }
          to   { opacity: 0; transform: translateX(110%) scale(0.92); max-height: 0; margin-bottom: -10px; }
        }
        @keyframes toastProgress {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
};
