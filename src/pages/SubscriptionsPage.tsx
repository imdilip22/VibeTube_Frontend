import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../components/BottomNav";
import { ConfirmModal } from "../components/ConfirmModal";
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

export const SubscriptionsPage = () => {
  const [channels, setChannels] = useState<SubscribedChannel[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsubscribing, setUnsubscribing] = useState<string | null>(null);
  const [confirmUnsubscribe, setConfirmUnsubscribe] = useState<{ email: string; name: string } | null>(null);
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
    } catch {
      showNotification("Failed to load subscriptions", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUnsubscribe = (channelEmail: string, channelName: string) => {
    setConfirmUnsubscribe({ email: channelEmail, name: channelName });
  };

  const executeUnsubscribe = async () => {
    if (!confirmUnsubscribe) return;
    const { email: channelEmail, name: channelName } = confirmUnsubscribe;
    setConfirmUnsubscribe(null);
    setUnsubscribing(channelEmail);
    try {
      await unsubscribeFromChannel(channelEmail);
      setChannels((prev) => prev.filter((c) => c.email !== channelEmail));
      setVideos((prev) => prev.filter((v) => v.createdBy !== channelEmail));
      showNotification(`Unsubscribed from ${channelName}`, "success");
    } catch {
      showNotification("Failed to unsubscribe", "error");
    } finally {
      setUnsubscribing(null);
    }
  };

  return (
    <div className="page-wrapper">

      <main className="content-container">
        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="mb-5">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
          >
            Subscriptions
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            {loading ? "Loading…" : `${channels.length} channel${channels.length !== 1 ? "s" : ""} you follow`}
          </p>
        </div>

        {/* ── Loading ──────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="spinner" />
          </div>
        )}

        {/* ── Empty ────────────────────────────────────────────────────── */}
        {!loading && channels.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="empty-icon">
              <Users size={22} style={{ color: "var(--outline-variant)" }} />
            </div>
            <p
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
            >
              No subscriptions yet
            </p>
            <p className="text-xs mt-1 max-w-xs" style={{ color: "var(--outline)" }}>
              When you subscribe to a channel, their videos will appear here.
            </p>
          </div>
        )}

        {!loading && channels.length > 0 && (
          <>
            {/* ── Channels strip ───────────────────────────────────────── */}
            <section className="mb-6">
              <h2 className="section-header mb-3">Channels</h2>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {channels.map((ch) => (
                  <div
                    key={ch.email}
                    className="flex-shrink-0 flex flex-col items-center gap-2 p-3"
                    style={{
                      background: "var(--surface-container-low)",
                      borderRadius: "var(--radius-xl)",
                      width: 104,
                    }}
                  >
                    {/* Avatar */}
                    <button
                      onClick={() => navigate(`/channel/${encodeURIComponent(ch.email)}`)}
                      className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg transition-opacity hover:opacity-80"
                      style={{
                        background: avatarGradient(ch.email),
                        color: "#005d27",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {ch.name[0]?.toUpperCase() ?? "?"}
                    </button>

                    {/* Name + subs */}
                    <button
                      onClick={() => navigate(`/channel/${encodeURIComponent(ch.email)}`)}
                      className="text-center w-full hover:opacity-80 transition-opacity"
                    >
                      <p
                        className="text-xs font-semibold line-clamp-1"
                        style={{ color: "var(--on-surface)" }}
                      >
                        {ch.name}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--outline)" }}>
                        {formatCount(ch.subscriberCount)} subs
                      </p>
                    </button>

                    {/* Unsubscribe */}
                    <button
                      onClick={() => handleUnsubscribe(ch.email, ch.name)}
                      disabled={unsubscribing === ch.email}
                      className="flex items-center justify-center gap-1 w-full py-1.5 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-50"
                      style={{
                        background: "var(--surface-container)",
                        color: "var(--on-surface-variant)",
                        border: "none",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.color = "var(--error)";
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,113,108,0.1)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.color = "var(--on-surface-variant)";
                        (e.currentTarget as HTMLElement).style.background = "var(--surface-container)";
                      }}
                    >
                      {unsubscribing === ch.email ? (
                        <span className="spinner" style={{ width: 10, height: 10 }} />
                      ) : (
                        <>
                          <UserMinus size={10} />
                          Unsub
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Surface spacer instead of border line */}
            <div style={{ height: 4, background: "var(--surface-container-low)", borderRadius: 2, marginBottom: 24 }} />

            {/* ── Latest videos ────────────────────────────────────────── */}
            <section>
              <h2 className="section-header mb-4">Latest Videos</h2>
              {videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm" style={{ color: "var(--outline)" }}>
                    No videos yet from your subscriptions.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
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
            </section>
          </>
        )}
      </main>

      <BottomNav />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmUnsubscribe !== null}
        title="Unsubscribe?"
        message={`Are you sure you want to unsubscribe from ${confirmUnsubscribe?.name ?? "this channel"}?`}
        confirmLabel="Unsubscribe"
        destructive
        onConfirm={executeUnsubscribe}
        onCancel={() => setConfirmUnsubscribe(null)}
      />
    </div>
  );
};
