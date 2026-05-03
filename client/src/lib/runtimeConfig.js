/** API + Socket origins for dev vs production (Vercel). */

export function getApiBase() {
  const v = import.meta.env.VITE_API_URL;
  if (v) return v.replace(/\/$/, '');
  if (import.meta.env.DEV) return 'http://localhost:5000/api';
  return '';
}

export function getSocketOrigin() {
  const v = import.meta.env.VITE_API_URL;
  if (v) return v.replace(/\/api\/?$/i, '').replace(/\/$/, '') || v;
  if (import.meta.env.DEV) return 'http://localhost:5000';
  return typeof window !== 'undefined' ? window.location.origin : '';
}
