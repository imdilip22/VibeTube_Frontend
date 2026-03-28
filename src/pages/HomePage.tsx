import { useState, useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { VideoCard } from "../components/VideoCard";
import { getAllVideos } from "../service/video.service";
import { useNotification } from "../context/NotificationContext";

export const HomePage = () => {
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
        console.log("HomePage fetchVideos error", error);
        showNotification("Failed to load videos", "error");
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
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-xs text-gray-500 mt-3">Loading videos...</p>
          </div>
        )}

        {!loading && videos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <div className="w-0 h-0 border-t-[10px] border-b-[10px] border-l-[16px] border-transparent border-l-gray-600 ml-1" />
            </div>
            <p className="text-sm text-gray-400 font-medium">No videos yet</p>
            <p className="text-xs text-gray-600 mt-1">Upload your first video to get started</p>
          </div>
        )}

        {!loading && videos.length > 0 && (
          <div className="flex flex-col gap-6">
            {videos.map((v: any) => (
              <VideoCard
                key={v.id}
                id={v.id}
                title={v.title}
                uploaderName={v.uploader?.name ?? "Unknown"}
                channelEmail={v.createdBy}
                thumbnailPath={v.thumbnailPath}
                uploadedAt={v.createdAt}
                views={0}
                likes={0}
                variant="large"
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
