MentorSlots: vibe coder (用戶) 預約專業工程師 (導師) 的本地可跑預約站（monorepo）。

## Structure

- `frontend/`: Next.js (UI)
- `backend/`: NestJS (API)

## Local Run (No Docker)

需要本機有 Postgres + S3 相容儲存（或用 Docker 跑下面那組）。

1) 安裝依賴

```bash
pnpm install
```

2) 啟動（兩個終端或用 root script）

```bash
pnpm dev
```

- Frontend: http://localhost:3000/
- Mentor: http://localhost:3000/mentor
- Auth: http://localhost:3000/auth

## Local Run (Docker)

```bash
docker compose up --build
```

## Backend Plan

See `docs/backend-plan.md`.
