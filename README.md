# HealthLens — AI Lab Report Interpreter

> **DigitalOcean Gradient™ AI Hackathon submission** · HIPAA-aware · No PHI stored

HealthLens lets users paste or upload lab reports and get a plain-English breakdown, flagged values, risk summaries, and AI-generated doctor questions — powered by **DigitalOcean Gradient™ AI Serverless Inference**.

---

## Features

| Feature | Description |
|---|---|
| 🔬 **Report Analysis** | Paste text or upload JPEG/PNG/WebP/PDF |
| 🤖 **Gradient AI** | DO Serverless Inference (OpenAI-compatible) |
| 📊 **Risk Summary** | Cardiovascular, Metabolic, Immune, Endocrine |
| 💬 **Follow-up Chat** | Multi-turn conversation about findings |
| 📈 **Trend Compare** | Compare two reports for improvements/declines |
| 🔐 **Auth** | JWT-based login/register |
| 🛡️ **HIPAA-aware** | No PHI stored, memory-only processing |
| ♿ **Accessible** | Carbon Design System (WCAG 2.1 AA) |

---

## Tech Stack

- **Frontend** — React 18 + Vite + [Carbon Design System](https://carbondesignsystem.com/) v1
- **Backend** — Node.js + Express 4
- **AI** — DigitalOcean Gradient™ AI Serverless Inference (OpenAI SDK)
- **Image processing** — `sharp` (EXIF strip, resize, JPEG normalise)
- **Auth** — JWT (bcryptjs + jsonwebtoken)
- **Security** — Helmet, CORS, express-rate-limit, express-validator

---

## Prerequisites

- Node.js 20+
- npm 10+
- A [DigitalOcean account](https://cloud.digitalocean.com/)
- A **Gradient™ AI Model Access Key** (see below)

---

## Getting a Gradient AI Key

1. Sign in to [cloud.digitalocean.com](https://cloud.digitalocean.com/)
2. Navigate to **Gradient AI → Settings → API Keys**
3. Click **Generate new key** and copy it
4. Set it as `GRADIENT_MODEL_ACCESS_KEY` in `server/.env`

The serverless inference endpoint is: `https://inference.do-ai.run/v1`

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/your-username/healthlens.git
cd healthlens

# 2. Install root dev deps
npm install

# 3. Configure server
cp server/.env.example server/.env
# Edit server/.env and set GRADIENT_MODEL_ACCESS_KEY and JWT_SECRET

# 4. Install dependencies
cd server && npm install
cd ../client && npm install
cd ..

# 5. Run dev (both server + client)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Environment Variables (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `GRADIENT_MODEL_ACCESS_KEY` | ✅ | DO Gradient AI key |
| `GRADIENT_BASE_URL` | — | Default: `https://inference.do-ai.run/v1` |
| `GRADIENT_MODEL` | — | Default: `claude-sonnet-4-6` |
| `JWT_SECRET` | ✅ | Min 64 chars, random |
| `JWT_EXPIRES_IN` | — | Default: `7d` |
| `PORT` | — | Default: `4000` |
| `CORS_ORIGIN` | — | Default: `http://localhost:5173` |

---

## Monorepo Structure

```
healthlens/
├── client/                  # React + Carbon frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/      # AppShell, HipaaBanner
│   │   │   └── report/      # ReportResults, GaugeBar
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # AnalyzePage, HistoryPage, ComparePage, ProfilePage
│   │   ├── services/        # Axios API client
│   │   └── styles/          # Carbon theme overrides
│   └── vite.config.js
│
├── server/                  # Express API
│   ├── routes/
│   │   ├── auth.js          # Login/register (in-memory store)
│   │   ├── analyze.js       # Image upload + Gradient AI call
│   │   └── history.js       # Session metadata (no PHI)
│   ├── middleware/
│   │   └── auth.js          # JWT guard
│   ├── services/
│   │   └── gradient.js      # DO Gradient AI wrapper
│   └── index.js             # Express app with Helmet/CORS/rate-limit
│
└── package.json             # Root scripts
```

---

## HIPAA Privacy Design

HealthLens is built with HIPAA privacy principles:

- **No PHI at rest** — lab report content is never written to disk or a database
- **Memory-only file processing** — multer uses `memoryStorage()`, sharp processes in-memory
- **EXIF stripping** — `sharp(...).withMetadata(false)` removes all image metadata before AI processing
- **No PHI logging** — request bodies are never logged; only opaque user IDs and event names appear in logs
- **Session-only history** — only metadata (title, status, counts) is kept in server RAM; clears on restart
- **Rate limiting** — 10 analyses/hour per user prevents bulk data extraction
- **Encrypted transport** — HTTPS enforced in production via DigitalOcean App Platform

> **Note:** HealthLens is not itself a HIPAA-covered entity. Users requiring a formal BAA should consult their legal counsel.

---

## Deploy to DigitalOcean App Platform

```yaml
# .do/app.yaml
name: healthlens
region: nyc

services:
  - name: api
    source_dir: server
    run_command: node index.js
    environment_slug: node-js
    instance_size_slug: apps-s-1vcpu-0.5gb
    envs:
      - key: GRADIENT_MODEL_ACCESS_KEY
        type: SECRET
      - key: JWT_SECRET
        type: SECRET
      - key: NODE_ENV
        value: production
      - key: CORS_ORIGIN
        value: ${APP_URL}

static_sites:
  - name: frontend
    source_dir: client
    build_command: npm run build
    output_dir: dist
    routes:
      - path: /
```

---

## License

MIT — see [LICENSE](./LICENSE)

---

## Disclaimer

HealthLens provides **educational information only** and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your healthcare provider.
