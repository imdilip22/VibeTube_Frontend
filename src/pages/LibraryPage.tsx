import { useState, useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { VideoCard } from "../components/VideoCard";
import { getAllVideos, getLikedVideos } from "../service/video.service";
import { toggleLike } from "../service/like.service";
import { getWatchLaterVideos, removeFromWatchLater } from "../service/watchlater.service";
import { useNotification } from "../context/NotificationContext";
import { Clock, Heart, Trash2 } from "lucide-react";

export const LibraryPage = () => {
  const [activeTab, setActiveTab] = useState<"all" | "watched" | "liked">("all");
  const [videos, setVideos] = useState<any[]>([]);
  const [watchLater, setWatchLater] = useState<any[]>([]);
  const [liked, setLiked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [allRes, watchRes, likedRes] = await Promise.all([
          getAllVideos().catch(() => ({ success: false })),
          getWatchLaterVideos().catch(() => ({ success: false })),
          getLikedVideos().catch(() => ({ success: false })),
        ]);

        if (allRes.success) setVideos(allRes.data);
        if (watchRes.success) setWatchLater(watchRes.data);
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
      activeTab === "watched" ? watchLater : liked;

  const tabLabel =
    activeTab === "all" ? "Your Videos" :
      activeTab === "watched" ? "Watch Later" : "Liked Videos";

  const handleRemoveVideo = async (videoId: string, type: "watched" | "liked") => {
    try {
      if (type === "watched") {
        await removeFromWatchLater(videoId);
        setWatchLater(prev => prev.filter(v => v.id !== videoId));
        showNotification("Removed from Watch Later", "success");
      } else {
        await toggleLike(videoId);
        setLiked(prev => prev.filter(v => v.id !== videoId));
        showNotification("Removed from Liked Videos", "success");
      }
    } catch {
      showNotification("Failed to remove video", "error");
    }
  };

  return (
    <div className="min-h-dvh bg-[#0a0a12] pb-20">
      <TopBar />

      <main className="px-4 pt-4">
        <h1 className="text-xl font-bold text-white mb-1">Library</h1>
        {/* Collection cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setActiveTab(activeTab === "watched" ? "all" : "watched")}
            className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all group ${activeTab === "watched"
                ? "bg-violet-500/10 border-violet-500/30"
                : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]"
              }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${activeTab === "watched" ? "bg-violet-500/20" : "bg-violet-500/10 group-hover:bg-violet-500/20"
              }`}>
              <Clock size={16} className="text-violet-400" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-white/80">Watch Later</p>
              <p className="text-[10px] text-gray-600">{watchLater.length} videos</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === "liked" ? "all" : "liked")}
            className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all group ${activeTab === "liked"
                ? "bg-pink-500/10 border-pink-500/30"
                : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]"
              }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${activeTab === "liked" ? "bg-pink-500/20" : "bg-pink-500/10 group-hover:bg-pink-500/20"
              }`}>
              <Heart size={16} className="text-pink-400" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-white/80">Liked Videos</p>
              <p className="text-[10px] text-gray-600">{liked.length} videos</p>
            </div>
          </button>
        </div>

        {/* Videos */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{tabLabel}</h2>
            {activeTab !== "all" && (
              <button
                onClick={() => setActiveTab("all")}
                className="text-[10px] text-violet-400 hover:text-violet-300 font-medium px-2 py-0.5 rounded-md bg-violet-500/10"
              >
                Show All
              </button>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <span className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
          )}

          {!loading && displayVideos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-gray-500">No videos found</p>
              <p className="text-xs text-gray-600 mt-1">
                {activeTab === "watched" ? "Add videos to watch later to see them here" :
                  activeTab === "liked" ? "Like some videos to see them here" :
                    "Upload a video to see it here"}
              </p>
            </div>
          )}

          {!loading && displayVideos.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {displayVideos.map((v: any) => (
                <VideoCard
                  key={`${activeTab}-${v.id}`}
                  id={v.id}
                  title={v.title || "Untitled"}
                  uploaderName={v.uploader?.name ?? "Unknown"}
                  channelEmail={v.createdBy}
                  thumbnailPath={v.thumbnailPath}
                  uploadedAt={v.createdAt}
                  variant="small"
                  action={activeTab !== "all" ? {
                    icon: Trash2,
                    onClick: () => handleRemoveVideo(v.id, activeTab === "watched" ? "watched" : "liked")
                  } : undefined}
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
