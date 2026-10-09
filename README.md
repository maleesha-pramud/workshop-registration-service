# Workshop Desk: Frontend

React + Vite + axios + Tailwind interface for the Workshop Registration Service
(see the backend repo for the API and the design of the capacity rule).

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173  (the API must be running on :4000)
npm run build
```

`/api` requests are proxied to `http://localhost:4000` in development (override with
`API_PROXY_TARGET`), so the browser only talks to one origin. For a separately hosted API set
`VITE_API_URL`. See `.env.example`.

## What each role sees

| Role | Lands on | Can use |
|---|---|---|
| Admin | Staff accounts | create staff, change roles, deactivate, reset passwords, account activity log |
| Manager | Workshops | create/edit workshops, register/cancel attendees, history, activity log |
| Front desk (Staff) | Workshops | find workshops, register/cancel attendees, history, attendee lookup |

The navigation and buttons come from the permission list the API returns for the signed-in user
(`GET /auth/me`), so the UI and backend share one permission matrix. Hiding things is only a
convenience: the backend refuses anything not allowed.

## Structure

```
src/
  api/          axios client (token, 401 handling, uniform ApiError), tokenStore, endpoints.js
  context/      AuthContext (session + can()), ToastContext
  routes/       ProtectedRoute (login + permission guard), navigation config, home redirect
  hooks/        useApi (loading/error, ignores stale responses), useLocations
  components/   ui.jsx primitives, Layout, workshop widgets, RegisterAttendeeForm, CancelRegistrationDialog
  pages/        Login, Workshops, WorkshopDetail, WorkshopForm, Users, Attendees, Activity, Forbidden, NotFound
  utils/        dates (UTC in, local out), labels
```

Components never build URLs: every endpoint is one function in `api/endpoints.js`.

## UX decisions for a non-technical team

- **"I just want this week's workshops with seats"**: one-click preset. Filters live in the URL, so
  refresh, back button and sharing a link all keep the view.
- **Two people, one last seat**: the screen's seat count can be seconds old, so the server decides.
  If a colleague takes the last seat first, the form explains it and offers the waitlist, and the
  seat counts refresh. Buttons are disabled while a request is in flight.
- **Cancellations** ask for confirmation and an optional reason, keep the row (greyed out, with who
  cancelled and when) and, if a waitlisted person was given the seat, tell staff to contact them.
- Server validation errors are shown next to the field that caused them.

## Not done / trade-offs

- No component or end-to-end test suite (verified manually in a browser against the live API).
- Session token is kept in localStorage; no refresh tokens.
- Location management and attendee editing screens are out of scope.
