import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { loginUser, registerUser, googleSignInUser } from "../service/auth.service";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

/* ── Google Icon ─────────────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.24 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { showNotification } = useNotification();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const result = await googleSignInUser(tokenResponse.access_token);
        setUser(result.data.user);
        showNotification("Welcome to VibeTube!", "success");
        navigate("/");
      } catch (error: any) {
        showNotification(error?.response?.data?.message || "Google sign-in failed.", "error");
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => showNotification("Google sign-in was cancelled or failed.", "error"),
    flow: "implicit",
    scope: "openid email profile",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const result = await loginUser(email, password);
        setUser(result.data.user);
        showNotification("Welcome back!", "success");
        navigate("/");
      } else {
        await registerUser(email, name, password);
        showNotification("Account created! Please log in.", "success");
        setIsLogin(true);
        setName("");
        setPassword("");
      }
    } catch (error: any) {
      showNotification(error?.response?.data?.message || "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden"
      style={{ background: "var(--surface)" }}
    >
      {/* Background radial glows */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-20%", left: "50%", transform: "translateX(-50%)",
          width: 600, height: 600,
          background: "radial-gradient(circle, rgba(63,255,129,0.06) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-15%", right: "-10%",
          width: 400, height: 400,
          background: "radial-gradient(circle, rgba(255,115,83,0.05) 0%, transparent 70%)",
        }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-sm flex flex-col gap-6 px-7 py-8 page-enter"
        style={{
          background: "var(--surface-container-low)",
          borderRadius: "var(--radius-2xl)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-container))" }}
          >
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 7L2 12V2Z" fill="#005d27" />
            </svg>
          </div>
          <span
            className="text-2xl font-black tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.04em" }}
          >
            VibeTube
          </span>
        </div>

        {/* Headline */}
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
          >
            {isLogin ? "Welcome back" : "Create account"}
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--on-surface-variant)" }}
          >
            {isLogin
              ? "Sign in to your studio."
              : "Start your creative journey today."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          {/* Name — register only */}
          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: "var(--on-surface-variant)" }}
              >
                Full Name
              </label>
              <div
                className="flex items-center gap-2.5 px-3 py-3 transition-all"
                style={{
                  background: "var(--surface-container-lowest)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(72,72,71,0.3)",
                }}
                onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(63,255,129,0.3)"}
                onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(72,72,71,0.3)"}
              >
                <User size={14} style={{ color: "var(--outline)", flexShrink: 0 }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  minLength={2}
                  className="flex-1 bg-transparent text-sm"
                  style={{ color: "var(--on-surface)", fontFamily: "var(--font-body)" }}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Email Address
            </label>
            <div
              className="flex items-center gap-2.5 px-3 py-3 transition-all"
              style={{
                background: "var(--surface-container-lowest)",
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(72,72,71,0.3)",
              }}
              onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(63,255,129,0.3)"}
              onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(72,72,71,0.3)"}
            >
              <Mail size={14} style={{ color: "var(--outline)", flexShrink: 0 }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@vibetube.com"
                required
                className="flex-1 bg-transparent text-sm"
                style={{ color: "var(--on-surface)", fontFamily: "var(--font-body)" }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Password
            </label>
            <div
              className="flex items-center gap-2.5 px-3 py-3 transition-all"
              style={{
                background: "var(--surface-container-lowest)",
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(72,72,71,0.3)",
              }}
              onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(63,255,129,0.3)"}
              onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(72,72,71,0.3)"}
            >
              <Lock size={14} style={{ color: "var(--outline)", flexShrink: 0 }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="flex-1 bg-transparent text-sm"
                style={{ color: "var(--on-surface)", fontFamily: "var(--font-body)" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ color: "var(--outline)" }}
                className="hover:opacity-80 transition-opacity flex-shrink-0"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner" style={{ width: 16, height: 16 }} />
                {isLogin ? "Signing in…" : "Creating…"}
              </span>
            ) : (
              isLogin ? "Sign In" : "Create Account"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "var(--surface-container-highest)" }} />
          <span
            className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
            style={{ color: "var(--outline)" }}
          >
            Or continue with
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--surface-container-highest)" }} />
        </div>

        {/* Google button */}
        <button
          id="google-signin-btn"
          type="button"
          onClick={() => handleGoogleLogin()}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "var(--surface-container)",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(72,72,71,0.3)",
            color: "var(--on-surface)",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 600,
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-container-high)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-container)"}
        >
          {googleLoading ? (
            <span className="spinner" style={{ width: 18, height: 18 }} />
          ) : (
            <GoogleIcon />
          )}
          {googleLoading ? "Signing in…" : "Continue with Google"}
        </button>

        {/* Toggle */}
        <p
          className="text-center text-xs"
          style={{ color: "var(--on-surface-variant)" }}
        >
          {isLogin ? "New to VibeTube? " : "Already have an account? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setName(""); setPassword(""); }}
            className="font-bold transition-opacity hover:opacity-80"
            style={{ color: "var(--primary)" }}
          >
            {isLogin ? "Create Account" : "Sign In"}
          </button>
        </p>
      </div>

      {/* Footer */}
      <p
        className="text-[10px] text-center mt-8 leading-relaxed"
        style={{ color: "var(--outline)" }}
      >
        © 2025 VibeTube
      </p>
    </div>
  );
};
