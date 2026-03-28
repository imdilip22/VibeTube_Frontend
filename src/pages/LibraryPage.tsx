import { useState, useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { VideoCard } from "../components/VideoCard";
import { getAllVideos } from "../service/video.service";
import { useNotification } from "../context/NotificationContext";
import { FolderOpen, Clock, Heart, Download } from "lucide-react";

const collections = [
  { icon: Clock, label: "Watch Later", count: 0 },
  { icon: Heart, label: "Liked Videos", count: 0 },
  { icon: Download, label: "Downloads", count: 0 },
  { icon: FolderOpen, label: "My Collections", count: 0 },
];

export const LibraryPage = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const result = await getAllVideos();
        if (result.success && result.data) {
          setVideos(result.data);
        }
      } catch (error) {
        console.log("LibraryPage fetchVideos error", error);
        showNotification("Failed to load library", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  return (
    <div className="min-h-dvh bg-[#0a0a12] pb-20">
      <TopBar />

      <main className="px-4 pt-4">
        <h1 className="text-xl font-bold text-white mb-1">Library</h1>
        <p className="text-xs text-gray-500 mb-5">Manage your collections and materials</p>

        {/* Collection cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {collections.map((col) => (
            <button
              key={col.label}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                <col.icon size={16} className="text-violet-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-white/80">{col.label}</p>
                <p className="text-[10px] text-gray-600">{col.count} videos</p>
              </div>
            </button>
          ))}
        </div>

        {/* Videos */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Videos</h2>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <span className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
          )}

          {!loading && videos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-gray-500">No videos in your library</p>
              <p className="text-xs text-gray-600 mt-1">Upload a video to see it here</p>
            </div>
          )}

          {!loading && videos.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {videos.map((v: any) => (
                <VideoCard
                  key={v.id}
                  id={v.id}
                  title={v.title || "Untitled"}
                  uploaderName={v.uploader?.name ?? "Unknown"}
                  channelEmail={v.createdBy}
                  thumbnailPath={v.thumbnailPath}
                  uploadedAt={v.createdAt}
                  variant="small"
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
