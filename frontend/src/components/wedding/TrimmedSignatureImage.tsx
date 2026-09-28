import React, { useEffect, useState } from "react";
import { trimImageBoundingBox } from "@/lib/signature";

interface TrimmedSignatureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

const trimmedCache = new Map<string, string>();

export const TrimmedSignatureImage: React.FC<TrimmedSignatureImageProps> = ({
  src,
  alt = "Signature",
  className,
  ...props
}) => {
  const [loadedSrc, setLoadedSrc] = useState<{ src: string; trimmed: string } | null>(null);

  useEffect(() => {
    if (!src || trimmedCache.has(src)) return;

    let isMounted = true;
    const img = new Image();
    if (!src.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      if (!isMounted) return;
      try {
        const trimmed = trimImageBoundingBox(img);
        const result = trimmed ? trimmed.canvas.toDataURL("image/png") : src;
        trimmedCache.set(src, result);
        setLoadedSrc({ src, trimmed: result });
      } catch {
        trimmedCache.set(src, src);
        setLoadedSrc({ src, trimmed: src });
      }
    };
    img.onerror = () => {
      if (isMounted) {
        trimmedCache.set(src, src);
        setLoadedSrc({ src, trimmed: src });
      }
    };
    img.src = src;

    return () => {
      isMounted = false;
    };
  }, [src]);

  const currentTrimmed =
    trimmedCache.get(src) ?? (loadedSrc?.src === src ? loadedSrc.trimmed : src);

  return <img src={currentTrimmed} alt={alt} className={className} {...props} />;
};
