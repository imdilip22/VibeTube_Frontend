import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../components/BottomNav";
import { ConfirmModal } from "../components/ConfirmModal";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { logoutUser } from "../service/auth.service";
import { getSubscriptionInfo, getSubscribedChannels, type SubscribedChannel } from "../service/subscription.service";
import { getVideosByChannel } from "../service/video.service";
import { LogOut, ChevronRight, Settings, History, ExternalLink, Edit2 } from "lucide-react";

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const COLORS = [
  "linear-gradient(135deg,rgba(63,255,129,0.7),#00c458)",
  "linear-gradient(135deg,rgba(255,115,83,0.8),#b02604)",
  "linear-gradient(135deg,rgba(90,200,250,0.8),#007aff)",
  "linear-gradient(135deg,rgba(255,215,0,0.8),#ff8c00)",
  "linear-gradient(135deg,rgba(199,125,255,0.8),#7b2fff)",
  "linear-gradient(135deg,rgba(255,107,157,0.8),#c9184a)",
];
const avatarGradient = (email: string) =>
  COLORS[email.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [statsLoading, setStatsLoading] = useState(true);
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [videoCount, setVideoCount] = useState<number>(0);
  const [subscriptions, setSubscriptions] = useState<SubscribedChannel[]>([]);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    setStatsLoading(true);
    Promise.all([
      getSubscriptionInfo(user.email).then((info) => setSubscriberCount(info.subscriberCount)),
      getVideosByChannel(user.email).then((r) => setVideoCount((r.data ?? []).length)),
      getSubscribedChannels().then(setSubscriptions),
    ])
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [user?.email]);

  const handleLogoutClick = () => {
    setConfirmLogout(true);
  };

  const executeLogout = async () => {
    try {
      await logoutUser();
      logout();
      showNotification("Signed out successfully", "success");
      navigate("/login");
    } catch {
      showNotification("Error signing out", "error");
    } finally {
      setConfirmLogout(false);
    }
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const handle = user?.email ? `@${user.email.split("@")[0]}` : "";
  const gradient = user?.email ? avatarGradient(user.email) : COLORS[0];
  const initial = displayName[0]?.toUpperCase() ?? "U";

  const stats = [
    { label: "Videos", value: videoCount },
    { label: "Subscribers", value: subscriberCount },
    { label: "Subscriptions", value: subscriptions.length },
  ];

  return (
    <div className="page-wrapper">

      <main className="pt-20">
        {/* ── Hero Profile Card ─────────────────────────────────────────── */}
        <div
          className="mx-4 mb-6 p-6 relative overflow-hidden"
          style={{
            background: "var(--surface-container-low)",
            borderRadius: "var(--radius-2xl)",
          }}
        >
          {/* Ambient glow from avatar color */}
          <div
            className="absolute top-0 right-0 pointer-events-none"
            style={{
              width: 200, height: 200,
              background: `radial-gradient(circle, rgba(63,255,129,0.06) 0%, transparent 70%)`,
            }}
          />

          <div className="flex items-start gap-4 relative z-10">
            {/* Avatar */}
            <div
              className="flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black"
              style={{
                background: gradient,
                color: "#005d27",
                fontFamily: "var(--font-display)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              }}
            >
              {initial}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-1">
              <h1
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
              >
                {displayName}
              </h1>
              <p
                className="text-sm font-medium mt-0.5"
                style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
              >
                {handle}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div
            className="flex gap-0 mt-5 relative z-10"
            style={{
              background: "var(--surface-container)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            {stats.map(({ label, value }, idx) => (
              <div
                key={label}
                className="flex-1 flex flex-col items-center py-3"
                style={{
                  borderRight: idx < stats.length - 1 ? "1px solid var(--surface-container-high)" : "none",
                }}
              >
                {statsLoading ? (
                  <div className="skeleton h-5 w-8 rounded" />
                ) : (
                  <p
                    className="text-lg font-bold"
                    style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
                  >
                    {formatCount(value)}
                  </p>
                )}
                <p
                  className="text-[10px] font-bold uppercase tracking-wider mt-0.5"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3 mt-4 relative z-10">
            <button
              id="view-channel-btn"
              onClick={() => navigate(`/channel/${encodeURIComponent(user?.email ?? "")}`)}
              className="btn-primary flex-1"
              style={{ fontSize: 12, padding: "9px 14px" }}
            >
              <ExternalLink size={13} />
              My Channel
            </button>
            <button
              onClick={() => showNotification("Coming soon", "success")}
              className="btn-ghost flex-1"
              style={{ fontSize: 12, padding: "9px 14px" }}
            >
              <Edit2 size={13} />
              Edit Profile
            </button>
          </div>
        </div>

        {/* ── Subscriptions Row ─────────────────────────────────────────── */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-header">Subscriptions</h2>
            <button
              onClick={() => navigate("/channels")}
              className="text-[10px] font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
              style={{ color: "var(--primary)" }}
            >
              View All
            </button>
          </div>

          {statsLoading ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 w-[58px]">
                  <div className="skeleton w-14 h-14 rounded-full" />
                  <div className="skeleton h-2.5 w-10 rounded" />
                </div>
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <p className="text-xs py-3" style={{ color: "var(--outline)" }}>
              No subscriptions yet
            </p>
          ) : (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {subscriptions.map((ch) => (
                <button
                  key={ch.email}
                  onClick={() => navigate(`/channel/${encodeURIComponent(ch.email)}`)}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 w-[58px]"
                >
                  <div
                    className="w-13 h-13 rounded-full flex items-center justify-center text-lg font-black"
                    style={{
                      width: 52, height: 52,
                      background: avatarGradient(ch.email),
                      color: "#005d27",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {ch.name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <p
                    className="text-[10px] font-semibold text-center w-14 truncate"
                    style={{ color: "var(--on-surface)" }}
                  >
                    {ch.name}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Settings List ─────────────────────────────────────────────── */}
        <div className="px-4 flex flex-col gap-1">
          {/* Account Settings */}
          <button
            onClick={() => showNotification("Coming soon", "success")}
            className="flex items-center gap-4 w-full px-4 py-4 transition-all group"
            style={{ borderRadius: "var(--radius-xl)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-container)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
              style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}
            >
              <Settings size={17} />
            </div>
            <div className="flex-1 text-left">
              <p
                className="text-sm font-semibold"
                style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
              >
                Account Settings
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--outline)" }}>
                Privacy, notifications, and security
              </p>
            </div>
            <ChevronRight size={16} style={{ color: "var(--surface-container-highest)" }} />
          </button>

          {/* Watch History */}
          <button
            onClick={() => navigate("/library")}
            className="flex items-center gap-4 w-full px-4 py-4 transition-all"
            style={{ borderRadius: "var(--radius-xl)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-container)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}
            >
              <History size={17} />
            </div>
            <div className="flex-1 text-left">
              <p
                className="text-sm font-semibold"
                style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
              >
                Watch History
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--outline)" }}>
                Your recently viewed videos
              </p>
            </div>
            <ChevronRight size={16} style={{ color: "var(--surface-container-highest)" }} />
          </button>

          {/* Sign Out */}
          <button
            id="signout-btn"
            onClick={handleLogoutClick}
            className="flex items-center gap-4 w-full px-4 py-4 mt-2 transition-all"
            style={{
              borderRadius: "var(--radius-xl)",
              border: "1px solid rgba(239,68,68,0.15)",
              background: "rgba(239,68,68,0.04)",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.04)"}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(239,68,68,0.08)", color: "#f87171" }}
            >
              <LogOut size={17} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold" style={{ color: "#f87171", fontFamily: "var(--font-display)" }}>
                Sign Out
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(248,113,113,0.5)" }}>
                Securely exit your account
              </p>
            </div>
          </button>
        </div>

        <p
          className="text-center text-[10px] pt-8 pb-2 uppercase tracking-widest"
          style={{ color: "var(--surface-container-highest)" }}
        >
          VibeTube · v1.0.0
        </p>
      </main>

      <BottomNav />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmLogout}
        title="Sign Out?"
        message="Are you sure you want to sign out of your account?"
        confirmLabel="Sign Out"
        destructive
        onConfirm={executeLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
};
