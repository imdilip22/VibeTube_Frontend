/**
 * VideoPlayer — HLS.js + native <video> controls
 *
 * Why native controls instead of Plyr?
 *  • Plyr's CSS fails to load in some Vite builds, leaving the player control-less.
 *  • Native controls work on every browser including Safari (which uses native HLS).
 *  • We layer our own quality switcher on top via HLS.js level API.
 */
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface QualityLevel {
  index: number;
  height: number;
  bitrate: number;
}

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
}

export const VideoPlayer = ({
  src,
  poster,
  title,
  autoPlay = true,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [isAuto, setIsAuto] = useState(true);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError(null);
    setQualities([]);
    setIsAuto(true);
    setCurrentLevelIndex(-1);

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1,             // let HLS.js auto-select start quality
        capLevelToPlayerSize: true,
        enableWorker: true,
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        // Deduplicate levels by height (keep highest bitrate per resolution)
        const levelMap: Record<number, QualityLevel> = {};
        data.levels.forEach((l, i) => {
          if (!levelMap[l.height] || l.bitrate > levelMap[l.height].bitrate) {
            levelMap[l.height] = { index: i, height: l.height, bitrate: l.bitrate };
          }
        });
        setQualities(Object.values(levelMap));

        if (autoPlay) {
          video.play().catch(() => {
            // Autoplay blocked by browser — user must click
          });
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentLevelIndex(data.level);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad(); // try to recover
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setError("Playback error. Please refresh.");
              hls.destroy();
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari — native HLS support, no quality API available
      video.src = src;
      if (autoPlay) video.autoplay = true;
    } else {
      setError("Your browser does not support HLS playback.");
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src]);

  const setQuality = (levelIndex: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = levelIndex; // -1 = auto-quality
    setIsAuto(levelIndex === -1);
    if (levelIndex !== -1) setCurrentLevelIndex(levelIndex);
  };

  // The height of the actively playing level
  const activeHeight =
    qualities.find((q) => q.index === currentLevelIndex)?.height ?? null;

  return (
    <div className="w-full">
      {/* ── Video shell ─────────────────────────────────────────────────────── */}
      <div
        className="w-full aspect-video bg-black overflow-hidden shadow-2xl relative"
        style={{ borderRadius: 12 }}
      >
        <video
          ref={videoRef}
          poster={poster}
          playsInline
          controls
          title={title}
          className="w-full h-full"
          style={{ display: "block", outline: "none" }}
        />

        {/* Fatal error overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-2">
            <p className="text-sm font-medium" style={{ color: "var(--error)" }}>
              {error}
            </p>
          </div>
        )}
      </div>

      {/* ── Quality selector ────────────────────────────────────────────────── */}
      {qualities.length > 0 && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span
            className="text-[10px] font-black uppercase tracking-widest select-none"
            style={{ color: "var(--outline)" }}
          >
            Quality
          </span>

          {/* Auto */}
          <button
            onClick={() => setQuality(-1)}
            className="px-3 h-7 rounded-lg text-xs font-black transition-all select-none"
            style={{
              background: isAuto ? "var(--primary)" : "var(--surface-container)",
              color: isAuto ? "#001a0d" : "var(--on-surface-variant)",
              boxShadow: isAuto ? "0 0 10px rgba(63,255,129,0.25)" : "none",
            }}
          >
            Auto{isAuto && activeHeight ? ` · ${activeHeight}p` : ""}
          </button>

          {/* Specific quality levels — sorted highest first */}
          {[...qualities]
            .sort((a, b) => b.height - a.height)
            .map((q) => {
              const isActive = !isAuto && currentLevelIndex === q.index;
              return (
                <button
                  key={q.index}
                  onClick={() => setQuality(q.index)}
                  className="px-3 h-7 rounded-lg text-xs font-black transition-all select-none"
                  style={{
                    background: isActive
                      ? "var(--primary)"
                      : "var(--surface-container)",
                    color: isActive
                      ? "#001a0d"
                      : "var(--on-surface-variant)",
                    boxShadow: isActive
                      ? "0 0 8px rgba(63,255,129,0.25)"
                      : "none",
                  }}
                >
                  {q.height}p
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
};
