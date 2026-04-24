import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import {
  Share2, Bookmark, ThumbsUp, Bell, BellOff, MessageSquare, Trash2, Radio, AlertCircle, Users,
} from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { ConfirmModal } from "../components/ConfirmModal";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import axiosInstance from "../client/axios";
import { getSubscriptionInfo, subscribeToChannel, unsubscribeFromChannel } from "../service/subscription.service";
import type { SubscriptionInfo } from "../service/subscription.service";
import { getLikeInfo, toggleLike } from "../service/like.service";
import type { LikeInfo } from "../service/like.service";
import { addToWatchLater, removeFromWatchLater, getWatchLaterStatus } from "../service/watchlater.service";
import { getComments, addComment, deleteComment } from "../service/comment.service";
import type { CommentRecord } from "../service/comment.service";
import {
  MediaPlayer, MediaProvider, isHLSProvider,
  type MediaProviderAdapter, type MediaProviderChangeEvent,
} from "@vidstack/react";
import { DefaultVideoLayout, defaultLayoutIcons } from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

type LiveState = "loading" | "waiting" | "live" | "offline";

interface StreamInfo {
  streamKey: string;
  title: string;
  isLive: boolean;
  thumbnailPath: string | null;
  archivedVideoId: string | null;
  creatorEmail: string;
  creator: { email: string; name: string };
  createdAt: string;
}

const HLS_LIVE_URL = (key: string) => `http://localhost:3000/live-hls/live/${key}/index.m3u8`;

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

export const WatchLivePage = () => {
  const { streamKey } = useParams<{ streamKey: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [liveState, setLiveState] = useState<LiveState>("loading");
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [hlsSrc, setHlsSrc] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);

  // social state — keyed off archivedVideoId
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const [confirmUnsubscribe, setConfirmUnsubscribe] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const playerRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);

  // ─── Fetch stream info on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!streamKey) return;
    axiosInstance.get(`/live/${streamKey}`).then(({ data }) => {
      const s = data.data.stream as StreamInfo;
      setStreamInfo(s);
      if (s.isLive) {
        setLiveState("live");
        setHlsSrc(HLS_LIVE_URL(streamKey));
      } else {
        setLiveState("waiting");
      }

      // Load social data using the pre-created video ID
      const vid = s.archivedVideoId;
      if (vid) {
        getLikeInfo(vid).then(setLikeInfo).catch(() => {});
        getWatchLaterStatus(vid).then((r) => setIsWatchLater(r.data.isWatchLater)).catch(() => {});
        setCommentsLoading(true);
        getComments(vid).then(setComments).catch(() => {}).finally(() => setCommentsLoading(false));
      }
      if (s.creatorEmail) {
        getSubscriptionInfo(s.creatorEmail).then(setSubInfo).catch(() => {});
      }
    }).catch(() => setLiveState("offline"));
  }, [streamKey]);

  // ─── Socket.io — live state events ─────────────────────────────────────────
  useEffect(() => {
    if (!streamKey) return;
    const socket = io("http://localhost:3000", { withCredentials: true });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("viewer:join", { streamKey }));
    socket.on("stream:started", () => { setLiveState("live"); setHlsSrc(HLS_LIVE_URL(streamKey!)); });
    socket.on("stream:ended", () => { setLiveState("offline"); setHlsSrc(null); });
    socket.on("viewer:count", (data: { count: number }) => setViewerCount(data.count));
    return () => { socket.emit("viewer:leave", { streamKey }); socket.disconnect(); };
  }, [streamKey]);

  // ─── HLS.js DVR config ──────────────────────────────────────────────────────
  // hls_list_size=0 on the server keeps ALL segments, so the full stream history
  // is always on disk. We configure HLS.js to load a large back-buffer so the
  // viewer can freely scrub backward (and forward to live edge) at any time.
  const onProviderChange = useCallback((
    provider: MediaProviderAdapter | null,
    _e: MediaProviderChangeEvent
  ) => {
    if (isHLSProvider(provider)) {
      provider.config = {
        // Allow seeking up to 1 hour back in the live stream
        liveBackBufferLength: 3600,
        // Stay reasonably close to live edge by default (~10 s)
        liveSyncDurationCount: 5,
        liveMaxLatencyDurationCount: 12,
        // Keep a generous forward buffer
        maxBufferLength: 60,
        maxMaxBufferLength: 600,
        // Low latency OFF — incompatible with large back-buffer DVR
        lowLatencyMode: false,
        // Retry if segments aren't ready yet (stream just started)
        manifestLoadingRetryDelay: 1000,
        manifestLoadingMaxRetry: 10,
      };
    }
  }, []);

  // ─── Social handlers — all use archivedVideoId ──────────────────────────────
  const videoId = streamInfo?.archivedVideoId ?? null;

  const handleSubscribeClick = () => {
    if (!streamInfo?.creatorEmail || subLoading) return;
    if (subInfo?.isSubscribed) {
      setConfirmUnsubscribe(true);
    } else {
      executeSubscriptionToggle(false);
    }
  };

  const executeSubscriptionToggle = async (isUnsubscribing: boolean) => {
    if (!streamInfo?.creatorEmail || subLoading) return;
    setSubLoading(true);
    setConfirmUnsubscribe(false);
    try {
      const updated = isUnsubscribing
        ? await unsubscribeFromChannel(streamInfo.creatorEmail)
        : await subscribeToChannel(streamInfo.creatorEmail);
      setSubInfo(updated);
      showNotification(updated.isSubscribed ? "Subscribed!" : "Unsubscribed", "success");
    } catch { showNotification("Failed to update subscription", "error"); }
    finally { setSubLoading(false); }
  };

  const handleLikeToggle = async () => {
    if (!videoId || likeLoading) return;
    setLikeLoading(true);
    try { const updated = await toggleLike(videoId); setLikeInfo(updated); }
    catch { showNotification("Failed to update like", "error"); }
    finally { setLikeLoading(false); }
  };

  const handleWatchLaterToggle = async () => {
    if (!videoId || watchLaterLoading) return;
    setWatchLaterLoading(true);
    try {
      if (isWatchLater) {
        await removeFromWatchLater(videoId); setIsWatchLater(false);
        showNotification("Removed from Watch Later", "success");
      } else {
        await addToWatchLater(videoId); setIsWatchLater(true);
        showNotification("Added to Watch Later", "success");
      }
    } catch { showNotification("Failed to update Watch Later", "error"); }
    finally { setWatchLaterLoading(false); }
  };

  const handleAddComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const text = parentId ? replyText : commentText;
    if (!videoId || !text.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const newComment = await addComment(videoId, text.trim(), parentId);
      setComments((prev) => [...prev, newComment]);
      if (parentId) { setReplyText(""); setReplyingTo(null); }
      else setCommentText("");
    } catch { showNotification("Failed to post comment", "error"); }
    finally { setSubmittingComment(false); }
  };

  const executeDeleteComment = async () => {
    if (!videoId || !commentToDelete) return;
    const commentId = commentToDelete;
    setCommentToDelete(null);
    try {
      await deleteComment(videoId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId));
    } catch { showNotification("Failed to delete comment", "error"); }
  };

  const repliesByParent = comments.reduce((acc, c) => {
    if (c.parentId) { acc[c.parentId] = [...(acc[c.parentId] ?? []), c]; }
    return acc;
  }, {} as Record<string, CommentRecord[]>);
  const rootComments = comments.filter((c) => !c.parentId);

  const CommentItem = ({ c, depth = 0 }: { c: CommentRecord; depth?: number }) => {
    const replies = (repliesByParent[c.id] ?? []).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const [showReplies, setShowReplies] = useState(depth < 2);
    return (
      <div className="flex flex-col relative">
        <div className="flex gap-3 group">
          <div className="flex flex-col items-center">
            <div className={`${depth > 0 ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs"} rounded-full bg-gradient-to-br from-violet-500/60 to-indigo-500/60 flex items-center justify-center text-white font-bold flex-shrink-0 relative z-10`}>
              {c.commenter?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            {replies.length > 0 && showReplies && (
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
                <button onClick={() => setCommentToDelete(c.id)} className="text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1">
                  <Trash2 size={depth > 0 ? 11 : 13} />
                </button>
              )}
            </div>
            <p className={`${depth > 0 ? "text-xs" : "text-sm"} text-gray-300 mt-1 leading-relaxed`}>{c.content}</p>
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => { setReplyingTo(replyingTo === c.id ? null : c.id); setReplyText(""); }}
                className="text-[10px] font-bold text-gray-500 hover:text-violet-400 uppercase tracking-tight transition-colors flex items-center gap-1"
              >
                <MessageSquare size={10} /> Reply
              </button>
              {replies.length > 0 && (
                <button onClick={() => setShowReplies(!showReplies)} className="text-[10px] font-bold text-violet-500 hover:text-violet-400 flex items-center gap-1.5 transition-colors">
                  {showReplies ? "Hide conversation" : `Show ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
                </button>
              )}
            </div>
            {replyingTo === c.id && (
              <form onSubmit={(e) => handleAddComment(e, c.id)} className="mt-3 flex gap-2">
                <input autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${c.commenter?.name}...`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50" />
                <div className="flex gap-1.5">
                  <button type="submit" disabled={!replyText.trim() || submittingComment}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-[10px] font-bold hover:bg-violet-500 disabled:opacity-40 transition-all">
                    Reply
                  </button>
                  <button type="button" onClick={() => setReplyingTo(null)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-[10px] font-bold hover:bg-white/10">
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {replies.length > 0 && showReplies && (
              <div className="flex flex-col gap-5 mt-5">
                {replies.map((r) => <CommentItem key={r.id} c={r} depth={depth + 1} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-wrapper">

      <main>
        {/* ── Player ─────────────────────────────────────────────────────── */}
        <div className="w-full aspect-video bg-black relative shadow-2xl overflow-hidden rounded-b-2xl md:rounded-2xl md:mx-4 md:mt-4">
          {liveState === "live" && hlsSrc ? (
            <>
              <MediaPlayer
                ref={playerRef}
                title={streamInfo?.title}
                src={hlsSrc}
                autoPlay
                playsInline
                onProviderChange={onProviderChange}
                className="w-full h-full"
              >
                <MediaProvider />
                <DefaultVideoLayout icons={defaultLayoutIcons} />
              </MediaPlayer>
              {/* LIVE badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide pointer-events-none z-10">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </div>
            </>
          ) : liveState === "loading" ? (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--surface-container-low)" }}>
              <span className="spinner" style={{ width: 32, height: 32 }} />
            </div>
          ) : liveState === "waiting" ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ background: "var(--surface-container-low)" }}>
              <Radio size={36} style={{ color: "var(--secondary)", opacity: 0.5 }} />
              <p className="text-sm font-semibold" style={{ color: "var(--on-surface-variant)" }}>Stream hasn't started yet</p>
              <p className="text-xs" style={{ color: "var(--outline)" }}>This page will update automatically when it goes live</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ background: "var(--surface-container-low)" }}>
              <AlertCircle size={36} style={{ color: "var(--outline-variant)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--on-surface-variant)" }}>This stream has ended</p>
              <p className="text-xs" style={{ color: "var(--outline)" }}>The recording will appear in Videos shortly</p>
            </div>
          )}
        </div>

        {/* ── Info + social ───────────────────────────────────────────────── */}
        {streamInfo && (
          <div className="px-4 pt-3">
            {/* Title + live pill */}
            <div className="flex items-start gap-2">
              <h1 className="text-lg font-bold text-white leading-snug flex-1">
                {streamInfo.title}
              </h1>
              {liveState === "live" && (
                <div className="shrink-0 mt-1 flex items-center gap-2">
                  <span className="flex items-center gap-1 bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    LIVE
                  </span>
                  {viewerCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                      <Users size={11} />
                      {viewerCount}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Uploader row */}
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => navigate(`/channel/${encodeURIComponent(streamInfo.creatorEmail)}`)}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex-shrink-0 hover:opacity-80 transition-opacity"
              />
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => navigate(`/channel/${encodeURIComponent(streamInfo.creatorEmail)}`)}
                  className="text-sm font-medium text-white leading-none hover:text-violet-300 transition-colors text-left"
                >
                  {streamInfo.creator?.name ?? "Unknown"}
                </button>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {subInfo != null ? `${formatCount(subInfo.subscriberCount)} subscribers` : "—"}
                </p>
              </div>
              {user?.email !== streamInfo.creatorEmail && (
                <button
                  onClick={handleSubscribeClick}
                  disabled={subLoading}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all disabled:opacity-60 ${
                    subInfo?.isSubscribed
                      ? "bg-white/10 text-gray-300 hover:bg-white/15"
                      : "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-500/20"
                  }`}
                >
                  {subLoading
                    ? <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    : subInfo?.isSubscribed ? <><BellOff size={12} /> Subscribed</> : <><Bell size={12} /> Subscribe</>
                  }
                </button>
              )}
            </div>

            <p className="text-[11px] text-gray-600 mt-2">
              {liveState === "live" ? `Started ${timeAgo(streamInfo.createdAt)}` : `Streamed ${timeAgo(streamInfo.createdAt)}`}
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-1 mt-4 flex-wrap">
              <button
                onClick={handleLikeToggle}
                disabled={likeLoading || !videoId}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-medium transition-all whitespace-nowrap disabled:opacity-60 ${
                  likeInfo?.isLiked
                    ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                    : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {likeLoading
                  ? <span className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
                  : <ThumbsUp size={14} className={likeInfo?.isLiked ? "fill-violet-400 text-violet-400" : ""} />
                }
                {likeInfo != null ? formatCount(likeInfo.likeCount) : "Like"}
              </button>

              <button
                onClick={handleWatchLaterToggle}
                disabled={watchLaterLoading || !videoId}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-medium transition-all whitespace-nowrap disabled:opacity-60 ${
                  isWatchLater
                    ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                    : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {watchLaterLoading
                  ? <span className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
                  : <Bookmark size={14} className={isWatchLater ? "fill-violet-400 text-violet-400" : ""} />
                }
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
                <Share2 size={14} /> Share
              </button>
            </div>

            {/* ── Comments ─────────────────────────────────────────────── */}
            <div className="mt-6 border-t border-white/5 pt-5 pb-4">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare size={15} className="text-gray-500" />
                {comments.length} Comment{comments.length !== 1 ? "s" : ""}
              </h3>

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
                    disabled={!videoId}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors disabled:opacity-40"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submittingComment || !videoId}
                    className="px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {submittingComment
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                      : "Post"
                    }
                  </button>
                </div>
              </form>

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
                  {rootComments.map((c) => <CommentItem key={c.id} c={c} />)}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <BottomNav />

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={confirmUnsubscribe}
        title="Unsubscribe?"
        message={`Are you sure you want to unsubscribe from ${streamInfo?.creator?.name ?? "this channel"}?`}
        confirmLabel="Unsubscribe"
        destructive
        onConfirm={() => executeSubscriptionToggle(true)}
        onCancel={() => setConfirmUnsubscribe(false)}
      />

      <ConfirmModal
        isOpen={commentToDelete !== null}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={executeDeleteComment}
        onCancel={() => setCommentToDelete(null)}
      />
    </div>
  );
};
