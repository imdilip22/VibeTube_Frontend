import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { VideoCard, StreamCard } from "../components/VideoCard";
import { getAllVideos } from "../service/video.service";
import { useNotification } from "../context/NotificationContext";
import { Play } from "lucide-react";
import axiosInstance from "../client/axios";

export const HomePage = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

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

  /* Pick hero from first live stream, else first video */
  const heroStream = liveStreams[0] ?? null;
  const heroVideo = videos[0] ?? null;
  const hasHero = !!heroStream || !!heroVideo;

  const heroTitle = heroStream ? heroStream.title : heroVideo?.title ?? "";
  const heroSubtitle = heroStream
    ? `Live from VibeTube · ${heroStream.viewerCount ?? "0"} watching`
    : `Uploaded by ${heroVideo?.uploader?.name ?? ""}`;

  const featuredVideos = heroVideo ? videos.slice(1) : videos;
  const featuredStreams = heroStream ? liveStreams.slice(1) : liveStreams;

  return (
    <div className="min-h-dvh bg-[#0e0e0e] pb-28">
      <TopBar />

      <main className="pt-20 pb-6 px-4 max-w-7xl mx-auto">

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <span className="w-8 h-8 border-2 border-[#3fff81]/30 border-t-[#3fff81] rounded-full animate-spin" />
            <p className="text-xs text-[#767575] mt-3 uppercase tracking-wider">Loading…</p>
          </div>
        )}

        {!loading && (
          <>
            {/* ── Hero / Featured Spotlight ────────────────────────────────── */}
            {hasHero && (
              <section className="mb-10 relative overflow-hidden rounded-xl bg-[#131313] p-5 flex flex-col gap-5">

                {/* Thumbnail */}
                <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-2xl">
                  {heroStream?.thumbnailPath ? (
                    <img
                      src={`http://localhost:3000/live-hls/live/${heroStream.streamKey}/${heroStream.thumbnailPath}`}
                      alt={heroTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : heroVideo?.thumbnailPath ? (
                    <img
                      src={`http://localhost:3000/hls-output/${heroVideo.id}/${heroVideo.thumbnailPath}`}
                      alt={heroTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#262626] flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-[#3fff81]/10 flex items-center justify-center">
                        <Play size={28} className="text-[#3fff81] ml-1" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {/* Glow */}
                  <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#3fff81]/10 blur-3xl rounded-full pointer-events-none" />
                </div>

                {/* Text + CTA */}
                <div>
                  {heroStream && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-[#ff7353] text-white px-3 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase">LIVE</span>
                      <span className="text-[#adaaaa] text-sm font-medium">{heroSubtitle}</span>
                    </div>
                  )}

                  <h1 className="text-3xl font-extrabold tracking-tighter leading-none mb-3 text-white">
                    {heroTitle.split(" ").map((word: string, i: number) =>
                      i === Math.floor(heroTitle.split(" ").length / 2) ? (
                        <span key={i} className="text-[#3fff81]">{word} </span>
                      ) : (
                        <span key={i}>{word} </span>
                      )
                    )}
                  </h1>

                  {!heroStream && (
                    <p className="text-[#adaaaa] text-sm mb-4">{heroSubtitle}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        heroStream
                          ? navigate(`/live/watch/${heroStream.streamKey}`)
                          : navigate(`/watch/${heroVideo.id}`)
                      }
                      className="bg-[#3fff81] text-[#0e0e0e] px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-[#2ee86d] active:scale-95 transition-all shadow-lg shadow-[#3fff81]/20"
                    >
                      <Play size={16} fill="currentColor" />
                      Watch Now
                    </button>
                    <button className="bg-[#262626] text-white px-6 py-2.5 rounded-lg font-bold border border-[#484847]/30 hover:bg-[#2c2c2c] transition-colors">
                      Details
                    </button>
                  </div>
                </div>
              </section>
            )}


            {/* ── Live streams (excluding hero) ─────────────────────────── */}
            {featuredStreams.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-black text-white uppercase tracking-widest">🔴 Live Now</h2>
                  <Link to="/live" className="text-xs text-[#3fff81] font-semibold hover:underline">See all</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-8">
                  {featuredStreams.slice(0, 3).map((s: any) => (
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
                <div className="mt-8 border-t border-white/5" />
              </section>
            )}

            {/* ── Videos grid ──────────────────────────────────────────────── */}
            {featuredVideos.length === 0 && featuredStreams.length === 0 && !hasHero ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#262626] flex items-center justify-center mb-4">
                  <Play size={24} className="text-[#484847] ml-1" />
                </div>
                <p className="text-sm text-[#adaaaa] font-semibold">No videos yet</p>
                <p className="text-xs text-[#767575] mt-1">Upload a video or go live to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
                {featuredVideos.map((v: any) => (
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
