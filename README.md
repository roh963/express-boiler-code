# Express Boilerplate (TypeScript, Clean Architecture)

## Overview

A production-ready Express.js boilerplate using TypeScript, following Clean Architecture and best practices.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- ESLint & Prettier
- Husky & lint-staged
- Helmet, CORS, Rate Limiter, Morgan

## Getting Started

### 1. Clone & Install

```sh
git clone <repo-url>
cd express-boilder-code
npm install
```

### 2. Environment Setup

- Copy `.env.example` to `.env` and adjust as needed.

### 3. Run Locally

```sh
npm run dev
```

### 4. Build & Start

```sh
npm run build
npm start
```

## Folder Structure

```
src/
  server.ts         # Entry point
  app.ts            # Express app config
  routes/
  controllers/
  services/
  middlewares/
  utils/
docs/
```

## Middleware List

- helmet (security headers)
- cors (strict allowlist)
- express-rate-limit (rate limiting)
- express.json (body parser)
- morgan (dev logging)

## Error Handling Contract

All errors return JSON:

```
{
  "message": "...",
  "code": "...",
  "path": "...",
  "timestamp": "..."
}
```

## Health Route

- `GET /health` → `{ status: "ok", uptime, env, version }`

## Lint & Format

- Pre-commit hooks block bad code: `npm run lint` and `npm run format`.

## License

MIT

## Real-Time Setup
- Install deps: See Step 1 above.
- Run with Docker: `docker-compose up` (includes Redis).
- Socket server runs on same port as API.
- For scaling: `docker-compose up --scale app=2`
- Test with demos in /tools
