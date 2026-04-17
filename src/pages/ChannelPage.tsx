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

  const channelName = videos[0]?.uploader?.name ?? channelEmail.split("@")[0];
  const isOwnChannel = user?.email === channelEmail;

  // Initial load — videos + sub info
  const load = useCallback(async () => {
    if (!channelEmail) return;
    try {
      setLoading(true);
      const [videosResult, info] = await Promise.all([
        getVideosByChannel(channelEmail, "latest"),
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

  return (
    <div className="min-h-dvh bg-[#0e0e0e] pb-28">
      <TopBar />

      <main className="pt-16">

        {/* ── Banner ──────────────────────────────────────────────────────── */}
        <div className="relative h-36 w-full overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${channelEmail ? avatarColor(channelEmail) : "from-[#1a1a1a] to-[#111]"} opacity-25`} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/60 to-transparent" />
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 cursor-pointer flex items-center gap-1.5 text-[11px] font-bold text-[#767575] hover:text-white transition-colors uppercase tracking-widest"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>

        {/* ── Profile Row ─────────────────────────────────────────────────── */}
        <div className="px-5 -mt-10 relative z-10">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${channelEmail ? avatarColor(channelEmail) : "from-[#1a1a1a] to-[#111]"} flex items-center justify-center text-[#0e0e0e] text-3xl font-black ring-4 ring-[#0e0e0e] shadow-xl`}>
            {channelName[0]?.toUpperCase() ?? "?"}
          </div>

          {/* Name + stats + subscribe */}
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">{channelName}</h1>
              <p className="text-[11px] text-[#767575] font-semibold mt-0.5 uppercase tracking-widest">
                {subInfo != null ? `${formatCount(subInfo.subscriberCount)} subscribers` : "—"} · {videos.length} videos
              </p>
            </div>

            {!isOwnChannel && (
              <button
                onClick={handleSubscribeToggle}
                disabled={subLoading}
                className={`cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all disabled:opacity-60 ${
                  subInfo?.isSubscribed
                    ? "bg-[#1a1a1a] text-[#767575] border border-[#262626] hover:border-red-500/40 hover:text-red-400"
                    : "bg-[#3fff81] text-[#0e0e0e] hover:bg-[#2de070] shadow-[0_4px_20px_rgba(63,255,129,0.3)]"
                }`}
              >
                {subLoading ? (
                  <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : subInfo?.isSubscribed ? (
                  <><BellOff size={14} /> Subscribed</>
                ) : (
                  <><Bell size={14} /> Subscribe</>
                )}
              </button>
            )}
          </div>
        </div>



        {/* ── Video Grid ──────────────────────────────────────────────────── */}
        <section className="px-5 mt-8">
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
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] flex items-center justify-center mb-4">
                <VideoOff size={24} className="text-[#767575]" />
              </div>
              <p className="text-sm text-[#767575] font-semibold">No videos yet</p>
              <p className="text-xs text-[#4a4a4a] mt-1">
                {isOwnChannel ? "Upload your first video to get started." : "This channel hasn't posted anything yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
              {videos.map((v: any) => (
                <VideoCard
                  key={v.id}
                  id={v.id}
                  title={v.title}
                  uploaderName={v.uploader?.name ?? channelName}
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
