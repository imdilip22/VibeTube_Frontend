import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { logoutUser } from "../service/auth.service";
import { getSubscriptionInfo, getSubscribedChannels } from "../service/subscription.service";
import { getVideosByChannel } from "../service/video.service";
import {
  LogOut, ChevronRight, Users, Video, Radio,
  Bell, Moon, Shield, HelpCircle, ExternalLink,
} from "lucide-react";

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof Users;
  label: string;
  value: string | null;
  loading: boolean;
}) => (
  <div className="flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
    <Icon size={14} className="text-violet-400 mb-0.5" />
    {loading ? (
      <div className="h-5 w-8 rounded bg-white/10 animate-pulse" />
    ) : (
      <p className="text-base font-bold text-white leading-none">{value ?? "0"}</p>
    )}
    <p className="text-[10px] text-gray-500 leading-none">{label}</p>
  </div>
);

// ─── Settings row ─────────────────────────────────────────────────────────────
const SettingsRow = ({
  icon: Icon,
  label,
  sublabel,
  onClick,
  danger,
  toggle,
  toggleValue,
  onToggle,
  badge,
}: {
  icon: typeof Users;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  danger?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: () => void;
  badge?: string;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-1 py-3 rounded-xl transition-colors text-left group ${
      danger ? "hover:bg-red-500/5" : "hover:bg-white/[0.03]"
    }`}
  >
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
        danger
          ? "bg-red-500/10 group-hover:bg-red-500/15"
          : "bg-white/[0.05] group-hover:bg-violet-500/10"
      }`}
    >
      <Icon
        size={16}
        className={danger ? "text-red-400" : "text-gray-400 group-hover:text-violet-400 transition-colors"}
      />
    </div>

    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium leading-tight ${danger ? "text-red-400" : "text-white/85"}`}>{label}</p>
      {sublabel && <p className="text-[11px] text-gray-600 mt-0.5 leading-tight">{sublabel}</p>}
    </div>

    {toggle ? (
      <div
        onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
        className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors flex-shrink-0 ${
          toggleValue ? "bg-violet-600" : "bg-white/10"
        }`}
      >
        <div
          className={`w-4.5 h-4.5 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm ${
            toggleValue ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </div>
    ) : badge ? (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 flex-shrink-0">
        {badge}
      </span>
    ) : !danger ? (
      <ChevronRight size={15} className="text-gray-700 flex-shrink-0 group-hover:text-gray-500 transition-colors" />
    ) : null}
  </button>
);

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-2">
    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-1 mb-1">{title}</p>
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] px-3 divide-y divide-white/[0.04]">
      {children}
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const [statsLoading, setStatsLoading] = useState(true);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [videoCount, setVideoCount] = useState<number | null>(null);
  const [subscriptionCount, setSubscriptionCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    setStatsLoading(true);
    Promise.all([
      getSubscriptionInfo(user.email).then((info) => {
        setSubscriberCount(info.subscriberCount);
      }),
      getVideosByChannel(user.email).then((result) => {
        setVideoCount((result.data ?? []).length);
      }),
      getSubscribedChannels().then((channels) => {
        setSubscriptionCount(channels.length);
      }),
    ])
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [user?.email]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      showNotification("Signed out successfully", "success");
      navigate("/login");
    } catch {
      showNotification("Error signing out", "error");
    }
  };

  const initial = user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U";
  const displayName = user?.name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-dvh bg-[#0a0a12] pb-24">
      <TopBar />

      <main>
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="relative">
          {/* Banner */}
          <div className="h-28 bg-gradient-to-br from-violet-900/50 via-indigo-900/40 to-[#0a0a12]" />

          {/* Avatar + name block */}
          <div className="px-4 -mt-10 pb-5">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white ring-4 ring-[#0a0a12] shadow-xl shadow-violet-900/40">
                  {initial}
                </div>
                {/* Online indicator */}
                <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#0a0a12]" />
              </div>

              {/* Name + email */}
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="text-xl font-bold text-white truncate leading-tight">{displayName}</h1>
                <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-2.5 mt-4">
              <StatCard icon={Video} label="Videos" value={videoCount !== null ? formatCount(videoCount) : null} loading={statsLoading} />
              <StatCard icon={Users} label="Subscribers" value={subscriberCount !== null ? formatCount(subscriberCount) : null} loading={statsLoading} />
              <StatCard icon={Radio} label="Subscriptions" value={subscriptionCount !== null ? formatCount(subscriptionCount) : null} loading={statsLoading} />
            </div>

            {/* My Channel CTA */}
            <button
              onClick={() => navigate(`/channel/${encodeURIComponent(user?.email ?? "")}`)}
              className="w-full mt-3 flex items-center justify-between px-4 py-3 rounded-2xl bg-violet-600/10 border border-violet-500/20 hover:bg-violet-600/15 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <ExternalLink size={14} className="text-violet-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-violet-300">View My Channel</p>
                  <p className="text-[11px] text-violet-400/60">See how others see your profile</p>
                </div>
              </div>
              <ChevronRight size={15} className="text-violet-500 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* ── Settings ──────────────────────────────────────────────────────── */}
        <div className="px-4 flex flex-col gap-4">

          <Section title="Preferences">
            <SettingsRow
              icon={Bell}
              label="Push Notifications"
              sublabel="New videos from subscriptions"
              toggle
              toggleValue={notifications}
              onToggle={() => setNotifications((v) => !v)}
            />
            <SettingsRow
              icon={Moon}
              label="Dark Mode"
              sublabel="Always on for the best experience"
              toggle
              toggleValue={darkMode}
              onToggle={() => setDarkMode((v) => !v)}
            />
          </Section>

          <Section title="Account">
            <SettingsRow
              icon={Shield}
              label="Privacy & Security"
              sublabel="Manage your data and permissions"
              onClick={() => showNotification("Coming soon", "success")}
            />
            <SettingsRow
              icon={HelpCircle}
              label="Help & Support"
              sublabel="FAQs, contact us"
              onClick={() => showNotification("Coming soon", "success")}
            />
          </Section>

          {/* Sign out */}
          <Section title="Session">
            <SettingsRow
              icon={LogOut}
              label="Sign Out"
              sublabel={user?.email ?? ""}
              onClick={handleLogout}
              danger
            />
          </Section>

          <p className="text-center text-[10px] text-gray-700 pb-2">
            VibeTube · v1.0.0
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
