import { useState, useEffect, useCallback } from "react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { VideoCard } from "../components/VideoCard";
import { getLikedVideos } from "../service/video.service";
import { toggleLike } from "../service/like.service";
import { getWatchLaterVideos, removeFromWatchLater } from "../service/watchlater.service";
import { getWatchHistory, removeFromWatchHistory, clearWatchHistory } from "../service/watchhistory.service";
import { useNotification } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { History as HistoryIcon, Heart, Clock, ChevronRight } from "lucide-react";

export const LibraryPage = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  
  // States for each section
  const [history, setHistory] = useState<any[]>([]);
  const [liked, setLiked] = useState<any[]>([]);
  const [watchLater, setWatchLater] = useState<any[]>([]);
  
  // Animation state
  const [removingId, setRemovingId] = useState<string | null>(null);

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
  }, [user, showNotification]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRemove = async (videoId: string, type: "history" | "liked" | "watchlater") => {
    // Start animation
    setRemovingId(videoId);
    
    // Wait for animation to finish (300ms)
    setTimeout(async () => {
      try {
        if (type === "history") {
          await removeFromWatchHistory(videoId);
          setHistory(prev => prev.filter(v => v.id !== videoId));
        } else if (type === "liked") {
          await toggleLike(videoId);
          setLiked(prev => prev.filter(v => v.id !== videoId));
        } else if (type === "watchlater") {
          await removeFromWatchLater(videoId);
          setWatchLater(prev => prev.filter(v => v.id !== videoId));
        }
        showNotification(`Removed from ${type}`, "success");
      } catch {
        showNotification("Failed to remove item", "error");
      }
      setRemovingId(null);
    }, 300);
  };

  const handleClearHistory = async () => {
    try {
      await clearWatchHistory();
      setHistory([]);
      showNotification("History cleared", "success");
    } catch {
      showNotification("Failed to clear history", "error");
    }
  };

  const SectionHeader = ({ icon: Icon, title, count, onClear }: any) => (
    <div className="flex items-center justify-between mb-4 mt-8 px-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-[#3fff81]">
          <Icon size={18} />
        </div>
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-widest">{title}</h2>
          <p className="text-[10px] text-[#767575] font-bold mt-0.5 uppercase tracking-tighter">{count} videos</p>
        </div>
      </div>
      {onClear ? (
        <button onClick={onClear} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:opacity-80">
          Clear All
        </button>
      ) : (
        <button className="text-[#767575] hover:text-[#3fff81] transition-colors">
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#0e0e0e] pb-28">
      <TopBar />

      <main className="pt-20">
        
        {/* ── 1. History ──────────────────────────────────────────────────── */}
        <section>
          <SectionHeader 
            icon={HistoryIcon} 
            title="Watch History" 
            count={history.length} 
            onClear={history.length > 0 ? handleClearHistory : null}
          />
          <div className="flex overflow-x-auto gap-4 px-6 pb-2 scrollbar-hide">
            {loading ? (
              [...Array(4)].map((_, i) => <div key={i} className="w-40 aspect-video rounded-xl bg-[#1a1a1a] animate-pulse flex-shrink-0" />)
            ) : history.length === 0 ? (
              <p className="text-xs text-[#767575] py-4">Nothing watched recently</p>
            ) : (
              history.map((v) => (
                <div 
                  key={v.id} 
                  className={`flex-shrink-0 w-48 transition-all duration-300 transform ${
                    removingId === v.id ? "-translate-x-full opacity-0" : "translate-x-0 opacity-100"
                  }`}
                >
                  <VideoCard
                    id={v.id}
                    title={v.title}
                    uploaderName={v.uploader?.name ?? "Unknown"}
                    channelEmail={v.createdBy}
                    thumbnailPath={v.thumbnailPath}
                    uploadedAt={v.createdAt}
                    variant="small"
                  />
                  <button 
                    onClick={() => handleRemove(v.id, "history")}
                    className="mt-2 w-full py-1.5 rounded-lg border border-[#262626] text-[10px] font-bold text-[#767575] hover:bg-red-500/10 hover:text-red-400 transition-all"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── 2. Liked Videos ─────────────────────────────────────────────── */}
        <section>
          <SectionHeader icon={Heart} title="Liked Videos" count={liked.length} />
          <div className="flex overflow-x-auto gap-4 px-6 pb-2 scrollbar-hide">
             {loading ? (
              [...Array(4)].map((_, i) => <div key={i} className="w-40 aspect-video rounded-xl bg-[#1a1a1a] animate-pulse flex-shrink-0" />)
            ) : liked.length === 0 ? (
              <p className="text-xs text-[#767575] py-4">No liked videos</p>
            ) : (
              liked.map((v) => (
                <div key={v.id} className="flex-shrink-0 w-48">
                  <VideoCard
                    id={v.id}
                    title={v.title}
                    uploaderName={v.uploader?.name ?? "Unknown"}
                    channelEmail={v.createdBy}
                    thumbnailPath={v.thumbnailPath}
                    uploadedAt={v.createdAt}
                    variant="small"
                  />
                   <button 
                    onClick={() => handleRemove(v.id, "liked")}
                    className="mt-2 w-full py-1.5 rounded-lg border border-[#262626] text-[10px] font-bold text-[#767575] hover:bg-red-500/10 hover:text-red-400 transition-all"
                  >
                    Unlike
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── 3. Watch Later ──────────────────────────────────────────────── */}
        <section>
          <SectionHeader icon={Clock} title="Watch Later" count={watchLater.length} />
          <div className="flex overflow-x-auto gap-4 px-6 pb-2 scrollbar-hide">
            {loading ? (
              [...Array(4)].map((_, i) => <div key={i} className="w-40 aspect-video rounded-xl bg-[#1a1a1a] animate-pulse flex-shrink-0" />)
            ) : watchLater.length === 0 ? (
              <p className="text-xs text-[#767575] py-4">Your queue is empty</p>
            ) : (
              watchLater.map((v) => (
                <div key={v.id} className="flex-shrink-0 w-48">
                  <VideoCard
                    id={v.id}
                    title={v.title}
                    uploaderName={v.uploader?.name ?? "Unknown"}
                    channelEmail={v.createdBy}
                    thumbnailPath={v.thumbnailPath}
                    uploadedAt={v.createdAt}
                    variant="small"
                  />
                   <button 
                    onClick={() => handleRemove(v.id, "watchlater")}
                    className="mt-2 w-full py-1.5 rounded-lg border border-[#262626] text-[10px] font-bold text-[#767575] hover:bg-red-500/10 hover:text-red-400 transition-all"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  );
};
