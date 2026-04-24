import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BottomNav } from "../components/BottomNav";
import { VideoCard, StreamCard } from "../components/VideoCard";
import { getAllVideos } from "../service/video.service";
import { useNotification } from "../context/NotificationContext";
import { Play, Radio, ChevronRight } from "lucide-react";
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
        if (videoResult.success && videoResult.data) setVideos(videoResult.data);
        setLiveStreams(liveResult.data?.data?.streams ?? []);
      } catch {
        showNotification("Failed to load content", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const isEmpty = !loading && liveStreams.length === 0 && videos.length === 0;

  return (
    <div className="page-wrapper">

      <main className="content-container">

        {/* ── Loading skeleton ─────────────────────────────────────────── */}
        {loading && (
          <div className="video-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="skeleton aspect-video w-full" style={{ borderRadius: "var(--radius-lg)" }} />
                <div className="skeleton h-3 w-3/4 rounded" />
                <div className="skeleton h-2.5 w-1/2 rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <>
            {/* ── Live streams ─────────────────────────────────────────── */}
            {liveStreams.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Radio size={14} style={{ color: "var(--secondary)" }} />
                    <h2 className="section-header">Live Now</h2>
                  </div>
                  <Link
                    to="/live"
                    className="flex items-center gap-1 text-xs font-bold hover:opacity-70 transition-opacity"
                    style={{ color: "var(--primary)" }}
                  >
                    See all <ChevronRight size={13} />
                  </Link>
                </div>
                <div className="video-grid">
                  {liveStreams.map((s: any) => (
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
              </section>
            )}

            {/* ── Videos grid ──────────────────────────────────────────── */}
            {videos.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="section-header">Latest Videos</h2>
                </div>
                <div className="video-grid">
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
              </section>
            )}

            {/* ── Empty state ──────────────────────────────────────────── */}
            {isEmpty && (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="empty-icon">
                  <Play size={22} style={{ color: "var(--outline-variant)", marginLeft: 2 }} />
                </div>
                <p className="text-sm font-semibold mb-1"
                  style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>
                  Nothing here yet
                </p>
                <p className="text-xs" style={{ color: "var(--outline)" }}>
                  Upload a video or go live to get started
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
