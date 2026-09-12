// Single source of truth for the backend API URL.
// Strips any trailing slash so we never get double-slash URLs like
// https://example.com//api/products
const raw = import.meta.env.VITE_API_URL || "https://linen-junction-new-final.onrender.com";
export const API_URL = raw.replace(/\/+$/, "");

/**
 * Resolve an image path to a full URL.
 * - Cloudinary / any absolute URL  →  returned as-is
 * - Legacy relative path (/uploads/…) →  prepended with API_URL
 * - Empty / falsy                   →  returns ""
 */
export function imageUrl(path: string | undefined | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_URL}${path}`;
}
