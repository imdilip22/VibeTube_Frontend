import { Link, useNavigate } from "react-router-dom";
import { ThumbsUp, Eye } from "lucide-react";

const HLS_BASE = "http://localhost:3000/hls-output";

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

const Thumbnail = ({ id, thumbnailPath, title, size }: { id: string; thumbnailPath?: string | null; title: string; size: "large" | "small" }) => {
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
    <div className="w-full h-full bg-gradient-to-br from-violet-900/40 to-indigo-900/40 flex items-center justify-center">
      <div className={`${iconSize} rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all`}>
        <div className={`w-0 h-0 border-transparent border-l-white/80 ${playSize}`} style={{ borderStyle: "solid" }} />
      </div>
    </div>
  );
};

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
}: VideoCardProps) => {
  const navigate = useNavigate();

  const goToChannel = (e: React.MouseEvent) => {
    if (!channelEmail) return;
    e.preventDefault();
    e.stopPropagation();
    navigate(`/channel/${encodeURIComponent(channelEmail)}`);
  };

  if (variant === "horizontal") {
    return (
      <Link to={`/watch/${id}`} className="flex gap-3 group">
        <div className="w-40 h-24 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
          <Thumbnail id={id} thumbnailPath={thumbnailPath} title={title} size="small" />
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <p className="text-sm font-medium text-white/90 line-clamp-2 leading-tight group-hover:text-violet-300 transition-colors">{title}</p>
          <span
            onClick={goToChannel}
            className={`text-xs text-gray-500 mt-1 ${channelEmail ? "hover:text-violet-300 cursor-pointer transition-colors" : ""}`}
          >
            {uploaderName}
          </span>
          <p className="text-xs text-gray-600 mt-0.5">{formatCount(views)} views · {timeAgo(uploadedAt)}</p>
        </div>
      </Link>
    );
  }

  if (variant === "small") {
    return (
      <Link to={`/watch/${id}`} className="group">
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-white/5">
          <Thumbnail id={id} thumbnailPath={thumbnailPath} title={title} size="small" />
        </div>
        <p className="mt-2 text-xs font-medium text-white/80 line-clamp-2 leading-tight group-hover:text-violet-300 transition-colors">{title}</p>
        <span
          onClick={goToChannel}
          className={`text-[10px] text-gray-500 mt-0.5 block ${channelEmail ? "hover:text-violet-300 cursor-pointer transition-colors" : ""}`}
        >
          {uploaderName}
        </span>
        <p className="text-[10px] text-gray-600 mt-0.5">{formatCount(views)} views · {timeAgo(uploadedAt)}</p>
      </Link>
    );
  }

  // large (feed card)
  return (
    <Link to={`/watch/${id}`} className="group block">
      {/* Thumbnail */}
      <div className="w-full aspect-video rounded-2xl overflow-hidden bg-white/5 relative">
        <Thumbnail id={id} thumbnailPath={thumbnailPath} title={title} size="large" />
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Meta */}
      <div className="mt-3 flex gap-3">
        {/* Uploader avatar */}
        <div
          onClick={goToChannel}
          className={`w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex-shrink-0 mt-0.5 ${channelEmail ? "cursor-pointer hover:opacity-75 transition-opacity" : ""}`}
        />

        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-violet-300 transition-colors">
            {title}
          </p>

          {/* Uploader name */}
          <span
            onClick={goToChannel}
            className={`text-xs text-gray-400 mt-1 block ${channelEmail ? "hover:text-violet-300 cursor-pointer transition-colors" : ""}`}
          >
            {uploaderName}
          </span>

          {/* Stats row */}
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
            <span className="text-[11px] text-gray-500">{timeAgo(uploadedAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
