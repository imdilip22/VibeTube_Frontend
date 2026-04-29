import { createContext, useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { logoutUser } from "../service/auth.service";
import { getProfile } from "../service/profile.service";
import { useNotification } from "./NotificationContext";
import { UPLOAD_BASE } from "../enums";

export type AuthUser = {
  email: string;
  name: string;
  /** Full URL to the avatar image, or null if none set */
  avatar: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  /** Exposed so login and Google callback can populate display info. */
  setUser: (user: { email: string; name: string } | null) => void;
  logout: () => Promise<void>;
  /** Refresh avatar from backend — call after EditProfilePage saves */
  refreshAvatar: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const { showNotification } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();

  // On every mount (including page refresh), try to load the profile via
  // the existing httpOnly cookie. If the request succeeds the user is logged in;
  // if it fails (401 / network) we stay null.
  // skipRefresh:true prevents the interceptor from triggering its refresh+redirect
  // dance when this probe 401s (e.g. on the login page before any login).
  useEffect(() => {
    getProfile({ skipRefresh: true })
      .then((p) => {
        setUserState({
          email: p.email,
          name: p.name,
          avatar: p.avatar ? `${UPLOAD_BASE}/profiles/${p.avatar}` : null,
        });
      })
      .catch(() => {
        // Not logged in or network error — leave user as null
      });
  }, []); // runs once on mount

  const setUser = (u: { email: string; name: string } | null) => {
    if (!u) {
      setUserState(null);
      return;
    }
    // Set name/email immediately, then fetch avatar in the background
    setUserState({ email: u.email, name: u.name, avatar: null });
    getProfile({ skipRefresh: true })
      .then((p) => {
        setUserState((prev) =>
          prev
            ? {
                ...prev,
                avatar: p.avatar ? `${UPLOAD_BASE}/profiles/${p.avatar}` : null,
              }
            : prev
        );
      })
      .catch(() => {});
  };

  const refreshAvatar = async () => {
    try {
      const p = await getProfile();
      setUserState((prev) =>
        prev
          ? {
              ...prev,
              name: p.name,
              avatar: p.avatar ? `${UPLOAD_BASE}/profiles/${p.avatar}` : null,
            }
          : prev
      );
    } catch {}
  };

  // Handle session_expired redirect from axios interceptor
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
    <AuthContext.Provider value={{ user, setUser, logout, refreshAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
