# Hospital BI

Hospital management dashboard (React + Vite) with a Flask REST API and Socket.IO live logs.

**Repository:** [github.com/Pavithpovi/Hospital-BI](https://github.com/Pavithpovi/Hospital-BI)

## Project layout

| Folder | Description |
|--------|-------------|
| `client/` | React SPA — admin, doctor, and patient portals |
| `server/` | Flask API (`/api/*`), JWT auth, email confirmations, AI chat fallback |

## Run locally

**Backend** (from `server/`):

```bash
pip install -r requirements.txt
python seed_data.py    # optional: reset SQLite demo data
python app.py          # http://127.0.0.1:5000
```

**Frontend** (from `client/`):

```bash
npm install
npm run dev            # http://localhost:5173
```

Demo logins (after seed): see login screen hints (`admin@medvista.com`, etc.).

---

## Deploy frontend on Vercel (GitHub)

1. Push this repo to GitHub (already connected at **Pavithpovi/Hospital-BI**).
2. Go to [vercel.com](https://vercel.com) → **Add New…** → **Project**.
3. **Import** `Pavithpovi/Hospital-BI`.
4. Framework / settings: leave **Root Directory** empty so Vercel uses the root **`vercel.json`** (`install` → `client`, `output` → `client/dist`).
5. **Environment variables** (Production — required for a working app against a real API):

   | Name | Example value |
   |------|----------------|
   | `VITE_API_URL` | `https://your-api.onrender.com/api` |

   Use the public base URL of your deployed Flask app, with the `/api` suffix.

6. **Deploy**. Your site will be at `https://<project>.vercel.app`.

7. On the **Flask** server, set `FRONTEND_ORIGINS` to your Vercel URL (e.g. `https://hospital-bi.vercel.app`) so CORS and Socket.IO work.

> The Python API is not run on Vercel. Host it on [Render](https://render.com), [Railway](https://railway.app), or similar, then set `VITE_API_URL` and redeploy the Vercel project if the API URL changes.

## Environment files

- `client/env.example` — copy to `.env.production` locally or mirror keys in Vercel.
- `server` — optional `FRONTEND_ORIGINS`, `MAIL_*`, `GEMINI_API_KEY` (see `server/config.py`).

## License

Use and modify for your own projects.
