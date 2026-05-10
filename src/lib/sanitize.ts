/**
 * Sanitize a search query for use in Supabase PostgREST `.or()` and `.ilike()` filters.
 *
 * PostgREST uses `,` as a separator inside `.or()`, `*` as a wildcard, parentheses for grouping,
 * and percent signs for ILIKE patterns. Untrusted input embedded directly into these strings can
 * be used to widen or alter the query. This helper strips/escapes the characters that have
 * special meaning so the user input is treated as a literal substring.
 */
export function sanitizeSearch(input: string, maxLength = 80): string {
  if (!input) return "";
  // Remove all PostgREST and SQL ILIKE special characters; we only allow plain literal substrings
  const cleaned = input
    .replace(/[%_,()*\\"']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
  return cleaned;
}

/**
 * Validate that a string is a UUID v4 (or v1-v8). Use to reject untrusted IDs in routes/params.
 */
export function isUuid(input: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input);
}

/**
 * Validate an email format (loose - actual deliverability is enforced by Supabase auth).
 */
export function isEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input) && input.length <= 254;
}
