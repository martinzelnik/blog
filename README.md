# Blog

A bilingual (English / Czech) blog built as a full-stack Next.js app. Readers can
sign up, like and comment on posts. Admins write posts, and can have **Gemini
draft a post from a photo** in the chosen language.

## Features

- **AI post drafts from an image.** An admin uploads a photo, and Gemini 2.5 Flash
  returns a title and 2–4 paragraphs in English or Czech. The admin can edit the
  draft before publishing.
- **Accounts and roles.** Sign up and log in with username and password. Passwords
  are hashed with bcrypt, sessions use signed JWTs (HS256, 1 hour). `user` can like
  and comment; `admin` can also create and delete posts.
- **Posts, likes and comments.** Likes toggle per user; post lists show like and
  comment counts.
- **Two languages.** Each post is written in English or Czech, and a language toggle
  switches which posts are shown.
- **Error monitoring.** Sentry on the client, server and edge runtimes, with source
  maps uploaded at build time.

## Tech stack

Next.js 15 (App Router, route handlers) · React 19 · TypeScript · MongoDB with
Mongoose · `jose` for JWTs · bcrypt · Google Gemini API · Sentry

## How it works

```
Browser (React, App Router)
  │  JWT in Authorization: Bearer header
  ▼
Next.js route handlers  /api/*
  ├─ requireAuth / requireAdmin  (src/lib/auth.ts)
  ├─ MongoDB via Mongoose        (src/lib/db.ts, cached connection)
  └─ Gemini generateContent      (src/app/api/ai/generate-post)
```

**AI generation** ([route.ts](src/app/api/ai/generate-post/route.ts)): the image is
sent as a base64 data URL and passed to Gemini inline, with a system prompt per
language that asks for JSON with `title` and `content`. The handler:

- only allows admins, and checks the image is a valid `data:image/...` URL;
- extracts the JSON from the reply even when the model wraps it in extra text, and
  accepts common key variants (`title`/`headline`, `content`/`body`);
- skips the model's "thinking" parts and uses the final answer;
- retries Gemini 500 errors twice with backoff, and returns a clear 502 when the
  reply is unusable.

## API

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Create an account, returns a token |
| POST | `/api/auth/login` | public | Log in, returns a token |
| GET | `/api/auth/me` | user | Current user |
| POST | `/api/auth/refresh` | user | Issue a fresh token |
| GET | `/api/posts` | public | All posts with like and comment counts |
| POST | `/api/posts` | admin | Create a post |
| GET | `/api/posts/:id` | public | One post |
| DELETE | `/api/posts/:id` | admin | Delete a post |
| POST | `/api/posts/:id/like` | user | Toggle like |
| GET | `/api/posts/:id/comments` | public | Comments on a post |
| POST | `/api/posts/:id/comments` | user | Add a comment |
| POST | `/api/ai/generate-post` | admin | Draft a post from an image |

## Running locally

Requirements: Node.js 20+, a MongoDB database (local or Atlas), and a
[Gemini API key](https://aistudio.google.com/apikey) for AI drafts.

Create `.env.local` in the project root (it's git-ignored):

```bash
MONGODB_URI=mongodb://localhost:27017/blog
JWT_SECRET=change-me-to-a-long-random-string
GEMINI_API_KEY=your-gemini-key
```

Then:

```bash
npm install
npm run dev    # http://localhost:3000
```

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Secret for signing tokens; use a long random string |
| `GEMINI_API_KEY` | for AI drafts | Gemini API key |

Sentry is optional. To upload source maps on build, put `SENTRY_AUTH_TOKEN` in
`.env.sentry-build-plugin` (not committed).

**Making an admin:** new accounts are `user`. Promote one in MongoDB:

```js
db.users.updateOne({ username: "your-name" }, { $set: { role: "admin" } })
```

Then log out and back in to get a token with the new role.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

## Known limitations

- Images are stored in MongoDB as base64 strings. Fine for a small blog; object
  storage (e.g. S3) would be the next step.
- The token is kept in `localStorage` and expires after an hour. The refresh
  endpoint exists but the client doesn't call it yet, so users log in again.
- No automated tests yet.
