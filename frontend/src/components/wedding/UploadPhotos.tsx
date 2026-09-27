import React, { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  UploadCloud,
  FileImage,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { uploadMedia } from "@/api/media";
import type { MediaItem } from "@/types/media";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "video/mp4",
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

interface UploadPhotosProps {
  weddingId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess: (newMedia: MediaItem) => void;
}

export const UploadPhotos: React.FC<UploadPhotosProps> = ({
  weddingId,
  isOpen,
  onOpenChange,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setValidationError(null);
    setUploadProgress(0);
    setIsUploading(false);
  }, [previewUrl]);

  const handleOpenChange = (open: boolean) => {
    if (!isUploading) {
      if (!open) {
        resetState();
      }
      onOpenChange(open);
    }
  };

  const validateAndSetFile = (file: File) => {
    setValidationError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setValidationError("Unsupported file format. Please upload JPEG, PNG, WebP, HEIC, or MP4.");
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

    if (file.size > maxSize) {
      setValidationError(
        `File is too large. Maximum size for ${isVideo ? "videos is 100 MB" : "photographs is 10 MB"}.`
      );
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    if (!weddingId) {
      setValidationError("Missing wedding reference ID.");
      return;
    }

    try {
      setIsUploading(true);
      setValidationError(null);

      const createdMedia = await uploadMedia({
        weddingId,
        file: selectedFile,
        onProgress: (percent) => setUploadProgress(percent),
      });

      toast.success("Photograph added to wedding collection", {
        description: selectedFile.name,
      });

      onUploadSuccess(createdMedia);
      resetState();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Upload error:", err);
      const message = err?.message || "Failed to upload file. Please try again.";
      setValidationError(message);
      toast.error("Upload failed", {
        description: message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formattedSize = selectedFile
    ? selectedFile.size > 1024 * 1024
      ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(selectedFile.size / 1024)} KB`
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!isUploading}
        className="max-w-lg bg-[#FFFCF8] border-[#E7DED5] rounded-sm p-6 shadow-none font-sans"
      >
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="font-serif text-2xl font-normal text-[#2F2926]">
            Add Memories
          </DialogTitle>
          <DialogDescription className="text-xs text-[#7A7069]">
            Share your captured moments to be part of the official wedding collection.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,video/mp4"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />

          {!selectedFile ? (
            /* Drag and Drop Zone */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-xs p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-200 ${
                isDragOver
                  ? "border-[#A67C6B] bg-[#F8F5F0]"
                  : "border-[#E7DED5] bg-[#F8F5F0]/50 hover:bg-[#F8F5F0] hover:border-[#A67C6B]/60"
              }`}
            >
              <div className="size-11 rounded-full bg-[#FFFCF8] border border-[#E7DED5] flex items-center justify-center mb-3 text-[#A67C6B]">
                <UploadCloud className="size-5" />
              </div>
              <p className="text-sm font-medium text-[#2F2926] mb-1">
                Drag and drop your photograph here
              </p>
              <p className="text-xs text-[#7A7069] mb-3">
                or click to browse from your device
              </p>
              <span className="text-[11px] text-[#7A7069]/80 uppercase tracking-widest">
                JPEG, PNG, WebP, HEIC up to 10MB • MP4 up to 100MB
              </span>
            </div>
          ) : (
            /* File Preview Card */
            <div className="border border-[#E7DED5] bg-[#F8F5F0] rounded-xs p-3 flex items-center gap-3">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="size-14 object-cover rounded-xs border border-[#E7DED5]"
                />
              ) : (
                <div className="size-14 rounded-xs border border-[#E7DED5] bg-[#FFFCF8] flex items-center justify-center text-[#A67C6B]">
                  <FileImage className="size-6" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#2F2926] truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-[#7A7069] tabular-nums mt-0.5">
                  {formattedSize}
                </p>
              </div>

              {!isUploading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={resetState}
                  className="size-7 text-[#7A7069] hover:text-[#9E3E3E] rounded-xs"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          )}

          {/* Validation Error Message */}
          {validationError && (
            <div className="flex items-center gap-2 p-3 bg-[#9E3E3E]/10 border border-[#9E3E3E]/20 text-[#9E3E3E] text-xs rounded-xs">
              <AlertCircle className="size-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs text-[#7A7069]">
                <span>Uploading to archive...</span>
                <span className="tabular-nums font-medium text-[#2F2926]">
                  {uploadProgress}%
                </span>
              </div>
              <Progress value={uploadProgress} className="h-1.5 bg-[#E7DED5]">
                <div
                  className="h-full bg-[#A67C6B] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </Progress>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2 border-t border-[#E7DED5]/60 pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={() => handleOpenChange(false)}
            className="border-[#E7DED5] bg-[#FFFCF8] text-[#2F2926] hover:bg-[#F8F5F0] rounded-xs text-xs uppercase tracking-wider h-9"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={!selectedFile || isUploading}
            onClick={handleUpload}
            className="bg-[#2F2926] hover:bg-[#433B37] text-[#FFFCF8] rounded-xs text-xs uppercase tracking-wider h-9 gap-1.5"
          >
            {isUploading ? (
              <>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5" />
                <span>Upload Memory</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
