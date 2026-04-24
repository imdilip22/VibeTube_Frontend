import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Pre-populate from ?q= URL param (when navigated from TopBar)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q) setQuery(q);
  }, [location.search]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const result = await getAllVideos();
        if (result.success && result.data) setVideos(result.data);
      } catch {
        showNotification("Failed to load videos", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const filteredVideos = query.trim()
    ? videos.filter(
        (v: any) =>
          (v.title || "").toLowerCase().includes(query.toLowerCase()) ||
          (v.uploader?.name || "").toLowerCase().includes(query.toLowerCase())
      )
    : videos;

  return (
    <div className="page-wrapper">
      {/* Desktop: use the global TopBar */}

      {/* ── Mobile-only sticky search header ─────────────────────────── */}
      <div
        className="lg:hidden glass fixed top-0 w-full z-50 flex items-center gap-3 px-4 h-16"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <button
          id="search-back-btn"
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all flex-shrink-0"
          style={{ color: "var(--on-surface-variant)" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "var(--surface-container)";
            (e.currentTarget as HTMLElement).style.color = "var(--on-surface)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--on-surface-variant)";
          }}
        >
          <ArrowLeft size={18} strokeWidth={1.8} />
        </button>

        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--outline)", pointerEvents: "none" }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos or creators…"
            className="w-full pl-9 pr-9 py-2.5 text-sm transition-all"
            style={{
              background: "var(--surface-container)",
              borderRadius: "var(--radius-lg)",
              color: "var(--on-surface)",
              fontFamily: "var(--font-body)",
              border: "1px solid transparent",
            }}
            onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(63,255,129,0.25)"}
            onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "transparent"}
          />
          {query && (
            <button
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-60"
              style={{ color: "var(--on-surface-variant)" }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────────── */}
      <main className="content-container">
        {/* Count label */}
        {!loading && (
          <p
            className="text-[10px] font-black uppercase tracking-widest mb-5"
            style={{ color: "var(--on-surface-variant)" }}
          >
            {query.trim()
              ? `${filteredVideos.length} result${filteredVideos.length !== 1 ? "s" : ""} for "${query}"`
              : `${videos.length} videos`}
          </p>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="video-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="skeleton aspect-video w-full" style={{ borderRadius: "var(--radius-md)" }} />
                <div className="skeleton h-3 w-3/4 rounded" />
                <div className="skeleton h-2.5 w-1/2 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredVideos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="empty-icon">
              <Search size={22} style={{ color: "var(--outline-variant)" }} />
            </div>
            <p
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
            >
              {query.trim() ? "No results found" : "No videos available"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--outline)" }}>
              {query.trim() ? "Try a different search term" : "Upload a video to get started"}
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && filteredVideos.length > 0 && (
          <div className="video-grid">
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
