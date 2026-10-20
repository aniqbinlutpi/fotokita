export interface PlanDates {
  planStartDate: Date;
  planExpiresAt: Date;
  mediaExpiresAt: Date;
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Calculates plan expiration date and media deletion date (3 days after plan expiration).
 * 
 * Supported tiers:
 * - "12h": 12 hours
 * - "1day": 24 hours
 * - "3days": 72 hours (3 days)
 * - "1week": 7 days
 * - "1month": 30 days
 * - "1year": 365 days
 * - Fallback / standard: 24 hours
 */
export function calculatePlanDates(planTier: string, startDate: Date = new Date()): PlanDates {
  const start = startDate.getTime();
  let durationMs: number;

  switch (planTier.toLowerCase()) {
    case "12h":
      durationMs = 12 * 60 * 60 * 1000;
      break;
    case "1day":
    case "oneday":
      durationMs = 24 * 60 * 60 * 1000;
      break;
    case "3days":
    case "threedays":
      durationMs = 3 * 24 * 60 * 60 * 1000;
      break;
    case "1week":
    case "oneweek":
      durationMs = 7 * 24 * 60 * 60 * 1000;
      break;
    case "1month":
    case "onemonth":
      durationMs = 30 * 24 * 60 * 60 * 1000;
      break;
    case "1year":
    case "oneyear":
      durationMs = 365 * 24 * 60 * 60 * 1000;
      break;
    default:
      durationMs = 24 * 60 * 60 * 1000; // Default 1 day
      break;
  }

  const planExpiresAt = new Date(start + durationMs);
  const mediaExpiresAt = new Date(planExpiresAt.getTime() + THREE_DAYS_MS);

  return {
    planStartDate: startDate,
    planExpiresAt,
    mediaExpiresAt,
  };
}
