# HealthLens — Hackathon Deployment Guide

Complete step-by-step instructions to get HealthLens live on DigitalOcean App Platform with reCAPTCHA v3 and full rate limiting.

---

## Step 1 — Get Your Google reCAPTCHA v3 Keys

reCAPTCHA v3 is invisible to users — no checkboxes, no challenges. It scores every request 0–1 in the background.

1. Go to **https://www.google.com/recaptcha/admin/create**
2. Fill in the form:
   - **Label**: `HealthLens`
   - **reCAPTCHA type**: `Score based (v3)` ← important
   - **Domains**: Add your production domain (e.g. `healthlens.example.com`) **and** `localhost`
3. Click **Submit**
4. Copy both keys:
   - **Site Key** (public) → goes into the React frontend as `VITE_RECAPTCHA_SITE_KEY`
   - **Secret Key** (private) → goes into the Express backend as `RECAPTCHA_SECRET_KEY`

> ⚠️ Never commit either key. They go in `.env` files and DigitalOcean secrets only.

---

## Step 2 — Configure Local Environment

### Server (`server/.env`)

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and fill in:

```env
# DigitalOcean Gradient AI
GRADIENT_MODEL_ACCESS_KEY=your_do_gradient_key

# JWT — generate with: cd server && npm run generate-keys
JWT_PRIVATE_KEY={"kty":"OKP","crv":"Ed25519","x":"...","d":"..."}
JWT_PUBLIC_KEY={"kty":"OKP","crv":"Ed25519","x":"..."}

# reCAPTCHA v3 — from Step 1
RECAPTCHA_SECRET_KEY=your_secret_key_here
RECAPTCHA_MIN_SCORE=0.5

# Server
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Client (`client/.env.local`)

```bash
cp client/.env.example client/.env.local
```

Edit `client/.env.local`:

```env
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
```

### Test locally

```bash
# Install all deps
pnpm install

# Run both server + client in parallel
pnpm dev
```

Open http://localhost:5173 — the reCAPTCHA badge will appear on Login and Register.

---

## Step 3 — Push to GitHub

```bash
git init            # if not already a git repo
git add .
git commit -m "feat: add reCAPTCHA v3 + rate limits"

# Create a new PUBLIC repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/healthlens.git
git branch -M main
git push -u origin main
```

> The repo **must be public** to meet hackathon submission requirements.
> Make sure it has a LICENSE file (MIT is fine — one is already included).

---

## Step 4 — Deploy to DigitalOcean App Platform

### 4a — Sign in and create the app

1. Go to **https://cloud.digitalocean.com/apps**
2. Click **Create App**
3. Choose **GitHub** as source → authorize DigitalOcean → select your `healthlens` repo
4. Branch: `main` · Auto-deploy: ✅

### 4b — Configure the API service

DigitalOcean will detect the monorepo. Set up the **API** service:

| Field | Value |
|---|---|
| Source directory | `server` |
| Build command | `npm run build` |
| Run command | `node dist/index.js` |
| HTTP port | `4000` |
| Instance size | Basic · 512 MB RAM (cheapest) |
| Route | `/api` |

### 4c — Configure the static frontend

Add a **Static Site** component:

| Field | Value |
|---|---|
| Source directory | `client` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Route | `/` |

### 4d — Set environment variables (Secrets)

In the App settings → **Environment Variables**, add these as **Encrypted** secrets:

**API service secrets:**

| Key | Value |
|---|---|
| `GRADIENT_MODEL_ACCESS_KEY` | Your DO Gradient AI key |
| `JWT_PRIVATE_KEY` | Full JSON from `npm run generate-keys` |
| `JWT_PUBLIC_KEY` | Full JSON from `npm run generate-keys` |
| `RECAPTCHA_SECRET_KEY` | Your reCAPTCHA **secret** key |

**API service plain vars:**

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `${APP_URL}` (DigitalOcean injects this automatically) |
| `RECAPTCHA_MIN_SCORE` | `0.5` |
| `RATE_LIMIT_MAX` | `100` |
| `ANALYZE_RATE_LIMIT_MAX` | `10` |

**Static site secrets:**

| Key | Value |
|---|---|
| `VITE_RECAPTCHA_SITE_KEY` | Your reCAPTCHA **site** key |

### 4e — Deploy

Click **Create Resources**. The first deploy takes ~3–5 minutes.

Your app will be live at `https://healthlens-xxxxx.ondigitalocean.app` (or your custom domain).

---

## Step 5 — Add your production domain to reCAPTCHA

1. Go back to **https://www.google.com/recaptcha/admin**
2. Select your HealthLens site
3. Under **Domains**, add your DigitalOcean URL (e.g. `healthlens-xxxxx.ondigitalocean.app`)
4. Save

Without this step, reCAPTCHA tokens will be invalid in production.

---

## Step 6 — Verify everything works

```bash
# Health check
curl https://your-app-url.ondigitalocean.app/api/health

# Expected response:
# {"status":"ok","service":"HealthLens API",...}
```

Then open the app, register a new account — you should see the reCAPTCHA branding on the form.

---

## Rate Limit Reference

| Endpoint | Limit | Window |
|---|---|---|
| `POST /api/auth/login` | 10 requests | per 15 min per IP |
| `POST /api/auth/register` | 5 requests | per 1 hour per IP |
| `POST /api/analyze` | 10 requests | per 1 hour per user |
| `POST /api/analyze/chat` | 30 requests | per 15 min per user |
| `POST /api/analyze/compare` | 5 requests | per 30 min per user |
| `GET /api/history` | 60 requests | per 15 min per user |
| `POST/DELETE /api/history` | 30 requests | per 15 min per user |
| Global (all routes) | 100 requests | per 15 min per IP |

---

## Hackathon Submission Checklist

- [ ] Repo is **public** on GitHub
- [ ] Repo has a **LICENSE** file (MIT)
- [ ] `README.md` explains the project and how to run it
- [ ] Demo video uploaded to YouTube/Vimeo (≤ 3 minutes)
- [ ] App is deployed and accessible via public URL
- [ ] DigitalOcean Gradient AI is clearly used (not just any OpenAI endpoint)
- [ ] Devpost submission filled in with repo URL, video URL, and project description

---

## Troubleshooting

**reCAPTCHA score is always 0 in production**
→ Make sure your production domain is listed in the reCAPTCHA admin console (Step 5).

**"Missing reCAPTCHA token" error on login**
→ Check that `VITE_RECAPTCHA_SITE_KEY` is set in the static site's environment variables and redeploy.

**Build fails on DigitalOcean**
→ Ensure Node.js version is set to 20. In App Platform: Settings → Components → API → Environment → Node version.

**Rate limit hit during testing**
→ Temporarily raise `RATE_LIMIT_MAX` in your App Platform env vars, or test from different IPs.
