# Workshop Registration Service

A full stack app for a community training centre: front desk staff register attendees for workshops
without ever overbooking a seat, and every registration (including cancellations) is kept with who did
it and when.

This is a single git repository holding both projects:

| Folder      | What it is                                    | Details                            |
| ----------- | --------------------------------------------- | ---------------------------------- |
| `backend/`  | Node.js + Express + Prisma + MySQL REST API   | [backend/README.md](backend/README.md)   |
| `frontend/` | React + Vite + axios + Tailwind web interface | [frontend/README.md](frontend/README.md) |

## Run it locally

You need Node 20+ and MySQL 8 running locally.

```bash
# 1. API (terminal 1)
cd backend
npm install
cp .env.example .env        # set DATABASE_URL (encode "@" in the password as %40)
npm run db:migrate          # creates the database and tables
npm run seed                # first admin + locations (set SEED_DEMO=true for demo data)
npm run dev                 # http://localhost:4000

# 2. Web app (terminal 2)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Demo logins (when `SEED_DEMO=true`):

| Role               | Email                | Password      | Lands on       |
| ------------------ | -------------------- | ------------- | -------------- |
| Admin              | admin@centre.local   | Admin@12345   | Staff accounts |
| Manager            | manager@centre.local | Manager@12345 | Workshops      |
| Staff (front desk) | staff@centre.local   | Staff@12345   | Workshops      |

Check the capacity rule under pressure with the API running: `cd backend && npm run test:race`.

## How it fits together

```
Browser (React)  --/api-->  Vite dev proxy  -->  Express API  -->  MySQL
  pages -> hooks -> api/endpoints.js            routes -> controller -> service -> Prisma
```

- **Access control is enforced by the backend.** The permission table lives in one file,
  `backend/src/config/permissions.js`; the API sends each user's permission list to the frontend, which
  uses it only to hide menus and buttons.
- **The capacity rule** (a workshop never holds more active registrations than its capacity) is
  guaranteed by a row lock plus a database CHECK constraint, and proven by `test:race`.
  See "The capacity rule" in the backend README.
- **Nothing is deleted.** Cancelled registrations and deactivated users stay, so the history is complete.

## Where to start reading

1. `backend/src/routes.js`, the map of every API route and its module.
2. `backend/src/modules/registrations/registrations.service.js`, the core booking logic.
3. `frontend/src/App.jsx`, every screen and who may open it.
4. `frontend/src/pages/WorkshopDetailPage.jsx`, the main front desk screen.
