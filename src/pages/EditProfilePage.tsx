import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, User, Save, ArrowLeft, Image as ImageIcon, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { getProfile, updateProfile } from "../service/profile.service";
import { UPLOAD_BASE } from "../enums";
import { BottomNav } from "../components/BottomNav";
import { ConfirmModal } from "../components/ConfirmModal";

/* ── URL helpers ─────────────────────────────────────────────────────────── */
const avatarUrl = (f: string | null | undefined) =>
  f ? `${UPLOAD_BASE}/profiles/${f}` : null;
const coverUrl = (f: string | null | undefined) =>
  f ? `${UPLOAD_BASE}/covers/${f}` : null;

/* ── Drag-and-drop upload zone ────────────────────────────────────────────── */
interface DropZoneProps {
  id: string;
  label: string;
  sublabel: string;
  accept: string;
  preview: string | null;
  shape: "circle" | "rect";
  icon: React.ReactNode;
  onChange: (file: File) => void;
  onRemove: () => void;
}

const DropZone = ({ id, label, sublabel, accept, preview, shape, icon, onChange, onRemove }: DropZoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) onChange(file);
    },
    [onChange]
  );

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
        {label}
      </label>

      <div
        className="relative transition-all cursor-pointer"
        style={{
          borderRadius: shape === "circle" ? "50%" : "var(--radius-xl)",
          border: `2px dashed ${dragging ? "var(--primary)" : "var(--outline)"}`,
          background: dragging ? "rgba(63,255,129,0.04)" : "var(--surface-container)",
          overflow: "hidden",
          ...(shape === "circle" ? { width: 104, height: 104 } : { width: "100%", aspectRatio: "3/1" }),
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt={label}
              className="w-full h-full"
              style={{ objectFit: "cover", display: "block" }}
            />
            {/* Hover overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              style={{ background: "rgba(0,0,0,0.55)" }}
            >
              <Camera size={22} style={{ color: "#fff" }} />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4">
            <div style={{ color: "var(--outline)" }}>{icon}</div>
            <p className="text-[10px] text-center" style={{ color: "var(--outline)" }}>{sublabel}</p>
          </div>
        )}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); }}
        />
      </div>

      {preview && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="flex items-center gap-1 text-[10px] font-semibold self-start transition-opacity hover:opacity-70"
          style={{ color: "var(--secondary)" }}
        >
          <X size={11} /> Remove
        </button>
      )}
    </div>
  );
};

/* ── Main page ────────────────────────────────────────────────────────────── */
export const EditProfilePage = () => {
  const { user, setUser, refreshAvatar } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? "");
  const [loading, setLoading] = useState(false);

  /* ── File + preview state ─────────────────────────────────────── */
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Track which images need to be cleared on save
  const [clearAvatar, setClearAvatar] = useState(false);
  const [clearCover, setClearCover] = useState(false);

  // Confirm-remove modal state: null = closed, "avatar" | "cover" = pending
  const [pendingRemove, setPendingRemove] = useState<"avatar" | "cover" | null>(null);

  /* ── Load existing profile ─────────────────────────────────────── */
  useEffect(() => {
    getProfile()
      .then((p) => {
        if (!name) setName(p.name);
        if (p.avatar) setAvatarPreview(avatarUrl(p.avatar));
        if (p.coverPhoto) setCoverPreview(coverUrl(p.coverPhoto));
      })
      .catch(() => {});
  }, []);

  /* ── Pick handlers ─────────────────────────────────────────────── */
  const pickAvatar = (file: File) => {
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setClearAvatar(false);
  };
  const pickCover = (file: File) => {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setClearCover(false);
  };

  /* ── Confirmed remove ──────────────────────────────────────────── */
  const confirmRemove = () => {
    if (pendingRemove === "avatar") {
      setAvatarPreview(null);
      setAvatarFile(null);
      setClearAvatar(true);
    } else if (pendingRemove === "cover") {
      setCoverPreview(null);
      setCoverFile(null);
      setClearCover(true);
    }
    setPendingRemove(null);
  };

  /* ── Save ──────────────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!name.trim()) {
      showNotification("Name cannot be empty.", "error");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      if (avatarFile) fd.append("avatar", avatarFile);
      if (coverFile) fd.append("coverPhoto", coverFile);
      if (clearAvatar) fd.append("clearAvatar", "true");
      if (clearCover) fd.append("clearCover", "true");

      const updated = await updateProfile(fd);
      // Update the name in AuthContext immediately; avatar is refreshed via API
      setUser({ email: updated.email, name: updated.name });
      await refreshAvatar();
      showNotification("Profile updated!", "success");
      navigate("/profile");
    } catch {
      showNotification("Failed to save changes.", "error");
    } finally {
      setLoading(false);
    }
  };

  const displayName = name || user?.email?.split("@")[0] || "User";

  return (
    <div className="page-wrapper">
      <main className="pt-6 pb-28 px-4 max-w-lg mx-auto">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "var(--surface-container)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-container-high)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface-container)")}
          >
            <ArrowLeft size={18} style={{ color: "var(--on-surface)" }} />
          </button>
          <div>
            <h1 className="text-xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>
              Edit Profile
            </h1>
            <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Customise how others see you</p>
          </div>
        </div>

        {/* ── Cover photo ─────────────────────────────────────────────── */}
        <div className="mb-6">
          <DropZone
            id="cover-upload"
            label="Cover Photo"
            sublabel="Tap or drag · 16:9 recommended · max 5 MB"
            accept="image/*"
            preview={coverPreview}
            shape="rect"
            icon={<ImageIcon size={28} />}
            onChange={pickCover}
            onRemove={() => setPendingRemove("cover")}
          />
        </div>

        {/* ── Avatar + name row ────────────────────────────────────────── */}
        <div className="flex items-end gap-5 mb-8">
          <DropZone
            id="avatar-upload"
            label="Avatar"
            sublabel="Tap or drag"
            accept="image/*"
            preview={avatarPreview}
            shape="circle"
            icon={<User size={28} />}
            onChange={pickAvatar}
            onRemove={() => setPendingRemove("avatar")}
          />

          {/* Name field */}
          <div className="flex-1 flex flex-col gap-1.5">
            <label htmlFor="name-input" className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
              Display Name
            </label>
            <input
              id="name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={64}
              placeholder="Your name"
              className="w-full px-4 py-3 text-sm font-semibold outline-none transition-all"
              style={{
                background: "var(--surface-container)",
                borderRadius: "var(--radius-xl)",
                border: "1.5px solid var(--outline)",
                color: "var(--on-surface)",
                fontFamily: "var(--font-body)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--outline)")}
            />
            <p className="text-[10px] self-end" style={{ color: "var(--outline)" }}>{name.length}/64</p>
          </div>
        </div>

        {/* ── Live preview card ─────────────────────────────────────────── */}
        <div
          className="mb-8 overflow-hidden"
          style={{
            background: "var(--surface-container-low)",
            borderRadius: "var(--radius-2xl)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="px-5 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>
            Preview
          </p>
          {/* Cover */}
          <div style={{ height: 90, position: "relative", overflow: "hidden" }}>
            {coverPreview ? (
              <img src={coverPreview} alt="cover" className="w-full h-full" style={{ objectFit: "cover" }} />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: "linear-gradient(135deg, rgba(63,255,129,0.08) 0%, rgba(63,255,129,0.03) 50%, rgba(0,0,0,0) 100%)",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              />
            )}
          </div>
          {/* Avatar overlapping cover */}
          <div className="px-5 pb-4" style={{ paddingTop: 0 }}>
            <div className="flex items-end gap-3" style={{ marginTop: -28 }}>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black flex-shrink-0 overflow-hidden"
                style={{
                  background: avatarPreview ? "transparent" : "linear-gradient(135deg,rgba(63,255,129,0.7),#00c458)",
                  border: "3px solid var(--surface-container-low)",
                  color: "#005d27",
                }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full" style={{ objectFit: "cover" }} />
                ) : (
                  displayName[0]?.toUpperCase()
                )}
              </div>
              <div className="pb-1">
                <p className="text-sm font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>
                  {displayName}
                </p>
                <p className="text-[11px]" style={{ color: "var(--primary)" }}>
                  @{(user?.email ?? "").split("@")[0]}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Save button ───────────────────────────────────────────────── */}
        <button
          id="save-profile-btn"
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
          style={{
            background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
            color: "var(--on-primary)",
            fontFamily: "var(--font-display)",
            boxShadow: "0 4px 24px rgba(63,255,129,0.25)",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (
            <><span className="animate-spin text-lg">⟳</span> Saving…</>
          ) : (
            <><Save size={17} /> Save Changes</>
          )}
        </button>
      </main>

      <BottomNav />

      {/* ── Confirm remove modal ───────────────────────────────────────── */}
      <ConfirmModal
        isOpen={pendingRemove !== null}
        title={pendingRemove === "avatar" ? "Remove Avatar?" : "Remove Cover Photo?"}
        message={
          pendingRemove === "avatar"
            ? "Your profile picture will be removed. You can always upload a new one."
            : "Your cover photo will be removed. You can always upload a new one."
        }
        confirmLabel="Remove"
        destructive
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
};
