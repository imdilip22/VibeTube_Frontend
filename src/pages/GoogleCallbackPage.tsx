import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

/**
 * After Google OAuth2 authorization code flow the backend redirects here with:
 *   /auth/callback?user=<base64-encoded JSON { email, name }>
 *
 * We decode it, persist to localStorage via setUser, then navigate home.
 */
export const GoogleCallbackPage = () => {
  const [params] = useSearchParams();
  const { setUser } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    const errorParam = params.get("error");
    if (errorParam) {
      showNotification("Google sign-in failed. Please try again.", "error");
      navigate("/login", { replace: true });
      return;
    }

    const userParam = params.get("user");
    if (!userParam) {
      showNotification("Something went wrong with Google sign-in.", "error");
      navigate("/login", { replace: true });
      return;
    }

    try {
      const decoded = JSON.parse(atob(userParam)) as { email: string; name: string };
      setUser({ email: decoded.email, name: decoded.name });
      showNotification("Welcome to VibeTube!", "success");
      navigate("/", { replace: true });
    } catch {
      showNotification("Invalid sign-in response.", "error");
      navigate("/login", { replace: true });
    }
  }, []);

  return (
    <div
      className="min-h-dvh flex items-center justify-center"
      style={{ background: "var(--surface)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <span className="spinner" style={{ width: 32, height: 32 }} />
        <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
          Completing sign-in…
        </p>
      </div>
    </div>
  );
};
