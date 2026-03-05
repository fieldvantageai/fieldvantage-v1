"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  AlertTriangle,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useClientT } from "@/lib/i18n/useClientT";
import { useLocale } from "@/lib/i18n/localeClient";

type Attachment = {
  id: string;
  job_id: string;
  company_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
  signed_url: string | null;
  note: string | null;
};

type JobAttachmentsSectionProps = {
  jobId: string;
};

function formatDate(dateStr: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(new Date(dateStr));
  } catch {
    return dateStr.slice(0, 10);
  }
}

export default function JobAttachmentsSection({
  jobId
}: JobAttachmentsSectionProps) {
  const { t } = useClientT("jobs");
  const { locale } = useLocale();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  const fetchAttachments = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/attachments`);
      if (res.ok) {
        const json = await res.json();
        setAttachments(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append("files", file);
      }

      const res = await fetch(`/api/jobs/${jobId}/attachments`, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const json = await res.json();
        setAttachments((prev) => [...(json.data ?? []), ...prev]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/jobs/${jobId}/attachments/${deleteTarget}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setAttachments((prev) => prev.filter((a) => a.id !== deleteTarget));
        if (
          lightboxIndex !== null &&
          imageAttachments[lightboxIndex]?.id === deleteTarget
        ) {
          setLightboxIndex(null);
        }
      }
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleSaveNote = async () => {
    if (lightboxIndex === null) return;
    const att = imageAttachments[lightboxIndex];
    if (!att) return;

    setSavingNote(true);
    try {
      const res = await fetch(
        `/api/jobs/${jobId}/attachments/${att.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: noteValue })
        }
      );
      if (res.ok) {
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === att.id ? { ...a, note: noteValue.trim() || null } : a
          )
        );
        setEditingNote(false);
      }
    } finally {
      setSavingNote(false);
    }
  };

  const isImage = (mime: string | null) =>
    mime?.startsWith("image/") ?? false;

  const imageAttachments = attachments.filter((a) => isImage(a.mime_type));

  const openLightbox = (attachment: Attachment) => {
    const idx = imageAttachments.findIndex((a) => a.id === attachment.id);
    if (idx >= 0) {
      setLightboxIndex(idx);
      setEditingNote(false);
      setNoteValue(imageAttachments[idx].note ?? "");
    }
  };

  const lightboxPrev = () => {
    setLightboxIndex((i) => {
      const next =
        i !== null
          ? (i - 1 + imageAttachments.length) % imageAttachments.length
          : null;
      if (next !== null) {
        setEditingNote(false);
        setNoteValue(imageAttachments[next].note ?? "");
      }
      return next;
    });
  };

  const lightboxNext = () => {
    setLightboxIndex((i) => {
      const next = i !== null ? (i + 1) % imageAttachments.length : null;
      if (next !== null) {
        setEditingNote(false);
        setNoteValue(imageAttachments[next].note ?? "");
      }
      return next;
    });
  };

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (editingNote) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") lightboxPrev();
      if (e.key === "ArrowRight") lightboxNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (editingNote && noteInputRef.current) {
      noteInputRef.current.focus();
    }
  }, [editingNote]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  const currentLightboxAtt =
    lightboxIndex !== null ? imageAttachments[lightboxIndex] : null;

  return (
    <div className="space-y-3">
      {attachments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200/70 bg-white/90 p-6 text-center text-sm text-slate-500">
          <Camera className="h-8 w-8 text-slate-300" />
          <p className="font-medium text-slate-700">
            {t("detail.attachments.emptyTitle")}
          </p>
          <p className="text-xs text-slate-400">
            {t("detail.attachments.emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200/70 bg-slate-50"
            >
              {isImage(att.mime_type) && att.signed_url ? (
                <button
                  type="button"
                  className="h-full w-full"
                  onClick={() => openLightbox(att)}
                >
                  <img
                    src={att.signed_url}
                    alt={att.file_name}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </button>
              ) : (
                <a
                  href={att.signed_url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-full w-full flex-col items-center justify-center gap-2 p-3"
                >
                  <ImageIcon className="h-8 w-8 text-slate-400" />
                  <span className="line-clamp-2 text-center text-xs text-slate-600">
                    {att.file_name}
                  </span>
                </a>
              )}

              {/* Date + note overlay */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-5">
                <p className="text-[10px] leading-tight text-white/90">
                  {formatDate(att.created_at, locale)}
                </p>
                {att.note && (
                  <p className="mt-0.5 truncate text-[10px] leading-tight text-white/70">
                    {att.note}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setDeleteTarget(att.id)}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition hover:bg-black/70 group-hover:opacity-100"
                aria-label="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {uploading
            ? t("detail.attachments.uploading")
            : t("detail.attachments.addPhoto")}
        </Button>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && currentLightboxAtt && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setLightboxIndex(null)}
            aria-label={t("detail.attachments.close")}
          >
            <X className="h-5 w-5" />
          </button>

          {imageAttachments.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  lightboxPrev();
                }}
                aria-label={t("detail.attachments.previous")}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  lightboxNext();
                }}
                aria-label={t("detail.attachments.next")}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <img
            src={currentLightboxAtt.signed_url ?? ""}
            alt={currentLightboxAtt.file_name}
            className="max-h-[70vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Metadata + note below image */}
          <div
            className="mt-3 w-full max-w-md px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-xs text-white/60">
              {t("detail.attachments.addedAt")}{" "}
              {formatDate(currentLightboxAtt.created_at, locale)}
            </p>

            {editingNote ? (
              <div className="mt-2 flex items-end gap-2">
                <textarea
                  ref={noteInputRef}
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveNote();
                    }
                    if (e.key === "Escape") {
                      setEditingNote(false);
                      setNoteValue(currentLightboxAtt.note ?? "");
                    }
                  }}
                  placeholder={t("detail.attachments.notePlaceholder")}
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={savingNote}
                  onClick={handleSaveNote}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white transition hover:bg-white/30 disabled:opacity-50"
                >
                  {savingNote ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingNote(false);
                    setNoteValue(currentLightboxAtt.note ?? "");
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNoteValue(currentLightboxAtt.note ?? "");
                  setEditingNote(true);
                }}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm text-white/70 transition hover:bg-white/10"
              >
                {currentLightboxAtt.note ? (
                  <>
                    <span className="line-clamp-2 text-center">
                      {currentLightboxAtt.note}
                    </span>
                    <Pencil className="ml-1 h-3.5 w-3.5 shrink-0 text-white/40" />
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    {t("detail.attachments.addNote")}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">
                  {t("detail.attachments.deleteTitle")}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {t("detail.attachments.deleteDescription")}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting ? (
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {isDeleting
                  ? t("detail.attachments.deleting")
                  : t("detail.attachments.confirmDelete")}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {t("detail.attachments.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
