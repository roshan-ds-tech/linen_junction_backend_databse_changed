// Single source of truth for the backend API URL.
// Strips any trailing slash so we never get double-slash URLs like
// https://example.com//api/products
const raw = import.meta.env.VITE_API_URL || "https://linen-junction-new-final.onrender.com";
export const API_URL = raw.replace(/\/+$/, "");
