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
      return "12 Jam";
    case "1day":
    case "oneday":
    case "standard":
      return "24 Jam (1 Hari Penuh)";
    case "3days":
    case "threedays":
      return "3 Hari (Weekend Pass)";
    case "1week":
    case "oneweek":
      return "7 Hari (1 Minggu)";
    case "1month":
    case "onemonth":
      return "30 Hari (1 Bulan)";
    case "1year":
    case "oneyear":
    case "vip":
      return "365 Hari (1 Tahun Penuh)";
    default:
      return "24 Jam (1 Hari Penuh)";
  }
}

export function calculatePlanEndDate(planTier: string, startDate: Date): Date {
  const durationMs = getPlanDurationMs(planTier);
  return new Date(startDate.getTime() + durationMs);
}

/**
 * Validates that the plan's end date is on or after the wedding event date.
 * If the plan ends before the wedding day, it will be flagged as invalid.
 */
export function validatePlanCoverage(weddingDateStr: string, planEndDate: Date): {
  isValid: boolean;
  message?: string;
  weddingFormatted?: string;
  endFormatted?: string;
} {
  if (!weddingDateStr) {
    return { isValid: true };
  }

  // Parse wedding date
  const weddingDate = new Date(weddingDateStr);
  if (isNaN(weddingDate.getTime())) {
    return { isValid: true };
  }

  // Compare against start of wedding date
  const weddingDayStart = new Date(weddingDate);
  weddingDayStart.setHours(0, 0, 0, 0);

  const weddingFormatted = weddingDayStart.toLocaleDateString("ms-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const endFormatted = planEndDate.toLocaleString("ms-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (planEndDate.getTime() < weddingDayStart.getTime()) {
    return {
      isValid: false,
      message: `Tarikh tamat pelan (${endFormatted}) mendahului tarikh majlis (${weddingFormatted}). Sila pilih tarikh mula guna yang lebih hampir dengan hari majlis atau pilih pelan dengan durasi lebih panjang.`,
      weddingFormatted,
      endFormatted,
    };
  }

  return {
    isValid: true,
    weddingFormatted,
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
