"use client";

import { Upload, Camera, FileImage, Check, Loader2, AlertCircle, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useState, useCallback } from "react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

export default function UploadPage() {
  const router = useRouter();
  const t = useTranslations("Upload");
  const locale = useLocale();

  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [_uploadedId, setUploadedId] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
      if (!validTypes.includes(file.type)) {
        setError(t("onlyImagesAllowed"));
        setState("error");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload
      setState("uploading");
      setError(null);

      try {
        const receipt = await api.uploadReceipt(file);
        setUploadedId(receipt.id);
        setState("success");

        // Redirect after brief delay
        setTimeout(() => {
          router.push(`/${locale}/receipts/${receipt.id}`);
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("uploadFailed"));
        setState("error");
      }
    },
    [router, locale, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setState("idle");

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState("dragging");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState("idle");
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
    setPreview(null);
    setUploadedId(null);
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="mb-2 font-display text-3xl text-fjord-800">{t("title")}</h1>
        <p className="text-stone">{t("subtitle")}</p>
      </div>

      {/* Upload Zone */}
      <div
        className={cn(
          "dropzone stagger-1 animate-slide-up p-8",
          state === "dragging" && "dragover",
          state === "success" && "border-forest-400 bg-forest-50/50",
          state === "error" && "border-red-300 bg-red-50/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {preview ? (
          <div className="relative">
            {/* Preview Image */}
            <div className="relative max-h-96 min-h-48 overflow-hidden rounded-xl bg-white shadow-paper">
              <Image src={preview} alt={t("preview")} fill unoptimized className="object-contain" />

              {/* Overlay based on state */}
              {state === "uploading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80">
                  <Loader2 className="mb-3 h-10 w-10 animate-spin text-fjord-500" />
                  <p className="font-medium text-fjord-600">{t("processing")}</p>
                  <p className="text-sm text-stone">{t("readingText")}</p>
                </div>
              )}

              {state === "success" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-forest-500/90">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white">
                    <Check className="h-8 w-8 text-forest-500" />
                  </div>
                  <p className="text-lg font-medium text-white">{t("saved")}</p>
                  <p className="text-sm text-forest-100">{t("redirecting")}</p>
                </div>
              )}

              {state === "error" && (
                <button
                  onClick={reset}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone transition-colors hover:text-red-500"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Error Message */}
            {state === "error" && error && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                <div>
                  <p className="font-medium text-red-800">{error}</p>
                  <button onClick={reset} className="mt-1 text-sm text-red-600 hover:text-red-800">
                    {t("tryAgain")}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            {/* Icon */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-fjord-100 to-fjord-50">
              <FileImage className="h-10 w-10 text-fjord-400" />
            </div>

            {/* Text */}
            <h3 className="mb-2 font-display text-lg text-fjord-700">{t("dropHere")}</h3>
            <p className="mb-6 text-stone">{t("orSelectFile")}</p>

            {/* Buttons */}
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <label className="btn-primary cursor-pointer">
                <Upload className="h-4 w-4" />
                {t("selectFile")}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleInputChange}
                />
              </label>
              <label className="btn-secondary cursor-pointer">
                <Camera className="h-4 w-4" />
                {t("takePhoto")}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={handleInputChange}
                />
              </label>
            </div>

            {/* Supported formats */}
            <p className="mt-6 text-xs text-stone-light">{t("supportedFormats")}</p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="paper-card stagger-2 mt-8 animate-slide-up p-6">
        <h3 className="mb-4 font-display text-fjord-700">{t("tipsTitle")}</h3>
        <ul className="space-y-3">
          <TipItem>{t("tip1")}</TipItem>
          <TipItem>{t("tip2")}</TipItem>
          <TipItem>{t("tip3")}</TipItem>
          <TipItem>{t("tip4")}</TipItem>
        </ul>
      </div>
    </div>
  );
}

function TipItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-fjord-100">
        <Check className="h-3 w-3 text-fjord-500" />
      </div>
      <span className="text-stone-dark">{children}</span>
    </li>
  );
}
