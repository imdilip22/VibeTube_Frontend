import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { VideoCard, StreamCard } from "../components/VideoCard";
import { getAllVideos } from "../service/video.service";
import { useNotification } from "../context/NotificationContext";
import { Radio, ChevronRight } from "lucide-react";
import axiosInstance from "../client/axios";

export const HomePage = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [videoResult, liveResult] = await Promise.all([
          getAllVideos(),
          axiosInstance.get("/live").catch(() => ({ data: { data: { streams: [] } } })),
        ]);

        if (videoResult.success && videoResult.data) {
          setVideos(videoResult.data);
        }
        setLiveStreams(liveResult.data?.data?.streams ?? []);
      } catch (error) {
        console.log("HomePage fetchAll error", error);
        showNotification("Failed to load content", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="min-h-dvh bg-[#0a0a12] pb-20">
      <TopBar />

      <main className="px-4 pt-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-xs text-gray-500 mt-3">Loading...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* ── Live Now section ─────────────────────────────────────── */}
            {liveStreams.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                      <Radio size={14} className="text-red-500" />
                      Live Now
                    </span>
                    <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      {liveStreams.length}
                    </span>
                  </div>
                  <Link to="/live" className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-violet-300 transition-colors">
                    See all <ChevronRight size={12} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {liveStreams.slice(0, 3).map((s: any) => (
                    <StreamCard
                      key={s.streamKey}
                      streamKey={s.streamKey}
                      title={s.title}
                      creatorName={s.creator?.name ?? "Unknown"}
                      creatorEmail={s.creatorEmail}
                      thumbnailPath={s.thumbnailPath}
                      startedAt={s.createdAt}
                    />
                  ))}
                </div>

                {/* Divider */}
                <div className="mt-8 border-t border-white/5" />
              </section>
            )}

            {/* ── Videos section ───────────────────────────────────────── */}
            {videos.length === 0 && liveStreams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <div className="w-0 h-0 border-t-[10px] border-b-[10px] border-l-[16px] border-transparent border-l-gray-600 ml-1" />
                </div>
                <p className="text-sm text-gray-400 font-medium">No videos yet</p>
                <p className="text-xs text-gray-600 mt-1">Upload a video or go live to get started</p>
              </div>
            ) : (
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
                    isLiveArchive={v.isLiveArchive}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
