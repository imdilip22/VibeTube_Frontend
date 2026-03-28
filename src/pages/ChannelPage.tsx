import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { VideoCard } from "../components/VideoCard";
import { getVideosByChannel } from "../service/video.service";
import { getSubscriptionInfo, subscribeToChannel, unsubscribeFromChannel } from "../service/subscription.service";
import type { SubscriptionInfo } from "../service/subscription.service";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { Bell, BellOff, ArrowLeft, VideoOff } from "lucide-react";

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

export const ChannelPage = () => {
  const { email } = useParams<{ email: string }>();
  const channelEmail = decodeURIComponent(email ?? "");
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [videos, setVideos] = useState<any[]>([]);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);

  // Derive channel name from the first video's uploader (or fall back to email username)
  const channelName = videos[0]?.uploader?.name ?? channelEmail.split("@")[0];

  const load = useCallback(async () => {
    if (!channelEmail) return;
    try {
      setLoading(true);
      const [videosResult, info] = await Promise.all([
        getVideosByChannel(channelEmail),
        getSubscriptionInfo(channelEmail),
      ]);
      setVideos(videosResult.data ?? []);
      setSubInfo(info);
    } catch {
      showNotification("Failed to load channel", "error");
    } finally {
      setLoading(false);
    }
  }, [channelEmail]);

  useEffect(() => { load(); }, [load]);

  const handleSubscribeToggle = async () => {
    if (!channelEmail || subLoading) return;
    setSubLoading(true);
    try {
      const updated = subInfo?.isSubscribed
        ? await unsubscribeFromChannel(channelEmail)
        : await subscribeToChannel(channelEmail);
      setSubInfo(updated);
      showNotification(updated.isSubscribed ? "Subscribed!" : "Unsubscribed", "success");
    } catch {
      showNotification("Failed to update subscription", "error");
    } finally {
      setSubLoading(false);
    }
  };

  const isOwnChannel = user?.email === channelEmail;

  return (
    <div className="min-h-dvh bg-[#0a0a12] pb-20">
      <TopBar />

      <main>
        {/* ── Back button ───────────────────────────────────────────────────── */}
        <div className="px-4 pt-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>

        {/* ── Loading ───────────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-32">
            <span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* ── Channel header ────────────────────────────────────────────── */}
            <div className="px-4 pt-4 pb-5">
              {/* Banner-style gradient strip */}
              <div className="h-24 rounded-2xl bg-gradient-to-br from-violet-900/40 via-indigo-900/30 to-transparent border border-white/5 mb-4" />

              <div className="flex items-end gap-4 -mt-10 px-2">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ring-4 ring-[#0a0a12]">
                  {channelName[0]?.toUpperCase() ?? "?"}
                </div>

                <div className="flex-1 min-w-0 pb-1">
                  <h1 className="text-lg font-bold text-white truncate">{channelName}</h1>
                  <p className="text-xs text-gray-500 truncate">{channelEmail}</p>
                </div>
              </div>

              {/* Stats row + subscribe */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-base font-bold text-white">{videos.length}</p>
                    <p className="text-[10px] text-gray-500">Videos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-white">
                      {subInfo != null ? formatCount(subInfo.subscriberCount) : "—"}
                    </p>
                    <p className="text-[10px] text-gray-500">Subscribers</p>
                  </div>
                </div>

                {/* Subscribe button — hidden on own channel */}
                {!isOwnChannel && (
                  <button
                    onClick={handleSubscribeToggle}
                    disabled={subLoading}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-60 ${
                      subInfo?.isSubscribed
                        ? "bg-white/10 text-gray-300 hover:bg-white/15"
                        : "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-500/20"
                    }`}
                  >
                    {subLoading ? (
                      <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    ) : subInfo?.isSubscribed ? (
                      <>
                        <BellOff size={14} />
                        Subscribed
                      </>
                    ) : (
                      <>
                        <Bell size={14} />
                        Subscribe
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* ── Divider ───────────────────────────────────────────────────── */}
            <div className="h-px bg-white/5 mx-4 mb-5" />

            {/* ── Videos ───────────────────────────────────────────────────── */}
            <div className="px-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Videos</h2>

              {videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
                    <VideoOff size={24} className="text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-500">No videos yet</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {isOwnChannel ? "Upload your first video to get started." : "This channel hasn't posted anything yet."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {videos.map((v: any) => (
                    <VideoCard
                      key={v.id}
                      id={v.id}
                      title={v.title}
                      uploaderName={v.uploader?.name ?? channelName}
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
