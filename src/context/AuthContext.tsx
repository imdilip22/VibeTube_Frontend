import { createContext, useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { logoutUser } from "../service/auth.service";
import { useNotification } from "./NotificationContext";

type AuthUser = {
  email: string;
  name: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  // setUser is exposed so login and Google callback can populate display info.
  // It has NO effect on whether the user can access routes — that's the backend's job.
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Pure in-memory state — only used for displaying name/avatar in the UI.
  // Auth is enforced by the backend returning 401 and the axios interceptor redirecting.
  const [user, setUserState] = useState<AuthUser | null>(null);
  const { showNotification } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();

  const setUser = (u: AuthUser | null) => setUserState(u);

  // Handle session_expired redirect coming from the axios interceptor
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("reason") === "session_expired") {
      setUserState(null);
      showNotification("Session expired. Please sign in again.", "error");
      navigate("/login", { replace: true });
    }
  }, []);

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // best-effort
    } finally {
      setUserState(null);
      navigate("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
