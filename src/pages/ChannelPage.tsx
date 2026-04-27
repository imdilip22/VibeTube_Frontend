import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BottomNav } from "../components/BottomNav";
import { ConfirmModal } from "../components/ConfirmModal";
import { VideoCard } from "../components/VideoCard";
import { getVideosByChannel, deleteVideo } from "../service/video.service";
import { getSubscriptionInfo, subscribeToChannel, unsubscribeFromChannel } from "../service/subscription.service";
import type { SubscriptionInfo } from "../service/subscription.service";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { Bell, BellOff, ArrowLeft, VideoOff, Play, Radio, Trash2 } from "lucide-react";

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

const TABS = ["Videos", "About"] as const;

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
  const [activeTab, setActiveTab] = useState<"Videos" | "About">("Videos");
  const [confirmUnsubscribe, setConfirmUnsubscribe] = useState(false);
  // Delete video state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const channelName = videos[0]?.uploader?.name ?? channelEmail.split("@")[0];
  const isOwnChannel = user?.email === channelEmail;
  const gradient = channelEmail ? avatarGradient(channelEmail) : "linear-gradient(135deg,#1a1a1a,#111)";

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

  const handleSubscribeClick = () => {
    if (!channelEmail || subLoading) return;
    if (subInfo?.isSubscribed) {
      setConfirmUnsubscribe(true);
    } else {
      executeSubscriptionToggle(false);
    }
  };

  const executeSubscriptionToggle = async (isUnsubscribing: boolean) => {
    if (!channelEmail || subLoading) return;
    setSubLoading(true);
    setConfirmUnsubscribe(false);
    try {
      const updated = isUnsubscribing
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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteVideo(deleteTarget.id);
      setVideos((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      showNotification("Video deleted.", "success");
    } catch {
      showNotification("Failed to delete video.", "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="page-wrapper">

      <main className="pt-16">
        {/* ── Banner ───────────────────────────────────────────────────────── */}
        <div className="relative h-40 w-full overflow-hidden">
          {/* Gradient art derived from channel color */}
          <div
            className="absolute inset-0"
            style={{ background: gradient, opacity: 0.18 }}
          />
          {/* Noise texture overlay for editorial depth */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, transparent 40%, var(--surface) 100%)",
            }}
          />
          {/* Ambient light spot */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              width: 300, height: 200,
              background: `radial-gradient(ellipse, ${gradient.includes("63,255") ? "rgba(63,255,129,0.12)" : "rgba(255,115,83,0.12)"} 0%, transparent 70%)`,
            }}
          />

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 flex items-center gap-1.5 transition-colors"
            style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700 }}
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>

        {/* ── Profile Row ──────────────────────────────────────────────────── */}
        <div className="px-5 -mt-12 relative z-10">
          {/* Avatar — big, ring, lifted */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black flex-shrink-0"
            style={{
              background: gradient,
              color: "#005d27",
              fontFamily: "var(--font-display)",
              boxShadow: "0 0 0 4px var(--surface), 0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            {channelName[0]?.toUpperCase() ?? "?"}
          </div>

          {/* Name + subscribe */}
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <h1
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
              >
                {channelName}
              </h1>
              <p
                className="text-[11px] font-semibold mt-0.5 uppercase tracking-wider"
                style={{ color: "var(--on-surface-variant)" }}
              >
                {subInfo != null ? `${formatCount(subInfo.subscriberCount)} subscribers` : "—"}&nbsp;·&nbsp;{videos.length} videos
              </p>
            </div>

            {!isOwnChannel && (
              <button
                id="channel-subscribe-btn"
                onClick={handleSubscribeClick}
                disabled={subLoading}
                className={`subscribe-btn ${subInfo?.isSubscribed ? "subscribed" : ""} disabled:opacity-60`}
              >
                {subLoading ? (
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                ) : subInfo?.isSubscribed ? (
                  <><BellOff size={13} /> Subscribed</>
                ) : (
                  <><Bell size={13} /> Subscribe</>
                )}
              </button>
            )}

            {isOwnChannel && (
              <button
                onClick={() => navigate("/upload")}
                className="btn-primary"
                style={{ fontSize: 12, padding: "8px 16px" }}
              >
                <Play size={13} fill="currentColor" /> Upload
              </button>
            )}
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div
          className="flex gap-6 px-5 mt-6 mb-5"
          style={{ borderBottom: "1px solid var(--surface-container-highest)" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="pb-3 text-sm font-semibold transition-colors relative"
              style={{
                fontFamily: "var(--font-display)",
                color: activeTab === tab ? "var(--primary)" : "var(--on-surface-variant)",
                borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Tab Content ──────────────────────────────────────────────────── */}
        <section className="px-4 pb-4">
          {activeTab === "Videos" && (
            <>
              {loading ? (
                <div className="video-grid">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-3">
                      <div className="skeleton aspect-video w-full" style={{ borderRadius: "var(--radius-lg)" }} />
                      <div className="skeleton h-4 w-3/4 rounded" />
                      <div className="skeleton h-3 w-1/2 rounded" />
                    </div>
                  ))}
                </div>
              ) : videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="empty-icon">
                    <VideoOff size={22} style={{ color: "var(--outline-variant)" }} />
                  </div>
                  <p
                    className="text-sm font-semibold"
                    style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
                  >
                    No videos yet
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--outline)" }}>
                    {isOwnChannel ? "Upload your first video to get started." : "This channel hasn't posted anything yet."}
                  </p>
                </div>
              ) : (
                <div className="video-grid">
                  {videos.map((v: any) => (
                    <div key={v.id} className="relative group">
                      <VideoCard
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
                      {isOwnChannel && (
                        <button
                          id={`delete-video-${v.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteTarget({ id: v.id, title: v.title });
                          }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-xl flex items-center justify-center
                                     opacity-0 group-hover:opacity-100 transition-all duration-200"
                          style={{
                            background: "rgba(15,15,15,0.85)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255,115,83,0.3)",
                            color: "var(--secondary)",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                          }}
                          title="Delete video"
                          aria-label="Delete video"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "About" && (
            <div
              className="p-5"
              style={{ background: "var(--surface-container-low)", borderRadius: "var(--radius-xl)" }}
            >
              <h3
                className="text-sm font-bold mb-3"
                style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
              >
                Channel Details
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Radio size={14} style={{ color: "var(--on-surface-variant)" }} />
                  <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                    {channelEmail}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Play size={14} style={{ color: "var(--on-surface-variant)" }} />
                  <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                    {videos.length} video{videos.length !== 1 ? "s" : ""} published
                  </span>
                </div>
                {subInfo && (
                  <div className="flex items-center gap-3">
                    <Bell size={14} style={{ color: "var(--on-surface-variant)" }} />
                    <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                      {formatCount(subInfo.subscriberCount)} subscribers
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      <BottomNav />

      <ConfirmModal
        isOpen={confirmUnsubscribe}
        title="Unsubscribe?"
        message={`Are you sure you want to unsubscribe from ${channelName}?`}
        confirmLabel="Unsubscribe"
        destructive
        onConfirm={() => executeSubscriptionToggle(true)}
        onCancel={() => setConfirmUnsubscribe(false)}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete video?"
        message={`"${deleteTarget?.title}" will be permanently deleted and cannot be recovered.`}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        cancelLabel="Keep it"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
