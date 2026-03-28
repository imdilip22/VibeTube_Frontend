import { useState, useRef } from "react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
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
    if (f && validateFile(f)) {
      setFile(f);
      setUploadResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && validateFile(f)) {
      setFile(f);
      setUploadResult(null);
    }
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
    if (!title.trim()) {
      showNotification("Please enter a video title.", "error");
      return;
    }
    setUploading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) { clearInterval(interval); return 90; }
        return p + 10;
      });
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
      console.log("UploadPage handleUpload error", error);
      const msg = error?.response?.data?.message || "Upload failed. Please try again.";
      showNotification(msg, "error");
    } finally {
      setUploading(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setTitle("");
    clearThumbnail();
    setUploadResult(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-dvh bg-[#0a0a12] pb-20">
      <TopBar />

      <main className="px-4 pt-6">
        <h1 className="text-xl font-bold text-white mb-1">Upload Studio</h1>
        <p className="text-xs text-gray-500 mb-6">Share your content with the world</p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer min-h-[200px] ${
            dragOver
              ? "border-violet-500 bg-violet-500/10"
              : file
              ? "border-violet-500/30 bg-violet-500/5"
              : "border-white/10 bg-white/[0.02] hover:border-violet-500/30 hover:bg-violet-500/5"
          }`}
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
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
                <Upload size={24} className="text-violet-400" />
              </div>
              <p className="text-sm text-white/80 font-medium">Drag & drop your video here</p>
              <p className="text-xs text-gray-500 mt-1">or click to browse</p>
              <p className="text-[10px] text-gray-600 mt-3">MP4, MKV, AVI, MOV, WebM · Max 500MB</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 w-full">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <Film size={20} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{file.name}</p>
                  <p className="text-[10px] text-gray-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                </div>
                {!uploading && (
                  <button onClick={(e) => { e.stopPropagation(); clearAll(); }} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                    <X size={14} className="text-gray-500" />
                  </button>
                )}
              </div>

              {(uploading || progress > 0) && (
                <div className="w-full mt-4">
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5 text-right">{progress}%</p>
                </div>
              )}
            </>
          )}
        </div>

        {file && !uploadResult && (
          <>
            {/* Title input */}
            <div className="mt-4">
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Video Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your video"
                disabled={uploading}
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all disabled:opacity-50"
              />
            </div>

            {/* Thumbnail picker */}
            <div className="mt-4">
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                Thumbnail <span className="text-gray-600">(optional · JPG, PNG, WebP · max 5 MB)</span>
              </label>

              {!thumbnailPreview ? (
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 border-dashed text-sm text-gray-500 hover:border-violet-500/40 hover:text-gray-400 hover:bg-white/[0.04] transition-all disabled:opacity-50"
                >
                  <Image size={16} className="text-gray-600" />
                  Click to add a thumbnail image
                </button>
              ) : (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-white/5">
                  <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  {!uploading && (
                    <button
                      onClick={clearThumbnail}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 transition-colors"
                    >
                      <X size={14} className="text-white" />
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

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm hover:from-violet-500 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </span>
              ) : (
                "Upload Video"
              )}
            </button>
          </>
        )}

        {/* Success card */}
        {uploadResult && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Check size={16} className="text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">Upload complete</span>
            </div>
            <p className="text-xs text-gray-400">
              Title: <span className="text-white/70">{uploadResult.data?.title}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Status: <span className="text-violet-300">{uploadResult.data?.status || "processing"}</span>
            </p>
            <button
              onClick={clearAll}
              className="mt-3 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              Upload another →
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
