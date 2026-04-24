import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { BottomNav } from "../components/BottomNav";
import { VideoPlayer } from "../components/VideoPlayer";
import { ConfirmModal } from "../components/ConfirmModal";
import { getVideoStatus } from "../service/video.service";
import { getSubscriptionInfo, subscribeToChannel, unsubscribeFromChannel } from "../service/subscription.service";
import type { SubscriptionInfo } from "../service/subscription.service";
import { getLikeInfo, toggleLike } from "../service/like.service";
import type { LikeInfo } from "../service/like.service";
import {
  addToWatchLater,
  removeFromWatchLater,
  getWatchLaterStatus,
} from "../service/watchlater.service";
import { recordWatchHistory } from "../service/watchhistory.service";
import { getComments, addComment, deleteComment } from "../service/comment.service";
import type { CommentRecord } from "../service/comment.service";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import {
  Share2, Bookmark, ThumbsUp,
  Bell, BellOff, MessageSquare, Trash2,
} from "lucide-react";

/* ── Helpers ─────────────────────────────────────────────────────────────── */
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

/* ═══════════════════════════════════════════════════════════════════════════
   WatchPage
═══════════════════════════════════════════════════════════════════════════ */
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const [confirmUnsubscribe, setConfirmUnsubscribe] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [confirmWatchLater, setConfirmWatchLater] = useState(false);

  const { showNotification } = useNotification();

  /* ── Data fetching ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const fetchVideo = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const result = await getVideoStatus(id);
        if (result.success && result.data) {
          setVideo(result.data);
          if (result.data.createdBy) {
            getSubscriptionInfo(result.data.createdBy).then(setSubInfo).catch(() => {});
          }
          getLikeInfo(id).then(setLikeInfo).catch(() => {});
          getWatchLaterStatus(id)
            .then((res) => setIsWatchLater(res.data.isWatchLater))
            .catch(() => {});
          recordWatchHistory(id).catch(() => {});
          setCommentsLoading(true);
          getComments(id)
            .then(setComments)
            .catch(() => {})
            .finally(() => setCommentsLoading(false));
        } else {
          showNotification(result.message || "Video not found", "error");
        }
      } catch {
        showNotification("Failed to load video", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [id]);

  /* ── Subscription ──────────────────────────────────────────────────────── */
  const handleSubscribeClick = () => {
    if (!video?.createdBy || subLoading) return;
    if (subInfo?.isSubscribed) {
      setConfirmUnsubscribe(true);
    } else {
      executeSubscriptionToggle(false);
    }
  };

  const executeSubscriptionToggle = async (isUnsubscribing: boolean) => {
    if (!video?.createdBy || subLoading) return;
    setSubLoading(true);
    setConfirmUnsubscribe(false);
    try {
      const updated = isUnsubscribing
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

  /* ── Like ──────────────────────────────────────────────────────────────── */
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

  /* ── Watch Later ───────────────────────────────────────────────────────── */
  const handleWatchLaterToggle = async () => {
    if (!id || watchLaterLoading) return;
    if (isWatchLater) {
      setConfirmWatchLater(true);
    } else {
      executeWatchLaterToggle();
    }
  };

  const executeWatchLaterToggle = async () => {
    if (!id) return;
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
      setConfirmWatchLater(false);
    }
  };

  /* ── Comments ──────────────────────────────────────────────────────────── */
  const handleAddComment = async (
    e: React.FormEvent,
    parentId: string | null = null
  ) => {
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

  const executeDeleteComment = async () => {
    if (!id || !commentToDelete) return;
    const commentId = commentToDelete;
    setCommentToDelete(null);
    try {
      await deleteComment(id, commentId);
      setComments((prev) =>
        prev.filter((c) => c.id !== commentId && c.parentId !== commentId)
      );
    } catch {
      showNotification("Failed to delete comment", "error");
    }
  };

  /* ── Comment threading ─────────────────────────────────────────────────── */
  const repliesByParent = comments.reduce((acc, c) => {
    if (c.parentId) {
      if (!acc[c.parentId]) acc[c.parentId] = [];
      acc[c.parentId].push(c);
    }
    return acc;
  }, {} as Record<string, CommentRecord[]>);

  const rootComments = comments.filter((c) => !c.parentId);

  /* ── CommentItem sub-component ─────────────────────────────────────────── */
  const CommentItem = ({
    c,
    depth = 0,
  }: {
    c: CommentRecord;
    depth?: number;
  }) => {
    const replies = (repliesByParent[c.id] || []).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const [showReplies, setShowReplies] = useState(depth < 2);

    return (
      <div className="flex flex-col relative">
        <div className="flex gap-3 group">
          <div className="flex flex-col items-center">
            <div
              className={`${
                depth > 0 ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs"
              } rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 relative z-10`}
              style={{ background: "var(--surface-container-high)" }}
            >
              {c.commenter?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            {replies.length > 0 && showReplies && (
              <div
                className="w-[1px] flex-1 my-1"
                style={{
                  background:
                    "linear-gradient(rgba(63,255,129,0.2), rgba(63,255,129,0.02))",
                }}
              />
            )}
          </div>

          <div className="flex-1 min-w-0 pb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold"
                  style={{ color: "var(--on-surface)" }}
                >
                  {c.commenter?.name ?? "Unknown"}
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: "var(--outline)" }}
                >
                  {timeAgo(c.createdAt)}
                </span>
              </div>
              {c.userEmail === user?.email && (
                <button
                  onClick={() => setCommentToDelete(c.id)}
                  className="opacity-0 group-hover:opacity-100 transition-all p-1"
                  style={{ color: "var(--outline)" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      "var(--error)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      "var(--outline)")
                  }
                >
                  <Trash2 size={depth > 0 ? 11 : 13} />
                </button>
              )}
            </div>

            <p
              className={`${depth > 0 ? "text-xs" : "text-sm"} mt-1 leading-relaxed`}
              style={{ color: "var(--on-surface-variant)" }}
            >
              {c.content}
            </p>

            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => {
                  setReplyingTo(replyingTo === c.id ? null : c.id);
                  setReplyText("");
                }}
                className="text-[10px] font-bold uppercase tracking-tight transition-colors flex items-center gap-1"
                style={{ color: "var(--outline)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color =
                    "var(--primary)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color =
                    "var(--outline)")
                }
              >
                <MessageSquare size={10} />
                Reply
              </button>

              {replies.length > 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-[10px] font-bold transition-colors"
                  style={{ color: "var(--primary)" }}
                >
                  {showReplies
                    ? "Hide conversation"
                    : `Show ${replies.length} ${
                        replies.length === 1 ? "reply" : "replies"
                      }`}
                </button>
              )}
            </div>

            {replyingTo === c.id && (
              <form
                onSubmit={(e) => handleAddComment(e, c.id)}
                className="mt-3 flex gap-2"
              >
                <input
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${c.commenter?.name}...`}
                  className="flex-1 rounded-lg px-3 py-1.5 text-xs outline-none transition-colors"
                  style={{
                    background: "var(--surface-container)",
                    border: "1px solid var(--outline-variant)",
                    color: "var(--on-surface)",
                  }}
                  onFocus={(e) =>
                    ((e.currentTarget as HTMLElement).style.borderColor =
                      "rgba(63,255,129,0.4)")
                  }
                  onBlur={(e) =>
                    ((e.currentTarget as HTMLElement).style.borderColor =
                      "var(--outline-variant)")
                  }
                />
                <div className="flex gap-1.5">
                  <button
                    type="submit"
                    disabled={!replyText.trim() || submittingComment}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40"
                    style={{
                      background: "var(--primary)",
                      color: "#001a0d",
                    }}
                  >
                    Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                    style={{
                      background: "var(--surface-container)",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

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

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="page-wrapper">
      <main>
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-32">
            <span className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        )}

        {/* Not found */}
        {!loading && !video && (
          <div className="flex flex-col items-center justify-center py-32">
            <p className="text-sm" style={{ color: "var(--outline)" }}>
              Video not found
            </p>
          </div>
        )}

        {/* Main content */}
        {!loading && video && (
          <div className="max-w-4xl mx-auto px-4 pt-4 pb-8">
            {/* ── Player ───────────────────────────────────────────────────── */}
            {video.status === "done" ? (
              <VideoPlayer
                src={`http://localhost:3000/hls-output/${video.id}/master.m3u8`}
                poster={
                  video.thumbnailPath
                    ? `http://localhost:3000/hls-output/${video.id}/${video.thumbnailPath}`
                    : undefined
                }
                title={video.title}
                autoPlay
              />
            ) : (
              <div
                className="w-full aspect-video flex flex-col items-center justify-center rounded-xl overflow-hidden"
                style={{ background: "var(--surface-container)" }}
              >
                <span className="spinner mb-3" style={{ width: 28, height: 28 }} />
                <p className="text-sm" style={{ color: "var(--outline)" }}>
                  Video is {video.status}…
                </p>
                {video.error && (
                  <p className="text-xs mt-1" style={{ color: "var(--error)" }}>
                    {video.error}
                  </p>
                )}
              </div>
            )}

            {/* ── Title ────────────────────────────────────────────────────── */}
            <h1
              className="text-xl font-bold mt-5 leading-snug"
              style={{
                color: "var(--on-surface)",
                fontFamily: "var(--font-display)",
              }}
            >
              {video.title || "Untitled Video"}
            </h1>

            {/* ── Channel row ──────────────────────────────────────────────── */}
            <div
              className="flex items-center gap-3 mt-4 pb-4"
              style={{ borderBottom: "1px solid var(--outline-variant)" }}
            >
              <button
                onClick={() =>
                  navigate(`/channel/${encodeURIComponent(video.createdBy)}`)
                }
                className="w-10 h-10 rounded-full flex-shrink-0 transition-opacity hover:opacity-80"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(63,255,129,0.55), var(--primary))",
                }}
              />
              <div className="flex-1 min-w-0">
                <button
                  onClick={() =>
                    navigate(`/channel/${encodeURIComponent(video.createdBy)}`)
                  }
                  className="text-sm font-semibold leading-none text-left transition-colors hover:opacity-80"
                  style={{ color: "var(--on-surface)" }}
                >
                  {video.uploader?.name ?? "Unknown"}
                </button>
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: "var(--outline)" }}
                >
                  {subInfo != null
                    ? `${formatCount(subInfo.subscriberCount)} subscribers`
                    : "—"}
                </p>
              </div>

              {user?.email !== video.createdBy && (
                <button
                  onClick={handleSubscribeClick}
                  disabled={subLoading}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold transition-all disabled:opacity-60"
                  style={
                    subInfo?.isSubscribed
                      ? {
                          background: "var(--surface-container-high)",
                          color: "var(--on-surface-variant)",
                        }
                      : {
                          background: "var(--primary)",
                          color: "#001a0d",
                          boxShadow: "0 0 16px rgba(63,255,129,0.2)",
                        }
                  }
                >
                  {subLoading ? (
                    <span
                      className="w-3 h-3 border-2 rounded-full animate-spin"
                      style={{ borderColor: "currentColor transparent transparent" }}
                    />
                  ) : subInfo?.isSubscribed ? (
                    <>
                      <BellOff size={12} /> Subscribed
                    </>
                  ) : (
                    <>
                      <Bell size={12} /> Subscribe
                    </>
                  )}
                </button>
              )}
            </div>

            {/* ── Action pills ──────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {/* Like */}
              <button
                onClick={handleLikeToggle}
                disabled={likeLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap disabled:opacity-60"
                style={
                  likeInfo?.isLiked
                    ? {
                        background: "rgba(63,255,129,0.12)",
                        border: "1px solid rgba(63,255,129,0.3)",
                        color: "var(--primary)",
                      }
                    : {
                        background: "var(--surface-container)",
                        border: "1px solid transparent",
                        color: "var(--on-surface-variant)",
                      }
                }
              >
                {likeLoading ? (
                  <span
                    className="w-3 h-3 border rounded-full animate-spin"
                    style={{ borderColor: "currentColor transparent transparent" }}
                  />
                ) : (
                  <ThumbsUp
                    size={14}
                    style={likeInfo?.isLiked ? { fill: "var(--primary)" } : {}}
                  />
                )}
                {likeInfo != null ? formatCount(likeInfo.likeCount) : "Like"}
              </button>

              {/* Watch Later */}
              <button
                onClick={handleWatchLaterToggle}
                disabled={watchLaterLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap disabled:opacity-60"
                style={
                  isWatchLater
                    ? {
                        background: "rgba(63,255,129,0.12)",
                        border: "1px solid rgba(63,255,129,0.3)",
                        color: "var(--primary)",
                      }
                    : {
                        background: "var(--surface-container)",
                        border: "1px solid transparent",
                        color: "var(--on-surface-variant)",
                      }
                }
              >
                {watchLaterLoading ? (
                  <span
                    className="w-3 h-3 border rounded-full animate-spin"
                    style={{ borderColor: "currentColor transparent transparent" }}
                  />
                ) : (
                  <Bookmark
                    size={14}
                    style={isWatchLater ? { fill: "var(--primary)" } : {}}
                  />
                )}
                {isWatchLater ? "Saved" : "Save"}
              </button>

              {/* Share */}
              <button
                onClick={() => {
                  navigator.clipboard
                    .writeText(window.location.href)
                    .then(() => showNotification("Link copied!", "success"))
                    .catch(() =>
                      showNotification("Failed to copy link", "error")
                    );
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  background: "var(--surface-container)",
                  color: "var(--on-surface-variant)",
                }}
              >
                <Share2 size={14} />
                Share
              </button>

              {/* Upload date — pushed right */}
              <span
                className="ml-auto text-[11px]"
                style={{ color: "var(--outline)" }}
              >
                {new Date(video.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* ── Comments ──────────────────────────────────────────────────── */}
            <div
              className="mt-8 pt-6"
              style={{ borderTop: "1px solid var(--outline-variant)" }}
            >
              <h3
                className="text-sm font-semibold mb-5 flex items-center gap-2"
                style={{ color: "var(--on-surface)" }}
              >
                <MessageSquare size={15} style={{ color: "var(--outline)" }} />
                {comments.length} Comment{comments.length !== 1 ? "s" : ""}
              </h3>

              {/* Comment input */}
              <form
                onSubmit={(e) => handleAddComment(e)}
                className="flex gap-3 mb-7"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: "var(--primary)",
                    color: "#001a0d",
                  }}
                >
                  {user?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment…"
                    maxLength={500}
                    className="flex-1 rounded-xl px-3 py-2 text-sm outline-none transition-colors"
                    style={{
                      background: "var(--surface-container)",
                      border: "1px solid var(--outline-variant)",
                      color: "var(--on-surface)",
                    }}
                    onFocus={(e) =>
                      ((e.currentTarget as HTMLElement).style.borderColor =
                        "rgba(63,255,129,0.4)")
                    }
                    onBlur={(e) =>
                      ((e.currentTarget as HTMLElement).style.borderColor =
                        "var(--outline-variant)")
                    }
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submittingComment}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "var(--primary)", color: "#001a0d" }}
                  >
                    {submittingComment ? (
                      <span
                        className="w-4 h-4 border-2 rounded-full animate-spin block"
                        style={{ borderColor: "#001a0d transparent transparent" }}
                      />
                    ) : (
                      "Post"
                    )}
                  </button>
                </div>
              </form>

              {/* Comment list */}
              {commentsLoading ? (
                <div className="flex justify-center py-6">
                  <span className="spinner" style={{ width: 20, height: 20 }} />
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <MessageSquare
                    size={24}
                    style={{ color: "var(--outline-variant)", marginBottom: 8 }}
                  />
                  <p className="text-xs" style={{ color: "var(--outline)" }}>
                    No comments yet. Be the first!
                  </p>
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
        )}
      </main>

      <BottomNav />

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={confirmUnsubscribe}
        title="Unsubscribe?"
        message={`Are you sure you want to unsubscribe from ${video?.uploader?.name ?? "this channel"}?`}
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
      <ConfirmModal
        isOpen={confirmWatchLater}
        title="Remove from Watch Later?"
        message="Are you sure you want to remove this video from your Watch Later list?"
        confirmLabel="Remove"
        destructive
        onConfirm={executeWatchLaterToggle}
        onCancel={() => setConfirmWatchLater(false)}
      />
    </div>
  );
};
