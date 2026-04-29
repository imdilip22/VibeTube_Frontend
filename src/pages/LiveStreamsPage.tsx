import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { BottomNav } from "../components/BottomNav";
import { StreamCard } from "../components/VideoCard";
import { Radio, Plus } from "lucide-react";
import axiosInstance from "../client/axios";
import { useNotification } from "../context/NotificationContext";

export const LiveStreamsPage = () => {
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const isFirstFetch = useRef(true);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/live");
      setStreams(data?.data?.streams ?? []);
    } catch {
      // Only notify on the first load; polling retries stay silent
      if (isFirstFetch.current) showNotification("Failed to load live streams", "error");
      setStreams([]);
    } finally {
      setLoading(false);
      isFirstFetch.current = false;
    }
  };

  useEffect(() => {
    fetchStreams();
    const interval = setInterval(fetchStreams, 15_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-wrapper">

      <main className="content-container">
        {/* ── Page header ─────────────────────────────────────────────── */}
        <header className="flex items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            {/* Coral glow icon */}
            <div className="relative flex-shrink-0">
              <div
                className="absolute inset-0 blur-lg opacity-30 pointer-events-none"
                style={{ background: "var(--secondary)", borderRadius: "50%" }}
              />
              <div
                className="relative w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--surface-container-low)" }}
              >
                <Radio className="animate-pulse" size={20} style={{ color: "var(--secondary)" }} />
              </div>
            </div>
            <div>
              <h1
                className="text-xl font-bold flex items-center gap-3 tracking-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
              >
                Live Discovery
                {streams.length > 0 && (
                  <span className="live-badge">
                    <span className="live-dot" />
                    {streams.length} Active
                  </span>
                )}
              </h1>
              <p
                className="text-[11px] font-semibold uppercase tracking-widest mt-0.5"
                style={{ color: "var(--on-surface-variant)" }}
              >

              </p>
            </div>
          </div>

          <Link
            to="/live/go"
            id="go-live-btn"
            className="btn-secondary flex-shrink-0"
            style={{ fontSize: 12, padding: "9px 16px" }}
          >
            <Plus size={14} />
            Go Live
          </Link>
        </header>

        {/* ── Loading skeleton ────────────────────────────────────────── */}
        {loading && streams.length === 0 && (
          <div className="video-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="skeleton aspect-video w-full" style={{ borderRadius: "var(--radius-lg)" }} />
                <div className="flex gap-3 items-start">
                  <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="skeleton h-4 w-3/4 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {!loading && streams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
              style={{ background: "var(--surface-container-low)" }}
            >
              <Radio size={28} style={{ color: "var(--outline-variant)" }} />
            </div>
            <h2
              className="text-lg font-bold uppercase tracking-widest mb-2"
              style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
            >
              Silence on Air
            </h2>
            <p className="text-sm max-w-sm mx-auto" style={{ color: "var(--outline)" }}>
              No broadcasts are currently active. Be the one to break the silence.
            </p>
            <Link
              to="/live/go"
              className="mt-8 text-xs font-black uppercase tracking-widest transition-opacity hover:opacity-70"
              style={{ color: "var(--primary)" }}
            >
              Start Your Broadcast
            </Link>
          </div>
        )}

        {/* ── Live grid ────────────────────────────────────────────────── */}
        {streams.length > 0 && (
          <div className="video-grid">
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
