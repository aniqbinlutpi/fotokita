import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { FotokitaLogo } from "@/components/common/FotokitaLogo";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export interface ErrorLayoutProps {
  statusTag?: string;
  onNavigateHome?: () => void;
  showThemeToggle?: boolean;
  children: React.ReactNode;
}

export const ErrorLayout: React.FC<ErrorLayoutProps> = ({
  statusTag,
  onNavigateHome,
  showThemeToggle = true,
  children,
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
    <div className="min-h-screen bg-[#F8F5F0] dark:bg-[#12100E] text-[#2F2926] dark:text-[#F5EFEB] selection:bg-[#A67C6B]/20 selection:text-[#2F2926] dark:selection:text-[#F5EFEB] flex flex-col font-sans transition-colors duration-300 relative overflow-hidden">
      {/* Background Ambient Warm Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-[#A67C6B]/10 dark:bg-[#A67C6B]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full bg-[#DFBF8A]/10 dark:bg-[#DFBF8A]/5 blur-[120px] pointer-events-none" />

      {/* Editorial Navigation Bar */}
      <header className="border-b border-[#E7DED5] dark:border-[#332B25] bg-[#FFFCF8]/80 dark:bg-[#1A1715]/80 backdrop-blur-md fixed top-0 left-0 right-0 z-40 px-6 py-4 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={handleHome}
            className="flex items-center group cursor-pointer text-left"
            aria-label="Fotokita Home"
          >
            <FotokitaLogo variant="full" size="sm" />
          </button>

          <div className="flex items-center gap-3 sm:gap-4">
            {statusTag && (
              <span className="text-[11px] uppercase tracking-widest text-[#7A7069] dark:text-[#A89F97] hidden sm:inline-block font-medium">
                {statusTag}
              </span>
            )}

            {/* Dark / Light Mode Switcher */}
            {showThemeToggle && (
              <AnimatedThemeToggler
                variant="circle"
                duration={450}
                className="text-[#7A7069] dark:text-[#A89F97] hover:text-[#2F2926] dark:hover:text-[#F5EFEB] transition-colors duration-200 cursor-pointer p-1.5 flex items-center justify-center rounded-full hover:bg-[#EAE4DB]/50 dark:hover:bg-[#25201C]"
                title="Toggle dark / light mode"
                aria-label="Toggle dark / light mode"
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center pt-28 pb-16 px-6">
        <div className="w-full max-w-xl mx-auto text-center flex flex-col items-center">
          {children}
        </div>
      </main>

      {/* Editorial Minimal Footer */}
      <footer className="border-t border-[#E7DED5] dark:border-[#332B25] bg-[#FFFCF8] dark:bg-[#1A1715] py-6 px-6 text-center text-xs text-[#7A7069] dark:text-[#A89F97] transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-serif italic text-xs sm:text-sm text-[#2F2926] dark:text-[#F5EFEB]">
            Fotokita — Preserving timeless wedding celebrations
          </p>
          <div className="flex items-center gap-4 text-[11px] uppercase tracking-widest text-[#7A7069] dark:text-[#A89F97]">
            <span>Digital Guestbook & Live Gallery</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
