import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { loginUser, registerUser, googleSignInUser } from "../service/auth.service";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

/* ── VIBETUBE wordmark — solid green ────────────────────────────────────── */
const VibeTubeLogo = () => (
  <span className="font-extrabold text-xl tracking-tight select-none text-green-500">
    VIBETUBE
  </span>
);

/* ── Google coloured G ──────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { showNotification } = useNotification();

  /* ── Google OAuth ──────────────────────────────────────────────────────── */
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const result = await googleSignInUser(tokenResponse.access_token);
        setUser(result.data.user);
        showNotification("Welcome to VibeTube!", "success");
        navigate("/");
      } catch (error: any) {
        const msg = error?.response?.data?.message || "Google sign-in failed.";
        showNotification(msg, "error");
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => showNotification("Google sign-in was cancelled or failed.", "error"),
    flow: "implicit",
    scope: "openid email profile",
  });

  /* ── Email / password submit ───────────────────────────────────────────── */
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
      const msg = error?.response?.data?.message || "Something went wrong.";
      showNotification(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* ── Page wrapper — very light grey bg ────────────────────────────────── */
    <div className="min-h-dvh bg-[#f2f2f7] flex flex-col items-center justify-between px-5 py-8">

      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-black/10 px-7 py-8 flex flex-col gap-5 mt-auto mb-auto">

        {/* Logo */}
        <VibeTubeLogo />

        {/* Headline */}
        <div className="mb-1">
          <h1 className="text-[26px] font-extrabold text-gray-900 leading-tight">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-[13px] text-gray-400 mt-1">
            {isLogin
              ? "Enter your credentials to access your studio."
              : "Start your creative journey today."}
          </p>
        </div>

        {/* ── Form ───────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Name — register only */}
          {!isLogin && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Full Name
              </label>
              <div className="flex items-center gap-2 bg-[#f5f5f7] rounded-xl px-3 py-3 border border-transparent focus-within:border-green-400 transition-all">
                <span className="text-gray-400">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" /></svg>
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  minLength={2}
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Email Address
            </label>
            <div className="flex items-center gap-2 bg-[#f5f5f7] rounded-xl px-3 py-3 border border-transparent focus-within:border-green-400 transition-all">
              <Mail size={15} className="text-gray-400 flex-shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@vibetube.com"
                required
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Password
              </label>
              {isLogin && (
                <button
                  type="button"
                  className="text-[11px] font-bold text-green-500 hover:text-green-400 uppercase tracking-widest transition-colors"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 bg-[#f5f5f7] rounded-xl px-3 py-3 border border-transparent focus-within:border-green-400 transition-all">
              <Lock size={15} className="text-gray-400 flex-shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          {isLogin && (
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                  rememberMe
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300 group-hover:border-green-400"
                }`}
              >
                {rememberMe && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-[13px] text-gray-500">Remember this device</span>
            </label>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-green-500 hover:bg-green-400 active:bg-green-600 text-white font-bold text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30 mt-1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {isLogin ? "Signing in…" : "Creating account…"}
              </span>
            ) : (
              isLogin ? "Sign In" : "Create Account"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[11px] text-gray-400 font-medium uppercase tracking-widest whitespace-nowrap">
            Or continue with
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google button */}
        <button
          type="button"
          onClick={() => handleGoogleLogin()}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {googleLoading ? (
            <span className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          <span className="text-sm font-semibold text-gray-700">
            {googleLoading ? "Signing in…" : "Google Account"}
          </span>
        </button>

        {/* Toggle sign in / register */}
        <p className="text-center text-[13px] text-gray-400 mt-1">
          {isLogin ? "New to VibeTube? " : "Already have an account? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setName(""); setPassword(""); }}
            className="text-green-500 font-bold hover:text-green-400 transition-colors"
          >
            {isLogin ? "Create Account" : "Sign In"}
          </button>
        </p>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-gray-400 text-center mt-6 leading-relaxed">
        © 2024 VIBETUBE CINEMATIC VANGUARD UI
        <br />• ALL RIGHTS RESERVED
      </p>
    </div>
  );
};
