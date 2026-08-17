# BuildLedger — Test Credentials

Backend stack: **Node.js + Express + Mongoose (MERN)** at `/app/backend-node`.
A thin FastAPI proxy at `/app/backend/server.py` bridges the supervisor uvicorn
process to the Node backend on internal port `4000` so the preview URL keeps
working.

## Seeded accounts

| Role         | Email                        | Password       |
|--------------|------------------------------|----------------|
| Admin        | admin@buildledger.dev        | Admin@1234     |
| Storekeeper  | store@buildledger.dev        | Store@1234     |
| Engineer     | engineer@buildledger.dev     | Engineer@1234  |

## Auth endpoints

* `POST /api/auth/register` – open registration (defaults to Engineer role)
* `POST /api/auth/login`
* `GET  /api/auth/me`
* `POST /api/auth/logout`
* `POST /api/auth/claim-first-admin` – promotes the caller to Admin if no admin exists

## Re-seed helper

```
mongosh test_database --quiet --eval 'db.users.deleteMany({}); db.materials.deleteMany({}); db.tasks.deleteMany({}); db.transactions.deleteMany({}); db.activities.deleteMany({});'
```
Then hit `POST /api/auth/register` and `POST /api/auth/claim-first-admin` to
recreate the Admin, or use the admin `POST /api/users` route to add the
Storekeeper and Engineer.
