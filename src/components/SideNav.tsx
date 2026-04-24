import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Radio, Library, History, Upload,
  User, LogOut, PlayCircle, Settings,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ConfirmModal } from "./ConfirmModal";

const NAV_SECTIONS = [
  {
    items: [
      { to: "/", icon: Home, label: "Home" },
      { to: "/subscriptions", icon: PlayCircle, label: "Subscriptions" },
      { to: "/live", icon: Radio, label: "Live" },
      { to: "/library", icon: Library, label: "Library" },
    ],
  },
];

export const SideNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const isActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    const [path, search] = to.split("?");

    if (!location.pathname.startsWith(path)) return false;

    if (search) {
      return location.search.includes(search);
    }

    if (path === "/library" && location.search.includes("tab=history")) {
      return false;
    }

    return true;
  };

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "V";

  return (
    <>
      <aside
        className="hidden lg:flex flex-col fixed left-0 z-40 select-none"
        style={{
          width: "240px",
          top: "64px",           /* below TopBar */
          height: "calc(100vh - 64px)",
          background: "var(--surface-container-low)",
          borderRight: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {/* ── App subtitle ─────────────────────────────────────────────────── */}
        <div className="px-5 pt-4 pb-3 flex-shrink-0">
          <p
            className="text-[9px] font-black uppercase tracking-[0.18em]"
            style={{ color: "var(--outline)" }}
          >
            VibeTube
          </p>
        </div>

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
          {NAV_SECTIONS[0].items.map(({ to, icon: Icon, label }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: active ? "rgba(63,255,129,0.1)" : "transparent",
                  color: active ? "var(--primary)" : "var(--on-surface-variant)",
                  fontFamily: "var(--font-body)",
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface-container)";
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <Icon
                  size={17}
                  strokeWidth={active ? 2.2 : 1.8}
                  style={{ color: active ? "var(--primary)" : "var(--on-surface-variant)", flexShrink: 0 }}
                />
                {label}
                {active && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: "var(--primary)" }}
                  />
                )}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-3" style={{ height: 1, background: "rgba(255,255,255,0.04)" }} />

          {/* Create section */}
          <p
            className="text-[9px] font-black uppercase tracking-[0.18em] px-3 pb-1.5 pt-1"
            style={{ color: "var(--outline)" }}
          >
            Create
          </p>
          <Link
            to="/upload"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              color: isActive("/upload") ? "var(--primary)" : "var(--on-surface-variant)",
              background: isActive("/upload") ? "rgba(63,255,129,0.1)" : "transparent",
              fontFamily: "var(--font-body)",
            }}
            onMouseEnter={e => {
              if (!isActive("/upload")) (e.currentTarget as HTMLElement).style.background = "var(--surface-container)";
            }}
            onMouseLeave={e => {
              if (!isActive("/upload")) (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <Upload size={17} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            Upload
          </Link>
          <Link
            to="/live/go"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              color: isActive("/live/go") ? "var(--secondary)" : "var(--on-surface-variant)",
              background: isActive("/live/go") ? "rgba(255,115,83,0.1)" : "transparent",
              fontFamily: "var(--font-body)",
            }}
            onMouseEnter={e => {
              if (!isActive("/live/go")) (e.currentTarget as HTMLElement).style.background = "var(--surface-container)";
            }}
            onMouseLeave={e => {
              if (!isActive("/live/go")) (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <Radio size={17} strokeWidth={1.8} style={{ flexShrink: 0, color: "var(--secondary)" }} />
            Go Live
          </Link>
        </nav>

        {/* ── User footer ──────────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 px-3 py-3 space-y-1"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Settings (placeholder) */}
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all text-left"
            style={{ color: "var(--outline)", fontFamily: "var(--font-body)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "var(--surface-container)";
              (e.currentTarget as HTMLElement).style.color = "var(--on-surface-variant)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--outline)";
            }}
          >
            <Settings size={15} strokeWidth={1.8} />
            Settings
          </button>

          {/* Profile link */}
          <Link
            to="/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all"
            style={{ fontFamily: "var(--font-body)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-container)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
          >
            <div className="avatar w-7 h-7 flex-shrink-0" style={{ fontSize: 10 }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "var(--on-surface)" }}>
                {user?.name ?? "My Account"}
              </p>
              <p className="text-[9px] truncate" style={{ color: "var(--outline)" }}>
                {user?.email ?? ""}
              </p>
            </div>
            <User size={13} style={{ color: "var(--outline)", flexShrink: 0 }} />
          </Link>

          {/* Sign Out */}
          <button
            onClick={() => setShowConfirmLogout(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all text-left"
            style={{ color: "var(--outline)", fontFamily: "var(--font-body)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,115,83,0.08)";
              (e.currentTarget as HTMLElement).style.color = "var(--secondary)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--outline)";
            }}
          >
            <LogOut size={15} strokeWidth={1.8} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Sign-out confirm ─────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={showConfirmLogout}
        title="Sign out?"
        message="You'll need to sign back in to access VibeTube."
        confirmLabel="Sign Out"
        cancelLabel="Stay"
        destructive
        onConfirm={() => { logout(); navigate("/login"); }}
        onCancel={() => setShowConfirmLogout(false)}
      />
    </>
  );
};
