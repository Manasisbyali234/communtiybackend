"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
exports.slugifyWithSuffix = slugifyWithSuffix;
/**
 * Convert a string to a URL-safe slug.
 * e.g. "Gowda Sabha 2025" → "gowda-sabha-2025"
 */
function slugify(text) {
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
function slugifyWithSuffix(text, suffix) {
    return `${slugify(text)}-${suffix}`;
}
//# sourceMappingURL=slugify.js.map