import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import {
  Home,
  RefreshCw,
  ChevronDown,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { ErrorLayout } from "@/components/error/ErrorLayout";
import { ServerErrorIllustration } from "@/components/error/WeddingErrorIllustrations";
import { GlitchNumber } from "@/components/error/GlitchNumber";

export interface ServerErrorPageProps {
  error?: Error | unknown;
  onRetry?: () => void;
  onNavigateHome?: () => void;
  title?: string;
  description?: string;
}

export const ServerErrorPage: React.FC<ServerErrorPageProps> = ({
  error,
  onRetry,
  onNavigateHome,
  title = "A Momentary Pause in the Ceremony",
  description = "Our camera systems and servers are catching their breath due to an unexpected technical interruption. Rest assured, all wedding photographs and heartfelt wishes remain securely preserved.",
}) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const handleHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      navigate({ to: "/" } as any);
    }
  };

  const handleRetry = async () => {
    if (onRetry) {
      setIsRetrying(true);
      try {
        await onRetry();
      } finally {
        setTimeout(() => setIsRetrying(false), 500);
      }
    } else {
      window.location.reload();
    }
  };

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : (error as any)?.message || null;

  const errorStack = error instanceof Error ? error.stack : null;

  const copyTechnicalDetails = () => {
    const textToCopy = `Fotokita Error 500\nMessage: ${
      errorMessage || "N/A"
    }\nURL: ${typeof window !== "undefined" ? window.location.href : ""}\nStack:\n${
      errorStack || "N/A"
    }`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ErrorLayout statusTag="System Interruption" onNavigateHome={handleHome}>
      {/* Animated Camera Shutter & Recharge Flash Illustration */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex justify-center mb-6"
      >
        <ServerErrorIllustration />
      </motion.div>

      {/* Glitch Error Number */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <GlitchNumber code="500" label="Server Error" />
      </motion.div>

      {/* Editorial Title */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal leading-tight text-[#2F2926] dark:text-[#F5EFEB] mb-4 max-w-lg"
      >
        {title}
      </motion.h1>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="text-xs sm:text-sm text-[#7A7069] dark:text-[#A89F97] leading-relaxed max-w-md mb-8"
      >
        {description}
      </motion.p>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="flex items-center justify-center gap-3"
      >
        {/* Refresh Button */}
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#2F2926] dark:bg-[#F5EFEB] text-[#FFFCF8] dark:text-[#12100E] hover:bg-[#453C37] dark:hover:bg-[#FFFFFF] text-xs font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs disabled:opacity-60"
        >
          <RefreshCw className={`size-3.5 ${isRetrying ? "animate-spin" : ""}`} />
          <span>{isRetrying ? "Refreshing..." : "Refresh"}</span>
        </button>

        {/* Home Button */}
        <button
          type="button"
          onClick={handleHome}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-[#D5CCC2] dark:border-[#3D352E] hover:border-[#2F2926] dark:hover:border-[#F5EFEB] text-[#2F2926] dark:text-[#F5EFEB] bg-[#FFFCF8]/70 dark:bg-[#1A1715]/70 text-xs font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs"
        >
          <Home className="size-3.5" />
          <span>Home</span>
        </button>
      </motion.div>

      {/* Collapsible Technical Details (for developer debugging & diagnostics) */}
      {(errorMessage || errorStack) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="w-full mt-10 pt-6 border-t border-[#E7DED5]/70 dark:border-[#332B25]/70 text-left"
        >
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-xs text-[#7A7069] dark:text-[#A89F97] hover:text-[#2F2926] dark:hover:text-[#F5EFEB] transition-colors py-1 cursor-pointer select-none"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <AlertCircle className="size-3.5 text-[#A67C6B]" />
              <span>Developer Diagnostics</span>
            </span>
            <ChevronDown
              className={`size-3.5 transition-transform duration-200 ${
                showDetails ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden mt-3"
              >
                <div className="p-3.5 rounded-lg bg-[#ECE5DB] dark:bg-[#1C1815] border border-[#D5CCC2] dark:border-[#3D352E] text-[11px] font-mono space-y-2">
                  <div className="flex items-center justify-between border-b border-[#D5CCC2]/60 dark:border-[#3D352E]/60 pb-2">
                    <span className="text-[#A67C6B] font-semibold">Error Message:</span>
                    <button
                      type="button"
                      onClick={copyTechnicalDetails}
                      className="flex items-center gap-1 text-[10px] text-[#7A7069] dark:text-[#A89F97] hover:text-[#2F2926] dark:hover:text-[#F5EFEB] cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>Copy Details</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-[#2F2926] dark:text-[#F5EFEB] break-words whitespace-pre-wrap">
                    {errorMessage || "No specific error message provided."}
                  </div>

                  {errorStack && (
                    <div className="pt-2 text-[10px] text-[#7A7069] dark:text-[#8E837A] max-h-36 overflow-y-auto whitespace-pre-wrap">
                      {errorStack}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </ErrorLayout>
  );
};

// Aliases for explicit naming flexibility
export const Error500Page = ServerErrorPage;
