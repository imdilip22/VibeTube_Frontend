import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { VideoCard } from "../components/VideoCard";
import {
  getSubscriptionsFeed,
  getSubscribedChannels,
  unsubscribeFromChannel,
} from "../service/subscription.service";
import type { SubscribedChannel } from "../service/subscription.service";
import { useNotification } from "../context/NotificationContext";
import { Users, UserMinus } from "lucide-react";

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

export const SubscriptionsPage = () => {
  const [channels, setChannels] = useState<SubscribedChannel[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsubscribing, setUnsubscribing] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [ch, vids] = await Promise.all([
        getSubscribedChannels(),
        getSubscriptionsFeed(),
      ]);
      setChannels(ch);
      setVideos(vids);
    } catch (error) {
      console.log("SubscriptionsPage load error", error);
      showNotification("Failed to load subscriptions", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUnsubscribe = async (channelEmail: string, channelName: string) => {
    setUnsubscribing(channelEmail);
    try {
      await unsubscribeFromChannel(channelEmail);
      // Remove the channel and filter out their videos from local state
      setChannels((prev) => prev.filter((c) => c.email !== channelEmail));
      setVideos((prev) => prev.filter((v) => v.createdBy !== channelEmail));
      showNotification(`Unsubscribed from ${channelName}`, "success");
    } catch {
      showNotification("Failed to unsubscribe", "error");
    } finally {
      setUnsubscribing(null);
    }
  };

  const isEmpty = !loading && channels.length === 0;

  return (
    <div className="min-h-dvh bg-[#0a0a12] pb-20">
      <TopBar />

      <main className="pt-4">
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="px-4 mb-4">
          <h1 className="text-xl font-bold text-white">Subscriptions</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {loading ? "Loading..." : `${channels.length} channel${channels.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* ── Loading spinner ───────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
              <Users size={28} className="text-violet-400" />
            </div>
            <p className="text-base font-semibold text-white">No subscriptions yet</p>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              When you subscribe to a channel, their new videos will appear here.
            </p>
          </div>
        )}

        {!loading && channels.length > 0 && (
          <>
            {/* ── Channels strip ─────────────────────────────────────────────── */}
            <div className="mb-5">
              <div className="px-4 mb-3">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Channels</h2>
              </div>

              <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
                {channels.map((ch) => (
                  <div
                    key={ch.email}
                    className="flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/5 w-[110px]"
                  >
                    {/* Avatar */}
                    <button
                      onClick={() => navigate(`/channel/${encodeURIComponent(ch.email)}`)}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 hover:opacity-80 transition-opacity"
                    >
                      {ch.name[0]?.toUpperCase() ?? "?"}
                    </button>

                    {/* Name */}
                    <button
                      onClick={() => navigate(`/channel/${encodeURIComponent(ch.email)}`)}
                      className="text-xs font-medium text-white text-center line-clamp-1 w-full hover:text-violet-300 transition-colors"
                    >
                      {ch.name}
                    </button>

                    {/* Subscriber count */}
                    <p className="text-[10px] text-gray-500 text-center">
                      {formatCount(ch.subscriberCount)} subs
                    </p>

                    {/* Unsubscribe button */}
                    <button
                      onClick={() => handleUnsubscribe(ch.email, ch.name)}
                      disabled={unsubscribing === ch.email}
                      className="flex items-center justify-center gap-1 w-full py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-gray-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all disabled:opacity-50"
                    >
                      {unsubscribing === ch.email ? (
                        <span className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
                      ) : (
                        <>
                          <UserMinus size={10} />
                          Unsubscribe
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Divider ───────────────────────────────────────────────────── */}
            <div className="h-px bg-white/5 mx-4 mb-5" />

            {/* ── Latest videos ──────────────────────────────────────────────── */}
            <div className="px-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Latest Videos</h2>

              {videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-gray-500">No videos yet</p>
                  <p className="text-xs text-gray-600 mt-1">
                    The channels you follow haven't posted anything yet.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {videos.map((v: any) => (
                    <VideoCard
                      key={v.id}
                      id={v.id}
                      title={v.title}
                      uploaderName={v.uploader?.name ?? "Unknown"}
                      channelEmail={v.createdBy}
                      thumbnailPath={v.thumbnailPath}
                      uploadedAt={v.createdAt}
                      variant="large"
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
