import React from "react";
import { motion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import { Home } from "lucide-react";
import { ErrorLayout } from "@/components/error/ErrorLayout";
import { NotFoundIllustration } from "@/components/error/WeddingErrorIllustrations";
import { GlitchNumber } from "@/components/error/GlitchNumber";

export interface NotFoundPageProps {
  weddingSlug?: string;
  title?: string;
  description?: string;
  onNavigateHome?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  weddingSlug,
  title = "A Moment Misplaced",
  description,
  onNavigateHome,
}) => {
  const navigate = useNavigate();

  const handleHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      navigate({ to: "/" } as any);
    }
  };

  const resolvedDescription =
    description ||
    (weddingSlug
      ? `The wedding gallery for "${weddingSlug}" has not been registered yet or the link may have been updated. Please verify the URL spelling.`
      : "It seems this wedding gallery or page cannot be found. The link may have expired, moved to a new address, or the URL might be misspelled.");

  return (
    <ErrorLayout statusTag="Gallery Not Found" onNavigateHome={handleHome}>
      {/* Animated Wedding Polaroid & Rings Illustration */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex justify-center mb-6"
      >
        <NotFoundIllustration />
      </motion.div>

      {/* Glitch Error Number */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <GlitchNumber code="404" label="Not Found" />
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
        className="text-xs sm:text-sm text-[#7A7069] dark:text-[#A89F97] leading-relaxed max-w-md mb-6"
      >
        {resolvedDescription}
      </motion.p>

      {/* Requested Wedding Slug Pill */}
      {weddingSlug && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-8 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#EFE9DF]/80 dark:bg-[#1F1B18] border border-[#D5CCC2]/60 dark:border-[#3D352E]/60 text-xs font-mono text-[#5A5048] dark:text-[#B5AAA1]"
        >
          <span className="text-[#A67C6B]">fotokita.com/</span>
          <span className="font-semibold text-[#2F2926] dark:text-[#F5EFEB]">{weddingSlug}</span>
        </motion.div>
      )}

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <button
          type="button"
          onClick={handleHome}
          className="inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-full bg-[#2F2926] dark:bg-[#F5EFEB] text-[#FFFCF8] dark:text-[#12100E] hover:bg-[#453C37] dark:hover:bg-[#FFFFFF] text-xs font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs"
        >
          <Home className="size-3.5" />
          <span>Home</span>
        </button>
      </motion.div>
    </ErrorLayout>
  );
};

// Aliases for explicit naming flexibility
export const Error404Page = NotFoundPage;
