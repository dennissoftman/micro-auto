"use client";

import React, { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useImages, addImage, deleteImage } from "@/lib/hooks";
import { X, Upload, Image as ImageIcon, Maximize2 } from "lucide-react";

interface ImageManagerProps {
  entityId?: string | number;
  entityType: "car" | "maintenanceEvent";
  pendingImages?: File[];
  onPendingImagesChange?: (files: File[]) => void;
  className?: string;
}

const EMPTY_FILES: File[] = [];

function ObjectUrlImage({
  source,
  alt,
  className,
}: {
  source: Blob;
  alt: string;
  className: string;
}) {
  const [url] = useState(() => URL.createObjectURL(source));

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [url]);

  // Blob object URLs are already local browser resources, so next/image adds no value here.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} />;
}

export function ImageManager({
  entityId,
  entityType,
  pendingImages = EMPTY_FILES,
  onPendingImagesChange,
  className = "",
}: ImageManagerProps) {
  const { t } = useI18n();
  const dbImagesRaw = useImages(entityId, entityType);
  const dbImages = dbImagesRaw || [];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullscreenImage, setFullscreenImage] = useState<{
    source: Blob;
    name: string;
    key: string;
  } | null>(null);

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
      source: img.blob,
      name: img.name,
    })),
    ...pendingImages.map((file, idx) => ({
      id: `pending_${file.name}_${file.size}_${file.lastModified}_${idx}`,
      index: idx,
      isPending: true,
      source: file,
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
              <ObjectUrlImage
                key={item.id}
                source={item.source}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFullscreenImage({
                      source: item.source,
                      name: item.name,
                      key: item.id,
                    })
                  }
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
          <div
            className="max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <ObjectUrlImage
              key={fullscreenImage.key}
              source={fullscreenImage.source}
              alt={fullscreenImage.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
