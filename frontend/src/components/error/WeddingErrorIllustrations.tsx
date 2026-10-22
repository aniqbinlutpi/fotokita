import React from "react";
import { motion } from "motion/react";

interface IllustrationProps {
  className?: string;
}

/**
 * 404 Illustration:
 * Floating vintage Polaroid with empty frame silhouette,
 * intertwined golden wedding rings with harmonic floating motion,
 * and drifting celebratory confetti / sparkles.
 */
export const NotFoundIllustration: React.FC<IllustrationProps> = ({ className = "" }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Background Soft Glow */}
      <motion.div
        initial={{ opacity: 0.3, scale: 0.9 }}
        animate={{ opacity: [0.3, 0.5, 0.3], scale: [0.9, 1.05, 0.9] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-56 h-56 rounded-full bg-gradient-to-tr from-[#A67C6B]/20 via-[#D5C2B2]/15 to-transparent blur-2xl pointer-events-none"
      />

      <svg
        viewBox="0 0 320 280"
        className="w-full max-w-[280px] sm:max-w-[320px] h-auto drop-shadow-md overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ringGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DFBF8A" />
            <stop offset="50%" stopColor="#C99859" />
            <stop offset="100%" stopColor="#A67C6B" />
          </linearGradient>
          <linearGradient id="polaroidBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F5EFEB" />
          </linearGradient>
          <linearGradient id="photoVoid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ECE5DC" />
            <stop offset="100%" stopColor="#DFD6C9" />
          </linearGradient>
        </defs>

        {/* Drifting Sparkles / Petals */}
        <motion.circle
          cx="45"
          cy="70"
          r="3"
          className="fill-[#A67C6B]"
          animate={{ y: [-10, 10, -10], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="280"
          cy="90"
          r="4"
          className="fill-[#DFBF8A]"
          animate={{ y: [8, -8, 8], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.path
          d="M 60 190 Q 65 180 70 192 T 60 190"
          className="fill-[#A67C6B]/40"
          animate={{ rotate: [0, 15, -10, 0], y: [-6, 6, -6] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="260"
          cy="200"
          r="2.5"
          className="fill-[#A67C6B]/60"
          animate={{ y: [-5, 8, -5], opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        />

        {/* Vintage Polaroid Frame */}
        <motion.g
          animate={{ y: [-4, 6, -4], rotate: [-2, 2, -2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "155px 135px" }}
        >
          {/* Polaroid Paper Shadow & Body */}
          <rect
            x="80"
            y="35"
            width="150"
            height="185"
            rx="8"
            fill="url(#polaroidBg)"
            stroke="#D8CDC1"
            strokeWidth="1.5"
            className="dark:fill-[#1C1815] dark:stroke-[#3D352E]"
          />

          {/* Missing Photo Window with dashed outline */}
          <rect
            x="94"
            y="49"
            width="122"
            height="124"
            rx="4"
            fill="url(#photoVoid)"
            stroke="#C4B6A6"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="dark:fill-[#25201C] dark:stroke-[#4A4038]"
          />

          {/* Delicate Mountain/Sun silhouette inside empty frame */}
          <g opacity="0.45" className="text-[#8F8175] dark:text-[#887C73]">
            <circle cx="178" cy="82" r="9" fill="currentColor" opacity="0.7" />
            <path
              d="M 102 154 L 132 118 L 158 142 L 180 125 L 208 154 Z"
              fill="currentColor"
            />
          </g>

          {/* Question / Heart Watermark */}
          <motion.g
            animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "155px 110px" }}
          >
            <circle cx="155" cy="110" r="18" className="fill-[#F8F5F0]/90 dark:fill-[#181513]/90 shadow-xs" />
            <text
              x="155"
              y="116"
              textAnchor="middle"
              className="fill-[#A67C6B] text-[17px] font-serif font-bold"
            >
              ?
            </text>
          </motion.g>

          {/* Polaroid Bottom Notes (Faded Handwritten Effect) */}
          <path
            d="M 102 190 Q 120 188 140 190 T 170 189"
            stroke="#B8AAA0"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="dark:stroke-[#594E46]"
          />
          <circle cx="188" cy="189" r="2" fill="#B8AAA0" className="dark:fill-[#594E46]" />
        </motion.g>

        {/* Golden Wedding Rings Floating at Foreground */}
        <motion.g
          animate={{ y: [6, -8, 6], rotate: [4, -4, 4] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          style={{ transformOrigin: "215px 200px" }}
        >
          {/* Ring 1 (Groom) */}
          <ellipse
            cx="205"
            cy="198"
            rx="20"
            ry="20"
            stroke="url(#ringGold)"
            strokeWidth="4"
            fill="none"
          />
          {/* Ring 2 (Bride with Diamond highlight) */}
          <ellipse
            cx="225"
            cy="192"
            rx="19"
            ry="19"
            stroke="url(#ringGold)"
            strokeWidth="4"
            fill="none"
          />
          {/* Sparkle on the diamond */}
          <motion.g
            animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "235px 177px" }}
          >
            <path
              d="M 235 171 L 237 177 L 243 179 L 237 181 L 235 187 L 233 181 L 227 179 L 233 177 Z"
              fill="#FFF2CC"
              stroke="#D4AF37"
              strokeWidth="0.8"
            />
          </motion.g>
        </motion.g>
      </svg>
    </div>
  );
};

/**
 * 500 Illustration:
 * Vintage Camera & Shutter / Flash calibration animation.
 * Soft rotating lens aperture with gentle warm flash recharge pulse.
 */
export const ServerErrorIllustration: React.FC<IllustrationProps> = ({ className = "" }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Warm Flash Recharge Ambient Pulse */}
      <motion.div
        initial={{ opacity: 0.2, scale: 0.85 }}
        animate={{ opacity: [0.2, 0.55, 0.2], scale: [0.85, 1.15, 0.85] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-60 h-60 rounded-full bg-gradient-to-tr from-[#9E3E3E]/15 via-[#A67C6B]/20 to-transparent blur-2xl pointer-events-none"
      />

      <svg
        viewBox="0 0 320 280"
        className="w-full max-w-[280px] sm:max-w-[320px] h-auto drop-shadow-md overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cameraBodyLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#ECE5DC" />
          </linearGradient>
          <linearGradient id="lensRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A67C6B" />
            <stop offset="50%" stopColor="#7A5647" />
            <stop offset="100%" stopColor="#4A342B" />
          </linearGradient>
          <linearGradient id="apertureGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DFBF8A" />
            <stop offset="100%" stopColor="#A67C6B" />
          </linearGradient>
        </defs>

        {/* Vintage Camera Housing */}
        <motion.g
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "160px 145px" }}
        >
          {/* Main Camera Body */}
          <rect
            x="60"
            y="85"
            width="200"
            height="125"
            rx="16"
            fill="url(#cameraBodyLight)"
            stroke="#D5CCC2"
            strokeWidth="2"
            className="dark:fill-[#1E1A17] dark:stroke-[#3E352E]"
          />

          {/* Top Prism / Viewfinder Pyramid */}
          <path
            d="M 125 85 L 140 60 L 180 60 L 195 85 Z"
            fill="url(#cameraBodyLight)"
            stroke="#D5CCC2"
            strokeWidth="2"
            strokeLinejoin="round"
            className="dark:fill-[#1E1A17] dark:stroke-[#3E352E]"
          />

          {/* Viewfinder Window */}
          <rect
            x="148"
            y="67"
            width="24"
            height="14"
            rx="3"
            fill="#2F2926"
            className="dark:fill-[#0A0908]"
          />

          {/* Flash Bulb / Indicator on top left */}
          <circle cx="88" cy="72" r="10" fill="#E8DEC8" stroke="#A67C6B" strokeWidth="2" className="dark:fill-[#2B231D]" />
          <motion.circle
            cx="88"
            cy="72"
            r="6"
            fill="#A67C6B"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Film Advance Wheel / Dial on top right */}
          <rect x="220" y="74" width="22" height="11" rx="2" fill="#7A7069" className="dark:fill-[#4A423D]" />

          {/* Camera Front Leather Grip Stripe */}
          <rect
            x="60"
            y="130"
            width="200"
            height="50"
            fill="#2F2926"
            opacity="0.06"
            className="dark:fill-[#FFFFFF] dark:opacity-5"
          />

          {/* Large Center Lens Outer Ring */}
          <circle
            cx="160"
            cy="145"
            r="48"
            fill="#F4EFEA"
            stroke="url(#lensRing)"
            strokeWidth="4"
            className="dark:fill-[#141210]"
          />

          {/* Inner Lens Glass */}
          <circle
            cx="160"
            cy="145"
            r="38"
            fill="#2A2420"
            stroke="#A67C6B"
            strokeWidth="1.5"
            className="dark:fill-[#0D0B0A]"
          />

          {/* Rotating Aperture Blades */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "160px 145px" }}
          >
            <path
              d="M 160 119 L 176 135 L 160 145 Z"
              fill="url(#apertureGlow)"
              opacity="0.75"
            />
            <path
              d="M 186 145 L 170 161 L 160 145 Z"
              fill="url(#apertureGlow)"
              opacity="0.75"
            />
            <path
              d="M 160 171 L 144 155 L 160 145 Z"
              fill="url(#apertureGlow)"
              opacity="0.75"
            />
            <path
              d="M 134 145 L 150 129 L 160 145 Z"
              fill="url(#apertureGlow)"
              opacity="0.75"
            />
          </motion.g>

          {/* Center Aperture Opening / Pupil */}
          <motion.circle
            cx="160"
            cy="145"
            r="11"
            fill="#12100E"
            stroke="#DFBF8A"
            strokeWidth="1.5"
            animate={{ r: [10, 14, 10] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Lens Glass Reflection Arc */}
          <path
            d="M 138 126 A 26 26 0 0 1 158 120"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Red Recording / Alert Status Dot */}
          <motion.circle
            cx="240"
            cy="105"
            r="3.5"
            fill="#9E3E3E"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        </motion.g>

        {/* Animated Little Wrench / Calibrate Sparkles */}
        <motion.path
          d="M 68 220 L 76 212"
          stroke="#A67C6B"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ rotate: [0, 15, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "72px 216px" }}
        />
        <motion.circle
          cx="255"
          cy="225"
          r="2.5"
          className="fill-[#A67C6B]/60"
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
};

/**
 * 403 Illustration:
 * By Invitation Only - Golden Wax Seal & Regal Wedding Envelope.
 */
export const ForbiddenIllustration: React.FC<IllustrationProps> = ({ className = "" }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Background Subtle Radiance */}
      <motion.div
        initial={{ opacity: 0.25, scale: 0.9 }}
        animate={{ opacity: [0.25, 0.45, 0.25], scale: [0.9, 1.08, 0.9] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-56 h-56 rounded-full bg-gradient-to-tr from-[#A67C6B]/25 via-[#D5C2B2]/15 to-transparent blur-2xl pointer-events-none"
      />

      <svg
        viewBox="0 0 320 280"
        className="w-full max-w-[280px] sm:max-w-[320px] h-auto drop-shadow-md overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="waxGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ECC875" />
            <stop offset="50%" stopColor="#C99859" />
            <stop offset="100%" stopColor="#8C5C39" />
          </linearGradient>
          <linearGradient id="envBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFCF8" />
            <stop offset="100%" stopColor="#F2ECE4" />
          </linearGradient>
        </defs>

        {/* Envelope Body */}
        <motion.g
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "160px 145px" }}
        >
          {/* Back panel & outline */}
          <rect
            x="65"
            y="75"
            width="190"
            height="130"
            rx="8"
            fill="url(#envBg)"
            stroke="#D8CDC1"
            strokeWidth="2"
            className="dark:fill-[#1C1815] dark:stroke-[#3D352E]"
          />

          {/* Envelope Inner V-Flap lines */}
          <path
            d="M 66 76 L 160 148 L 254 76"
            stroke="#C4B6A6"
            strokeWidth="1.5"
            fill="none"
            className="dark:stroke-[#3E352D]"
          />
          <path
            d="M 66 204 L 132 140"
            stroke="#D8CDC1"
            strokeWidth="1.5"
            className="dark:stroke-[#332B25]"
          />
          <path
            d="M 254 204 L 188 140"
            stroke="#D8CDC1"
            strokeWidth="1.5"
            className="dark:stroke-[#332B25]"
          />

          {/* Delicate ribbon loop */}
          <path
            d="M 125 148 Q 160 162 195 148"
            stroke="#A67C6B"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />

          {/* Regal Wax Seal with Monogram / Keyhole */}
          <motion.g
            animate={{ scale: [0.98, 1.04, 0.98] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "160px 148px" }}
          >
            {/* Wax Seal outer scallops */}
            <circle
              cx="160"
              cy="148"
              r="24"
              fill="url(#waxGold)"
              stroke="#6B4125"
              strokeWidth="1"
              className="drop-shadow-sm"
            />
            {/* Wax Seal Inner Rim */}
            <circle
              cx="160"
              cy="148"
              r="19"
              fill="none"
              stroke="#593219"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              opacity="0.6"
            />

            {/* Lock / Keyhole Icon in Seal */}
            <path
              d="M 154 147 A 6 6 0 0 1 166 147 L 166 151 L 154 151 Z"
              fill="none"
              stroke="#43220E"
              strokeWidth="1.8"
            />
            <rect
              x="152"
              y="150"
              width="16"
              height="11"
              rx="2.5"
              fill="#43220E"
            />
            <circle cx="160" cy="154" r="1.5" fill="#DFBF8A" />
            <path d="M 160 155.5 L 160 158" stroke="#DFBF8A" strokeWidth="1" strokeLinecap="round" />
          </motion.g>

          {/* Botanical sprigs on corners of envelope */}
          <path
            d="M 85 92 Q 95 86 100 95"
            stroke="#A67C6B"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
          <circle cx="98" cy="90" r="1.5" fill="#A67C6B" opacity="0.7" />
          <path
            d="M 235 92 Q 225 86 220 95"
            stroke="#A67C6B"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
          <circle cx="222" cy="90" r="1.5" fill="#A67C6B" opacity="0.7" />
        </motion.g>
      </svg>
    </div>
  );
};

/**
 * 400 Illustration:
 * Vintage 35mm film canister with gently unspooling film leader & question tag.
 */
export const BadRequestIllustration: React.FC<IllustrationProps> = ({ className = "" }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Background Subtle Glow */}
      <motion.div
        initial={{ opacity: 0.25, scale: 0.9 }}
        animate={{ opacity: [0.25, 0.45, 0.25], scale: [0.9, 1.08, 0.9] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-56 h-56 rounded-full bg-gradient-to-tr from-[#A67C6B]/20 via-[#DFBF8A]/15 to-transparent blur-2xl pointer-events-none"
      />

      <svg
        viewBox="0 0 320 280"
        className="w-full max-w-[280px] sm:max-w-[320px] h-auto drop-shadow-md overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="canisterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3E342F" />
            <stop offset="50%" stopColor="#25201C" />
            <stop offset="100%" stopColor="#14110F" />
          </linearGradient>
          <linearGradient id="goldCap" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ECC875" />
            <stop offset="50%" stopColor="#C99859" />
            <stop offset="100%" stopColor="#8C5C39" />
          </linearGradient>
        </defs>

        {/* Film Canister Body */}
        <motion.g
          animate={{ y: [-3, 3, -3], rotate: [-1, 1, -1] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "120px 145px" }}
        >
          {/* Top Spool Knob */}
          <rect x="108" y="58" width="24" height="12" rx="3" fill="url(#goldCap)" />

          {/* Main Canister Cylinder */}
          <rect
            x="85"
            y="68"
            width="70"
            height="135"
            rx="10"
            fill="url(#canisterGrad)"
            stroke="#D5CCC2"
            strokeWidth="1.5"
            className="dark:stroke-[#453C35]"
          />

          {/* Gold Metallic Band on Canister */}
          <rect x="85" y="115" width="70" height="28" fill="url(#goldCap)" opacity="0.9" />
          <text
            x="120"
            y="133"
            textAnchor="middle"
            className="fill-[#1A1715] text-[10px] font-sans font-bold uppercase tracking-widest"
          >
            ISO 400
          </text>

          {/* Canister Rim accents */}
          <line x1="85" y1="78" x2="155" y2="78" stroke="#DFBF8A" strokeWidth="1.5" opacity="0.6" />
          <line x1="85" y1="193" x2="155" y2="193" stroke="#DFBF8A" strokeWidth="1.5" opacity="0.6" />
        </motion.g>

        {/* Unspooling Film Ribbon with Sprocket Holes */}
        <motion.g
          animate={{ x: [-2, 3, -2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Curved film strip flowing to the right */}
          <path
            d="M 154 90 C 185 85, 205 110, 245 105 C 265 102, 280 115, 285 135 L 285 175 C 275 160, 255 150, 240 152 C 200 158, 180 135, 154 140 Z"
            fill="#231E1B"
            stroke="#A67C6B"
            strokeWidth="1.5"
            className="dark:fill-[#12100E]"
          />

          {/* Film Sprocket Holes along top */}
          <rect x="175" y="94" width="7" height="5" rx="1" fill="#DFBF8A" opacity="0.75" />
          <rect x="195" y="97" width="7" height="5" rx="1" fill="#DFBF8A" opacity="0.75" />
          <rect x="218" y="102" width="7" height="5" rx="1" fill="#DFBF8A" opacity="0.75" />
          <rect x="240" y="103" width="7" height="5" rx="1" fill="#DFBF8A" opacity="0.75" />
          <rect x="262" y="109" width="7" height="5" rx="1" fill="#DFBF8A" opacity="0.75" />

          {/* Film Sprocket Holes along bottom */}
          <rect x="175" y="132" width="7" height="5" rx="1" fill="#DFBF8A" opacity="0.75" />
          <rect x="195" y="138" width="7" height="5" rx="1" fill="#DFBF8A" opacity="0.75" />
          <rect x="218" y="145" width="7" height="5" rx="1" fill="#DFBF8A" opacity="0.75" />
          <rect x="240" y="146" width="7" height="5" rx="1" fill="#DFBF8A" opacity="0.75" />
          <rect x="262" y="153" width="7" height="5" rx="1" fill="#DFBF8A" opacity="0.75" />

          {/* Center Film Frame Placeholder */}
          <rect
            x="200"
            y="110"
            width="40"
            height="28"
            rx="2"
            fill="#14110F"
            stroke="#DFBF8A"
            strokeWidth="0.8"
            strokeDasharray="2 2"
          />
          <text
            x="220"
            y="128"
            textAnchor="middle"
            className="fill-[#A67C6B] text-[12px] font-serif font-bold"
          >
            !
          </text>
        </motion.g>

        {/* Ambient Sparkles */}
        <motion.circle
          cx="60"
          cy="120"
          r="3"
          className="fill-[#A67C6B]"
          animate={{ y: [-6, 6, -6], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="285"
          cy="80"
          r="2.5"
          className="fill-[#DFBF8A]"
          animate={{ y: [6, -6, 6], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        />
      </svg>
    </div>
  );
};
