/**
 * Utility functions for extracting and formatting wedding slugs from URL queries.
 */

/**
 * Robustly extracts the wedding slug from a query string, supporting both
 * URL-encoded characters (e.g., %26) and raw unencoded characters (e.g., abc&def)
 * without swallowing other parameters like &preview=..., &weddingId=..., etc.
 */
export function extractSlugFromSearch(rawSearch: string): string | undefined {
  if (!rawSearch) return undefined;
  const search = rawSearch.startsWith("?") ? rawSearch.slice(1) : rawSearch;
  if (!search) return undefined;

  // Match `slug=` up to the next recognized query parameter or end of query string.
  // Known query parameters: page, weddingId, token, preview, login, admin, action, ref
  const match = search.match(
    /(?:^|&)slug=([^&]*(?:&(?!page=|weddingId=|token=|preview=|login=|admin=|action=|ref=)[^&]*)*)/
  );

  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }

  const standard = new URLSearchParams(search).get("slug");
  return standard || undefined;
}

/**
 * Sanitizes a slug string to lowercase alphanumeric characters, hyphens, and ampersands.
 */
export function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-&]/g, "");
}
