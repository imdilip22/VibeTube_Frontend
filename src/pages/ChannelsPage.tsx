import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { getAllChannels, type Channel } from "../service/channels.service";
import {
  getSubscribedChannels,
  subscribeToChannel,
  unsubscribeFromChannel,
} from "../service/subscription.service";
import { useNotification } from "../context/NotificationContext";
import {
  Search, Users, Video, Bell, BellOff,
  TrendingUp, ArrowUpDown, Sparkles,
} from "lucide-react";

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

type SortKey = "subscribers" | "videos" | "newest";

const SORT_OPTIONS: { key: SortKey; label: string; icon: typeof TrendingUp }[] = [
  { key: "subscribers", label: "Top", icon: TrendingUp },
  { key: "videos", label: "Most Active", icon: Video },
  { key: "newest", label: "Newest", icon: Sparkles },
];

const AVATAR_GRADIENTS = [
  "from-violet-500 to-indigo-600",
  "from-pink-500 to-rose-600",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-600",
  "from-sky-400 to-blue-600",
  "from-fuchsia-500 to-purple-700",
];

const getGradient = (email: string) =>
  AVATAR_GRADIENTS[
    email.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
      AVATAR_GRADIENTS.length
  ];

export const ChannelsPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [subscribedEmails, setSubscribedEmails] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("subscribers");
  const [subLoading, setSubLoading] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [all, subscribed] = await Promise.all([
          getAllChannels(),
          getSubscribedChannels().catch(() => []),
        ]);
        setChannels(all);
        setSubscribedEmails(new Set(subscribed.map((c) => c.email)));
      } catch {
        showNotification("Failed to load channels", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubscribeToggle = async (
    e: React.MouseEvent,
    channelEmail: string,
    channelName: string
  ) => {
    e.stopPropagation();
    if (subLoading === channelEmail) return;
    setSubLoading(channelEmail);
    try {
      const isSubscribed = subscribedEmails.has(channelEmail);
      if (isSubscribed) {
        await unsubscribeFromChannel(channelEmail);
        setSubscribedEmails((prev) => {
          const next = new Set(prev);
          next.delete(channelEmail);
          return next;
        });
        // Optimistically reduce count
        setChannels((prev) =>
          prev.map((c) =>
            c.email === channelEmail
              ? { ...c, subscriberCount: Math.max(0, c.subscriberCount - 1) }
              : c
          )
        );
        showNotification(`Unsubscribed from ${channelName}`, "success");
      } else {
        await subscribeToChannel(channelEmail);
        setSubscribedEmails((prev) => new Set([...prev, channelEmail]));
        setChannels((prev) =>
          prev.map((c) =>
            c.email === channelEmail
              ? { ...c, subscriberCount: c.subscriberCount + 1 }
              : c
          )
        );
        showNotification(`Subscribed to ${channelName}!`, "success");
      }
    } catch {
      showNotification("Failed to update subscription", "error");
    } finally {
      setSubLoading(null);
    }
  };

  const displayed = useMemo(() => {
    let list = [...channels];

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortKey === "subscribers") {
      list.sort((a, b) => b.subscriberCount - a.subscriberCount);
    } else if (sortKey === "videos") {
      list.sort((a, b) => b.videoCount - a.videoCount);
    } else {
      list.sort(
        (a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
      );
    }

    return list;
  }, [channels, searchQuery, sortKey]);

  const subscribedList = useMemo(
    () => channels.filter((c) => subscribedEmails.has(c.email)),
    [channels, subscribedEmails]
  );

  return (
    <div className="min-h-dvh bg-[#0a0a12] pb-24">
      <TopBar />

      <main className="pt-4 px-4">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-white">Channels</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {loading ? "Loading…" : `${channels.length} creator${channels.length !== 1 ? "s" : ""} on VibeTube`}
          </p>
        </div>

        {/* ── Subscribed strip ─────────────────────────────────────────────── */}
        {!loading && subscribedList.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Your Subscriptions
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {subscribedList.map((ch) => (
                <button
                  key={ch.email}
                  onClick={() =>
                    navigate(`/channel/${encodeURIComponent(ch.email)}`)
                  }
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGradient(ch.email)} flex items-center justify-center text-white font-bold text-lg ring-2 ring-violet-500/30 group-hover:ring-violet-400/60 transition-all`}
                  >
                    {ch.name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors max-w-[56px] truncate">
                    {ch.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Search bar ───────────────────────────────────────────────────── */}
        <div className="relative mb-4">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search channels…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06] transition-all"
          />
        </div>

        {/* ── Sort tabs ────────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-5">
          {SORT_OPTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSortKey(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sortKey === key
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                  : "bg-white/[0.04] text-gray-500 hover:text-gray-300 border border-white/5"
              }`}
            >
              <Icon size={11} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Loading ──────────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-[76px] rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {!loading && displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <Users size={28} className="text-violet-400" />
            </div>
            <p className="text-sm font-semibold text-white">
              {searchQuery ? "No channels found" : "No other creators yet"}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {searchQuery
                ? "Try a different name or email"
                : "Be the first to upload a video!"}
            </p>
          </div>
        )}

        {/* ── Channel list ─────────────────────────────────────────────────── */}
        {!loading && displayed.length > 0 && (
          <div className="flex flex-col gap-2">
            {displayed.map((ch) => {
              const isSubscribed = subscribedEmails.has(ch.email);
              const isLoadingThis = subLoading === ch.email;
              const gradient = getGradient(ch.email);

              return (
                <div
                  key={ch.email}
                  onClick={() =>
                    navigate(`/channel/${encodeURIComponent(ch.email)}`)
                  }
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.025] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer group"
                >
                  {/* Avatar */}
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg`}
                  >
                    {ch.name[0]?.toUpperCase() ?? "?"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-violet-200 transition-colors truncate">
                      {ch.name}
                    </p>
                    <p className="text-[10px] text-gray-600 truncate">
                      {ch.email}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Users size={9} />
                        {formatCount(ch.subscriberCount)} subs
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Video size={9} />
                        {ch.videoCount} video{ch.videoCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Subscribe button */}
                  <button
                    onClick={(e) =>
                      handleSubscribeToggle(e, ch.email, ch.name)
                    }
                    disabled={isLoadingThis}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all disabled:opacity-60 ${
                      isSubscribed
                        ? "bg-white/[0.06] text-gray-400 hover:bg-red-500/10 hover:text-red-400 border border-white/8"
                        : "bg-violet-600/90 text-white hover:bg-violet-500 shadow-md shadow-violet-600/25"
                    }`}
                  >
                    {isLoadingThis ? (
                      <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    ) : isSubscribed ? (
                      <>
                        <BellOff size={11} />
                        <span className="hidden sm:inline">Subscribed</span>
                      </>
                    ) : (
                      <>
                        <Bell size={11} />
                        <span className="hidden sm:inline">Subscribe</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
