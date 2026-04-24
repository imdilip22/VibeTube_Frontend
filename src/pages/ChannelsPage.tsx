import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../components/BottomNav";
import { VideoCard } from "../components/VideoCard";
import {
  getSubscribedChannels,
  getSubscriptionsFeed,
  type SubscribedChannel,
} from "../service/subscription.service";
import { useNotification } from "../context/NotificationContext";

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

export const ChannelsPage = () => {
  const { showNotification } = useNotification();
  const navigate = useNavigate();

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
    setSelectedEmail((prev) => (prev === email ? null : email));
  };

  return (
    <div className="page-wrapper">

      <main className="content-container">
        {/* ── Channel Selector Strip ────────────────────────────────── */}
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide pt-2 mb-2">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 w-16">
                <div className="skeleton w-14 h-14 rounded-full" />
                <div className="skeleton h-2.5 w-10 rounded" />
              </div>
            ))
          ) : subscribedChannels.length === 0 ? (
            <p className="text-xs py-4" style={{ color: "var(--outline)" }}>
              No subscriptions yet
            </p>
          ) : (
            subscribedChannels.map((ch) => {
              const isActive = selectedEmail === ch.email;
              return (
                <button
                  key={ch.email}
                  onClick={() => handleChannelClick(ch.email)}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 w-16 transition-all"
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center font-black text-xl transition-all"
                    style={{
                      background: avatarGradient(ch.email),
                      color: "#005d27",
                      fontFamily: "var(--font-display)",
                      opacity: isActive ? 1 : 0.55,
                      transform: isActive ? "scale(1.1)" : "scale(1)",
                      boxShadow: isActive
                        ? "0 0 0 2.5px var(--primary), 0 4px 20px rgba(63,255,129,0.3)"
                        : "none",
                      filter: isActive ? "none" : "grayscale(0.3)",
                    }}
                  >
                    {ch.name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span
                    className="text-[10px] text-center w-full truncate font-semibold"
                    style={{
                      color: isActive ? "var(--primary)" : "var(--outline)",
                    }}
                  >
                    {ch.name}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Filter indicator */}
        {selectedEmail && (
          <div className="mb-4 flex items-center gap-2">
            <p
              className="text-xs font-semibold"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Showing:&nbsp;
              <span style={{ color: "var(--primary)" }}>
                {subscribedChannels.find(c => c.email === selectedEmail)?.name ?? selectedEmail}
              </span>
            </p>
            <button
              onClick={() => setSelectedEmail(null)}
              className="text-[10px] font-bold transition-opacity hover:opacity-70"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Clear
            </button>
          </div>
        )}

        {/* ── Video Grid ───────────────────────────────────────────── */}
        <section>
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
          ) : filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p
                className="text-sm font-semibold"
                style={{ fontFamily: "var(--font-display)", color: "var(--on-surface-variant)" }}
              >
                {subscribedChannels.length === 0
                  ? "Subscribe to creators to see their videos here"
                  : "No videos for this channel yet"}
              </p>
              {subscribedChannels.length === 0 && (
                <button
                  onClick={() => navigate("/")}
                  className="mt-4 btn-primary"
                  style={{ fontSize: 12, padding: "8px 18px" }}
                >
                  Discover Content
                </button>
              )}
            </div>
          ) : (
            <div className="video-grid">
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
