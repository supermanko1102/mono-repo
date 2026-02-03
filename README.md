MentorSlots: vibe coder (用戶) 預約專業工程師 (導師) 的本地可跑示範站。

## Local Run

1) 安裝依賴

```bash
npm install
```

2) 初始化資料庫 (SQLite)

```bash
npx prisma migrate dev
```

3) 啟動

```bash
npm run dev
```

- 客戶端 (vibe coder): http://localhost:3000/
- 導師端: http://localhost:3000/mentor
- 登入/註冊: http://localhost:3000/auth

## Storage

- SQLite DB: `dev.db`
- 上傳圖片: `public/uploads/`（瀏覽路徑 `/uploads/...`）

## Backend Plan

See `docs/backend-plan.md`.
