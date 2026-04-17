import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../components/BottomNav";
import { VideoCard } from "../components/VideoCard";
import { getAllVideos } from "../service/video.service";
import { useNotification } from "../context/NotificationContext";
import { Search, ArrowLeft, X } from "lucide-react";

export const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input as soon as the page mounts
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const result = await getAllVideos();
        if (result.success && result.data) {
          setVideos(result.data);
        }
      } catch {
        showNotification("Failed to load videos", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const filteredVideos = query.trim()
    ? videos.filter((v: any) =>
        (v.title || "").toLowerCase().includes(query.toLowerCase()) ||
        (v.uploader?.name || "").toLowerCase().includes(query.toLowerCase())
      )
    : videos;

  return (
    <div className="min-h-dvh bg-[#0e0e0e] pb-28">

      {/* ── Sticky search header ─────────────────────────────────────────── */}
      <div className="fixed top-0 w-full z-50 bg-[#0e0e0e]/90 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="cursor-pointer text-[#767575] hover:text-white transition-colors flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#767575]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos or creators..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#262626] text-sm text-white placeholder:text-[#4a4a4a] focus:outline-none focus:border-[#3fff81]/40 transition-all"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-[#767575] hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────────────────────── */}
      <main className="px-4 pt-20">

        {/* Results count label */}
        {!loading && (
          <p className="text-[10px] font-black text-[#767575] uppercase tracking-widest mb-4">
            {query.trim()
              ? `${filteredVideos.length} result${filteredVideos.length !== 1 ? "s" : ""} for "${query}"`
              : `${videos.length} videos`}
          </p>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="aspect-video w-full rounded-xl bg-[#1a1a1a] animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-[#1a1a1a] animate-pulse" />
                <div className="h-2.5 w-1/2 rounded bg-[#1a1a1a] animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredVideos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] flex items-center justify-center mb-4">
              <Search size={24} className="text-[#767575]" />
            </div>
            <p className="text-sm font-bold text-white">
              {query.trim() ? "No results found" : "No videos available"}
            </p>
            <p className="text-xs text-[#767575] mt-1">
              {query.trim() ? "Try a different search term" : "Upload a video to get started"}
            </p>
          </div>
        )}

        {/* Video grid */}
        {!loading && filteredVideos.length > 0 && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6">
            {filteredVideos.map((v: any) => (
              <VideoCard
                key={v.id}
                id={v.id}
                title={v.title || "Untitled"}
                uploaderName={v.uploader?.name ?? "Unknown"}
                channelEmail={v.createdBy}
                thumbnailPath={v.thumbnailPath}
                uploadedAt={v.createdAt}
                views={v.views ?? 0}
                likes={v.likes ?? 0}
                variant="small"
                isLiveArchive={v.isLiveArchive}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
