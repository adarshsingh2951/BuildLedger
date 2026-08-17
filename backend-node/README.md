# BuildLedger MERN backend

This is the canonical Node.js backend for the project. It uses Express, MongoDB, and Mongoose. The legacy `/app/backend` Python service only remains for the current workspace preview runner; it is not part of this MERN source tree.

## Start

```bash
cp .env.example .env
npm install
npm run dev
```

The API listens on `http://localhost:8001`.

## Structure

- `src/models/`: Mongoose schemas for User, Material, Task, Transaction, Activity, and SiteSettings
- `src/schemas/`: Zod request validation schemas
- `src/controllers/`: request/business orchestration
- `src/routes/`: REST endpoint definitions
- `src/middleware/`: JWT role protection and error handling
- `src/services/`: authentication, stock updates, and activity logging
- `src/config/`: environment and database connection

YOLOv5 is intentionally not implemented in the backend yet. The React page remains the documented future integration point.