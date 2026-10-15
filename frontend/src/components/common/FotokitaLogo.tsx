import React from "react";

interface FotokitaLogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: "full" | "mark" | "text";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const FULL_SIZE_MAP: Record<string, string> = {
  xs: "h-6 sm:h-6.5 w-auto",
  sm: "h-7 sm:h-7.5 w-auto",
  md: "h-8 sm:h-8.5 w-auto",
  lg: "h-9.5 sm:h-10.5 w-auto",
  xl: "h-11 sm:h-13 w-auto",
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
          {/* Camera Body Silhouette with Black Fill */}
          <path
            d="M 40 57.5 L 68 57.5 L 80 38.5 L 127 38.5 L 139 57.5 L 166 57.5 A 6 6 0 0 1 172 63.5 L 172 143.5 A 6 6 0 0 1 166 149.5 L 40 149.5 A 6 6 0 0 1 34 143.5 L 34 63.5 A 6 6 0 0 1 40 57.5 Z"
            fill="#000000"
            stroke="#FFFFFF"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Camera Lens Ring */}
          <circle cx="103.5" cy="98" r="25.5" fill="#000000" stroke="#FFFFFF" strokeWidth="9" />
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

  if (variant === "text") {
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
  }

  // Default: variant="full" (Camera Icon + "fotokita.com")
  const sizeClass = FULL_SIZE_MAP[size] || FULL_SIZE_MAP.md;
  return (
    <svg
      viewBox="0 0 225 46"
      className={`${sizeClass} select-none shrink-0 transition-transform group-hover:scale-105 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Camera Icon on Left */}
      <g transform="translate(1, 5) scale(0.2857) translate(-34, -38.5)">
        {/* Camera Body Silhouette with Black Fill */}
        <path
          d="M 40 57.5 L 68 57.5 L 80 38.5 L 127 38.5 L 139 57.5 L 166 57.5 A 6 6 0 0 1 172 63.5 L 172 143.5 A 6 6 0 0 1 166 149.5 L 40 149.5 A 6 6 0 0 1 34 143.5 L 34 63.5 A 6 6 0 0 1 40 57.5 Z"
          fill="#000000"
          stroke="#FFFFFF"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Camera Lens Ring */}
        <circle cx="103.5" cy="98" r="25.5" fill="#000000" stroke="#FFFFFF" strokeWidth="9" />
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

      {/* "fotokita.com" Text on Right */}
      <text
        x="52"
        y="31"
        className="fill-[#2F2926] dark:fill-[#F5EFEB] transition-colors duration-200"
        style={{
          fontFamily:
            "'Plus Jakarta Sans', 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: "26px",
          fontWeight: 700,
          letterSpacing: "-0.035em",
        }}
      >
        fotokita
        <tspan
          style={{
            fontWeight: 500,
            letterSpacing: "-0.015em",
            opacity: 0.82,
          }}
        >
          .com
        </tspan>
      </text>
    </svg>
  );
};

export default FotokitaLogo;
