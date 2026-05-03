/** Human-readable messages for failed login/register requests. */

export function formatAuthError(err, context = 'login') {
  const msg = err.response?.data?.error;
  if (typeof msg === 'string' && msg.trim()) return msg;

  const status = err.response?.status;
  if (status === 401) return 'Invalid email or password.';
  if (status === 404) {
    return import.meta.env.PROD
      ? 'API not found. Set VITE_API_URL in Vercel (your Flask URL ending with /api) and redeploy.'
      : 'API not found. Is the Flask server running on port 5000?';
  }

  const net =
    err.code === 'ERR_NETWORK' ||
    err.message === 'Network Error' ||
    (!err.response && err.request);

  if (net) {
    if (import.meta.env.DEV) {
      return 'Cannot reach the server. From the server folder run: python app.py';
    }
    const missing =
      import.meta.env.PROD && !import.meta.env.VITE_API_URL?.trim();
    if (missing) {
      return 'API URL missing: in Vercel → Project → Settings → Environment Variables, add VITE_API_URL (e.g. https://your-api.onrender.com/api), then redeploy.';
    }
    return 'Cannot reach the API. Check VITE_API_URL, CORS (FRONTEND_ORIGINS on Flask), and that the backend is running.';
  }

  if (status >= 500) return 'Server error. Try again later.';
  return err.message || (context === 'register' ? 'Registration failed.' : 'Login failed. Please try again.');
}
