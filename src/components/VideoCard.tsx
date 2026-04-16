import { Link, useNavigate } from "react-router-dom";
import { ThumbsUp, Eye, Radio } from "lucide-react";

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

// StreamCard is used in the Live Now section — links to watch live page
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

const Thumbnail = ({
  id,
  thumbnailPath,
  title,
  size,
  isLiveArchive,
}: {
  id: string;
  thumbnailPath?: string | null;
  title: string;
  size: "large" | "small";
  isLiveArchive?: boolean;
}) => {
  const iconSize = size === "large" ? "w-14 h-14" : "w-8 h-8";
  const playSize = size === "large"
    ? "border-t-[10px] border-b-[10px] border-l-[16px] ml-1"
    : "border-t-[6px] border-b-[6px] border-l-[10px] ml-0.5";

  return thumbnailPath ? (
    <img
      src={`${HLS_BASE}/${id}/${thumbnailPath}`}
      alt={title}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
  ) : (
    <div className={`w-full h-full flex items-center justify-center ${isLiveArchive ? "bg-gradient-to-br from-red-900/30 to-rose-900/30" : "bg-gradient-to-br from-violet-900/40 to-indigo-900/40"}`}>
      <div className={`${iconSize} rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all`}>
        {isLiveArchive
          ? <Radio size={size === "large" ? 20 : 12} className="text-white/60" />
          : <div className={`w-0 h-0 border-transparent border-l-white/80 ${playSize}`} style={{ borderStyle: "solid" }} />
        }
      </div>
    </div>
  );
};

// ─── StreamCard — for Live Now section ───────────────────────────────────────
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
    <Link to={`/live/watch/${streamKey}`} className="group block">
      <div className="w-full aspect-video rounded-2xl overflow-hidden bg-white/5 relative">
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-900/40 to-rose-900/40 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
              <Radio size={20} className="text-white/60" />
            </div>
          </div>
        )}
        {/* LIVE badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </div>
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="mt-3 flex gap-3">
        <div
          onClick={goToChannel}
          className={`w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex-shrink-0 mt-0.5 ${creatorEmail ? "cursor-pointer hover:opacity-75 transition-opacity" : ""}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-red-300 transition-colors">
            {title}
          </p>
          <span
            onClick={goToChannel}
            className={`text-xs text-gray-400 mt-1 block ${creatorEmail ? "hover:text-red-300 cursor-pointer transition-colors" : ""}`}
          >
            {creatorName}
          </span>
          <p className="text-[11px] text-gray-500 mt-1">Started {timeAgo(startedAt)}</p>
        </div>
      </div>
    </Link>
  );
};

// ─── VideoCard — regular videos + live archives ───────────────────────────────
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

  if (variant === "horizontal") {
    return (
      <Link to={`/watch/${id}`} className="flex gap-3 group">
        <div className="w-40 h-24 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 relative">
          <Thumbnail id={id} thumbnailPath={thumbnailPath} title={title} size="small" isLiveArchive={isLiveArchive} />
          {isLiveArchive && (
            <div className="absolute top-1 left-1 bg-red-600/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">VOD</div>
          )}
        </div>
        <div className="flex-col justify-center min-w-0 flex">
          <p className="text-sm font-medium text-white/90 line-clamp-2 leading-tight group-hover:text-violet-300 transition-colors">{title}</p>
          <span onClick={goToChannel} className={`text-xs text-gray-500 mt-1 ${channelEmail ? "hover:text-violet-300 cursor-pointer transition-colors" : ""}`}>
            {uploaderName}
          </span>
          <p className="text-xs text-gray-600 mt-0.5">{formatCount(views)} views · {metaTime}</p>
        </div>
      </Link>
    );
  }

  if (variant === "small") {
    return (
      <div className="relative group">
        <Link to={`/watch/${id}`} className="block">
          <div className="w-full aspect-video rounded-xl overflow-hidden bg-white/5 relative">
            <Thumbnail id={id} thumbnailPath={thumbnailPath} title={title} size="small" isLiveArchive={isLiveArchive} />
            {isLiveArchive && (
              <div className="absolute top-1 left-1 bg-red-600/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">VOD</div>
            )}
          </div>
          <p className="mt-2 text-xs font-medium text-white/80 line-clamp-2 leading-tight group-hover:text-violet-300 transition-colors uppercase">{title.toUpperCase()}</p>
          <span onClick={goToChannel} className={`text-[10px] text-gray-500 mt-0.5 block ${channelEmail ? "hover:text-violet-300 cursor-pointer transition-colors" : ""}`}>
            {uploaderName}
          </span>
          <p className="text-[10px] text-gray-600 mt-0.5">{formatCount(views)} views · {metaTime}</p>
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

  // large (feed card)
  return (
    <Link to={`/watch/${id}`} className="group block">
      <div className="w-full aspect-video rounded-2xl overflow-hidden bg-white/5 relative">
        <Thumbnail id={id} thumbnailPath={thumbnailPath} title={title} size="large" isLiveArchive={isLiveArchive} />
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
        {isLiveArchive && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600/90 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide text-white">
            <Radio size={9} />
            STREAM
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-3">
        <div onClick={goToChannel} className={`w-8 h-8 rounded-full bg-gradient-to-br ${isLiveArchive ? "from-red-500 to-rose-500" : "from-violet-500 to-indigo-500"} flex-shrink-0 mt-0.5 ${channelEmail ? "cursor-pointer hover:opacity-75 transition-opacity" : ""}`} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-violet-300 transition-colors">
            {title}
          </p>
          <span onClick={goToChannel} className={`text-xs text-gray-400 mt-1 block ${channelEmail ? "hover:text-violet-300 cursor-pointer transition-colors" : ""}`}>
            {uploaderName}
          </span>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <Eye size={11} />
              {formatCount(views)} views
            </span>
            <span className="text-gray-700">·</span>
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <ThumbsUp size={11} />
              {formatCount(likes)}
            </span>
            <span className="text-gray-700">·</span>
            <span className={`text-[11px] ${isLiveArchive ? "text-red-400/70" : "text-gray-500"}`}>{metaTime}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
