import { useState, useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { VideoCard } from "../components/VideoCard";
import { getAllVideos, getLikedVideos } from "../service/video.service";
import { toggleLike } from "../service/like.service";
import { getWatchLaterVideos, removeFromWatchLater } from "../service/watchlater.service";
import { getWatchHistory, removeFromWatchHistory, clearWatchHistory } from "../service/watchhistory.service";
import { useNotification } from "../context/NotificationContext";
import { Clock, Heart, Trash2, History, AlertTriangle } from "lucide-react";

type ActiveTab = "all" | "watchlater" | "history" | "liked";

export const LibraryPage = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [videos, setVideos] = useState<any[]>([]);
  const [watchLater, setWatchLater] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [liked, setLiked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [allRes, watchRes, histRes, likedRes] = await Promise.all([
          getAllVideos().catch(() => ({ success: false })),
          getWatchLaterVideos().catch(() => ({ success: false })),
          getWatchHistory().catch(() => ({ success: false })),
          getLikedVideos().catch(() => ({ success: false })),
        ]);

        if (allRes.success) setVideos(allRes.data);
        if (watchRes.success) setWatchLater(watchRes.data);
        if (histRes.success) setHistory(histRes.data);
        if (likedRes.success) setLiked(likedRes.data);
      } catch (error) {
        console.log("LibraryPage fetchData error", error);
        showNotification("Failed to load library data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayVideos =
    activeTab === "all" ? videos :
      activeTab === "watchlater" ? watchLater :
        activeTab === "history" ? history : liked;

  const tabLabel =
    activeTab === "all" ? "Your Videos" :
      activeTab === "watchlater" ? "Watch Later" :
        activeTab === "history" ? "Watch History" : "Liked Videos";

  const handleRemoveVideo = async (videoId: string, type: ActiveTab) => {
    try {
      if (type === "watchlater") {
        await removeFromWatchLater(videoId);
        setWatchLater(prev => prev.filter(v => v.id !== videoId));
        showNotification("Removed from Watch Later", "success");
      } else if (type === "history") {
        await removeFromWatchHistory(videoId);
        setHistory(prev => prev.filter(v => v.id !== videoId));
        showNotification("Removed from history", "success");
      } else if (type === "liked") {
        await toggleLike(videoId);
        setLiked(prev => prev.filter(v => v.id !== videoId));
        showNotification("Removed from Liked Videos", "success");
      }
    } catch {
      showNotification("Failed to remove video", "error");
    }
  };

  const handleClearHistory = async () => {
    setClearingHistory(true);
    try {
      await clearWatchHistory();
      setHistory([]);
      setShowClearConfirm(false);
      showNotification("Watch history cleared", "success");
    } catch {
      showNotification("Failed to clear history", "error");
    } finally {
      setClearingHistory(false);
    }
  };

  const formatWatchedAt = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  };

  return (
    <div className="min-h-dvh bg-[#0a0a12] pb-20">
      <TopBar />

      <main className="px-4 pt-4">
        <h1 className="text-xl font-bold text-white mb-1">Library</h1>

        {/* Collection cards */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {/* Watch Later */}
          <button
            onClick={() => setActiveTab(activeTab === "watchlater" ? "all" : "watchlater")}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all group ${activeTab === "watchlater"
              ? "bg-violet-500/10 border-violet-500/30"
              : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]"
              }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${activeTab === "watchlater" ? "bg-violet-500/20" : "bg-violet-500/10 group-hover:bg-violet-500/20"
              }`}>
              <Clock size={16} className="text-violet-400" />
            </div>
            <div className="text-center">
              <p className="text-[11px] font-medium text-white/80">Watch Later</p>
              <p className="text-[10px] text-gray-600">{watchLater.length} videos</p>
            </div>
          </button>

          {/* History */}
          <button
            onClick={() => setActiveTab(activeTab === "history" ? "all" : "history")}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all group ${activeTab === "history"
              ? "bg-amber-500/10 border-amber-500/30"
              : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]"
              }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${activeTab === "history" ? "bg-amber-500/20" : "bg-amber-500/10 group-hover:bg-amber-500/20"
              }`}>
              <History size={16} className="text-amber-400" />
            </div>
            <div className="text-center">
              <p className="text-[11px] font-medium text-white/80">History</p>
              <p className="text-[10px] text-gray-600">{history.length} videos</p>
            </div>
          </button>

          {/* Liked */}
          <button
            onClick={() => setActiveTab(activeTab === "liked" ? "all" : "liked")}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all group ${activeTab === "liked"
              ? "bg-pink-500/10 border-pink-500/30"
              : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]"
              }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${activeTab === "liked" ? "bg-pink-500/20" : "bg-pink-500/10 group-hover:bg-pink-500/20"
              }`}>
              <Heart size={16} className="text-pink-400" />
            </div>
            <div className="text-center">
              <p className="text-[11px] font-medium text-white/80">Liked</p>
              <p className="text-[10px] text-gray-600">{liked.length} videos</p>
            </div>
          </button>
        </div>

        {/* Videos */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{tabLabel}</h2>
            <div className="flex items-center gap-2">
              {/* Clear History button */}
              {activeTab === "history" && history.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-[10px] text-red-400 hover:text-red-300 font-medium px-2 py-0.5 rounded-md bg-red-500/10 flex items-center gap-1"
                >
                  <Trash2 size={10} />
                  Clear All
                </button>
              )}
              {activeTab !== "all" && (
                <button
                  onClick={() => setActiveTab("all")}
                  className="text-[10px] text-violet-400 hover:text-violet-300 font-medium px-2 py-0.5 rounded-md bg-violet-500/10"
                >
                  Show All
                </button>
              )}
            </div>
          </div>

          {/* Clear History Confirmation */}
          {showClearConfirm && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3 animate-in fade-in duration-200">
              <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/80">Clear entire watch history?</p>
                <p className="text-[10px] text-gray-500 mt-0.5">This action cannot be undone.</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleClearHistory}
                    disabled={clearingHistory}
                    className="px-3 py-1 rounded-lg bg-red-600 text-white text-[10px] font-bold hover:bg-red-500 disabled:opacity-50 transition-all flex items-center gap-1"
                  >
                    {clearingHistory
                      ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                      : "Yes, Clear"}
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1 rounded-lg bg-white/5 text-gray-400 text-[10px] font-bold hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <span className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
          )}

          {!loading && displayVideos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-3">
                {activeTab === "watchlater" ? <Clock size={20} className="text-gray-600" />
                  : activeTab === "history" ? <History size={20} className="text-gray-600" />
                    : activeTab === "liked" ? <Heart size={20} className="text-gray-600" />
                      : null}
              </div>
              <p className="text-sm text-gray-500">No videos found</p>
              <p className="text-xs text-gray-600 mt-1">
                {activeTab === "watchlater" ? "Save videos to watch later" :
                  activeTab === "history" ? "Videos you watch will appear here" :
                    activeTab === "liked" ? "Like some videos to see them here" :
                      "Upload a video to see it here"}
              </p>
            </div>
          )}

          {!loading && displayVideos.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {displayVideos.map((v: any) => (
                <div key={`${activeTab}-${v.id}`} className="relative">
                  <VideoCard
                    id={v.id}
                    title={v.title || "Untitled"}
                    uploaderName={v.uploader?.name ?? "Unknown"}
                    channelEmail={v.createdBy}
                    thumbnailPath={v.thumbnailPath}
                    uploadedAt={v.createdAt}
                    variant="small"
                    action={activeTab !== "all" ? {
                      icon: Trash2,
                      onClick: () => handleRemoveVideo(v.id, activeTab)
                    } : undefined}
                  />
                  {/* Watched-at badge for history tab */}
                  {activeTab === "history" && v.watchedAt && (
                    <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
                      <History size={9} className="text-amber-400" />
                      <span className="text-[9px] text-amber-300 font-medium">{formatWatchedAt(v.watchedAt)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
};
