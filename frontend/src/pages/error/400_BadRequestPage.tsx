import React from "react";
import { motion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import { Home } from "lucide-react";
import { ErrorLayout } from "@/components/error/ErrorLayout";
import { BadRequestIllustration } from "@/components/error/WeddingErrorIllustrations";
import { GlitchNumber } from "@/components/error/GlitchNumber";

export interface BadRequestPageProps {
  onNavigateHome?: () => void;
  title?: string;
  description?: string;
}

export const BadRequestPage: React.FC<BadRequestPageProps> = ({
  onNavigateHome,
  title = "Invalid Celebration Request",
  description = "The request could not be processed due to invalid parameters or corrupt upload information. Please verify the link, form data, or return to the main hall.",
}) => {
  const navigate = useNavigate();

  const handleHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      navigate({ to: "/" } as any);
    }
  };

  return (
    <ErrorLayout statusTag="Bad Request" onNavigateHome={handleHome}>
      {/* Animated 35mm Film Canister & Negative Ribbon */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex justify-center mb-6"
      >
        <BadRequestIllustration />
      </motion.div>

      {/* Glitch Error Number */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <GlitchNumber code="400" label="Bad Request" />
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
export const Error400Page = BadRequestPage;
