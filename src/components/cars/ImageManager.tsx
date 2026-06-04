"use client";

import React, { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useImages, addImage, deleteImage } from "@/lib/hooks";
import { X, Upload, Image as ImageIcon, Maximize2 } from "lucide-react";
import type { ImageAttachment } from "@/lib/db";

interface ImageManagerProps {
  entityId?: string | number;
  entityType: "car" | "maintenanceEvent";
  pendingImages?: File[];
  onPendingImagesChange?: (files: File[]) => void;
  className?: string;
}

const EMPTY_ARRAY: any[] = [];

export function ImageManager({
  entityId,
  entityType,
  pendingImages = EMPTY_ARRAY,
  onPendingImagesChange,
  className = "",
}: ImageManagerProps) {
  const { t } = useI18n();
  const dbImagesRaw = useImages(entityId, entityType);
  const dbImages = dbImagesRaw || EMPTY_ARRAY;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [objectUrls, setObjectUrls] = useState<Record<string, string>>({});

  // Generate object URLs for db images and pending files to display them
  useEffect(() => {
    const urls: Record<string, string> = {};

    // DB Images
    for (const img of dbImages) {
      if (img.id && !objectUrls[img.id]) {
        urls[img.id] = URL.createObjectURL(img.blob);
      } else if (img.id) {
        urls[img.id] = objectUrls[img.id];
      }
    }

    // Pending Images
    pendingImages.forEach((file, idx) => {
      const key = `pending_${idx}`;
      if (!objectUrls[key]) {
        urls[key] = URL.createObjectURL(file);
      } else {
        urls[key] = objectUrls[key];
      }
    });

    setObjectUrls((prev) => {
      let changed = false;
      const allNewKeys = new Set([
        ...dbImages.map((img) => img.id!),
        ...pendingImages.map((_, i) => `pending_${i}`),
      ]);

      // Cleanup old URLs
      Object.keys(prev).forEach((key) => {
        if (!allNewKeys.has(key)) {
          URL.revokeObjectURL(prev[key]);
          changed = true;
        }
      });

      if (Object.keys(urls).length !== Object.keys(prev).length) {
        changed = true;
      } else {
        for (const key in urls) {
          if (urls[key] !== prev[key]) {
            changed = true;
            break;
          }
        }
      }

      return changed ? urls : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbImages, pendingImages]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      Object.values(objectUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (entityId) {
      // Save directly to DB
      for (let i = 0; i < files.length; i++) {
        await addImage(files[i], entityId, entityType);
      }
    } else {
      // Add to pending
      if (onPendingImagesChange) {
        onPendingImagesChange([...pendingImages, ...Array.from(files)]);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteDbImage = async (id: string) => {
    if (confirm(t("confirmDeleteImage") || "Delete this image?")) {
      await deleteImage(id);
    }
  };

  const handleDeletePendingImage = (index: number) => {
    if (onPendingImagesChange) {
      const newPending = [...pendingImages];
      newPending.splice(index, 1);
      onPendingImagesChange(newPending);
    }
  };

  const allItems = [
    ...dbImages.map((img) => ({
      id: img.id!,
      index: undefined,
      isPending: false,
      url: objectUrls[img.id!] || "",
      name: img.name,
    })),
    ...pendingImages.map((file, idx) => ({
      id: `pending_${idx}`,
      index: idx,
      isPending: true,
      url: objectUrls[`pending_${idx}`] || "",
      name: file.name,
    })),
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          {t("attachments") || "Attachments"}
        </h3>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg"
        >
          <Upload className="w-3.5 h-3.5" />
          {t("uploadImage") || "Upload"}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
        />
      </div>

      {allItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allItems.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square bg-slate-100 dark:bg-zinc-900 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-sm animate-enter"
            >
              {item.url && (
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setFullscreenImage(item.url)}
                  className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors"
                  title="View full screen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    item.isPending
                      ? handleDeletePendingImage(item.index!)
                      : handleDeleteDbImage(item.id)
                  }
                  className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-colors"
                  title="Delete"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {item.isPending && (
                <div className="absolute bottom-2 right-2 text-[10px] uppercase font-bold bg-amber-500 text-white px-2 py-0.5 rounded shadow-sm">
                  {t("pending") || "Pending"}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400">
          <ImageIcon className="w-8 h-8 mb-3 opacity-50" />
          <p className="text-sm font-medium">
            {t("noImages") || "No images attached"}
          </p>
          <p className="text-xs opacity-75 mt-1">
            {t("clickUploadToAttach") || "Click Upload to attach photos"}
          </p>
        </div>
      )}

      {/* Fullscreen Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-enter"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={() => setFullscreenImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={fullscreenImage}
            alt="Fullscreen"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent click from closing immediately if clicking on image
          />
        </div>
      )}
    </div>
  );
}
