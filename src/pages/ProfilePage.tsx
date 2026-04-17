import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
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
  "from-[#3fff81] to-[#00c458]",
  "from-[#ff7353] to-[#b02604]",
  "from-[#5ac8fa] to-[#007aff]",
  "from-[#ffd700] to-[#ff8c00]",
  "from-[#c77dff] to-[#7b2fff]",
  "from-[#ff6b9d] to-[#c9184a]",
];
const avatarColor = (email: string) =>
  COLORS[email.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [statsLoading, setStatsLoading] = useState(true);
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [videoCount, setVideoCount] = useState<number>(0);
  const [subscriptions, setSubscriptions] = useState<SubscribedChannel[]>([]);

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

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const handle = user?.email ? `@${user.email.split("@")[0]}` : "";
  const myColor = user?.email ? avatarColor(user.email) : "from-[#3fff81] to-[#00c458]";
  const initial = displayName[0]?.toUpperCase() ?? "U";

  return (
    <div className="min-h-dvh bg-[#0e0e0e] pb-28">
      <TopBar />

      <main className="pt-20">

        {/* ── Profile Card ────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center px-6 pt-4 pb-6">
          {/* Avatar */}
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${myColor} flex items-center justify-center text-[#0e0e0e] text-4xl font-black ring-4 ring-[#1a1a1a] shadow-2xl`}>
            {initial}
          </div>

          {/* Name + handle */}
          <h1 className="mt-4 text-2xl font-black text-white tracking-tight">{displayName}</h1>
          <p className="text-sm text-[#3fff81] font-semibold mt-0.5">{handle}</p>

          {/* Stats */}
          <div className="flex gap-6 mt-5">
            {[
              { label: "Videos",      value: videoCount },
              { label: "Subscribers", value: subscriberCount },
              { label: "Subscriptions", value: subscriptions.length },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center">
                {statsLoading ? (
                  <div className="h-6 w-10 rounded bg-[#1a1a1a] animate-pulse" />
                ) : (
                  <p className="text-xl font-black text-white">{formatCount(value)}</p>
                )}
                <p className="text-[10px] text-[#767575] font-bold uppercase tracking-widest mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3 w-full mt-5">
            <button
              onClick={() => navigate(`/channel/${encodeURIComponent(user?.email ?? "")}`)}
              className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#3fff81] text-[#0e0e0e] text-xs font-black uppercase tracking-widest hover:bg-[#2de070] transition-all shadow-[0_4px_20px_rgba(63,255,129,0.25)]"
            >
              <ExternalLink size={14} />
              View My Channel
            </button>
            <button
              onClick={() => showNotification("Coming soon", "success")}
              className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full border border-[#262626] text-[#767575] text-xs font-black uppercase tracking-widest hover:border-[#3fff81]/40 hover:text-[#3fff81] transition-all"
            >
              <Edit2 size={14} />
              Edit Profile
            </button>
          </div>
        </div>

        {/* ── Subscriptions Row ───────────────────────────────────────────── */}
        <div className="px-5 mb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Subscriptions</h2>
            <button
              onClick={() => navigate("/channels")}
              className="cursor-pointer text-[10px] font-black text-[#3fff81] uppercase tracking-widest hover:opacity-80"
            >
              View All
            </button>
          </div>

          {statsLoading ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 w-[60px]">
                  <div className="w-14 h-14 rounded-full bg-[#1a1a1a] animate-pulse" />
                  <div className="h-2.5 w-10 rounded bg-[#1a1a1a] animate-pulse" />
                </div>
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <p className="text-xs text-[#767575] py-4">No subscriptions yet</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {subscriptions.map((ch) => (
                <button
                  key={ch.email}
                  onClick={() => navigate(`/channel/${encodeURIComponent(ch.email)}`)}
                  className="cursor-pointer flex-shrink-0 flex flex-col items-center gap-2 w-[60px]"
                >
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${avatarColor(ch.email)} flex items-center justify-center text-[#0e0e0e] text-xl font-black`}>
                    {ch.name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-semibold text-white truncate w-14">{ch.name}</p>
                    <p className="text-[9px] text-[#767575]">{formatCount(ch.subscriberCount)} Subs</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Settings List ───────────────────────────────────────────────── */}
        <div className="px-5 mt-4 flex flex-col gap-0.5">

          {/* Account Settings */}
          <button
            onClick={() => showNotification("Coming soon", "success")}
            className="cursor-pointer flex items-center gap-4 w-full px-4 py-4 rounded-2xl hover:bg-[#1a1a1a] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] group-hover:bg-[#222] flex items-center justify-center text-[#767575] group-hover:text-[#3fff81] transition-colors flex-shrink-0">
              <Settings size={18} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-white">Account Settings</p>
              <p className="text-[11px] text-[#767575] mt-0.5">Privacy, notifications, and security</p>
            </div>
            <ChevronRight size={16} className="text-[#3a3a3a] group-hover:text-[#767575] transition-colors" />
          </button>

          {/* Watch History */}
          <button
            onClick={() => navigate("/library")}
            className="cursor-pointer flex items-center gap-4 w-full px-4 py-4 rounded-2xl hover:bg-[#1a1a1a] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] group-hover:bg-[#222] flex items-center justify-center text-[#767575] group-hover:text-[#3fff81] transition-colors flex-shrink-0">
              <History size={18} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-white">Watch History</p>
              <p className="text-[11px] text-[#767575] mt-0.5">Your recently viewed videos</p>
            </div>
            <ChevronRight size={16} className="text-[#3a3a3a] group-hover:text-[#767575] transition-colors" />
          </button>

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            className="cursor-pointer flex items-center gap-4 w-full px-4 py-4 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all group mt-2"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 group-hover:bg-red-500/15 flex items-center justify-center text-red-400 flex-shrink-0">
              <LogOut size={18} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-red-400">Sign Out</p>
              <p className="text-[11px] text-red-400/50 mt-0.5">Securely exit your account</p>
            </div>
          </button>

        </div>

        <p className="text-center text-[10px] text-[#3a3a3a] font-semibold pt-8 pb-2 uppercase tracking-widest">
          VibeTube · v1.0.0
        </p>
      </main>

      <BottomNav />
    </div>
  );
};
