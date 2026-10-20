/**
 * Utilities for calculating and validating subscription plan durations,
 * start dates, and end times against wedding event dates.
 */

export function getPlanDurationMs(planTier: string): number {
  switch (planTier?.toLowerCase()) {
    case "12h":
      return 12 * 60 * 60 * 1000;
    case "1day":
    case "oneday":
    case "standard":
    case "premium":
      return 24 * 60 * 60 * 1000;
    case "3days":
    case "threedays":
      return 3 * 24 * 60 * 60 * 1000;
    case "1week":
    case "oneweek":
      return 7 * 24 * 60 * 60 * 1000;
    case "1month":
    case "onemonth":
      return 30 * 24 * 60 * 60 * 1000;
    case "1year":
    case "oneyear":
    case "vip":
      return 365 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

export function getPlanDurationLabel(planTier: string): string {
  switch (planTier?.toLowerCase()) {
    case "12h":
      return "12 Hours";
    case "1day":
    case "oneday":
    case "standard":
    case "premium":
      return "24 Hours (Full Day)";
    case "3days":
    case "threedays":
      return "3 Days (Weekend Pass)";
    case "1week":
    case "oneweek":
      return "7 Days (1 Week)";
    case "1month":
    case "onemonth":
      return "30 Days (1 Month)";
    case "1year":
    case "oneyear":
    case "vip":
      return "365 Days (1 Full Year)";
    default:
      return "24 Hours (Full Day)";
  }
}

export function calculatePlanEndDate(planTier: string, startDate: Date): Date {
  const durationMs = getPlanDurationMs(planTier);
  return new Date(startDate.getTime() + durationMs);
}

export function getPlanDurationLabelEn(planTier: string): string {
  switch (planTier?.toLowerCase()) {
    case "12h":
      return "12 Hours";
    case "1day":
    case "oneday":
    case "standard":
    case "premium":
      return "24 Hours (Full Day)";
    case "3days":
    case "threedays":
      return "3 Days (Weekend Pass)";
    case "1week":
    case "oneweek":
      return "7 Days (1 Week)";
    case "1month":
    case "onemonth":
      return "30 Days (1 Month)";
    case "1year":
    case "oneyear":
    case "vip":
      return "365 Days (1 Full Year)";
    default:
      return "24 Hours (Full Day)";
  }
}

export function parseDateOnly(dateStr: string): { start: Date; end: Date } | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-").map(Number);
  if (parts.length >= 3 && !parts.some(isNaN)) {
    const [year, month, day] = parts;
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day, 23, 59, 59, 999);
    return { start, end };
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function validatePlanCoverageEn(
  weddingDateStr: string,
  planStartDate: Date,
  planEndDate: Date
): {
  isValid: boolean;
  message?: string;
  weddingFormatted?: string;
  startFormatted?: string;
  endFormatted?: string;
} {
  if (!weddingDateStr) {
    return { isValid: true };
  }

  const parsed = parseDateOnly(weddingDateStr);
  if (!parsed) {
    return { isValid: true };
  }

  const { start: weddingDayStart, end: weddingDayEnd } = parsed;

  const weddingFormatted = weddingDayStart.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const startFormatted = planStartDate.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const endFormatted = planEndDate.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 1. Activation start date cannot be after the wedding date!
  if (planStartDate.getTime() > weddingDayEnd.getTime()) {
    return {
      isValid: false,
      message: `Gallery activation date (${startFormatted}) cannot be after your wedding date (${weddingFormatted}). The system must start active on or before your wedding event.`,
      weddingFormatted,
      startFormatted,
      endFormatted,
    };
  }

  // 2. Plan expiration date cannot end before the wedding day starts!
  if (planEndDate.getTime() < weddingDayStart.getTime()) {
    return {
      isValid: false,
      message: `Plan expiration (${endFormatted}) is earlier than your wedding date (${weddingFormatted}). The plan must remain active during your wedding event. Please choose a start date closer to your event or select a longer plan.`,
      weddingFormatted,
      startFormatted,
      endFormatted,
    };
  }

  return {
    isValid: true,
    weddingFormatted,
    startFormatted,
    endFormatted,
  };
}

/**
 * Validates that:
 * 1. The plan's start date is on or before the wedding day.
 * 2. The plan's end date is on or after the wedding event date.
 * If either condition fails, it will be flagged as invalid.
 */
export function validatePlanCoverage(
  weddingDateStr: string,
  planStartDate: Date,
  planEndDate: Date
): {
  isValid: boolean;
  message?: string;
  weddingFormatted?: string;
  startFormatted?: string;
  endFormatted?: string;
} {
  if (!weddingDateStr) {
    return { isValid: true };
  }

  const parsed = parseDateOnly(weddingDateStr);
  if (!parsed) {
    return { isValid: true };
  }

  const { start: weddingDayStart, end: weddingDayEnd } = parsed;

  const weddingFormatted = weddingDayStart.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const startFormatted = planStartDate.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const endFormatted = planEndDate.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 1. Activation start date cannot be after the wedding date
  if (planStartDate.getTime() > weddingDayEnd.getTime()) {
    return {
      isValid: false,
      message: `Gallery activation date (${startFormatted}) cannot be after your wedding date (${weddingFormatted}). The system must start active on or before your wedding event.`,
      weddingFormatted,
      startFormatted,
      endFormatted,
    };
  }

  // 2. Plan expiration date cannot end before the wedding day starts
  if (planEndDate.getTime() < weddingDayStart.getTime()) {
    return {
      isValid: false,
      message: `Plan expiration (${endFormatted}) is earlier than your wedding date (${weddingFormatted}). The plan must remain active during your wedding event. Please choose a start date closer to your event or select a longer plan.`,
      weddingFormatted,
      startFormatted,
      endFormatted,
    };
  }

  return {
    isValid: true,
    weddingFormatted,
    startFormatted,
    endFormatted,
  };
}

/**
 * Helper to format a Date into an HTML datetime-local input string: YYYY-MM-DDTHH:mm
 */
export function formatToDatetimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}
