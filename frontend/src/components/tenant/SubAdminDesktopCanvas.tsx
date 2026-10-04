import React from "react";

interface SubAdminDesktopCanvasProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  previewIframeUrl: string;
  onIframeLoad: () => void;
}

export const SubAdminDesktopCanvas: React.FC<SubAdminDesktopCanvasProps> = ({
  iframeRef,
  previewIframeUrl,
  onIframeLoad,
}) => {
  return (
    <div className="w-full h-full rounded-lg border border-border shadow-xs overflow-hidden bg-background">
      <iframe
        ref={iframeRef}
        src={previewIframeUrl}
        key="desktop-preview"
        title="Live Guest View Simulator - Desktop"
        onLoad={onIframeLoad}
        className="w-full h-full border-0 bg-[#F8F5F0] dark:bg-[#12100E]"
      />
    </div>
  );
};

export default SubAdminDesktopCanvas;
