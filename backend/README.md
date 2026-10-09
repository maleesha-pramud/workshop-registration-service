# Workshop Registration Service: API

Node.js + Express + Prisma + MySQL backend for a community training centre's workshop bookings.
The front desk can register and cancel attendees without ever overbooking a workshop, even when
several staff book the same popular workshop at the same moment.

## Quick start

Requires Node 20+ and a running MySQL 8 (CHECK constraints need 8.0.16+).

```bash
npm install
cp .env.example .env     # then edit DATABASE_URL (URL-encode special characters: @ -> %40)
npm run db:migrate       # creates the database, tables and constraints
npm run seed             # 3 locations + first Admin (SEED_DEMO=true adds demo data)
npm run dev              # http://localhost:4000, restarts on file changes
npm run test:race        # concurrency proof (needs the API running + demo seed)
```

### npm scripts

| Script                             | What it does                                                        |
| ---------------------------------- | ------------------------------------------------------------------- |
| `dev` / `start`                    | run the API with auto-restart / run it plainly                      |
| `setup`                            | apply migrations and seed, for a fresh deployment                   |
| `db:migrate` / `db:deploy`         | create+apply a migration in development / apply existing migrations |
| `db:reset`                         | **wipe** the database, re-apply migrations, re-seed                 |
| `db:studio`                        | browse the data in Prisma Studio                                    |
| `seed`                             | idempotent seed, safe to run repeatedly                             |
| `test:race`                        | concurrent-request test of the capacity rule                        |
| `lint` / `format` / `format:check` | oxlint / Prettier (write) / Prettier (check only)                   |

Seeded accounts (demo seed only, change them in real use):

| Role               | Email                | Password      |
| ------------------ | -------------------- | ------------- |
| Admin              | admin@centre.local   | Admin@12345   |
| Manager            | manager@centre.local | Manager@12345 |
| Staff (front desk) | staff@centre.local   | Staff@12345   |

There is no public signup: the first Admin is seeded and Admins create every other account.

## Project structure

```
prisma/
  schema.prisma        data model (users, locations, workshops, registrations, audit_logs)
  migrations/          SQL history, including the hand-written CHECK constraints
  seed.js              idempotent seed
scripts/race-test.js   concurrency proof against a running API
src/
  server.js            starts the HTTP server          app.js   builds the Express app
  routes.js            mounts every module under /api (read this first for the route map)
  config/              env.js (validated environment), permissions.js (who can do what)
  lib/                 prisma.js (transactions + retry), errors.js, audit.js, validators.js
  middleware/          authenticate, authorize, validate, errorHandler
  modules/<name>/      one folder per feature, always the same four layers:
    <name>.routes.js      URL -> middleware -> controller
    <name>.controller.js  HTTP in/out only
    <name>.service.js     business rules and database transactions
    <name>.schemas.js     zod request validation
```

Modules: `auth`, `users`, `locations`, `workshops`, `registrations` (plus `waitlist.js`), `audit`.
To add an endpoint: schema -> service function -> controller function -> route line, then, if it needs
a new rule about who may call it, one entry in `config/permissions.js`.

## The capacity rule: how it holds under concurrency

> A workshop can never hold more active registrations than its capacity.

Three layers, so no single mistake can break it:

1. **Row lock, then check, in one transaction.** Every operation that changes seats (register, cancel,
   waitlist promotion, capacity edit) runs in a `READ COMMITTED` transaction that starts with
   `SELECT ... FROM workshops WHERE id = ? FOR UPDATE` (`workshops/workshops.lock.js`). Requests for the
   same workshop queue on that lock and each sees the committed result of the one before it. The
   losing request of two people grabbing the last seat gets `409 WORKSHOP_FULL`.
   Different workshops lock different rows, so they never slow each other down.
2. **A counter on the locked row.** `workshops.active_count` is updated in the same transaction as the
   registration row, so the check is O(1) and "has seats" filters need no per-row `COUNT(*)`.
3. **A database CHECK constraint.** `CHECK (active_count >= 0 AND active_count <= capacity)`
   (hand-added to the migration). If application logic were ever wrong, the database refuses the write
   instead of overbooking.

Same locking covers: the same person submitted twice at once (duplicate check runs after the lock),
two desks cancelling the same registration (`409 ALREADY_CANCELLED`, seat freed once) and a capacity
cut racing a booking.

`npm run test:race` fires real simultaneous HTTP requests (50 bookings for 20 seats, 10 identical
bookings, 10 identical cancellations, 50 bookings for 1 freed seat, concurrent cancellations feeding a
waitlist) and asserts exact outcomes.

Deadlocks / lock timeouts are retried a few times with jitter; if still contended the API answers a
clear `503 SERVICE_BUSY` rather than a 500.

## Access control

Enforced on the backend by middleware, never just hidden in the UI.

| Permission                                                 | Admin | Manager | Staff |
| ---------------------------------------------------------- | ----- | ------- | ----- |
| Create user accounts & set roles (`USERS_MANAGE`)          | yes   |         |       |
| Add & edit workshops (`WORKSHOPS_WRITE`)                   |       | yes     |       |
| Register & cancel attendees (`REGISTRATIONS_WRITE`)        |       | yes     | yes   |
| View workshops, registrations & history (`WORKSHOPS_READ`) |       | yes     | yes   |

The matrix lives in one file (`src/config/permissions.js`); routes ask for a permission, not a role.

- `authenticate` verifies the JWT **and reloads the user from the database on every request**, so a
  deactivated or demoted user loses access immediately instead of when their token expires.
- Admins can't deactivate or demote themselves, and the last active admin can't be removed
  (checked under a lock, so two admins can't strip each other at once).
- Login gives the same error for wrong email and wrong password, does a constant-time style hash
  comparison either way, and is rate limited.

## API

All routes are under `/api`. Success: `{ "data": ..., "meta": ... }`.
Errors: `{ "error": { "code", "message", "details?" } }` with stable `code` values the frontend branches on.

| Method      | Path                           | Who                                                              | Notes                                                     |
| ----------- | ------------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------- |
| POST        | `/auth/login`                  | public                                                           | returns `{ token, user }`                                 |
| GET         | `/auth/me`                     | any                                                              | user + permission list                                    |
| GET, POST   | `/users`                       | Admin                                                            | list / create                                             |
| PATCH       | `/users/:id`                   | Admin                                                            | name, role, isActive                                      |
| POST        | `/users/:id/reset-password`    | Admin                                                            |                                                           |
| GET         | `/locations`                   | any signed in                                                    |                                                           |
| GET         | `/workshops`                   | Manager, Staff                                                   | filters below                                             |
| GET         | `/workshops/:id`               | Manager, Staff                                                   |                                                           |
| POST, PATCH | `/workshops`, `/workshops/:id` | Manager                                                          |                                                           |
| GET         | `/workshops/:id/registrations` | Manager, Staff                                                   | full history incl. cancelled; `?status=`                  |
| POST        | `/workshops/:id/registrations` | Manager, Staff                                                   | `joinWaitlist: true` queues when full                     |
| POST        | `/registrations/:id/cancel`    | Manager, Staff                                                   | optional `reason`; returns `{ registration, promoted[] }` |
| GET         | `/registrations?q=`            | Manager, Staff                                                   | find an attendee's bookings across workshops              |
| GET         | `/audit-logs`                  | Admin (account changes), Manager (workshop/registration changes) |                                                           |

**Finding workshops** (`GET /workshops`): `from`, `to` (date range), `status` (comma separated),
`hasSeats=true` (open, upcoming, seats left), `locationId`, `q` (code/title/instructor), `page`, `pageSize`.
Each workshop includes derived fields: `seatsLeft`, `isFull`, `hasStarted`, `isBookable`, `waitlistCount`.

## Design decisions

- **Nothing is deleted.** Cancelling sets `status = CANCELLED` and records who/when/why; users are
  deactivated, not deleted, so history always points at real people. There are no DELETE endpoints.
- **"Full" is derived, not a stored status**, so it can't drift from reality
  (status is `OPEN | CLOSED | CANCELLED | COMPLETED`).
- **Extra fields tracked** beyond the spreadsheet: location (the centre has three, seeded and used as a
  filter), description, end time, who created/last edited a workshop, timestamps. Emails are lower-cased.
- **Layering**: routes -> validation (zod) -> controller -> service (rules + transactions) -> Prisma.
  Domain errors are typed (`lib/errors.js`) and mapped in one place.
- **Bonus: audit trail.** Every change (account creation, role change, deactivation, workshop edits
  with before/after values, registrations, cancellations, promotions) is written in the same
  transaction as the change itself, so the log can't disagree with the data.
- **Bonus: waitlist.** A full workshop accepts `joinWaitlist`. A freed seat (cancellation, capacity
  increase, reopening) goes to the longest-waiting person inside the same locked transaction, so nobody
  can jump the queue. Attendees have no accounts, so the cancel response lists who was promoted and the
  UI tells staff to contact them.

## Not done / trade-offs

- No automated test framework beyond the race script (it exercises the riskiest behaviour end to end).
- No email/SMS to attendees; staff are prompted to contact promoted attendees themselves.
- Times are stored in UTC and shown in the browser's timezone; no per-location timezone.
- JWT is returned in the response body and kept by the frontend in localStorage (simple; an httpOnly
  cookie plus CSRF protection would be stronger for production).
- Location management (add/edit locations) is seed-only; passwords are admin-set (no email reset flow).
- Stale `OPEN` workshops that are in the past are not auto-marked `COMPLETED` (registration is
  refused after start time regardless).
