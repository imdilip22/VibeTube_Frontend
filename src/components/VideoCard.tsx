import { Link, useNavigate } from "react-router-dom";
import { Radio } from "lucide-react";

const HLS_BASE = "http://localhost:3000/hls-output";
const LIVE_HLS_BASE = "http://localhost:3000/live-hls/live";

type VideoCardProps = {
  id: string;
  title: string;
  uploaderName: string;
  channelEmail?: string;
  thumbnailPath?: string | null;
  uploadedAt: string;
  views?: number;
  likes?: number;
  variant?: "large" | "small" | "horizontal";
  isLiveArchive?: boolean;
  action?: {
    icon: any;
    onClick: (e: React.MouseEvent) => void;
    label?: string;
  };
};

type StreamCardProps = {
  streamKey: string;
  title: string;
  creatorName: string;
  creatorEmail?: string;
  thumbnailPath?: string | null;
  startedAt: string;
};

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};

/* ── Avatar ──────────────────────────────────────────────────────────────── */
const ChannelAvatar = ({
  name,
  email,
  size = 36,
  onClick,
}: {
  name: string;
  email?: string;
  size?: number;
  onClick?: (e: React.MouseEvent) => void;
}) => (
  <div
    onClick={onClick}
    className="avatar flex-shrink-0"
    style={{
      width: size,
      height: size,
      fontSize: size * 0.36,
      cursor: email ? "pointer" : "default",
    }}
  >
    {name[0]?.toUpperCase() ?? "?"}
  </div>
);

/* ── Thumbnail ───────────────────────────────────────────────────────────── */
const Thumbnail = ({
  id,
  thumbnailPath,
  title,
  isLiveArchive,
}: {
  id: string;
  thumbnailPath?: string | null;
  title: string;
  isLiveArchive?: boolean;
}) =>
  thumbnailPath ? (
    <img
      src={`${HLS_BASE}/${id}/${thumbnailPath}`}
      alt={title}
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
      loading="lazy"
    />
  ) : (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: isLiveArchive
          ? "linear-gradient(135deg, rgba(255,115,83,0.15) 0%, rgba(176,38,4,0.15) 100%)"
          : "var(--surface-container)",
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: "var(--surface-container-high)" }}
      >
        {isLiveArchive ? (
          <Radio size={16} style={{ color: "var(--secondary)", opacity: 0.6 }} />
        ) : (
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: "8px solid transparent",
              borderBottom: "8px solid transparent",
              borderLeft: "13px solid rgba(255,255,255,0.5)",
              marginLeft: 2,
            }}
          />
        )}
      </div>
    </div>
  );

/* ─── StreamCard ─────────────────────────────────────────────────────────── */
export const StreamCard = ({
  streamKey,
  title,
  creatorName,
  creatorEmail,
  thumbnailPath,
  startedAt,
}: StreamCardProps) => {
  const navigate = useNavigate();

  const goToChannel = (e: React.MouseEvent) => {
    if (!creatorEmail) return;
    e.preventDefault();
    e.stopPropagation();
    navigate(`/channel/${encodeURIComponent(creatorEmail)}`);
  };

  const thumbnailSrc = thumbnailPath
    ? `${LIVE_HLS_BASE}/${streamKey}/${thumbnailPath}`
    : null;

  return (
    <Link to={`/live/watch/${streamKey}`} className="group block cursor-pointer">
      {/* Thumbnail */}
      <div className="thumb-wrapper mb-3" style={{ borderRadius: "var(--radius-lg)" }}>
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(255,115,83,0.1), rgba(176,38,4,0.1))" }}
          >
            <Radio size={28} style={{ color: "var(--secondary)", opacity: 0.35 }} className="animate-pulse" />
          </div>
        )}

        {/* LIVE badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="live-badge">
            <span className="live-dot" />
            LIVE
          </span>
        </div>

        {/* Bottom gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)" }}
        />
      </div>

      {/* Meta */}
      <div className="flex gap-3 items-start">
        <ChannelAvatar name={creatorName} email={creatorEmail} onClick={goToChannel} />
        <div className="flex-1 min-w-0">
          <h3
            className="text-sm font-bold leading-snug line-clamp-2 mb-1 transition-colors"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--on-surface)",
            }}
          >
            {title}
          </h3>
          <div className="flex items-center gap-1.5">
            <p
              onClick={goToChannel}
              className="text-xs font-semibold transition-colors"
              style={{
                color: "var(--on-surface-variant)",
                cursor: creatorEmail ? "pointer" : "default",
              }}
            >
              {creatorName}
            </p>
            <span
              className="w-1 h-1 rounded-full"
              style={{ background: "var(--outline-variant)" }}
            />
            <p className="text-xs" style={{ color: "var(--outline)" }}>
              {timeAgo(startedAt)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

/* ─── VideoCard ──────────────────────────────────────────────────────────── */
export const VideoCard = ({
  id,
  title,
  uploaderName,
  channelEmail,
  thumbnailPath,
  uploadedAt,
  views = 0,
  variant = "large",
  isLiveArchive = false,
  action,
}: VideoCardProps) => {
  const navigate = useNavigate();

  const goToChannel = (e: React.MouseEvent) => {
    if (!channelEmail) return;
    e.preventDefault();
    e.stopPropagation();
    navigate(`/channel/${encodeURIComponent(channelEmail)}`);
  };

  const metaTime = isLiveArchive ? `Streamed ${timeAgo(uploadedAt)}` : timeAgo(uploadedAt);

  /* ── Horizontal variant ─────────────────────────────────────────────── */
  if (variant === "horizontal") {
    return (
      <Link to={`/watch/${id}`} className="flex gap-3 group cursor-pointer">
        <div
          className="w-36 h-[81px] flex-shrink-0 overflow-hidden relative"
          style={{ borderRadius: "var(--radius-md)", background: "var(--surface-container)" }}
        >
          <Thumbnail id={id} thumbnailPath={thumbnailPath} title={title} isLiveArchive={isLiveArchive} />
          {isLiveArchive && (
            <div className="absolute top-1 left-1">
              <span
                className="text-[8px] font-black px-1.5 py-0.5 rounded-sm"
                style={{ background: "var(--secondary)", color: "#fff" }}
              >
                Stream
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <p
            className="text-xs font-semibold line-clamp-2 leading-snug transition-colors"
            style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
          >
            {title}
          </p>
          <span
            onClick={goToChannel}
            className="text-[11px] mt-1 block transition-colors"
            style={{
              color: "var(--on-surface-variant)",
              cursor: channelEmail ? "pointer" : "default",
            }}
          >
            {uploaderName}
          </span>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--outline)" }}>
            {views > 0 ? `${formatCount(views)} views · ` : ""}{metaTime}
          </p>
        </div>
      </Link>
    );
  }

  /* ── Small variant ──────────────────────────────────────────────────── */
  if (variant === "small") {
    return (
      <div className="relative group cursor-pointer">
        <Link to={`/watch/${id}`} className="block">
          <div
            className="thumb-wrapper w-full mb-2"
            style={{ borderRadius: "var(--radius-md)" }}
          >
            <Thumbnail id={id} thumbnailPath={thumbnailPath} title={title} isLiveArchive={isLiveArchive} />
            {isLiveArchive && (
              <div className="absolute top-1.5 left-1.5">
                <span
                  className="text-[8px] font-black px-1.5 py-0.5 rounded-sm"
                  style={{ background: "var(--secondary)", color: "#fff" }}
                >
                  Stream
                </span>
              </div>
            )}
            {/* Playbar */}
            <div className="playbar opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p
            className="text-xs font-semibold line-clamp-2 leading-snug transition-colors"
            style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
          >
            {title}
          </p>
          <span
            onClick={goToChannel}
            className="text-[10px] mt-0.5 block"
            style={{
              color: "var(--on-surface-variant)",
              cursor: channelEmail ? "pointer" : "default",
            }}
          >
            {uploaderName}
          </span>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--outline)" }}>
            {formatCount(views)} views · {metaTime}
          </p>
        </Link>

        {/* Action button */}
        {action && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); action.onClick(e); }}
            className="absolute top-1.5 right-1.5 p-1.5 rounded-lg glass text-red-400 border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
            style={{ borderColor: "rgba(239,68,68,0.2)" }}
          >
            <action.icon size={11} />
          </button>
        )}
      </div>
    );
  }

  /* ── Large feed variant ─────────────────────────────────────────────── */
  return (
    <Link to={`/watch/${id}`} className="group block cursor-pointer">
      {/* Thumbnail */}
      <div
        className="thumb-wrapper w-full mb-3"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <Thumbnail id={id} thumbnailPath={thumbnailPath} title={title} isLiveArchive={isLiveArchive} />

        {/* Archive badge */}
        {isLiveArchive && (
          <div className="absolute top-2.5 left-2.5">
            <span className="live-badge" style={{ background: "var(--secondary-container)" }}>
              <Radio size={8} />
              Stream
            </span>
          </div>
        )}

        {/* Hover playbar */}
        <div className="playbar opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Bottom fade */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 40%)" }}
        />
      </div>

      {/* Meta row */}
      <div className="flex gap-3 items-start">
        <ChannelAvatar name={uploaderName} email={channelEmail} size={34} onClick={goToChannel} />
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold leading-snug mb-0.5 line-clamp-2 text-sm transition-colors group-hover:opacity-90"
            style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
          >
            {title}
          </h3>
          <p
            onClick={goToChannel}
            className="text-xs transition-colors mb-0.5"
            style={{
              color: "var(--on-surface-variant)",
              cursor: channelEmail ? "pointer" : "default",
              fontWeight: 500,
            }}
          >
            {uploaderName}
          </p>
          {/* Always show views · time */}
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--outline)" }}>
            <span>{formatCount(views)} views</span>
            <span className="w-0.5 h-0.5 rounded-full inline-block" style={{ background: "var(--outline-variant)" }} />
            <span>{metaTime}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
