import { useState, useEffect, useMemo, useCallback } from "react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { VideoCard } from "../components/VideoCard";
import {
  getSubscribedChannels,
  getSubscriptionsFeed,
  type SubscribedChannel,
} from "../service/subscription.service";
import { useNotification } from "../context/NotificationContext";

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

export const ChannelsPage = () => {
  const { showNotification } = useNotification();

  const [subscribedChannels, setSubscribedChannels] = useState<SubscribedChannel[]>([]);
  const [allSubscribedVideos, setAllSubscribedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [channels, feed] = await Promise.all([
        getSubscribedChannels().catch(() => []),
        getSubscriptionsFeed().catch(() => []),
      ]);
      setSubscribedChannels(channels);
      setAllSubscribedVideos(feed);
    } catch {
      showNotification("Failed to load your subscriptions", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredVideos = useMemo(() => {
    if (!selectedEmail) return allSubscribedVideos;
    return allSubscribedVideos.filter((v) => v.createdBy === selectedEmail);
  }, [allSubscribedVideos, selectedEmail]);

  const handleChannelClick = (email: string) => {
    setSelectedEmail(prev => prev === email ? null : email);
  };

  return (
    <div className="min-h-dvh bg-[#0e0e0e] pb-28">
      <TopBar />

      <main className="pt-20 px-4 max-w-7xl mx-auto">

        {/* ── Channel Selector Bar ─────────────────────────── */}
        <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide pt-2">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-14 h-14 rounded-full bg-[#1a1a1a] animate-pulse" />
            ))
          ) : (
            subscribedChannels.map((ch) => {
              const isActive = selectedEmail === ch.email;
              return (
                <button
                  key={ch.email}
                  onClick={() => handleChannelClick(ch.email)}
                  className="flex-shrink-0 flex flex-col items-center gap-2 group w-[64px] cursor-pointer"
                >
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${avatarColor(ch.email)} flex items-center justify-center text-[#0e0e0e] text-xl font-black transition-all ring-offset-2 ring-offset-[#0e0e0e] ${
                    isActive ? "ring-2 ring-[#3fff81] scale-110 shadow-[0_4px_20px_rgba(63,255,129,0.4)]" : "opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0"
                  }`}>
                    {ch.name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span className={`text-[10px] w-full text-center truncate px-1 transition-colors ${
                    isActive ? "text-[#3fff81] font-bold" : "text-[#767575] font-medium"
                  }`}>
                    {ch.name}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* ── Video Grid ────────────────────────────────────────────────── */}
        <section>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="aspect-video w-full rounded-xl bg-[#1a1a1a] animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-[#1a1a1a] animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-[#1a1a1a] animate-pulse" />
                </div>
              ))}
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="text-sm text-[#767575] font-semibold">
                {subscribedChannels.length === 0
                  ? "Subscribe to creators to see their videos here"
                  : "No videos for this creator"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
              {filteredVideos.map((v: any) => (
                <VideoCard
                  key={v.id}
                  id={v.id}
                  title={v.title}
                  uploaderName={v.uploader?.name ?? "Unknown"}
                  channelEmail={v.createdBy}
                  thumbnailPath={v.thumbnailPath}
                  uploadedAt={v.createdAt}
                  views={v.views ?? 0}
                  likes={v.likes ?? 0}
                  variant="large"
                  isLiveArchive={v.isLiveArchive}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
};
