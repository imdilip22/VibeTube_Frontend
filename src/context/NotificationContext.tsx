import { createContext, useContext, useState, useCallback } from "react";

type NotificationType = "success" | "error" | "info";

type Notification = {
  id: number;
  type: NotificationType;
  message: string;
};

type NotificationContextValue = {
  notifications: Notification[];
  showNotification: (message: string, type?: NotificationType) => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

let nextId = 0;

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, type: NotificationType = "info") => {
    const id = nextId++;
    setNotifications((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, showNotification }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`
              pointer-events-auto px-5 py-3 rounded-xl text-sm font-medium shadow-lg
              backdrop-blur-lg border border-white/10
              animate-[slideIn_0.3s_ease-out]
              ${n.type === "success" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : ""}
              ${n.type === "error" ? "bg-red-500/20 text-red-300 border-red-500/30" : ""}
              ${n.type === "info" ? "bg-violet-500/20 text-violet-300 border-violet-500/30" : ""}
            `}
          >
            {n.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
};
