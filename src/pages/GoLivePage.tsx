import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import {
  Radio, StopCircle, Copy, Check, AlertCircle, ImagePlus, X,
  Users, Clock, Wifi, WifiOff, MessageSquare, Send, Trash2,
} from "lucide-react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../client/axios";
import { getComments, addComment, deleteComment } from "../service/comment.service";
import type { CommentRecord } from "../service/comment.service";

type StreamState = "idle" | "creating" | "live" | "ended";

// ── Duration formatter ─────────────────────────────────────────────────────────
const fmtDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export const GoLivePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Setup state ──────────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [streamState, setStreamState] = useState<StreamState>("idle");
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [archivedVideoId, setArchivedVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Live stats ────────────────────────────────────────────────────────────────
  const [viewerCount, setViewerCount] = useState(0);
  const [duration, setDuration] = useState(0);  // seconds since went live
  const [isConnected, setIsConnected] = useState(false);

  // ── Live chat ─────────────────────────────────────────────────────────────────
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [chatText, setChatText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Refs ──────────────────────────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Camera preview on mount ───────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError("Camera/microphone access denied. Please allow permissions and refresh."));

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      socketRef.current?.disconnect();
      if (durationRef.current) clearInterval(durationRef.current);
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, []);

  // ── Re-apply srcObject whenever the <video> element re-mounts (state change) ─
  // When streamState switches views React swaps the DOM node, losing srcObject.
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [streamState]);

  // ── Auto-scroll chat to bottom ────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // ── Thumbnail handlers ────────────────────────────────────────────────────────
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const clearThumbnail = () => {
    setThumbnail(null);
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(null);
    if (thumbInputRef.current) thumbInputRef.current.value = "";
  };

  // ── Start live chat polling ───────────────────────────────────────────────────
  const startChatPolling = (videoId: string) => {
    const poll = async () => {
      try {
        const data = await getComments(videoId);
        setComments(data);
      } catch { /* silent */ }
    };
    poll();
    chatPollRef.current = setInterval(poll, 4000);
  };

  // ── Go Live ───────────────────────────────────────────────────────────────────
  const handleGoLive = async () => {
    if (!title.trim()) { setError("Please enter a stream title."); return; }
    if (!streamRef.current) { setError("No camera/microphone stream available."); return; }
    setError(null);
    setStreamState("creating");

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      if (thumbnail) formData.append("thumbnail", thumbnail);

      const { data } = await axiosInstance.post("/live", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const key: string = data.data.stream.streamKey;
      const vid: string | null = data.data.stream.archivedVideoId;
      setStreamKey(key);
      setArchivedVideoId(vid);

      const socket = io("http://localhost:3000", { withCredentials: true });
      socketRef.current = socket;

      socket.on("connect", () => {
        setIsConnected(true);
        socket.emit("broadcaster:start", { streamKey: key });

        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=h264,opus")
          ? "video/webm;codecs=h264,opus"
          : "video/webm";

        const recorder = new MediaRecorder(streamRef.current!, {
          mimeType,
          videoBitsPerSecond: 1_500_000,
        });

        recorder.ondataavailable = async (e) => {
          if (e.data.size > 0 && socket.connected) {
            socket.emit("broadcaster:chunk", await e.data.arrayBuffer());
          }
        };

        recorder.start(250);
        recorderRef.current = recorder;
        setStreamState("live");

        // Start duration clock
        durationRef.current = setInterval(() => setDuration((d) => d + 1), 1000);

        // Start chat polling once we have a video ID
        if (vid) startChatPolling(vid);
      });

      socket.on("disconnect", () => setIsConnected(false));
      socket.on("reconnect", () => setIsConnected(true));
      socket.on("viewer:count", (d: { count: number }) => setViewerCount(d.count));
      socket.on("stream:error", (d: { message: string }) => {
        setError(d.message);
        stopStream(key);
      });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to create stream.");
      setStreamState("idle");
    }
  };

  // ── End stream ────────────────────────────────────────────────────────────────
  const stopStream = (key?: string) => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    if (durationRef.current) { clearInterval(durationRef.current); durationRef.current = null; }
    if (chatPollRef.current) { clearInterval(chatPollRef.current); chatPollRef.current = null; }

    if (socketRef.current) {
      socketRef.current.emit("broadcaster:stop");
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const finalKey = key ?? streamKey;
    if (finalKey) axiosInstance.patch(`/live/${finalKey}/end`).catch(() => {});

    setStreamState("ended");
  };

  // ── Send chat message ─────────────────────────────────────────────────────────
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || submitting || !archivedVideoId) return;
    setSubmitting(true);
    try {
      const newComment = await addComment(archivedVideoId, chatText.trim(), null);
      setComments((prev) => [...prev, newComment]);
      setChatText("");
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  const handleDeleteChat = async (commentId: string) => {
    if (!archivedVideoId) return;
    try {
      await deleteComment(archivedVideoId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch { /* silent */ }
  };

  const copyWatchLink = () => {
    if (!streamKey) return;
    navigator.clipboard.writeText(`${window.location.origin}/live/watch/${streamKey}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  // ── Idle / setup ──────────────────────────────────────────────────────────────
  if (streamState === "idle" || streamState === "creating") {
    return (
      <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
        <TopBar title="Go Live" />
        <main className="flex-1 flex flex-col items-center px-4 py-6 gap-5 pb-24">
          {/* Camera preview */}
          <div className="w-full max-w-lg aspect-video bg-black rounded-2xl overflow-hidden border border-white/10">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          </div>

          {error && (
            <div className="w-full max-w-lg flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="w-full max-w-lg flex flex-col gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Stream title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you streaming today?"
                maxLength={100}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Thumbnail <span className="text-gray-600">(optional)</span>
              </label>
              {thumbnailPreview ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10">
                  <img src={thumbnailPreview} alt="thumbnail preview" className="w-full h-full object-cover" />
                  <button onClick={clearThumbnail} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => thumbInputRef.current?.click()}
                  className="w-full aspect-video rounded-xl border border-dashed border-white/15 hover:border-violet-500/50 bg-white/3 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-violet-400 transition-all"
                >
                  <ImagePlus size={22} />
                  <span className="text-xs">Click to add a thumbnail</span>
                </button>
              )}
              <input ref={thumbInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                onChange={handleThumbnailChange} className="hidden" />
            </div>

            <button
              onClick={handleGoLive}
              disabled={streamState === "creating" || !title.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-3.5 font-semibold text-sm transition-all"
            >
              <Radio size={16} />
              {streamState === "creating" ? "Starting…" : "Go Live"}
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // ── Ended ─────────────────────────────────────────────────────────────────────
  if (streamState === "ended") {
    return (
      <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
        <TopBar title="Stream Ended" />
        <main className="flex-1 flex flex-col items-center justify-center px-4 gap-5 pb-24">
          <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center">
            <Radio size={32} className="text-gray-600" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-1">Stream ended</h2>
            <p className="text-sm text-gray-500">Duration: {fmtDuration(duration)}</p>
            <p className="text-xs text-gray-600 mt-2 max-w-xs">Your recording is being processed and will appear in Videos shortly.</p>
          </div>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => { setStreamState("idle"); setStreamKey(null); setArchivedVideoId(null); setTitle(""); setError(null); setDuration(0); setViewerCount(0); setComments([]); clearThumbnail(); }}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-semibold transition-all"
            >
              Stream again
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-all text-gray-300"
            >
              Home
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // ── Live — YouTube Studio layout ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
      {/* ── Top status bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2.5 bg-[#0d0d1a]/95 backdrop-blur-xl border-b border-white/5">
        {/* Left: LIVE badge + connection dot */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-red-600 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-medium ${isConnected ? "text-green-400" : "text-yellow-400"}`}>
            {isConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
            {isConnected ? "Connected" : "Reconnecting…"}
          </div>
        </div>

        {/* Center: duration */}
        <div className="flex items-center gap-1.5 text-sm font-mono font-semibold text-white">
          <Clock size={13} className="text-gray-400" />
          {fmtDuration(duration)}
        </div>

        {/* Right: viewers + end button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Users size={13} />
            <span className="font-semibold text-white">{viewerCount}</span>
          </div>
          <button
            onClick={() => stopStream()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white text-xs font-semibold transition-all"
          >
            <StopCircle size={13} />
            End
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* ── LEFT PANEL: camera + stream info ─────────────────────────────────── */}
        <div className="md:flex-1 md:overflow-y-auto flex flex-col">
          {/* Camera preview */}
          <div className="w-full aspect-video bg-black relative">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            {/* Corner overlay: title */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
              <p className="text-sm font-semibold text-white truncate">{title}</p>
              <p className="text-[10px] text-gray-400">{user?.name}</p>
            </div>
          </div>

          {/* Stream info panel */}
          <div className="px-4 py-4 flex flex-col gap-4 border-b border-white/5 md:border-b-0">
            {/* Share link */}
            <div>
              <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">Viewer link</p>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                <span className="text-xs text-violet-300 truncate flex-1 font-mono">
                  {window.location.origin}/live/watch/{streamKey}
                </span>
                <button onClick={copyWatchLink} className="shrink-0 p-1.5 rounded-lg hover:bg-white/10">
                  {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} className="text-gray-400" />}
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-3 flex flex-col items-center gap-1">
                <Users size={16} className="text-violet-400" />
                <span className="text-xl font-bold text-white">{viewerCount}</span>
                <span className="text-[9px] text-gray-500 uppercase tracking-wide">Watching</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-3 flex flex-col items-center gap-1">
                <Clock size={16} className="text-violet-400" />
                <span className="text-xl font-bold text-white font-mono">{fmtDuration(duration)}</span>
                <span className="text-[9px] text-gray-500 uppercase tracking-wide">Duration</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-3 flex flex-col items-center gap-1">
                <MessageSquare size={16} className="text-violet-400" />
                <span className="text-xl font-bold text-white">{comments.length}</span>
                <span className="text-[9px] text-gray-500 uppercase tracking-wide">Comments</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: live chat ────────────────────────────────────────────── */}
        <div className="md:w-80 lg:w-96 flex flex-col border-t border-white/5 md:border-t-0 md:border-l md:border-white/5 bg-[#0d0d1a]" style={{ height: "calc(100vh - 48px)" }}>
          {/* Chat header */}
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <MessageSquare size={14} className="text-violet-400" />
            <span className="text-sm font-semibold text-white">Live Chat</span>
            <span className="ml-auto text-[10px] text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{comments.length}</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 min-h-0">
            {comments.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8 gap-2">
                <MessageSquare size={24} className="text-gray-700" />
                <p className="text-xs text-gray-600">No messages yet</p>
                <p className="text-[10px] text-gray-700">Viewers can comment while watching</p>
              </div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="group flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/60 to-indigo-500/60 flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white mt-0.5">
                    {c.commenter?.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-[11px] font-semibold ${c.userEmail === user?.email ? "text-violet-400" : "text-white/80"}`}>
                        {c.commenter?.name ?? "Unknown"}
                        {c.userEmail === user?.email && <span className="ml-1 text-[8px] text-violet-500/70 font-normal">(you)</span>}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed break-words">{c.content}</p>
                  </div>
                  {c.userEmail === user?.email && (
                    <button
                      onClick={() => handleDeleteChat(c.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-600 hover:text-red-400 flex-shrink-0"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="px-3 py-3 border-t border-white/5">
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Say something…"
                maxLength={300}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
              <button
                type="submit"
                disabled={!chatText.trim() || submitting}
                className="w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 flex items-center justify-center transition-all flex-shrink-0"
              >
                {submitting
                  ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                  : <Send size={12} />
                }
              </button>
            </form>
            <p className="text-[9px] text-gray-700 mt-1.5 text-center">Comments are saved and visible to viewers</p>
          </div>
        </div>
      </div>
    </div>
  );
};
