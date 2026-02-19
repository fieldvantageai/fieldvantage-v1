"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/Button";

type CustomerAvatarUploadProps = {
  value?: string | null;
  previewUrl?: string | null;
  onUpload: (file: File) => Promise<{
    avatar_url: string;
    avatar_signed_url?: string | null;
  }>;
  onRemove: () => void;
  label: string;
};

export default function CustomerAvatarUpload({
  value,
  previewUrl,
  onUpload,
  onRemove,
  label
}: CustomerAvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const hasPreview = Boolean(previewUrl || value);

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setIsUploading(true);
    try {
      await onUpload(file);
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative">
          <div className="h-20 w-20 overflow-hidden rounded-full border border-slate-200/70 bg-slate-100">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={label}
                className="h-full w-full object-cover"
              />
            ) : value ? (
              <img
                src={value}
                alt={label}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
                {label.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <button
            type="button"
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            onClick={() => inputRef.current?.click()}
            aria-label="Editar foto"
            disabled={isUploading}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 20h4l11-11-4-4L4 16v4Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m14 6 4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">
            {isUploading ? "Enviando..." : "Escolha uma imagem para o cliente."}
          </p>
          {hasPreview ? (
            <button
              type="button"
              className="text-xs font-semibold text-rose-500 hover:text-rose-600"
              onClick={onRemove}
            >
              Remover
            </button>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelect}
      />
    </div>
  );
}
