import { useState, useEffect, useCallback } from "react";
import { BottomNav } from "../components/BottomNav";
import { ConfirmModal } from "../components/ConfirmModal";
import { VideoCard } from "../components/VideoCard";
import { getLikedVideos } from "../service/video.service";
import { toggleLike } from "../service/like.service";
import { getWatchLaterVideos, removeFromWatchLater } from "../service/watchlater.service";
import { getWatchHistory, removeFromWatchHistory, clearWatchHistory } from "../service/watchhistory.service";
import { useNotification } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { History as HistoryIcon, Heart, Clock, Trash2 } from "lucide-react";

const TABS = [
  { id: "history", label: "History", icon: HistoryIcon },
  { id: "liked", label: "Liked", icon: Heart },
  { id: "later", label: "Watch Later", icon: Clock },
] as const;

type TabId = "history" | "liked" | "later";

export const LibraryPage = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("history");
  const [history, setHistory] = useState<any[]>([]);
  const [liked, setLiked] = useState<any[]>([]);
  const [watchLater, setWatchLater] = useState<any[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<{ id: string; type: TabId } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [histRes, likedRes, watchRes] = await Promise.all([
        getWatchHistory().catch(() => ({ success: false, data: [] })),
        getLikedVideos().catch(() => ({ success: false, data: [] })),
        getWatchLaterVideos().catch(() => ({ success: false, data: [] })),
      ]);
      if (histRes.success) setHistory(histRes.data);
      if (likedRes.success) setLiked(likedRes.data);
      if (watchRes.success) setWatchLater(watchRes.data);
    } catch {
      showNotification("Failed to load library", "error");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRemove = (videoId: string, type: TabId) => {
    setItemToRemove({ id: videoId, type });
  };

  const executeRemoveItem = async () => {
    if (!itemToRemove) return;
    const { id: videoId, type } = itemToRemove;
    setItemToRemove(null);
    setRemovingId(videoId);
    setTimeout(async () => {
      try {
        if (type === "history") {
          await removeFromWatchHistory(videoId);
          setHistory(prev => prev.filter(v => v.id !== videoId));
        } else if (type === "liked") {
          await toggleLike(videoId);
          setLiked(prev => prev.filter(v => v.id !== videoId));
        } else if (type === "later") {
          await removeFromWatchLater(videoId);
          setWatchLater(prev => prev.filter(v => v.id !== videoId));
        }
        showNotification("Removed", "success");
      } catch {
        showNotification("Failed to remove item", "error");
      }
      setRemovingId(null);
    }, 280);
  };

  const executeClearHistory = async () => {
    try {
      await clearWatchHistory();
      setHistory([]);
      showNotification("History cleared", "success");
    } catch {
      showNotification("Failed to clear history", "error");
    } finally {
      setConfirmClearHistory(false);
    }
  };

  const currentVideos =
    activeTab === "history" ? history :
    activeTab === "liked" ? liked : watchLater;

  const counts = { history: history.length, liked: liked.length, later: watchLater.length };

  return (
    <div className="page-wrapper">

      <main className="content-container">
        {/* ── Page title ────────────────────────────────────────────────── */}
        <div className="mb-5">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
          >
            Library
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            Your saved and watched videos
          </p>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div
          className="flex gap-1 p-1 mb-6"
          style={{
            background: "var(--surface-container-low)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all"
              style={{
                borderRadius: "var(--radius-md)",
                background: activeTab === id ? "var(--surface-container-high)" : "transparent",
                color: activeTab === id ? "var(--on-surface)" : "var(--on-surface-variant)",
                fontFamily: "var(--font-body)",
              }}
            >
              <Icon size={13} strokeWidth={activeTab === id ? 2.5 : 1.8} />
              {label}
              {counts[id] > 0 && (
                <span
                  className="text-[9px] font-black px-1 py-0.5 rounded-sm leading-none"
                  style={{
                    background: activeTab === id ? "var(--primary)" : "var(--surface-container-highest)",
                    color: activeTab === id ? "var(--on-primary)" : "var(--on-surface-variant)",
                  }}
                >
                  {counts[id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Section action bar ───────────────────────────────────────── */}
        {!loading && activeTab === "history" && history.length > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setConfirmClearHistory(true)}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-70"
              style={{ color: "var(--error)" }}
            >
              <Trash2 size={12} />
              Clear All
            </button>
          </div>
        )}

        {/* ── Loading skeletons ────────────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="skeleton aspect-video w-full" style={{ borderRadius: "var(--radius-md)" }} />
                <div className="skeleton h-3 w-3/4 rounded" />
                <div className="skeleton h-2.5 w-1/2 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {!loading && currentVideos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="empty-icon">
              {activeTab === "history" ? (
                <HistoryIcon size={22} style={{ color: "var(--outline-variant)" }} />
              ) : activeTab === "liked" ? (
                <Heart size={22} style={{ color: "var(--outline-variant)" }} />
              ) : (
                <Clock size={22} style={{ color: "var(--outline-variant)" }} />
              )}
            </div>
            <p
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
            >
              {activeTab === "history" ? "Nothing watched recently" :
               activeTab === "liked" ? "No liked videos" :
               "Your queue is empty"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--outline)" }}>
              {activeTab === "history" ? "Videos you watch will appear here" :
               activeTab === "liked" ? "Like videos to save them here" :
               "Save videos to watch later"}
            </p>
          </div>
        )}

        {/* ── Video grid ──────────────────────────────────────────────── */}
        {!loading && currentVideos.length > 0 && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6">
            {currentVideos.map((v) => (
              <div
                key={v.id}
                className="transition-all duration-280"
                style={{
                  opacity: removingId === v.id ? 0 : 1,
                  transform: removingId === v.id ? "scale(0.95)" : "scale(1)",
                }}
              >
                <VideoCard
                  id={v.id}
                  title={v.title}
                  uploaderName={v.uploader?.name ?? "Unknown"}
                  channelEmail={v.createdBy}
                  thumbnailPath={v.thumbnailPath}
                  uploadedAt={v.createdAt}
                  variant="small"
                  action={{
                    icon: Trash2,
                    onClick: () => handleRemove(v.id, activeTab),
                    label: "Remove",
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmClearHistory}
        title="Clear Watch History?"
        message="Are you sure you want to clear your entire watch history? This action cannot be undone."
        confirmLabel="Clear History"
        destructive
        onConfirm={executeClearHistory}
        onCancel={() => setConfirmClearHistory(false)}
      />

      <ConfirmModal
        isOpen={itemToRemove !== null}
        title="Remove Item?"
        message={`Are you sure you want to remove this video from your ${
          itemToRemove?.type === "history" ? "Watch History" :
          itemToRemove?.type === "liked" ? "Liked Videos" : "Watch Later"
        } list?`}
        confirmLabel="Remove"
        destructive
        onConfirm={executeRemoveItem}
        onCancel={() => setItemToRemove(null)}
      />
    </div>
  );
};
