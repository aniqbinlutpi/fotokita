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
  const [trimmedSrc, setTrimmedSrc] = useState<string>(() => trimmedCache.get(src) || src);

  useEffect(() => {
    if (!src) return;
    if (trimmedCache.has(src)) {
      setTrimmedSrc(trimmedCache.get(src)!);
      return;
    }

    let isMounted = true;
    const img = new Image();
    if (!src.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      if (!isMounted) return;
      try {
        const trimmed = trimImageBoundingBox(img);
        if (trimmed) {
          const dataUrl = trimmed.canvas.toDataURL("image/png");
          trimmedCache.set(src, dataUrl);
          setTrimmedSrc(dataUrl);
        } else {
          trimmedCache.set(src, src);
          setTrimmedSrc(src);
        }
      } catch {
        trimmedCache.set(src, src);
        setTrimmedSrc(src);
      }
    };
    img.onerror = () => {
      if (isMounted) {
        trimmedCache.set(src, src);
        setTrimmedSrc(src);
      }
    };
    img.src = src;

    return () => {
      isMounted = false;
    };
  }, [src]);

  return <img src={trimmedSrc} alt={alt} className={className} {...props} />;
};
