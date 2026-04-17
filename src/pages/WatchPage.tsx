import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { getVideoStatus } from "../service/video.service";
import { getSubscriptionInfo, subscribeToChannel, unsubscribeFromChannel } from "../service/subscription.service";
import type { SubscriptionInfo } from "../service/subscription.service";
import { getLikeInfo, toggleLike } from "../service/like.service";
import type { LikeInfo } from "../service/like.service";
import {
  addToWatchLater,
  removeFromWatchLater,
  getWatchLaterStatus
} from "../service/watchlater.service";
import { recordWatchHistory } from "../service/watchhistory.service";
import { getComments, addComment, deleteComment } from "../service/comment.service";
import type { CommentRecord } from "../service/comment.service";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import {
  Share2, Bookmark, ThumbsUp, Settings,
  Bell, BellOff, MessageSquare, Trash2,
} from "lucide-react";
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  useMediaState,
  useMediaPlayer,
  isHLSProvider,
  type MediaProviderAdapter,
  type MediaProviderChangeEvent
} from "@vidstack/react";
import { DefaultVideoLayout, defaultLayoutIcons } from "@vidstack/react/player/layouts/default";

// Premium player styles
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";



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

export const WatchPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [likeInfo, setLikeInfo] = useState<LikeInfo | null>(null);
  const [likeLoading, setLikeLoading] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [watchLaterLoading, setWatchLaterLoading] = useState(false);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const { showNotification } = useNotification();
  const playerRef = useRef<any>(null);

  // Custom Quality Selector component
  const QualitySelector = () => {
    const qualities = useMediaState('qualities', playerRef);
    const currentQuality = useMediaState('quality', playerRef);
    const autoQuality = useMediaState('autoQuality', playerRef);

    if (qualities.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-4 items-center">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Quality:</span>
        <button
          onClick={() => {
            if (playerRef.current) playerRef.current.autoQuality = true;
          }}
          className={`flex items-center justify-center min-w-[36px] h-8 rounded-lg text-xs font-black transition-all ${autoQuality
            ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30 ring-2 ring-violet-400/20'
            : 'bg-white/5 text-gray-500 hover:bg-white/10 border border-white/5'
            }`}
        >
          Auto
        </button>
        {[720, 480, 360].map((height) => {
          const q = qualities.find(q => q.height === height);
          const label = height === 720 ? "72" : height === 480 ? "48" : "36";

          return (
            <button
              key={height}
              disabled={!q}
              onClick={() => {
                if (playerRef.current && q) {
                  playerRef.current.autoQuality = false;
                  playerRef.current.quality = q;
                }
              }}
              className={`flex items-center justify-center min-w-[36px] h-8 px-2 rounded-lg text-xs font-black transition-all ${!autoQuality && currentQuality?.height === height
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30 ring-2 ring-violet-400/20'
                : !q
                  ? 'bg-black/20 text-gray-800 cursor-not-allowed opacity-50'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5 hover:text-white'
                }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  };


  useEffect(() => {
    const fetchVideo = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const result = await getVideoStatus(id);
        if (result.success && result.data) {
          setVideo(result.data);
          // Load subscription info, like info, and comments in parallel
          if (result.data.createdBy) {
            getSubscriptionInfo(result.data.createdBy).then(setSubInfo).catch(() => { });
          }
          getLikeInfo(id).then(setLikeInfo).catch(() => { });
          getWatchLaterStatus(id)
            .then((res) => setIsWatchLater(res.data.isWatchLater))
            .catch(() => { });
          // Silently record into watch history
          recordWatchHistory(id).catch(() => { });
          setCommentsLoading(true);
          getComments(id)
            .then(setComments)
            .catch(() => { })
            .finally(() => setCommentsLoading(false));
        } else {
          showNotification(result.message || "Video not found", "error");
        }
      } catch (error) {
        console.log("WatchPage fetchVideo error", error);
        showNotification("Failed to load video", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [id]);

  const handleSubscribeToggle = async () => {
    if (!video?.createdBy || subLoading) return;
    setSubLoading(true);
    try {
      const updated = subInfo?.isSubscribed
        ? await unsubscribeFromChannel(video.createdBy)
        : await subscribeToChannel(video.createdBy);
      setSubInfo(updated);
      showNotification(updated.isSubscribed ? "Subscribed!" : "Unsubscribed", "success");
    } catch {
      showNotification("Failed to update subscription", "error");
    } finally {
      setSubLoading(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!id || likeLoading) return;
    setLikeLoading(true);
    try {
      const updated = await toggleLike(id);
      setLikeInfo(updated);
    } catch {
      showNotification("Failed to update like", "error");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleWatchLaterToggle = async () => {
    if (!id || watchLaterLoading) return;
    setWatchLaterLoading(true);
    try {
      if (isWatchLater) {
        await removeFromWatchLater(id);
        setIsWatchLater(false);
        showNotification("Removed from Watch Later", "success");
      } else {
        await addToWatchLater(id);
        setIsWatchLater(true);
        showNotification("Added to Watch Later", "success");
      }
    } catch {
      showNotification("Failed to update Watch Later", "error");
    } finally {
      setWatchLaterLoading(false);
    }
  };

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const handleAddComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const text = parentId ? replyText : commentText;
    if (!id || !text.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const newComment = await addComment(id, text.trim(), parentId);
      setComments((prev) => [...prev, newComment]);
      if (parentId) {
        setReplyText("");
        setReplyingTo(null);
      } else {
        setCommentText("");
      }
    } catch {
      showNotification("Failed to post comment", "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id) return;
    try {
      await deleteComment(id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId));
    } catch {
      showNotification("Failed to delete comment", "error");
    }
  };

  // Group comments into threads
  const repliesByParent = comments.reduce((acc, c) => {
    if (c.parentId) {
      if (!acc[c.parentId]) acc[c.parentId] = [];
      acc[c.parentId].push(c);
    }
    return acc;
  }, {} as Record<string, CommentRecord[]>);

  const rootComments = comments.filter((c) => !c.parentId);

  const CommentItem = ({ c, depth = 0 }: { c: CommentRecord; depth?: number }) => {
    const replies = (repliesByParent[c.id] || []).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const [showReplies, setShowReplies] = useState(depth < 2); // Auto-expand first 2 levels

    return (
      <div className="flex flex-col relative">
        <div className="flex gap-3 group">
          {/* Avatar and Thread Line container */}
          <div className="flex flex-col items-center">
            <div className={`${depth > 0 ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs"} rounded-full bg-gradient-to-br from-violet-500/60 to-indigo-500/60 flex items-center justify-center text-white font-bold flex-shrink-0 relative z-10 shadow-sm shadow-black/20`}>
              {c.commenter?.name?.[0]?.toUpperCase() ?? "?"}
            </div>

            {/* Thread line connecting to replies */}
            {(replies.length > 0 && showReplies) && (
              <div className="w-[1px] flex-1 bg-gradient-to-b from-violet-500/30 via-violet-500/10 to-transparent my-1" />
            )}
          </div>

          <div className="flex-1 min-w-0 pb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white/80">{c.commenter?.name ?? "Unknown"}</span>
                <span className="text-[10px] text-gray-600">{timeAgo(c.createdAt)}</span>
              </div>
              {c.userEmail === user?.email && (
                <button
                  onClick={() => handleDeleteComment(c.id)}
                  className="text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                >
                  <Trash2 size={depth > 0 ? 11 : 13} />
                </button>
              )}
            </div>

            <p className={`${depth > 0 ? "text-xs" : "text-sm"} text-gray-300 mt-1 leading-relaxed`}>{c.content}</p>

            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => {
                  setReplyingTo(replyingTo === c.id ? null : c.id);
                  setReplyText("");
                }}
                className="text-[10px] font-bold text-gray-500 hover:text-violet-400 uppercase tracking-tight transition-colors flex items-center gap-1"
              >
                <MessageSquare size={10} />
                Reply
              </button>

              {replies.length > 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-[10px] font-bold text-violet-500 hover:text-violet-400 flex items-center gap-1.5 transition-colors"
                >
                  {showReplies ? "Hide conversation" : `Show ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
                </button>
              )}
            </div>

            {/* Reply Input */}
            {replyingTo === c.id && (
              <form
                onSubmit={(e) => handleAddComment(e, c.id)}
                className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200"
              >
                <input
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${c.commenter?.name}...`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
                />
                <div className="flex gap-1.5">
                  <button
                    type="submit"
                    disabled={!replyText.trim() || submittingComment}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-[10px] font-bold hover:bg-violet-500 disabled:opacity-40 transition-all"
                  >
                    Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-[10px] font-bold hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            )}

            {/* Nested Replies Rendering */}
            {replies.length > 0 && showReplies && (
              <div className="flex flex-col gap-5 mt-5">
                {replies.map((reply) => (
                  <CommentItem key={reply.id} c={reply} depth={depth + 1} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };





  const onProviderChange = useCallback((
    provider: MediaProviderAdapter | null,
    nativeEvent: MediaProviderChangeEvent
  ) => {
    if (isHLSProvider(provider)) {
      // HLS.js config to prevent buffering the whole video at once
      provider.config = {
        maxBufferLength: 30,     // Buffer ahead up to 30 seconds
        maxMaxBufferLength: 60,  // Absolute maximum buffer of 60 seconds (default is 600)
      };
    }
  }, []);

  return (
    <div className="min-h-dvh bg-[#0a0a12] pb-20">
      <TopBar />

      <main>
        {loading && (
          <div className="flex items-center justify-center py-32">
            <span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        )}

        {!loading && !video && (
          <div className="flex flex-col items-center justify-center py-32">
            <p className="text-sm text-gray-400">Video not found</p>
          </div>
        )}

        {!loading && video && (
          <>
            {/* Video player */}
            <div className="w-full aspect-video bg-black relative shadow-2xl overflow-hidden rounded-b-2xl md:rounded-2xl md:mx-4 md:mt-4">
              {video.status === "done" ? (
                <MediaPlayer
                  ref={playerRef}
                  title={video.title}
                  src={`http://localhost:3000/hls-output/${video.id}/master.m3u8`}
                  autoPlay
                  playsInline
                  onProviderChange={onProviderChange}
                  className="w-full h-full"
                >
                  <MediaProvider>
                    {video.thumbnailPath && (
                      <Poster
                        src={`http://localhost:3000/hls-output/${video.id}/${video.thumbnailPath}`}
                        alt={video.title}
                        className="vds-poster"
                      />
                    )}
                  </MediaProvider>
                  <DefaultVideoLayout
                    icons={defaultLayoutIcons}
                  />
                </MediaPlayer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-violet-900/30 to-indigo-900/30">
                  <span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-3" />
                  <p className="text-sm text-gray-400">Video is {video.status}...</p>
                  {video.error && <p className="text-xs text-red-400 mt-1">{video.error}</p>}
                </div>
              )}
            </div>

            {/* Video info */}
            <div className="px-4 pt-3">
              <h1 className="text-lg font-bold text-white leading-snug">
                {video.title || "Untitled Video"}
              </h1>

              {/* Custom Quality Selector - Making it impossible to miss */}
              <QualitySelector />

              {/* Uploader row */}
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => navigate(`/channel/${encodeURIComponent(video.createdBy)}`)}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex-shrink-0 hover:opacity-80 transition-opacity"
                />
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => navigate(`/channel/${encodeURIComponent(video.createdBy)}`)}
                    className="text-sm font-medium text-white leading-none hover:text-violet-300 transition-colors text-left"
                  >
                    {video.uploader?.name ?? "Unknown"}
                  </button>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {subInfo != null ? `${formatCount(subInfo.subscriberCount)} subscribers` : "—"}
                  </p>
                </div>
                {user?.email !== video.createdBy && (
                  <button
                    onClick={handleSubscribeToggle}
                    disabled={subLoading}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all disabled:opacity-60 ${subInfo?.isSubscribed
                      ? "bg-white/10 text-gray-300 hover:bg-white/15"
                      : "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-500/20"
                      }`}
                  >
                    {subLoading ? (
                      <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    ) : subInfo?.isSubscribed ? (
                      <><BellOff size={12} /> Subscribed</>
                    ) : (
                      <><Bell size={12} /> Subscribe</>
                    )}
                  </button>
                )}
              </div>

              <p className="text-[11px] text-gray-600 mt-2">{new Date(video.createdAt).toLocaleDateString()}</p>

              {/* Like + action buttons */}
              <div className="flex items-center gap-1 mt-4 flex-wrap">
                {/* Like button with real count */}
                <button
                  onClick={handleLikeToggle}
                  disabled={likeLoading}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-medium transition-all whitespace-nowrap disabled:opacity-60 ${likeInfo?.isLiked
                    ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                    : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  {likeLoading ? (
                    <span className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
                  ) : (
                    <ThumbsUp size={14} className={likeInfo?.isLiked ? "fill-violet-400 text-violet-400" : ""} />
                  )}
                  {likeInfo != null ? formatCount(likeInfo.likeCount) : "Like"}
                </button>

                <button
                  onClick={handleWatchLaterToggle}
                  disabled={watchLaterLoading}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-medium transition-all whitespace-nowrap disabled:opacity-60 ${isWatchLater
                    ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                    : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  {watchLaterLoading ? (
                    <span className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
                  ) : (
                    <Bookmark size={14} className={isWatchLater ? "fill-violet-400 text-violet-400 border-none" : ""} />
                  )}
                  {isWatchLater ? "Watch Later" : "Save"}
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                      .then(() => showNotification("Link copied!", "success"))
                      .catch(() => showNotification("Failed to copy link", "error"));
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/5 border border-white/5 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-all whitespace-nowrap"
                >
                  <Share2 size={14} />
                  Share
                </button>
              </div>

              {/* ── Comment section ──────────────────────────────────────────── */}
              <div className="mt-6 border-t border-white/5 pt-5 pb-4">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageSquare size={15} className="text-gray-500" />
                  {comments.length} Comment{comments.length !== 1 ? "s" : ""}
                </h3>

                {/* Input */}
                <form onSubmit={(e) => handleAddComment(e)} className="flex gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {user?.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      maxLength={500}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim() || submittingComment}
                      className="px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {submittingComment ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                      ) : (
                        "Post"
                      )}
                    </button>
                  </div>
                </form>

                {/* Comment list */}
                {commentsLoading ? (
                  <div className="flex justify-center py-6">
                    <span className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <MessageSquare size={24} className="text-gray-700 mb-2" />
                    <p className="text-xs text-gray-600">No comments yet. Be the first!</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {rootComments.map((c) => (
                      <CommentItem key={c.id} c={c} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

