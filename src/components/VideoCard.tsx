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

/* ── Avatar letter bubble ─────────────────────────────────────────────────── */
const ChannelAvatar = ({
  name,
  email,
  onClick,
}: {
  name: string;
  email?: string;
  onClick?: (e: React.MouseEvent) => void;
}) => (
  <div
    onClick={onClick}
    className={`w-10 h-10 rounded-full bg-gradient-to-br from-[#3fff81]/70 to-[#00c458] flex items-center justify-center text-[#0e0e0e] text-xs font-black flex-shrink-0 ${email ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
  >
    {name[0]?.toUpperCase() ?? "?"}
  </div>
);

/* ── Thumbnail ─────────────────────────────────────────────────────────────── */
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
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
    />
  ) : (
    <div
      className={`w-full h-full flex items-center justify-center ${isLiveArchive
          ? "bg-gradient-to-br from-[#ff7353]/20 to-[#b02604]/20"
          : "bg-[#1a1a1a]"
        }`}
    >
      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
        {isLiveArchive ? (
          <Radio size={18} className="text-white/60" />
        ) : (
          <div className="w-0 h-0 border-t-[9px] border-b-[9px] border-l-[14px] border-transparent border-l-white/70 ml-1" style={{ borderStyle: "solid" }} />
        )}
      </div>
    </div>
  );

// ─── StreamCard ───────────────────────────────────────────────────────────────
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
      <div className="relative aspect-video rounded-2xl overflow-hidden mb-5 bg-[#1a1a1a] shadow-2xl border border-white/5">
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#ff7353]/10 to-[#b02604]/10 flex items-center justify-center">
            <Radio size={32} className="text-[#ff7353]/30 animate-pulse" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="flex items-center gap-1.5 bg-[#ff7353] text-[#0e0e0e] text-[10px] font-black px-2.5 py-1 rounded-sm shadow-[0_0_15px_rgba(255,115,83,0.4)]">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        </div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
      </div>

      <div className="flex gap-4">
        <ChannelAvatar name={creatorName} email={creatorEmail} onClick={goToChannel} />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white leading-tight mb-1.5 line-clamp-2 group-hover:text-[#3fff81] transition-colors tracking-tight">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <p
              onClick={goToChannel}
              className={`text-sm text-[#adaaaa] font-semibold ${creatorEmail ? "cursor-pointer hover:text-white transition-colors" : ""}`}
            >
              {creatorName}
            </p>
            <span className="w-1 h-1 rounded-full bg-[#484847]" />
            <p className="text-xs text-[#767575] font-medium leading-none">
              Started {timeAgo(startedAt)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

// ─── VideoCard ────────────────────────────────────────────────────────────────
export const VideoCard = ({
  id,
  title,
  uploaderName,
  channelEmail,
  thumbnailPath,
  uploadedAt,
  views = 0,
  likes = 0,
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

  /* ── Horizontal variant ─────────────────────────────────────────────────── */
  if (variant === "horizontal") {
    return (
      <Link to={`/watch/${id}`} className="flex gap-3 group cursor-pointer">
        <div className="w-40 h-24 rounded-xl overflow-hidden bg-[#1a1a1a] flex-shrink-0 relative">
          <Thumbnail id={id} thumbnailPath={thumbnailPath} title={title} isLiveArchive={isLiveArchive} />
          {isLiveArchive && (
            <div className="absolute top-1 left-1 bg-[#ff7353] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm">VOD</div>
          )}
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <p className="text-sm font-bold text-white line-clamp-2 leading-tight group-hover:text-[#3fff81] transition-colors">
            {title}
          </p>
          <span
            onClick={goToChannel}
            className={`text-xs text-[#adaaaa] mt-1 ${channelEmail ? "hover:text-[#3fff81] cursor-pointer transition-colors" : ""}`}
          >
            {uploaderName}
          </span>
          <p className="text-xs text-[#767575] mt-0.5">
            {formatCount(views)} Views · {metaTime}
          </p>
        </div>
      </Link>
    );
  }

  /* ── Small variant ──────────────────────────────────────────────────────── */
  if (variant === "small") {
    return (
      <div className="relative group cursor-pointer">
        <Link to={`/watch/${id}`} className="block">
          <div className="w-full aspect-video rounded-xl overflow-hidden bg-[#1a1a1a] relative">
            <Thumbnail id={id} thumbnailPath={thumbnailPath} title={title} isLiveArchive={isLiveArchive} />
            {isLiveArchive && (
              <div className="absolute top-1 left-1 bg-[#ff7353] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm">VOD</div>
            )}
          </div>
          <p className="mt-2 text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-[#3fff81] transition-colors">
            {title}
          </p>
          <span
            onClick={goToChannel}
            className={`text-[10px] text-[#adaaaa] mt-0.5 block ${channelEmail ? "hover:text-[#3fff81] cursor-pointer transition-colors" : ""}`}
          >
            {uploaderName}
          </span>
          <p className="text-[10px] text-[#767575] mt-0.5">
            {formatCount(views)} Views · {metaTime}
          </p>
        </Link>
        {action && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); action.onClick(e); }}
            className="absolute top-1 right-1 p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-red-400 border border-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
          >
            <action.icon size={12} />
          </button>
        )}
      </div>
    );
  }

  /* ── Large feed variant ─────────────────────────────────────────────────── */
  return (
    <Link to={`/watch/${id}`} className="group block cursor-pointer">
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-[#1a1a1a] shadow-lg">
        <Thumbnail id={id} thumbnailPath={thumbnailPath} title={title} isLiveArchive={isLiveArchive} />

        {/* LIVE badge — top left */}
        {isLiveArchive && (
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-[#ff7353] text-white text-[10px] font-black px-2 py-0.5 rounded-sm tracking-tighter">
              Stream
            </span>
          </div>
        )}

        {/* Duration badge — bottom right */}
        {!isLiveArchive && (
          <span className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded">
            {metaTime}
          </span>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
      </div>

      {/* Meta row */}
      <div className="flex gap-3 items-start">
        <ChannelAvatar name={uploaderName} email={channelEmail} onClick={goToChannel} />
        <div className="flex-1 min-w-0">
          {/* Title — always green */}
          <h3 className="font-bold text-[#3fff81] leading-snug mb-0.5 line-clamp-2">
            {title}
          </h3>
          {/* Channel name */}
          <p
            onClick={goToChannel}
            className={`text-sm text-white font-medium mb-0.5 ${channelEmail ? "cursor-pointer hover:text-[#3fff81] transition-colors" : ""}`}
          >
            {uploaderName}
          </p>
          {/* Views · Likes */}
          <div className="flex items-center gap-2 text-xs text-[#767575]">
            {views > 0 && <span>{formatCount(views)} Views</span>}
            {views > 0 && likes > 0 && (
              <span className="w-1 h-1 bg-[#484847] rounded-full inline-block" />
            )}
            {likes > 0 && <span>{formatCount(likes)} Likes</span>}
          </div>
        </div>
      </div>
    </Link>
  );
};
