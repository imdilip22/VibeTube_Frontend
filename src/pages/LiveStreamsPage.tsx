import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { StreamCard } from "../components/VideoCard";
import { Radio } from "lucide-react";
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
    // Refresh every 15 s so new streams appear without a page reload
    const interval = setInterval(fetchStreams, 15_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-dvh bg-[#0a0a12] pb-20">
      <TopBar title="Live Streams" />

      <main className="px-4 pt-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-red-500" />
            <h1 className="text-base font-bold text-white">Live Now</h1>
            {streams.length > 0 && (
              <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {streams.length}
              </span>
            )}
          </div>
          <Link
            to="/live/go"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold hover:opacity-90 transition-all"
          >
            <Radio size={12} />
            Go Live
          </Link>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            <p className="text-xs text-gray-500 mt-3">Looking for live streams…</p>
          </div>
        )}

        {!loading && streams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Radio size={24} className="text-gray-600" />
            </div>
            <p className="text-sm text-gray-400 font-medium">No one is live right now</p>
            <p className="text-xs text-gray-600 mt-1">Check back soon or start your own stream</p>
          </div>
        )}

        {!loading && streams.length > 0 && (
          <div className="flex flex-col gap-6">
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
