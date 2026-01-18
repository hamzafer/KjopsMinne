"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Camera,
  FileImage,
  Check,
  Loader2,
  AlertCircle,
  X
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

export default function UploadPage() {
  const router = useRouter();
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedId, setUploadedId] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!validTypes.includes(file.type)) {
      setError("Kun bilder (JPG, PNG, WebP, HEIC) er tillatt");
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
        router.push(`/receipts/${receipt.id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opplasting feilet");
      setState("error");
    }
  }, [router]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState("idle");

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState("dragging");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState("idle");
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
    setPreview(null);
    setUploadedId(null);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-display text-fjord-800 mb-2">
          Last opp kvittering
        </h1>
        <p className="text-stone">
          Ta bilde av kvitteringen eller velg en fil fra enheten din.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        className={cn(
          "dropzone p-8 animate-slide-up stagger-1",
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
            <div className="relative rounded-xl overflow-hidden bg-white shadow-paper max-h-96">
              <img
                src={preview}
                alt="Forhåndsvisning"
                className="w-full h-full object-contain"
              />

              {/* Overlay based on state */}
              {state === "uploading" && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 text-fjord-500 animate-spin mb-3" />
                  <p className="text-fjord-600 font-medium">Behandler kvittering...</p>
                  <p className="text-sm text-stone">Leser tekst og kategoriserer varer</p>
                </div>
              )}

              {state === "success" && (
                <div className="absolute inset-0 bg-forest-500/90 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-3">
                    <Check className="w-8 h-8 text-forest-500" />
                  </div>
                  <p className="text-white font-medium text-lg">Kvittering lagret!</p>
                  <p className="text-forest-100 text-sm">Omdirigerer...</p>
                </div>
              )}

              {state === "error" && (
                <button
                  onClick={reset}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-stone hover:text-red-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Error Message */}
            {state === "error" && error && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">{error}</p>
                  <button
                    onClick={reset}
                    className="text-sm text-red-600 hover:text-red-800 mt-1"
                  >
                    Prøv igjen
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-fjord-100 to-fjord-50 flex items-center justify-center mx-auto mb-6">
              <FileImage className="w-10 h-10 text-fjord-400" />
            </div>

            {/* Text */}
            <h3 className="text-lg font-display text-fjord-700 mb-2">
              Slipp kvitteringen her
            </h3>
            <p className="text-stone mb-6">
              eller velg en fil fra enheten din
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <label className="btn-primary cursor-pointer">
                <Upload className="w-4 h-4" />
                Velg fil
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleInputChange}
                />
              </label>
              <label className="btn-secondary cursor-pointer">
                <Camera className="w-4 h-4" />
                Ta bilde
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
            <p className="text-xs text-stone-light mt-6">
              Støttede formater: JPG, PNG, WebP, HEIC
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-8 paper-card p-6 animate-slide-up stagger-2">
        <h3 className="font-display text-fjord-700 mb-4">Tips for bedre resultat</h3>
        <ul className="space-y-3">
          <TipItem>Sørg for god belysning uten skygger</TipItem>
          <TipItem>Hold kvitteringen flat og uten bretter</TipItem>
          <TipItem>Pass på at all tekst er synlig og lesbar</TipItem>
          <TipItem>Ta bildet rett ovenfra for best resultat</TipItem>
        </ul>
      </div>
    </div>
  );
}

function TipItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-5 h-5 rounded-full bg-fjord-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Check className="w-3 h-3 text-fjord-500" />
      </div>
      <span className="text-stone-dark">{children}</span>
    </li>
  );
}
