import { useState, useRef } from "react";
import { BottomNav } from "../components/BottomNav";
import { ConfirmModal } from "../components/ConfirmModal";
import { useNotification } from "../context/NotificationContext";
import { uploadVideo } from "../service/video.service";
import { Upload, Film, Check, X, Image } from "lucide-react";

const ALLOWED_FORMATS = [".mp4", ".mkv", ".avi", ".mov", ".webm"];
const ALLOWED_IMAGE_FORMATS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024;

export const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();

  const validateFile = (f: File) => {
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_FORMATS.includes(ext)) {
      showNotification(`Unsupported format: ${ext}`, "error");
      return false;
    }
    if (f.size > MAX_FILE_SIZE) {
      showNotification("File too large. Max 500MB.", "error");
      return false;
    }
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && validateFile(f)) { setFile(f); setUploadResult(null); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && validateFile(f)) { setFile(f); setUploadResult(null); }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_IMAGE_FORMATS.includes(ext)) {
      showNotification("Thumbnail must be JPG, PNG, or WebP.", "error");
      return;
    }
    if (f.size > MAX_THUMBNAIL_SIZE) {
      showNotification("Thumbnail must be under 5 MB.", "error");
      return;
    }
    setThumbnail(f);
    setThumbnailPreview(URL.createObjectURL(f));
  };

  const clearThumbnail = () => {
    setThumbnail(null);
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!title.trim()) { showNotification("Please enter a video title.", "error"); return; }
    setUploading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => { if (p >= 90) { clearInterval(interval); return 90; } return p + 10; });
    }, 300);
    try {
      const result = await uploadVideo(file, title.trim(), thumbnail ?? undefined);
      clearInterval(interval);
      setProgress(100);
      setUploadResult(result);
      showNotification("Video uploaded! Transcoding started.", "success");
    } catch (error: any) {
      clearInterval(interval);
      setProgress(0);
      showNotification(error?.response?.data?.message || "Upload failed. Please try again.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleClearClick = () => {
    if (file || title || thumbnail) {
      setConfirmClear(true);
    } else {
      executeClear();
    }
  };

  const executeClear = () => {
    setFile(null); setTitle(""); clearThumbnail(); setUploadResult(null); setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setConfirmClear(false);
  };

  return (
    <div className="page-wrapper">

      <main className="content-container max-w-2xl mx-auto lg:mx-0">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="mb-7">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
          >
            Upload Studio
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--on-surface-variant)" }}>
            Share your content with the world
          </p>
        </div>

        {/* ── Drop zone ───────────────────────────────────────────── */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          className="relative flex flex-col items-center justify-center p-8 min-h-[180px] transition-all cursor-pointer"
          style={{
            background: dragOver
              ? "rgba(63,255,129,0.06)"
              : file
              ? "rgba(63,255,129,0.03)"
              : "var(--surface-container-low)",
            borderRadius: "var(--radius-xl)",
            border: dragOver
              ? "2px dashed rgba(63,255,129,0.5)"
              : file
              ? "2px dashed rgba(63,255,129,0.25)"
              : "2px dashed rgba(72,72,71,0.4)",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp4,.mkv,.avi,.mov,.webm"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!file ? (
            <>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(63,255,129,0.08)" }}
              >
                <Upload size={24} style={{ color: "var(--primary)" }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>
                Drag & drop your video here
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--outline)" }}>or click to browse</p>
              <p className="text-[10px] mt-3 font-semibold uppercase tracking-wider" style={{ color: "var(--surface-container-highest)" }}>
                MP4, MKV, AVI, MOV, WebM · Max 500MB
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 w-full">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(63,255,129,0.08)" }}
                >
                  <Film size={20} style={{ color: "var(--primary)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--on-surface)" }}>
                    {file.name}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--outline)" }}>
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                {!uploading && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClearClick(); }}
                    className="p-1.5 rounded-lg transition-colors hover:opacity-70"
                    style={{ color: "var(--outline)" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {(uploading || progress > 0) && (
                <div className="w-full mt-5">
                  {/* Progress bar */}
                  <div
                    className="h-1.5 overflow-hidden"
                    style={{ background: "var(--surface-container-high)", borderRadius: 99 }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${progress}%`,
                        background: "linear-gradient(90deg, var(--primary), var(--primary-container))",
                        borderRadius: 99,
                        boxShadow: "0 0 8px rgba(63,255,129,0.4)",
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <p className="text-[10px] font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                      {progress < 100 ? "Uploading…" : "Processing…"}
                    </p>
                    <p className="text-[10px] font-bold" style={{ color: "var(--primary)" }}>
                      {progress}%
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {file && !uploadResult && (
          <>
            {/* ── Title field ─────────────────────────────────────── */}
            <div className="mt-5">
              <label
                className="block text-[11px] font-bold uppercase tracking-widest mb-2"
                style={{ color: "var(--on-surface-variant)" }}
              >
                Video Title
              </label>
              <div
                className="flex items-center gap-2.5 px-3 py-3 transition-all"
                style={{
                  background: "var(--surface-container-lowest)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(72,72,71,0.3)",
                }}
                onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(63,255,129,0.3)"}
                onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(72,72,71,0.3)"}
              >
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your video a great title…"
                  disabled={uploading}
                  maxLength={100}
                  className="flex-1 bg-transparent text-sm disabled:opacity-50"
                  style={{ color: "var(--on-surface)", fontFamily: "var(--font-body)" }}
                />
                <span className="text-[10px]" style={{ color: "var(--surface-container-highest)", flexShrink: 0 }}>
                  {title.length}/100
                </span>
              </div>
            </div>

            {/* ── Thumbnail picker ─────────────────────────────────── */}
            <div className="mt-4">
              <label
                className="block text-[11px] font-bold uppercase tracking-widest mb-2"
                style={{ color: "var(--on-surface-variant)" }}
              >
                Thumbnail&nbsp;
                <span
                  className="normal-case text-[10px] font-medium"
                  style={{ color: "var(--outline)" }}
                >
                  optional · JPG, PNG, WebP · max 5 MB
                </span>
              </label>

              {!thumbnailPreview ? (
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-all disabled:opacity-50"
                  style={{
                    background: "var(--surface-container-low)",
                    borderRadius: "var(--radius-md)",
                    border: "2px dashed rgba(72,72,71,0.3)",
                    color: "var(--outline)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(63,255,129,0.3)";
                    (e.currentTarget as HTMLElement).style.color = "var(--on-surface-variant)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(72,72,71,0.3)";
                    (e.currentTarget as HTMLElement).style.color = "var(--outline)";
                  }}
                >
                  <Image size={15} />
                  Click to add a thumbnail image
                </button>
              ) : (
                <div
                  className="relative w-full overflow-hidden"
                  style={{ aspectRatio: "16/9", borderRadius: "var(--radius-md)", background: "var(--surface-container)" }}
                >
                  <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  {!uploading && (
                    <button
                      onClick={clearThumbnail}
                      className="absolute top-2 right-2 p-1.5 rounded-lg glass transition-colors"
                      style={{ color: "var(--on-surface)" }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}

              <input
                ref={thumbnailInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleThumbnailSelect}
                className="hidden"
              />
            </div>

            {/* ── Upload button ────────────────────────────────────── */}
            <button
              id="upload-submit-btn"
              onClick={handleUpload}
              disabled={uploading || !title.trim()}
              className="btn-primary w-full mt-5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Upload Video
                </>
              )}
            </button>
          </>
        )}

        {/* ── Success state ────────────────────────────────────────── */}
        {uploadResult && (
          <div
            className="mt-5 p-5 slide-up"
            style={{
              background: "rgba(63,255,129,0.06)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid rgba(63,255,129,0.15)",
            }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(63,255,129,0.15)" }}
              >
                <Check size={16} style={{ color: "var(--primary)" }} />
              </div>
              <span
                className="text-sm font-bold"
                style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}
              >
                Upload Complete
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
              Title:&nbsp;
              <span style={{ color: "var(--on-surface)", fontWeight: 600 }}>
                {uploadResult.data?.title}
              </span>
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--on-surface-variant)" }}>
              Status:&nbsp;
              <span style={{ color: "var(--primary)", fontWeight: 600, textTransform: "capitalize" }}>
                {uploadResult.data?.status || "processing"}
              </span>
            </p>
            <button
              onClick={executeClear}
              className="mt-4 text-xs font-bold transition-opacity hover:opacity-70"
              style={{ color: "var(--primary)" }}
            >
              Upload another →
            </button>
          </div>
        )}
      </main>

      <BottomNav />

      <ConfirmModal
        isOpen={confirmClear}
        title="Discard Upload?"
        message="Are you sure you want to discard this upload? All filled details will be lost."
        confirmLabel="Discard"
        destructive
        onConfirm={executeClear}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
};
