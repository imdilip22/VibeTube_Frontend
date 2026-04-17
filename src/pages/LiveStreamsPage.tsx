import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { StreamCard } from "../components/VideoCard";
import { Radio, Plus } from "lucide-react";
import axiosInstance from "../client/axios";

export const LiveStreamsPage = () => {
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/live");
      setStreams(data?.data?.streams ?? []);
    } catch {
      setStreams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();
    const interval = setInterval(fetchStreams, 15_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-dvh bg-[#0e0e0e] pb-28">
      <TopBar />

      <main className="pt-20 px-6 max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-20 animate-pulse" />
              <div className="relative w-12 h-12 rounded-2xl bg-[#1a1a1a] border border-[#ff7353]/30 flex items-center justify-center">
                <Radio className="text-[#ff7353]" size={24} />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                LIVE DISCOVERY
                {streams.length > 0 && (
                  <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-sm shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                    {streams.length} ACTIVE
                  </span>
                )}
              </h1>
              <p className="text-xs text-[#767575] font-semibold uppercase tracking-widest mt-1">Real-time cinematic experiences</p>
            </div>
          </div>

          <Link
            to="/live/go"
            className="group relative flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3fff81] text-[#0e0e0e] font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_4px_20px_rgba(63,255,129,0.3)] overflow-hidden"
          >
            <div className="absolute inset-x-0 bottom-0 h-0 group-hover:h-full bg-white/20 transition-all pointer-events-none" />
            <Plus size={16} />
            Go Live Now
          </Link>
        </header>

        {loading && streams.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col gap-4">
                <div className="aspect-video w-full rounded-2xl bg-[#1a1a1a] animate-pulse" />
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1a1a1a] animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-[#1a1a1a] animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-[#1a1a1a] animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : streams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-3xl bg-[#1a1a1a] border border-[#262626] flex items-center justify-center mb-6">
              <Radio size={32} className="text-[#484847]" />
            </div>
            <h2 className="text-lg font-black text-white uppercase tracking-widest mb-2">Silence on Air</h2>
            <p className="text-sm text-[#767575] max-w-sm mx-auto">No cinematic broadcasts are currently active. Be the one to break the silence.</p>
            <Link to="/live/go" className="mt-8 text-xs text-[#3fff81] font-black uppercase tracking-widest hover:opacity-80 transition-opacity">
              Start Your Broadcast
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {streams.map((s: any) => (
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
        )}
      </main>

      <BottomNav />
    </div>
  );
};
