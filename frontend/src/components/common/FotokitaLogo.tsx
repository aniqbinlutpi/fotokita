import React from "react";

interface FotokitaLogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: "full" | "mark" | "text";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const FULL_SIZE_MAP: Record<string, string> = {
  xs: "h-5 sm:h-5.5 w-auto",
  sm: "h-6 sm:h-6.5 w-auto",
  md: "h-7 sm:h-7.5 w-auto",
  lg: "h-8.5 sm:h-9 w-auto",
  xl: "h-10 sm:h-11 w-auto",
};

const MARK_SIZE_MAP: Record<string, string> = {
  xs: "size-5",
  sm: "size-7",
  md: "size-8.5",
  lg: "size-11",
  xl: "size-14",
};

export const FotokitaLogo: React.FC<FotokitaLogoProps> = ({
  variant = "full",
  size = "md",
  className = "",
  ...props
}) => {
  if (variant === "mark") {
    const sizeClass = MARK_SIZE_MAP[size] || MARK_SIZE_MAP.md;
    return (
      <svg
        viewBox="0 0 256 256"
        className={`${sizeClass} select-none shrink-0 drop-shadow-xs transition-transform group-hover:scale-105 ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <g transform="translate(25, 34)">
          {/* Outer Beige Badge */}
          <path
            d="M 28 0 L 160 0 Q 172 3 178 9 L 197 28 Q 203 34 206 46 L 206 160 A 28 28 0 0 1 178 188 L 46 188 Q 34 185 28 179 L 9 160 Q 3 154 0 142 L 0 28 A 28 28 0 0 1 28 0 Z"
            fill="#000000"
          />
          {/* Camera Body Silhouette */}
          <path
            d="M 40 57.5 L 68 57.5 L 80 38.5 L 127 38.5 L 139 57.5 L 166 57.5 A 6 6 0 0 1 172 63.5 L 172 143.5 A 6 6 0 0 1 166 149.5 L 40 149.5 A 6 6 0 0 1 34 143.5 L 34 63.5 A 6 6 0 0 1 40 57.5 Z"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Camera Lens Ring */}
          <circle cx="103.5" cy="98" r="25.5" fill="none" stroke="#FFFFFF" strokeWidth="9" />
          {/* Lens Reflection Arc */}
          <path
            d="M 91.5 87 A 16 16 0 0 1 102.5 82"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Flash / Viewfinder Window */}
          <rect x="145" y="75.5" width="8.5" height="8.5" rx="2" fill="#FFFFFF" />
          {/* Polaroid Base Card */}
          <path
            d="M 145 121.5 L 180 121.5 A 3 3 0 0 1 183 124.5 L 183 155 L 173.5 164.5 L 145 164.5 A 3 3 0 0 1 142 161.5 L 142 124.5 A 3 3 0 0 1 145 121.5 Z"
            fill="#BD755A"
          />
          {/* Cutout Window */}
          <rect x="148.5" y="126.5" width="28" height="23" rx="2" fill="#000000" />
          {/* Folded Flap */}
          <path d="M 173.5 164.5 L 173.5 155 L 183 155 Z" fill="#AB5E46" />
        </g>
      </svg>
    );
  }

  // Default: variant="full" / "text" (Ultra-clean typography wordmark "fotokita.com")
  const sizeClass = FULL_SIZE_MAP[size] || FULL_SIZE_MAP.md;
  return (
    <svg
      viewBox="0 0 185 34"
      className={`${sizeClass} select-none shrink-0 transition-transform group-hover:scale-105 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <text
        x="0"
        y="25"
        className="fill-[#2F2926] dark:fill-[#F5EFEB] transition-colors duration-200"
        style={{
          fontFamily:
            "'Plus Jakarta Sans', 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: "27px",
          fontWeight: 700,
          letterSpacing: "-0.035em",
        }}
      >
        fotokita
        <tspan
          style={{
            fontWeight: 500,
            letterSpacing: "-0.015em",
            opacity: 0.85,
          }}
        >
          .com
        </tspan>
      </text>
    </svg>
  );
};

export default FotokitaLogo;
