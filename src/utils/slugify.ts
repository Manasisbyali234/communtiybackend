/**
 * Convert a string to a URL-safe slug.
 * e.g. "Gowda Sabha 2025" → "gowda-sabha-2025"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Append a short suffix to ensure uniqueness.
 */
export function slugifyWithSuffix(text: string, suffix: string): string {
  return `${slugify(text)}-${suffix}`;
}
