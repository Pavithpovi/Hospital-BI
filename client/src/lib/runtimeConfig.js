/** API + Socket origins for dev vs production (Vercel). */

export function getApiBase() {
  const v = import.meta.env.VITE_API_URL?.trim();
  if (v) return v.replace(/\/$/, '');
  if (import.meta.env.DEV) return 'http://localhost:5000/api';
  // Production build on Vercel: prefer setting VITE_API_URL to your Flask API (…/api).
  // Same-origin /api only works if you add an API proxy; otherwise login calls must use VITE_API_URL.
  return '/api';
}

export function getSocketOrigin() {
  const v = import.meta.env.VITE_API_URL?.trim();
  if (v) {
    try {
      return new URL(v).origin;
    } catch {
      return v.replace(/\/api\/?$/i, '').replace(/\/$/, '') || v;
    }
  }
  if (import.meta.env.DEV) return 'http://localhost:5000';
  return '';
}
