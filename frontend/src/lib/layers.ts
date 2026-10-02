/**
 * Helper utilities for Canvas Element Layer Order (Z-Index) and Drag Locking.
 * Supports Bring to Front, Send to Back, and Lock/Unlock status across Hero elements.
 */

export interface ElementPosition {
  x: number;
  y: number;
  zIndex?: number;
  locked?: boolean;
}

export type TextPositionMap = Record<string, ElementPosition>;

export const DEFAULT_Z_INDEX: Record<string, number> = {
  ampersand: 10,
  orb: 20,
  partner1: 30,
  partner2: 30,
  date: 30,
  eyebrow: 30,
  photoCount: 30,
  quote: 30,
};

export function getElementZIndex(
  id: string,
  textPositions?: Record<string, { zIndex?: number } | undefined> | null
): number {
  if (textPositions?.[id]?.zIndex !== undefined) {
    return textPositions[id]!.zIndex!;
  }
  return DEFAULT_Z_INDEX[id] ?? 20;
}

export function isElementLocked(
  id: string,
  textPositions?: Record<string, { locked?: boolean } | undefined> | null
): boolean {
  return Boolean(textPositions?.[id]?.locked);
}

/**
 * Calculates a new z-index that places the element above all current elements.
 */
export function calculateBringToFront(
  _id: string,
  textPositions?: Record<string, { zIndex?: number } | undefined> | null
): number {
  const allIds = Object.keys(DEFAULT_Z_INDEX);
  const currentZs = allIds.map((k) => getElementZIndex(k, textPositions));
  const maxZ = Math.max(...currentZs, 30);
  return maxZ + 2;
}

/**
 * Calculates a new z-index that places the element below all current elements.
 */
export function calculateSendToBack(
  _id: string,
  textPositions?: Record<string, { zIndex?: number } | undefined> | null
): number {
  const allIds = Object.keys(DEFAULT_Z_INDEX);
  const currentZs = allIds.map((k) => getElementZIndex(k, textPositions));
  const minZ = Math.min(...currentZs, 10);
  return Math.max(1, minZ - 2);
}
