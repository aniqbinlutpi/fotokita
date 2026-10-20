"use client";

import React, { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button, buttonVariants } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { cn } from "cn";

interface TimePickerProps {
  value: string; // 24h format "HH:mm"
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const PERIODS: ("AM" | "PM")[] = ["AM", "PM"];

function parse24HourTime(timeStr: string): { hour12: number; minute: string; period: "AM" | "PM" } {
  if (!timeStr) {
    return { hour12: 8, minute: "00", period: "AM" };
  }
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr || "8", 10);
  if (isNaN(h)) h = 8;
  const m = mStr ? mStr.padStart(2, "0").slice(0, 2) : "00";

  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;

  // Round minute to nearest preset if close, otherwise keep
  const foundMin = MINUTES.includes(m) ? m : MINUTES.reduce((prev, curr) => {
    return Math.abs(parseInt(curr, 10) - parseInt(m, 10)) < Math.abs(parseInt(prev, 10) - parseInt(m, 10)) ? curr : prev;
  });

  return { hour12, minute: foundMin, period };
}

function formatTo24HourTime(hour12: number, minute: string, period: "AM" | "PM"): string {
  let h = hour12 % 12;
  if (period === "PM") {
    h += 12;
  }
  return `${h.toString().padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "Select time",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { hour12, minute, period } = parse24HourTime(value);

  const handleSelectHour = (newHour: number) => {
    const formatted = formatTo24HourTime(newHour, minute, period);
    onChange(formatted);
  };

  const handleSelectMinute = (newMinute: string) => {
    const formatted = formatTo24HourTime(hour12, newMinute, period);
    onChange(formatted);
  };

  const handleSelectPeriod = (newPeriod: "AM" | "PM") => {
    const formatted = formatTo24HourTime(hour12, minute, newPeriod);
    onChange(formatted);
  };

  const displayTime = value
    ? `${hour12.toString().padStart(2, "0")}:${minute} ${period}`
    : placeholder;

  const quickPresets = [
    { label: "08:00 AM", val: "08:00" },
    { label: "10:00 AM", val: "10:00" },
    { label: "12:00 PM", val: "12:00" },
    { label: "06:00 PM", val: "18:00" },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-between font-normal h-10 px-3 cursor-pointer border-input hover:bg-muted/40 text-left font-sans text-xs",
          !value && "text-muted-foreground",
          className
        )}
      >
        <span className="truncate">{displayTime}</span>
        <Clock className="size-3.5 text-muted-foreground shrink-0 ml-1.5" />
      </PopoverTrigger>

      <PopoverContent className="w-auto p-3" align="end">
        <div className="space-y-3 font-sans">
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-1 border-b border-border/50">
            <div>Hour</div>
            <div>Minute</div>
            <div>Period</div>
          </div>

          <div className="flex items-start gap-2 h-44">
            {/* Hours list */}
            <div className="flex-1 overflow-y-auto space-y-1 h-full pr-1 overscroll-contain [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60">
              {HOURS.map((h) => {
                const isSelected = hour12 === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleSelectHour(h)}
                    className={cn(
                      "w-full h-7 rounded-md text-xs font-sans font-medium transition-colors text-center cursor-pointer select-none",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    {h.toString().padStart(2, "0")}
                  </button>
                );
              })}
            </div>

            {/* Separator */}
            <div className="w-px h-full bg-border/40" />

            {/* Minutes list */}
            <div className="flex-1 overflow-y-auto space-y-1 h-full pr-1 overscroll-contain [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60">
              {MINUTES.map((m) => {
                const isSelected = minute === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelectMinute(m)}
                    className={cn(
                      "w-full h-7 rounded-md text-xs font-sans font-medium transition-colors text-center cursor-pointer select-none",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            {/* Separator */}
            <div className="w-px h-full bg-border/40" />

            {/* AM/PM list */}
            <div className="flex flex-col gap-1.5 h-full">
              {PERIODS.map((p) => {
                const isSelected = period === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSelectPeriod(p)}
                    className={cn(
                      "px-3 h-8 rounded-md text-xs font-sans font-semibold transition-colors text-center cursor-pointer select-none",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "hover:bg-muted text-foreground border border-border/40"
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick presets */}
          <div className="pt-2 border-t border-border/50">
            <div className="text-[10px] text-muted-foreground mb-1.5 font-medium">Quick presets:</div>
            <div className="grid grid-cols-2 gap-1">
              {quickPresets.map((preset) => (
                <Button
                  key={preset.val}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    onChange(preset.val);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "text-[10px] font-sans font-medium justify-center h-6 cursor-pointer",
                    value === preset.val && "border-primary bg-primary/5 text-primary"
                  )}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
