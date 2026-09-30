# Fotokita Admin Service

Microservice khas untuk Super Admin Control Panel Fotokita.

## Ciri-ciri
- Pengesahan keselamatan Super Admin (Username & Password + HMAC JWT).
- Pemantauan status kesihatan servis (`wedding-service`, `media-service`).
- Pengurusan metadata majlis & statistik keseluruhan sistem.

## Menjalankan Servis

```bash
cd services/admin-service
bun install
bun run dev
```

Port lalai: `3002`.

Kredensial lalai (boleh dikonfigurasi melalui `.env`):
- **Username**: `superadmin`
- **Password**: `fotokitaAdmin2026!`
