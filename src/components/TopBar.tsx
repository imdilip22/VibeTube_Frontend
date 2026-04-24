import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Upload, Bell, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const TopBar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "V";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setMobileSearchOpen(false);
      setQuery("");
    }
  };

  useEffect(() => {
    if (mobileSearchOpen) mobileInputRef.current?.focus();
  }, [mobileSearchOpen]);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center h-16"
      style={{
        background: "var(--surface-container-low)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Logo area — always 240px on desktop, auto on mobile ───────── */}
      <div className="flex items-center flex-shrink-0 pl-4 lg:pl-5" style={{ width: "240px" }}>
        {/* Mobile: only show logo when search is closed */}
        <Link
          to="/"
          className={`flex items-center gap-2 select-none lg:flex ${mobileSearchOpen ? "hidden" : "flex"}`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)" }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 7L2 12V2Z" fill="#005d27" />
            </svg>
          </div>
          <span
            className="text-lg font-black tracking-tight"
            style={{ color: "var(--primary)", letterSpacing: "-0.04em" }}
          >
            VibeTube
          </span>
        </Link>
      </div>

      {/* ── Desktop center search ─────────────────────────────────────── */}
      <form
        onSubmit={handleSearch}
        className="hidden lg:flex flex-1 max-w-lg items-center mx-4"
      >
        <div
          className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-full transition-all"
          style={{ background: "var(--surface-container)" }}
        >
          <Search size={14} strokeWidth={1.8} style={{ color: "var(--outline)", flexShrink: 0 }} />
          <input
            ref={desktopInputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Explore videos…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--on-surface)", fontFamily: "var(--font-body)" }}
            onFocus={e => {
              const p = e.currentTarget.parentElement as HTMLElement;
              p.style.background = "var(--surface-container-high)";
              p.style.boxShadow = "0 0 0 1.5px rgba(63,255,129,0.3)";
            }}
            onBlur={e => {
              const p = e.currentTarget.parentElement as HTMLElement;
              p.style.background = "var(--surface-container)";
              p.style.boxShadow = "none";
            }}
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} tabIndex={-1}>
              <X size={13} style={{ color: "var(--outline)" }} />
            </button>
          )}
        </div>
      </form>

      {/* ── Mobile search overlay (replaces topbar content) ──────────── */}
      {mobileSearchOpen && (
        <form
          onSubmit={handleSearch}
          className="lg:hidden flex items-center gap-2 flex-1 pr-3"
        >
          <div
            className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-full"
            style={{
              background: "var(--surface-container-high)",
              boxShadow: "0 0 0 1.5px rgba(63,255,129,0.3)",
            }}
          >
            <Search size={14} style={{ color: "var(--outline)" }} />
            <input
              ref={mobileInputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search videos…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--on-surface)", fontFamily: "var(--font-body)" }}
            />
          </div>
          <button
            type="button"
            onClick={() => { setMobileSearchOpen(false); setQuery(""); }}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <X size={16} />
          </button>
        </form>
      )}

      {/* ── Right icons ──────────────────────────────────────────────── */}
      <div className={`flex items-center gap-0.5 ml-auto pr-3 lg:pr-4 ${mobileSearchOpen ? "hidden" : "flex"} lg:flex`}>
        {/* Mobile search toggle */}
        <button
          onClick={() => setMobileSearchOpen(true)}
          className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ color: "var(--on-surface-variant)" }}
          aria-label="Search"
        >
          <Search size={18} strokeWidth={1.8} />
        </button>

        {/* Upload */}
        <button
          id="topbar-upload-btn"
          onClick={() => navigate("/upload")}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ color: "var(--on-surface-variant)" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "var(--surface-container)";
            (e.currentTarget as HTMLElement).style.color = "var(--on-surface)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--on-surface-variant)";
          }}
          aria-label="Upload"
        >
          <Upload size={18} strokeWidth={1.8} />
        </button>

        {/* Notifications */}
        <button
          id="topbar-notifications-btn"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ color: "var(--on-surface-variant)" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "var(--surface-container)";
            (e.currentTarget as HTMLElement).style.color = "var(--on-surface)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--on-surface-variant)";
          }}
          aria-label="Notifications"
        >
          <Bell size={18} strokeWidth={1.8} />
        </button>

        {/* Avatar */}
        <button
          id="topbar-avatar-btn"
          onClick={() => navigate("/profile")}
          className="avatar w-8 h-8 ml-1 hover:opacity-85 active:scale-95 transition-all"
          style={{ fontSize: 11 }}
          aria-label="Profile"
        >
          {initials}
        </button>
      </div>
    </nav>
  );
};
