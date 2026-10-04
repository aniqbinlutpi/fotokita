# Fotokita Admin Service

Dedicated microservice for the Fotokita Super Admin Control Panel.

## Features
- Super Admin security authentication (Username & Password + HMAC-SHA256 JWT).
- Cross-service health check monitoring (`wedding-service`, `media-service`).
- Wedding metadata management and system-wide statistics aggregation.

## Running the Service

```bash
cd services/admin-service
bun install
bun run dev
```

Default port: `3002`.

Default credentials (configurable via `.env`):
- **Username**: yourusername
- **Password**: yourpassword
