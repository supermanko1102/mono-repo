# Backend Plan (Nest + Postgres + MinIO)

## Goals

- User = vibe coder, Mentor = 專業工程師
- Mentor 建立可預約時段
- vibe coder 瀏覽導師、選時段下單預約
- 圖片上傳（例如：錯誤截圖），可在訂單中查看
- 先能完整本地跑：Docker 起 Postgres + MinIO

## Current Architecture (This Repo)

- Frontend: Next.js（`frontend/`）
- Backend: NestJS（`backend/`）
- DB: Prisma + Postgres（Docker: `db` service）
- Auth: email/password + httpOnly session cookie + Session table
- Uploads: MinIO（S3 相容；Docker: `minio` service），DB 存 upload url/key

## Data Model

- User(role: VIBE_CODER | MENTOR)
- AvailabilitySlot(mentorId, startAt, endAt, status)
- Booking(slotId unique, userId, mentorId, note, uploadId?)
- Upload(ownerId, path, mime, sizeBytes)
- Session(tokenHash, userId, expiresAt)

## API Surface

- Auth
  - POST `/api/auth/register`
  - POST `/api/auth/login`
  - POST `/api/auth/logout`
  - GET `/api/me`
- Mentor
  - GET/POST `/api/mentor/slots`
  - GET `/api/mentor/bookings`
- Customer
  - GET `/api/mentors`
  - GET `/api/mentors/:mentorId`
  - POST `/api/bookings`
- Upload
  - POST `/api/uploads` (image/*, max 5MB)

## Production Upgrade Path (Plan Only)

- DB: Postgres（保留）
- Uploads: MinIO -> S3/R2 (signed upload + CDN)
- Auth: 同樣 cookie session，但 Session store 改用 Redis/DB；增加 password reset
- Observability: request logging + error tracking
- Rate limit: login/upload endpoints
- Booking integrity: DB transaction + unique constraints + optional row-level lock pattern (Postgres)
