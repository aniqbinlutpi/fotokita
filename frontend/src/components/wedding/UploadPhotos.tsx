import React, { useState, useRef, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";
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
  AlertCircle,
  CheckCircle2,
  Crop,
  ZoomIn,
  RotateCcw,
  Sparkles,
  Download,
  PenTool,
  KeyRound,
  Eye,
  EyeOff,
  User,
  HeartHandshake,
  Trash2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { uploadMedia } from "@/api/media";
import { getCroppedImg } from "@/lib/cropImage";
import { downloadPhotoboothCard } from "@/lib/photoboothCanvas";
import {
  SIGNATURE_COLOR_PRESETS,
  DEFAULT_SIGNATURE_COLOR,
} from "@/lib/signature";
import type { MediaItem } from "@/types/media";
import type { Wedding } from "@/types/wedding";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "video/mp4",
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_WISHES_LENGTH = 70; // Character limit for wishes on photobooth print

interface UploadPhotosProps {
  weddingId: string;
  wedding?: Wedding | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess: (newMedia: MediaItem) => void;
}

export const UploadPhotos: React.FC<UploadPhotosProps> = ({
  weddingId,
  wedding,
  isOpen,
  onOpenChange,
  onUploadSuccess,
}) => {
  // Original selected file and its object URL for cropping
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);

  // Cropped ready-to-upload file and its preview URL
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);

  // Cropper coordinates & state
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCroppingMode, setIsCroppingMode] = useState<boolean>(false);
  const [isProcessingCrop, setIsProcessingCrop] = useState<boolean>(false);

  // Form State: Wishes, From, Signature, Secret Code
  const [fromName, setFromName] = useState<string>("");
  const [wishes, setWishes] = useState<string>("");
  const [secretCode, setSecretCode] = useState<string>("");
  const [showSecretCode, setShowSecretCode] = useState<boolean>(false);

  // Clean up any stale remembered code from previous versions
  useEffect(() => {
    try {
      localStorage.removeItem("fotokita_recent_code");
    } catch {
      // Ignored
    }
  }, []);

  // Guarantee secret code field is always blank whenever upload modal is opened
  useEffect(() => {
    if (isOpen) {
      setSecretCode("");
      setShowSecretCode(false);
    }
  }, [isOpen]);

  // Signature state
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw");
  const [signatureColor, setSignatureColor] = useState<string>(DEFAULT_SIGNATURE_COLOR);
  const [typedSignature, setTypedSignature] = useState<string>("");
  const [drawnSignatureData, setDrawnSignatureData] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear signature canvas
  const clearSignatureCanvas = useCallback(() => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawnSignatureData(null);
  }, []);

  const resetAll = useCallback(() => {
    setRawFile(null);
    if (rawImageSrc) {
      URL.revokeObjectURL(rawImageSrc);
      setRawImageSrc(null);
    }
    setCroppedFile(null);
    if (croppedPreviewUrl) {
      URL.revokeObjectURL(croppedPreviewUrl);
      setCroppedPreviewUrl(null);
    }
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCroppingMode(false);
    setIsProcessingCrop(false);
    setFromName("");
    setWishes("");
    setSecretCode("");
    setShowSecretCode(false);
    setTypedSignature("");
    setSignatureColor(DEFAULT_SIGNATURE_COLOR);
    setDrawnSignatureData(null);
    clearSignatureCanvas();
    setValidationError(null);
    setUploadProgress(0);
    setIsUploading(false);
  }, [rawImageSrc, croppedPreviewUrl, clearSignatureCanvas]);

  const handleOpenChange = (open: boolean) => {
    if (!isUploading) {
      if (!open) {
        resetAll();
      }
      onOpenChange(open);
    }
  };

  const handleColorChange = (newColor: string) => {
    setSignatureColor(newColor);
    if (sigCanvasRef.current && drawnSignatureData) {
      const canvas = sigCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.globalCompositeOperation = "source-in";
        ctx.fillStyle = newColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "source-over";
        setDrawnSignatureData(canvas.toDataURL("image/png"));
      }
    }
  };

  // Canvas signature pointer drawing handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.beginPath();
    ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    ctx.strokeStyle = signatureColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
    const canvas = sigCanvasRef.current;
    if (canvas) {
      setDrawnSignatureData(canvas.toDataURL("image/png"));
    }
  };

  const hasSignature =
    signatureMode === "draw"
      ? Boolean(drawnSignatureData)
      : Boolean(typedSignature.trim());

  const formattedSignaturePayload =
    signatureMode === "draw"
      ? drawnSignatureData || undefined
      : typedSignature.trim()
      ? JSON.stringify({ text: typedSignature.trim(), color: signatureColor })
      : undefined;

  const isLightColor =
    signatureColor.toLowerCase() === "#ffffff" ||
    signatureColor.toLowerCase() === "#faf5ef" ||
    signatureColor.toLowerCase() === "#fff";

  const validateAndHandleFile = (file: File) => {
    setValidationError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setValidationError(
        "Unsupported format. Please upload JPEG, PNG, WebP, HEIC, or MP4."
      );
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

    if (file.size > maxSize) {
      setValidationError(
        `File is too large. Maximum size for ${
          isVideo ? "videos is 100 MB" : "photographs is 10 MB"
        }.`
      );
      return;
    }

    setRawFile(file);
    const objectUrl = URL.createObjectURL(file);

    if (file.type.startsWith("image/")) {
      setRawImageSrc(objectUrl);
      setIsCroppingMode(true);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } else {
      // For video, directly set as ready file
      setCroppedFile(file);
      setCroppedPreviewUrl(null);
      setIsCroppingMode(false);
    }
  };

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, currentCroppedAreaPixels: Area) => {
      setCroppedAreaPixels(currentCroppedAreaPixels);
    },
    []
  );

  const handleApplyCrop = async () => {
    if (!rawImageSrc || !croppedAreaPixels || !rawFile) return;

    try {
      setIsProcessingCrop(true);
      const generatedFile = await getCroppedImg(
        rawImageSrc,
        croppedAreaPixels,
        rawFile.name,
        rawFile.type
      );

      if (croppedPreviewUrl) {
        URL.revokeObjectURL(croppedPreviewUrl);
      }

      const newPreviewUrl = URL.createObjectURL(generatedFile);
      setCroppedFile(generatedFile);
      setCroppedPreviewUrl(newPreviewUrl);
      setIsCroppingMode(false);
    } catch (err) {
      console.error("Failed to crop image:", err);
      toast.error("Could not crop photograph", {
        description: "Falling back to original file.",
      });
      setCroppedFile(rawFile);
      setCroppedPreviewUrl(rawImageSrc);
      setIsCroppingMode(false);
    } finally {
      setIsProcessingCrop(false);
    }
  };

  const handleUpload = async () => {
    const fileToUpload = croppedFile || rawFile;
    if (!fileToUpload) return;

    if (!weddingId) {
      setValidationError("Missing wedding reference ID.");
      return;
    }

    if (!fromName.trim()) {
      setValidationError("Please enter your name so the couple knows who sent this.");
      return;
    }

    if (!wishes.trim()) {
      setValidationError("Please write your wishes or prayers for the couple.");
      return;
    }

    if (wishes.length > MAX_WISHES_LENGTH) {
      setValidationError(
        `Wishes & prayers must be ${MAX_WISHES_LENGTH} characters or less.`
      );
      return;
    }

    if (!secretCode.trim()) {
      setValidationError(
        "Please enter a secret code so you can delete your photo later."
      );
      return;
    }

    try {
      setIsUploading(true);
      setValidationError(null);

      const createdMedia = await uploadMedia({
        weddingId,
        file: fileToUpload,
        from: fromName.trim(),
        wishes: wishes.trim(),
        signature: formattedSignaturePayload,
        code: secretCode.trim(),
        onProgress: (percent) => setUploadProgress(percent),
      });

      // Save secret code locally for user convenience when deleting this specific photo
      try {
        localStorage.setItem(
          `fotokita_secret_${createdMedia.id}`,
          secretCode.trim()
        );
      } catch {
        // Safe localStorage fallback
      }

      toast.success("Photograph & wedding wishes added to collection", {
        description: `From ${fromName.trim()}`,
      });

      onUploadSuccess(createdMedia);
      resetAll();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Upload error:", err);
      const message =
        err?.message || "Failed to upload file. Please try again.";
      setValidationError(message);
      toast.error("Upload failed", {
        description: message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const coupleName = wedding?.name ?? "The Wedding";

  const formattedDate = React.useMemo(() => {
    if (!wedding?.date) return "";
    try {
      const d = new Date(wedding.date);
      return d
        .toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
        .toUpperCase();
    } catch {
      return "";
    }
  }, [wedding]);

  const activeFile = croppedFile || rawFile;
  const formattedSize = activeFile
    ? activeFile.size > 1024 * 1024
      ? `${(activeFile.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(activeFile.size / 1024)} KB`
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!isUploading}
        className={`bg-[#FFFCF8] border-[#E7DED5] rounded-[3px] p-4 sm:p-6 shadow-2xl font-sans transition-all duration-300 max-h-[92vh] overflow-y-auto w-full max-w-[calc(100vw-1.5rem)] sm:max-w-xl ${
          isCroppingMode
            ? "md:max-w-2xl"
            : rawFile
            ? "lg:max-w-4xl"
            : "sm:max-w-md"
        }`}
      >
        <DialogHeader className="text-left space-y-1 pb-1">
          <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#7A7069]">
            <Sparkles className="size-3 text-[#A67C6B]" />
            <span>
              {isCroppingMode
                ? "Adjust Portrait Framing"
                : rawFile
                ? "Wedding Photobooth & Guestbook"
                : "Add Memory"}
            </span>
          </div>
          <DialogTitle className="font-serif text-xl sm:text-2xl font-normal text-[#2F2926]">
            {isCroppingMode
              ? "Position Your Photograph"
              : rawFile
              ? "Wedding Photobooth Print & Wishes"
              : "Wedding Photobooth Card"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#7A7069] leading-relaxed">
            {isCroppingMode
              ? "Drag and scale your photo to fit the fixed 1:1 photobooth portrait print."
              : rawFile
              ? "Leave your warm wishes, prayers, signature, and set a private code to manage your photo."
              : "Upload your capture to be framed into the official wedding print collection."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,video/mp4"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                validateAndHandleFile(e.target.files[0]);
              }
            }}
            disabled={isUploading}
          />

          {/* 1. INITIAL DROP ZONE (When no file selected) */}
          {!rawFile && (
            <div
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  validateAndHandleFile(e.dataTransfer.files[0]);
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragOver(false);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-[2px] p-6 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-200 ${
                isDragOver
                  ? "border-[#A67C6B] bg-[#F8F5F0]"
                  : "border-[#E7DED5] bg-[#F8F5F0]/50 hover:bg-[#F8F5F0] hover:border-[#A67C6B]/60"
              }`}
            >
              <div className="size-12 rounded-full bg-[#FFFCF8] border border-[#E7DED5] flex items-center justify-center mb-3 text-[#A67C6B]">
                <UploadCloud className="size-5" />
              </div>
              <p className="text-sm font-medium text-[#2F2926] mb-1">
                Drag and drop your photograph here
              </p>
              <p className="text-xs text-[#7A7069] mb-3">
                or tap to browse from your device
              </p>
              <span className="text-[11px] text-[#7A7069]/80 uppercase tracking-widest">
                JPEG, PNG, WebP, HEIC up to 10MB
              </span>
            </div>
          )}

          {/* 2. INTERACTIVE CROPPER VIEW */}
          {isCroppingMode && rawImageSrc && (
            <div className="space-y-4">
              <div className="max-w-[280px] sm:max-w-xs mx-auto bg-[#FFFCF8] border border-[#E7DED5] rounded-[2px] p-3 pb-3.5 shadow-[0_4px_20px_-4px_rgba(47,41,38,0.1)] flex flex-col">
                <div className="text-center pb-1.5 select-none">
                  <span className="text-[8px] uppercase tracking-[0.25em] text-[#7A7069]/60 font-medium">
                    Fotobooth Kita
                  </span>
                </div>

                {/* 1:1 Square Cropping Window */}
                <div className="relative aspect-square w-full bg-[#2F2926] rounded-[1px] overflow-hidden border border-[#E7DED5]">
                  <Cropper
                    image={rawImageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropCompleteCallback}
                    classes={{
                      containerClassName: "rounded-[1px]",
                      cropAreaClassName:
                        "border-2 border-[#FFFCF8] shadow-[0_0_0_9999px_rgba(47,41,38,0.7)]",
                    }}
                  />
                </div>

                <div className="pt-2.5 pb-0.5 text-center select-none font-sans">
                  <p className="text-[8px] uppercase tracking-[0.25em] text-[#7A7069] font-medium leading-none">
                    The Wedding Of
                  </p>
                  <h4 className="font-serif text-sm font-normal text-[#2F2926] uppercase tracking-wider leading-none my-1.5">
                    {coupleName}
                  </h4>
                  {formattedDate && (
                    <p className="text-[7px] uppercase tracking-[0.2em] text-[#7A7069] tabular-nums leading-none">
                      {formattedDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Zoom & Reset Controls */}
              <div className="flex items-center gap-3 bg-[#F8F5F0] p-3 rounded-[2px] border border-[#E7DED5] max-w-sm mx-auto w-full">
                <ZoomIn className="size-4 text-[#7A7069] shrink-0" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-[#A67C6B] cursor-pointer h-1.5 bg-[#E7DED5] rounded-lg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setZoom(1);
                    setCrop({ x: 0, y: 0 });
                  }}
                  className="text-xs text-[#7A7069] hover:text-[#2F2926] h-7 px-2 gap-1 rounded-xs"
                >
                  <RotateCcw className="size-3" />
                  <span>Reset</span>
                </Button>
              </div>
            </div>
          )}

          {/* 3. READY PHOTOBOOTH PRINT & GUESTBOOK FORM VIEW */}
          {!isCroppingMode && rawFile && (
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Left Column (or Top on Mobile): Photobooth Card Preview */}
              <div className="w-full lg:col-span-5 flex flex-col items-center">
                <div className="w-56 sm:w-64 max-w-full bg-[#FFFCF8] border border-[#E7DED5] rounded-[2px] p-3 pb-3.5 shadow-[0_4px_16px_-4px_rgba(47,41,38,0.1)] flex flex-col justify-between mx-auto">
                  <div className="text-center pb-1.5 select-none">
                    <span className="text-[8px] uppercase tracking-[0.25em] text-[#7A7069]/60 font-medium">
                      Fotobooth Kita
                    </span>
                  </div>

                  <div className="relative aspect-square w-full bg-[#F8F5F0] overflow-hidden border border-[#E7DED5]/90 rounded-[1px]">
                    {croppedPreviewUrl ? (
                      <img
                        src={croppedPreviewUrl}
                        alt="Cropped Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#A67C6B]">
                        <FileImage className="size-8" />
                      </div>
                    )}

                    {/* Signature Overlay on Photo (Bottom-Right) */}
                    {hasSignature && (
                      <div className="absolute bottom-1 right-2 sm:bottom-1.5 sm:right-2.5 z-10 pointer-events-none select-none max-w-[65%] flex justify-end">
                        {signatureMode === "draw" && drawnSignatureData ? (
                          <img
                            src={drawnSignatureData}
                            alt="Signature Preview"
                            className="h-4 sm:h-5 object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                          />
                        ) : typedSignature.trim() ? (
                          <p
                            style={{ color: signatureColor }}
                            className="font-signature text-base sm:text-xl leading-none truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]"
                          >
                            {typedSignature.trim()}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Card Chin with live Typography, Wishes & Signature */}
                  <div className="pt-2.5 pb-0.5 text-center select-none font-sans">
                    <p className="text-[8px] uppercase tracking-[0.25em] text-[#7A7069] font-medium leading-none">
                      The Wedding Of
                    </p>
                    <h4 className="font-serif text-sm font-normal text-[#2F2926] uppercase tracking-wider leading-none my-1.5">
                      {coupleName}
                    </h4>
                    {formattedDate && (
                      <p className="text-[7px] uppercase tracking-[0.2em] text-[#7A7069] tabular-nums leading-none">
                        {formattedDate}
                      </p>
                    )}

                    {/* Live Preview of Wishes */}
                    {(wishes || fromName) && (
                      <div className="pt-2 border-t border-[#E7DED5]/80 space-y-1 mt-1 text-center">
                        {wishes && (
                          <p className="font-serif italic text-[11px] text-[#433B37] leading-tight line-clamp-3 px-1">
                            "{wishes}"
                          </p>
                        )}
                        {fromName && (
                          <p className="text-[8px] uppercase tracking-[0.15em] text-[#7A7069] font-medium">
                            — With Love, {fromName}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 w-full">
                  {rawImageSrc && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      onClick={() => setIsCroppingMode(true)}
                      className="border-[#E7DED5] bg-[#FFFCF8] text-[#2F2926] hover:bg-[#F8F5F0] text-xs h-7 px-2.5 gap-1.5 rounded-xs"
                    >
                      <Crop className="size-3 text-[#A67C6B]" />
                    </Button>
                  )}

                                    <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-[#7A7069] hover:text-[#2F2926] h-7 px-2.5 rounded-xs"
                  >
                    Change Photo
                  </Button>

                  {croppedPreviewUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      onClick={async () => {
                        await downloadPhotoboothCard(
                          croppedPreviewUrl,
                          wedding,
                          rawFile.name,
                          {
                            wishes: wishes.trim() || undefined,
                            from: fromName.trim() || undefined,
                            signature: formattedSignaturePayload,
                          }
                        );
                      }}
                      className="border-[#E7DED5] bg-[#FFFCF8] text-[#2F2926] hover:bg-[#F8F5F0] text-xs h-7 px-2.5 gap-1.5 rounded-xs"
                      title="Download print card with border & wishes"
                    >
                      <Download className="size-3 text-[#A67C6B]" />
                    </Button>
                  )}
                </div>

                {/* Truncated File Name & Size */}
                <div className="text-[11px] text-[#7A7069] mt-2 flex items-center justify-center gap-1.5 max-w-full px-2">
                  <span className="truncate max-w-[180px] sm:max-w-[220px]">
                    {rawFile.name}
                  </span>
                  {formattedSize && (
                    <span className="shrink-0">• {formattedSize}</span>
                  )}
                </div>
              </div>

              {/* Right Column (or Bottom on Mobile): Guestbook Form */}
              <div className="w-full lg:col-span-7 space-y-4 bg-[#FFFCF8] border border-[#E7DED5] p-4 sm:p-5 rounded-[2px]">
                {/* 1. From (Name) */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium text-[#2F2926]">
                    <User className="size-3.5 text-[#A67C6B]" />
                    <span>From (Your Name / Family)</span>
                    <span className="text-[#9E3E3E]">*</span>
                  </label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="e.g. Harris & Family"
                    disabled={isUploading}
                    className="w-full bg-[#F8F5F0]/60 border border-[#E7DED5] rounded-[2px] px-3 py-2 text-sm text-[#2F2926] placeholder:text-[#7A7069]/60 focus:outline-none focus:border-[#A67C6B] focus:bg-[#FFFCF8] transition-colors"
                  />
                </div>

                {/* 2. Wishes & Prayers Form */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium text-[#2F2926]">
                      <HeartHandshake className="size-3.5 text-[#A67C6B]" />
                      <span>Wishes & Prayers</span>
                      <span className="text-[#9E3E3E]">*</span>
                    </label>
                    <span
                      className={`text-[11px] font-mono tabular-nums transition-colors ${
                        wishes.length >= MAX_WISHES_LENGTH
                          ? "text-[#9E3E3E] font-semibold"
                          : "text-[#7A7069]"
                      }`}
                    >
                      {wishes.length}/{MAX_WISHES_LENGTH}
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={MAX_WISHES_LENGTH}
                    value={wishes}
                    onChange={(e) =>
                      setWishes(e.target.value.slice(0, MAX_WISHES_LENGTH))
                    }
                    placeholder="Write your heartfelt wishes, prayers, or blessings for the bride and groom..."
                    disabled={isUploading}
                    className="w-full bg-[#F8F5F0]/60 border border-[#E7DED5] rounded-[2px] p-3 text-sm text-[#2F2926] placeholder:text-[#7A7069]/60 focus:outline-none focus:border-[#A67C6B] focus:bg-[#FFFCF8] transition-colors resize-none leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[11px] text-[#7A7069]">
                    <span>
                      Your message will be framed alongside your memory in the wedding gallery.
                    </span>
                    {wishes.length >= MAX_WISHES_LENGTH && (
                      <span className="text-[#9E3E3E] shrink-0 font-medium ml-2">
                        Limit reached
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Signature (Draw or Type) */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium text-[#2F2926]">
                      <PenTool className="size-3.5 text-[#A67C6B]" />
                      <span>Your Signature</span>
                    </label>

                    {/* Mode Toggle: Draw vs Type */}
                    <div className="flex items-center gap-1 border border-[#E7DED5] rounded-[2px] p-0.5 bg-[#F8F5F0]">
                      <button
                        type="button"
                        onClick={() => setSignatureMode("draw")}
                        className={`text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-[1px] font-medium transition-colors ${
                          signatureMode === "draw"
                            ? "bg-[#FFFCF8] text-[#2F2926] shadow-xs"
                            : "text-[#7A7069] hover:text-[#2F2926]"
                        }`}
                      >
                        Draw
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignatureMode("type")}
                        className={`text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-[1px] font-medium transition-colors ${
                          signatureMode === "type"
                            ? "bg-[#FFFCF8] text-[#2F2926] shadow-xs"
                            : "text-[#7A7069] hover:text-[#2F2926]"
                        }`}
                      >
                        Type
                      </button>
                    </div>
                  </div>

                  {/* Signature Color Selector */}
                  <div className="flex items-center justify-between py-1.5 px-2.5 bg-[#F8F5F0]/70 border border-[#E7DED5] rounded-[2px]">
                    <span className="text-[11px] uppercase tracking-wider font-medium text-[#7A7069]">
                      Ink Color
                    </span>
                    <div className="flex items-center gap-1.5">
                      {SIGNATURE_COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          title={preset.label}
                          onClick={() => handleColorChange(preset.value)}
                          className={`size-5 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
                            signatureColor.toLowerCase() === preset.value.toLowerCase()
                              ? "ring-2 ring-[#A67C6B] ring-offset-1 scale-110 shadow-xs"
                              : "hover:scale-105 opacity-90"
                          }`}
                          style={{
                            backgroundColor: preset.value,
                            borderColor: preset.border || "#D1D5DB",
                          }}
                        >
                          {signatureColor.toLowerCase() === preset.value.toLowerCase() && (
                            <Check
                              className={`size-3 ${
                                preset.value === "#FFFFFF" || preset.value === "#FAF5EF"
                                  ? "text-[#2F2926]"
                                  : "text-white"
                              }`}
                            />
                          )}
                        </button>
                      ))}
                      {/* Custom Color Picker Input */}
                      <label
                        title="Custom Color"
                        className="relative size-5 rounded-full border border-[#D1D5DB] cursor-pointer flex items-center justify-center overflow-hidden hover:scale-105 transition-all shadow-2xs"
                        style={{
                          background:
                            "conic-gradient(from 180deg at 50% 50%, #FF0000 0deg, #FFFF00 60deg, #00FF00 120deg, #00FFFF 180deg, #0000FF 240deg, #FF00FF 300deg, #FF0000 360deg)",
                        }}
                      >
                        <input
                          type="color"
                          value={signatureColor}
                          onChange={(e) => handleColorChange(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </label>
                    </div>
                  </div>

                  {signatureMode === "draw" ? (
                    <div className="space-y-1.5">
                      <div
                        className={`relative border border-[#E7DED5] rounded-[2px] transition-colors overflow-hidden ${
                          isLightColor ? "bg-[#2F2926]" : "bg-[#F8F5F0]/60"
                        }`}
                      >
                        <canvas
                          ref={sigCanvasRef}
                          width={400}
                          height={120}
                          onPointerDown={handlePointerDown}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          className="w-full h-24 sm:h-28 touch-none cursor-crosshair block bg-transparent"
                        />
                        {!drawnSignatureData && (
                          <div
                            className={`absolute inset-0 pointer-events-none flex items-center justify-center text-xs italic font-serif ${
                              isLightColor ? "text-white/40" : "text-[#7A7069]/50"
                            }`}
                          >
                            Sign here with finger or mouse
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#7A7069]">
                        <span>Use finger on phone or mouse to sign</span>
                        {drawnSignatureData && (
                          <button
                            type="button"
                            onClick={clearSignatureCanvas}
                            className="text-xs text-[#9E3E3E] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <Trash2 className="size-3" />
                            <span>Clear</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={typedSignature}
                        onChange={(e) => setTypedSignature(e.target.value)}
                        placeholder="Type your name to generate signature"
                        disabled={isUploading}
                        className="w-full bg-[#F8F5F0]/60 border border-[#E7DED5] rounded-[2px] px-3 py-2 text-sm text-[#2F2926] placeholder:text-[#7A7069]/60 focus:outline-none focus:border-[#A67C6B] focus:bg-[#FFFCF8] transition-colors"
                      />
                      {typedSignature && (
                        <div
                          style={{ color: signatureColor }}
                          className={`py-3.5 px-3 border border-[#E7DED5] rounded-[2px] text-center font-signature text-3xl sm:text-4xl shadow-xs select-none tracking-wide transition-colors ${
                            isLightColor ? "bg-[#2F2926]" : "bg-[#FFFCF8]"
                          }`}
                        >
                          {typedSignature}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Secret Code (Protection / Deletion Code) */}
                <div className="space-y-1.5 pt-2 border-t border-[#E7DED5]/60">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <label className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium text-[#2F2926]">
                      <KeyRound className="size-3.5 text-[#A67C6B]" />
                      <span>Secret Code (To Delete Later)</span>
                      <span className="text-[#9E3E3E]">*</span>
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type={showSecretCode ? "text" : "password"}
                      value={secretCode}
                      onChange={(e) => setSecretCode(e.target.value)}
                      placeholder="e.g. 1234 or your secret phrase"
                      disabled={isUploading}
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck="false"
                      name="fotokita_upload_secret_code"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      className="w-full bg-[#F8F5F0]/60 border border-[#E7DED5] rounded-[2px] pl-3 pr-10 py-2 text-sm text-[#2F2926] placeholder:text-[#7A7069]/60 focus:outline-none focus:border-[#A67C6B] focus:bg-[#FFFCF8] transition-colors font-mono tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretCode(!showSecretCode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7069] hover:text-[#2F2926] p-1"
                    >
                      {showSecretCode ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#7A7069] leading-relaxed">
                    Only someone with this code can remove this photo. (remember the code)
                  </p>
                </div>
              </div>
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
                <span>Uploading photobooth print & wishes...</span>
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

        {/* DIALOG ACTIONS */}
        <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2 border-t border-[#E7DED5]/60 pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={isUploading || isProcessingCrop}
            onClick={() => handleOpenChange(false)}
            className="w-full sm:w-auto border-[#E7DED5] bg-[#FFFCF8] text-[#2F2926] hover:bg-[#F8F5F0] rounded-xs text-xs uppercase tracking-wider h-10 px-5"
          >
            Cancel
          </Button>

          {isCroppingMode ? (
            <Button
              type="button"
              disabled={isProcessingCrop}
              onClick={handleApplyCrop}
              className="w-full sm:w-auto bg-[#2F2926] hover:bg-[#433B37] text-[#FFFCF8] rounded-xs text-xs uppercase tracking-wider h-10 px-5 gap-1.5"
            >
              {isProcessingCrop ? (
                <span>Framing...</span>
              ) : (
                <>
                  <Crop className="size-3.5" />
                  <span>Apply</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!activeFile || isUploading}
              onClick={handleUpload}
              className="w-full sm:w-auto bg-[#2F2926] hover:bg-[#433B37] text-[#FFFCF8] rounded-xs text-xs uppercase tracking-wider h-10 px-5 gap-1.5"
            >
              {isUploading ? (
                <span>Uploading...</span>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Upload</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
