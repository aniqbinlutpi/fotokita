import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  Volume2,
  VolumeX,
  RotateCcw,
  Play,
  Pause,
  X,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const COLS = 22;
const ROWS = 13;
const INITIAL_SPEED = 140; // ms per tick

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type GameStatus = "idle" | "playing" | "paused" | "gameover";

interface Point {
  x: number;
  y: number;
}

export interface AsciiSnakeGameProps {
  onClose?: () => void;
  className?: string;
}

export const AsciiSnakeGame: React.FC<AsciiSnakeGameProps> = ({
  onClose,
  className = "",
}) => {
  // Game state
  const [snake, setSnake] = useState<Point[]>([
    { x: 11, y: 6 },
    { x: 10, y: 6 },
    { x: 9, y: 6 },
  ]);
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [nextDirection, setNextDirection] = useState<Direction>("RIGHT");
  const [food, setFood] = useState<Point>({ x: 16, y: 6 });
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("fotokita_snake_high_score");
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [status, setStatus] = useState<GameStatus>("idle");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("fotokita_snake_sound");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });
  const [isNewHigh, setIsNewHigh] = useState<boolean>(false);
  const [colorTheme, setColorTheme] = useState<"amber" | "emerald" | "terracotta">("terracotta");

  // Touch tracking for mobile swipe
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sound Synthesizer via Web Audio API
  const playSound = useCallback(
    (type: "eat" | "turn" | "gameover" | "start") => {
      if (!soundEnabled) return;
      try {
        const AudioContextClass =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();

        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === "eat") {
          // Sweet celebratory high chord
          osc.type = "triangle";
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
        } else if (type === "turn") {
          // Subtle low click
          osc.type = "sine";
          osc.frequency.setValueAtTime(260, now);
          gain.gain.setValueAtTime(0.03, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.start(now);
          osc.stop(now + 0.04);
        } else if (type === "gameover") {
          // Retro descending game over crunch
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(280, now);
          osc.frequency.exponentialRampToValueAtTime(90, now + 0.35);
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
        } else if (type === "start") {
          // Startup chime
          osc.type = "square";
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(659.25, now + 0.08);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
        }
      } catch {
        // Silently ignore audio restrictions
      }
    },
    [soundEnabled]
  );

  // Spawns food at random free cell
  const spawnFood = useCallback((currentSnake: Point[]): Point => {
    const occupied = new Set(currentSnake.map((p) => `${p.x},${p.y}`));
    const freeCells: Point[] = [];

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!occupied.has(`${x},${y}`)) {
          freeCells.push({ x, y });
        }
      }
    }

    if (freeCells.length === 0) {
      return { x: 0, y: 0 };
    }

    const randomIndex = Math.floor(Math.random() * freeCells.length);
    return freeCells[randomIndex];
  }, []);

  // Start / restart game
  const startGame = useCallback(() => {
    const initialSnake: Point[] = [
      { x: 11, y: 6 },
      { x: 10, y: 6 },
      { x: 9, y: 6 },
    ];
    setSnake(initialSnake);
    setDirection("RIGHT");
    setNextDirection("RIGHT");
    setFood(spawnFood(initialSnake));
    setScore(0);
    setIsNewHigh(false);
    setStatus("playing");
    playSound("start");
  }, [spawnFood, playSound]);

  // Pause / resume game
  const togglePause = useCallback(() => {
    if (status === "playing") {
      setStatus("paused");
    } else if (status === "paused") {
      setStatus("playing");
    }
  }, [status]);

  // Direction changer with illegal reversal protection
  const changeDirection = useCallback(
    (newDir: Direction) => {
      // Light haptic feedback on mobile if supported
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate?.(8);
        } catch {
          // Ignore
        }
      }

      setNextDirection((curr) => {
        if (newDir === "UP" && curr !== "DOWN" && direction !== "DOWN") return "UP";
        if (newDir === "DOWN" && curr !== "UP" && direction !== "UP") return "DOWN";
        if (newDir === "LEFT" && curr !== "RIGHT" && direction !== "RIGHT") return "LEFT";
        if (newDir === "RIGHT" && curr !== "LEFT" && direction !== "LEFT") return "RIGHT";
        return curr;
      });

      playSound("turn");
    },
    [direction, playSound]
  );

  // Main game tick loop
  useEffect(() => {
    if (status !== "playing") return;

    // Calculate dynamic speed based on score (slightly faster as score climbs)
    const currentSpeed = Math.max(70, INITIAL_SPEED - Math.floor(score / 30) * 8);

    const timer = setInterval(() => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const currentDir = nextDirection;
        setDirection(currentDir);

        let newX = head.x;
        let newY = head.y;

        if (currentDir === "UP") newY -= 1;
        else if (currentDir === "DOWN") newY += 1;
        else if (currentDir === "LEFT") newX -= 1;
        else if (currentDir === "RIGHT") newX += 1;

        // Wall collision check (solid walls)
        if (newX < 0 || newX >= COLS || newY < 0 || newY >= ROWS) {
          setStatus("gameover");
          playSound("gameover");
          return prevSnake;
        }

        // Self collision check (ignore tail if moving)
        const isSelfCollision = prevSnake
          .slice(0, -1)
          .some((segment) => segment.x === newX && segment.y === newY);

        if (isSelfCollision) {
          setStatus("gameover");
          playSound("gameover");
          return prevSnake;
        }

        const newHead: Point = { x: newX, y: newY };
        const hasEatenFood = newX === food.x && newY === food.y;

        if (hasEatenFood) {
          playSound("eat");
          setScore((s) => {
            const newScore = s + 10;
            if (newScore > highScore) {
              setHighScore(newScore);
              setIsNewHigh(true);
              try {
                localStorage.setItem("fotokita_snake_high_score", newScore.toString());
              } catch {
                // Ignore storage errors
              }
            }
            return newScore;
          });

          const newSnake = [newHead, ...prevSnake];
          setFood(spawnFood(newSnake));
          return newSnake;
        }

        // Normal move: add new head, pop last segment
        return [newHead, ...prevSnake.slice(0, -1)];
      });
    }, currentSpeed);

    return () => clearInterval(timer);
  }, [status, nextDirection, food, score, highScore, spawnFood, playSound]);

  // Keyboard navigation listener (Desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Prevent page scrolling with arrow keys & spacebar inside game
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "spacebar"].includes(key)) {
        e.preventDefault();
      }

      if (e.key === "Escape" && onClose) {
        onClose();
        return;
      }

      if (status === "idle") {
        if (
          ["enter", " ", "arrowup", "arrowdown", "arrowleft", "arrowright", "w", "s", "a", "d"].includes(key)
        ) {
          startGame();
        }
        return;
      }

      if (status === "gameover") {
        if (["enter", " ", "r"].includes(key)) {
          startGame();
        }
        return;
      }

      if (key === " " || key === "p") {
        togglePause();
        return;
      }

      if (key === "r") {
        startGame();
        return;
      }

      if (status === "playing") {
        if (e.key === "ArrowUp" || key === "w") changeDirection("UP");
        else if (e.key === "ArrowDown" || key === "s") changeDirection("DOWN");
        else if (e.key === "ArrowLeft" || key === "a") changeDirection("LEFT");
        else if (e.key === "ArrowRight" || key === "d") changeDirection("RIGHT");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, startGame, togglePause, changeDirection, onClose]);

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touchEnd = e.changedTouches[0];
    const dx = touchEnd.clientX - touchStartRef.current.x;
    const dy = touchEnd.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Minimum swipe threshold (in px)
    const minSwipe = 22;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > minSwipe) {
        if (status === "idle" || status === "gameover") {
          startGame();
        } else if (status === "playing") {
          if (dx > 0) changeDirection("RIGHT");
          else changeDirection("LEFT");
        }
      }
    } else {
      if (Math.abs(dy) > minSwipe) {
        if (status === "idle" || status === "gameover") {
          startGame();
        } else if (status === "playing") {
          if (dy > 0) changeDirection("DOWN");
          else changeDirection("UP");
        }
      }
    }
  };

  // Build the ASCII grid text buffer
  const renderAsciiGrid = (): string[] => {
    // Determine head character according to direction
    let headChar = "►";
    if (direction === "UP") headChar = "▲";
    else if (direction === "DOWN") headChar = "▼";
    else if (direction === "LEFT") headChar = "◄";

    // 2D grid matrix
    const grid: string[][] = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => " ")
    );

    // Food character (sweet wedding heart ♥ or sparkling star ★)
    if (food.y >= 0 && food.y < ROWS && food.x >= 0 && food.x < COLS) {
      grid[food.y][food.x] = "♥";
    }

    // Snake body
    for (let i = 1; i < snake.length; i++) {
      const seg = snake[i];
      if (seg.y >= 0 && seg.y < ROWS && seg.x >= 0 && seg.x < COLS) {
        grid[seg.y][seg.x] = "o";
      }
    }

    // Snake head
    if (snake.length > 0) {
      const head = snake[0];
      if (head.y >= 0 && head.y < ROWS && head.x >= 0 && head.x < COLS) {
        grid[head.y][head.x] = status === "gameover" ? "x" : headChar;
      }
    }

    // Overlays for special states
    if (status === "idle") {
      const line1 = " F O T O K I T A ";
      const line2 = "  S N A K E  4 0 4  ";
      const line3 = "[ PRESS PLAY / TAP ]";

      const startY = 4;
      const centerOverlay = (str: string, rowIdx: number) => {
        const startX = Math.max(0, Math.floor((COLS - str.length) / 2));
        for (let i = 0; i < str.length && startX + i < COLS; i++) {
          grid[rowIdx][startX + i] = str[i];
        }
      };
      centerOverlay(line1, startY);
      centerOverlay(line2, startY + 1);
      centerOverlay(line3, startY + 3);
    } else if (status === "paused") {
      const pLine = "   P A U S E D   ";
      const rLine = "[TAP RESUME / SPACE]";
      const startX1 = Math.max(0, Math.floor((COLS - pLine.length) / 2));
      const startX2 = Math.max(0, Math.floor((COLS - rLine.length) / 2));
      for (let i = 0; i < pLine.length; i++) grid[5][startX1 + i] = pLine[i];
      for (let i = 0; i < rLine.length; i++) grid[7][startX2 + i] = rLine[i];
    } else if (status === "gameover") {
      const line1 = "  G A M E  O V E R  ";
      const line2 = `SCORE: ${score.toString().padStart(4, "0")}`;
      const line3 = isNewHigh ? "* NEW HIGH SCORE *" : `RECORD: ${highScore.toString().padStart(4, "0")}`;
      const line4 = "[ TAP TO REPLAY ]";

      const centerRow = (str: string, r: number) => {
        const sX = Math.max(0, Math.floor((COLS - str.length) / 2));
        for (let i = 0; i < str.length && sX + i < COLS; i++) {
          grid[r][sX + i] = str[i];
        }
      };

      centerRow(line1, 3);
      centerRow(line2, 5);
      centerRow(line3, 6);
      centerRow(line4, 8);
    }

    // Border generation
    const topBorder = "┌" + "─".repeat(COLS) + "┐";
    const bottomBorder = "└" + "─".repeat(COLS) + "┘";
    const bodyLines = grid.map((row) => "│" + row.join("") + "│");

    return [topBorder, ...bodyLines, bottomBorder];
  };

  // Color theme definitions
  const themeStyles = {
    terracotta: {
      bg: "bg-[#181311]",
      border: "border-[#4A3830]",
      text: "text-[#F5D5C3]",
      highlight: "text-[#E08A68]",
      badge: "bg-[#2E201B] text-[#F5D5C3] border-[#543E34]",
      glow: "shadow-[0_0_35px_rgba(224,138,104,0.12)]",
      dpadBtn: "bg-[#2E201B] hover:bg-[#3D2C25] active:bg-[#4A3830] text-[#F5D5C3] border-[#543E34]",
      accentBtn: "bg-[#E08A68] text-[#181311] hover:bg-[#EAA184]",
    },
    amber: {
      bg: "bg-[#141008]",
      border: "border-[#4D391A]",
      text: "text-[#FCD34D]",
      highlight: "text-[#F59E0B]",
      badge: "bg-[#261E0E] text-[#FCD34D] border-[#5E4720]",
      glow: "shadow-[0_0_35px_rgba(245,158,11,0.14)]",
      dpadBtn: "bg-[#261E0E] hover:bg-[#382B14] active:bg-[#4D391A] text-[#FCD34D] border-[#5E4720]",
      accentBtn: "bg-[#F59E0B] text-[#141008] hover:bg-[#FBBF24]",
    },
    emerald: {
      bg: "bg-[#0A140E]",
      border: "border-[#1A422B]",
      text: "text-[#6EE7B7]",
      highlight: "text-[#10B981]",
      badge: "bg-[#10291D] text-[#6EE7B7] border-[#22583A]",
      glow: "shadow-[0_0_35px_rgba(16,185,129,0.14)]",
      dpadBtn: "bg-[#10291D] hover:bg-[#193F2D] active:bg-[#22583A] text-[#6EE7B7] border-[#22583A]",
      accentBtn: "bg-[#10B981] text-[#0A140E] hover:bg-[#34D399]",
    },
  }[colorTheme];

  const asciiRows = renderAsciiGrid();

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.94, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 10 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full max-w-md mx-auto select-none ${className}`}
    >
      {/* Retro Arcade / Terminal Box */}
      <div
        className={`rounded-2xl border ${themeStyles.border} ${themeStyles.bg} ${themeStyles.glow} overflow-hidden shadow-2xl transition-all duration-300 relative`}
      >
        {/* CRT Scanline Filter Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] z-10"
          aria-hidden="true"
        />

        {/* Vintage Terminal Title Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 bg-black/30 backdrop-blur-sm z-20 relative">
          <div className="flex items-center gap-2">
            <span className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-[#EF4444]/80 inline-block" />
              <span className="size-2.5 rounded-full bg-[#F59E0B]/80 inline-block" />
              <span className="size-2.5 rounded-full bg-[#10B981]/80 inline-block" />
            </span>
            <span className="font-mono text-[10px] tracking-wider text-white/60 font-semibold uppercase hidden sm:inline">
              fotokita-terminal // 404_snake.sh
            </span>
            <span className="font-mono text-[10px] tracking-wider text-white/60 font-semibold uppercase sm:hidden">
              404_SNAKE.SH
            </span>
          </div>

          {/* Top Actions: Theme Switcher, Sound, Close */}
          <div className="flex items-center gap-1.5">
            {/* Theme Toggle (Terracotta, Amber, Emerald) */}
            <div className="flex items-center gap-1 mr-1">
              <button
                type="button"
                onClick={() => setColorTheme("terracotta")}
                title="Warm Terracotta CRT"
                aria-label="Warm Terracotta Theme"
                className={`size-3.5 rounded-full bg-[#E08A68] transition-transform ${
                  colorTheme === "terracotta" ? "ring-2 ring-white scale-110" : "opacity-50 hover:opacity-100"
                }`}
              />
              <button
                type="button"
                onClick={() => setColorTheme("amber")}
                title="Phosphor Amber CRT"
                aria-label="Phosphor Amber Theme"
                className={`size-3.5 rounded-full bg-[#F59E0B] transition-transform ${
                  colorTheme === "amber" ? "ring-2 ring-white scale-110" : "opacity-50 hover:opacity-100"
                }`}
              />
              <button
                type="button"
                onClick={() => setColorTheme("emerald")}
                title="Matrix Emerald CRT"
                aria-label="Matrix Emerald Theme"
                className={`size-3.5 rounded-full bg-[#10B981] transition-transform ${
                  colorTheme === "emerald" ? "ring-2 ring-white scale-110" : "opacity-50 hover:opacity-100"
                }`}
              />
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                try {
                  localStorage.setItem("fotokita_snake_sound", String(next));
                } catch {
                  // Ignore
                }
                if (next) playSound("start");
              }}
              className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={soundEnabled ? "Mute 8-bit sound" : "Enable 8-bit sound"}
              aria-label={soundEnabled ? "Mute audio" : "Enable audio"}
            >
              {soundEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
            </button>

            {/* Close Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Exit Game (Esc)"
                aria-label="Close Snake Game"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Score & HUD Ribbon */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/20 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-white/40 uppercase tracking-widest text-[10px]">Score</span>
            <span className={`font-bold tabular-nums text-sm ${themeStyles.highlight}`}>
              {score.toString().padStart(4, "0")}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <Trophy className="size-3 text-amber-400" />
            <span className="text-white/40 uppercase tracking-widest text-[10px] hidden sm:inline">Record</span>
            <span className="font-semibold text-white/80 tabular-nums">
              {highScore.toString().padStart(4, "0")}
            </span>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-1.5">
            <span
              className={`size-1.5 rounded-full ${
                status === "playing"
                  ? "bg-emerald-400 animate-pulse"
                  : status === "paused"
                  ? "bg-amber-400"
                  : "bg-white/30"
              }`}
            />
            <span className="text-[10px] uppercase font-mono tracking-wider text-white/50">
              {status}
            </span>
          </div>
        </div>

        {/* ASCII Playfield Display */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="p-3 sm:p-4 flex flex-col items-center justify-center relative touch-none cursor-pointer"
          onClick={() => {
            if (status === "idle" || status === "gameover") {
              startGame();
            }
          }}
        >
          <pre
            className={`font-mono text-[11px] xs:text-[13px] sm:text-[14px] md:text-[15px] leading-[1.12] sm:leading-[1.15] tracking-[0.14em] sm:tracking-[0.18em] font-bold ${themeStyles.text} transition-colors duration-200 select-none drop-shadow-[0_0_8px_currentColor]`}
            style={{
              textShadow: "0 0 6px currentColor",
            }}
          >
            {asciiRows.join("\n")}
          </pre>

          {/* Idle / Gameover Floating Action Pill */}
          <AnimatePresence>
            {(status === "idle" || status === "gameover") && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-20"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  {status === "gameover" ? (
                    <>
                      <span className="text-rose-400 font-mono text-xs uppercase tracking-widest font-bold">
                        Collision Detected!
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startGame();
                        }}
                        className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-mono text-xs font-bold uppercase tracking-wider ${themeStyles.accentBtn} shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95`}
                      >
                        <RotateCcw className="size-3.5" />
                        <span>Play Again</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 font-mono text-[11px]">
                        <Sparkles className="size-3 text-amber-300" />
                        <span>Retro ASCII Snake</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startGame();
                        }}
                        className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider ${themeStyles.accentBtn} shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95 mt-1`}
                      >
                        <Play className="size-3.5 fill-current" />
                        <span>Start Game</span>
                      </button>
                    </>
                  )}
                  <span className="text-white/40 font-mono text-[10px] tracking-wide mt-1">
                    Swipe or use D-Pad on mobile • Arrow / WASD on PC
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Tactile D-Pad & Controls Controller */}
        <div className="p-3 bg-black/35 border-t border-white/5 flex flex-col items-center gap-2">
          {/* Action Row (Pause / Resume / Restart / Exit) */}
          <div className="w-full flex items-center justify-between text-xs font-mono px-2">
            <button
              type="button"
              onClick={togglePause}
              disabled={status === "idle" || status === "gameover"}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
                status === "idle" || status === "gameover"
                  ? "opacity-30 cursor-not-allowed border-white/5 text-white/40"
                  : themeStyles.badge
              }`}
            >
              {status === "paused" ? (
                <>
                  <Play className="size-3 fill-current" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="size-3" />
                  <span>Pause</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={startGame}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${themeStyles.badge}`}
            >
              <RotateCcw className="size-3" />
              <span>Restart</span>
            </button>
          </div>

          {/* D-Pad Buttons (Ergonomic Touch Controller) */}
          <div className="relative w-40 h-32 flex flex-col items-center justify-center my-1 select-none">
            {/* UP BUTTON */}
            <button
              type="button"
              onClick={() => changeDirection("UP")}
              disabled={status !== "playing"}
              className={`absolute top-0 w-12 h-10 rounded-xl border flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-90 ${themeStyles.dpadBtn}`}
              aria-label="Snake Up"
            >
              <ArrowUp className="size-4" />
            </button>

            {/* LEFT BUTTON */}
            <button
              type="button"
              onClick={() => changeDirection("LEFT")}
              disabled={status !== "playing"}
              className={`absolute left-0 top-11 w-12 h-10 rounded-xl border flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-90 ${themeStyles.dpadBtn}`}
              aria-label="Snake Left"
            >
              <ArrowLeft className="size-4" />
            </button>

            {/* CENTER LOGO PILL */}
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center pointer-events-none">
              <span className="text-[9px] font-mono text-white/30 font-bold">FK</span>
            </div>

            {/* RIGHT BUTTON */}
            <button
              type="button"
              onClick={() => changeDirection("RIGHT")}
              disabled={status !== "playing"}
              className={`absolute right-0 top-11 w-12 h-10 rounded-xl border flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-90 ${themeStyles.dpadBtn}`}
              aria-label="Snake Right"
            >
              <ArrowRight className="size-4" />
            </button>

            {/* DOWN BUTTON */}
            <button
              type="button"
              onClick={() => changeDirection("DOWN")}
              disabled={status !== "playing"}
              className={`absolute bottom-0 w-12 h-10 rounded-xl border flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-90 ${themeStyles.dpadBtn}`}
              aria-label="Snake Down"
            >
              <ArrowDown className="size-4" />
            </button>
          </div>

          {/* Controls Instruction Helper */}
          <div className="text-[10px] font-mono text-white/40 text-center flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 pt-1">
            <span className="hidden sm:inline">Desktop: Arrow keys or WASD</span>
            <span className="hidden sm:inline">Space: Pause</span>
            <span>Mobile: Swipe screen or tap D-Pad</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
