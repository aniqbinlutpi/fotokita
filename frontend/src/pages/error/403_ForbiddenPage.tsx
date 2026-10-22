import React from "react";
import { motion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import { Home, KeyRound } from "lucide-react";
import { ErrorLayout } from "@/components/error/ErrorLayout";
import { ForbiddenIllustration } from "@/components/error/WeddingErrorIllustrations";
import { GlitchNumber } from "@/components/error/GlitchNumber";

export interface ForbiddenPageProps {
  onNavigateHome?: () => void;
  title?: string;
  description?: string;
}

export const ForbiddenPage: React.FC<ForbiddenPageProps> = ({
  onNavigateHome,
  title = "Private & Reserved Ceremony",
  description = "Access to this wedding archive or couple portal is strictly reserved for the celebration hosts and invited guests. Please log in with your authorized credentials or check your invitation access code.",
}) => {
  const navigate = useNavigate();

  const handleHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      navigate({ to: "/" } as any);
    }
  };

  const handleLogin = () => {
    navigate({ to: "/login" } as any);
  };

  return (
    <ErrorLayout statusTag="Restricted Access" onNavigateHome={handleHome}>
      {/* Animated Golden Wax Seal & Regal Wedding Envelope */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex justify-center mb-6"
      >
        <ForbiddenIllustration />
      </motion.div>

      {/* Glitch Error Number */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <GlitchNumber code="403" label="Forbidden" />
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
        {/* Login Button */}
        <button
          type="button"
          onClick={handleLogin}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#A67C6B] hover:bg-[#8F6859] text-[#FFFFFF] text-xs font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs"
        >
          <KeyRound className="size-3.5" />
          <span>Login</span>
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
    </ErrorLayout>
  );
};

// Aliases for explicit naming flexibility
export const Error403Page = ForbiddenPage;
