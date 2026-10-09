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

| Role               | Lands on       | Can use                                                                       |
| ------------------ | -------------- | ----------------------------------------------------------------------------- |
| Admin              | Staff accounts | create staff, change roles, deactivate, reset passwords, account activity log |
| Manager            | Workshops      | create/edit workshops, register/cancel attendees, history, activity log       |
| Front desk (Staff) | Workshops      | find workshops, register/cancel attendees, history, attendee lookup           |

The navigation and buttons come from the permission list the API returns for the signed-in user
(`GET /auth/me`), so the UI and backend share one permission matrix. Hiding things is only a
convenience: the backend refuses anything not allowed.

## Structure

```
src/
  App.jsx          providers + route table (read this first: it shows every page and who may open it)
  api/             client.js (axios, token header, 401 handling, uniform ApiError)
                   endpoints.js (one function per API endpoint), tokenStore.js
  context/         AuthProvider, ToastProvider (+ the small *-context.js files they share)
  hooks/           useAuth, useToast, useApi (loading/error/stale-response safe), useFormSubmit,
                   useWorkshopFilters (URL-synced filters), useLocations
  routes/          ProtectedRoute (login + permission guard), navigation.js (menu + home page per role)
  pages/           one file per screen: Login, Workshops, WorkshopDetail, WorkshopForm, Users,
                   Attendees, Activity, Forbidden, NotFound
  components/
    ui/            generic building blocks: Button, Field, Card, Modal, Alert, Badge, ...
    users/         UsersTable and the create / edit / reset-password dialogs
    workshops/     SeatsIndicator, WorkshopStatusBadge
    registrations/ RegisterAttendeeForm, CancelRegistrationDialog
    Layout.jsx     header, role-aware navigation
  utils/           dates (UTC in, local out), labels (enum -> friendly text), cx
```

Conventions:

- Components never build URLs or call axios: every endpoint is a function in `api/endpoints.js`.
- Pages fetch with `useApi`. Simple forms (the account dialogs) use `useFormSubmit` for field errors,
  alerts, toasts and loading state; the workshop and registration forms have extra rules (e.g. offering the
  waitlist on a 409) so they handle their own errors.
- Each file in `components/ui` is one small component; import them from `components/ui`.
- To add a page: create it in `pages/`, add a route in `App.jsx` (wrap it in
  `<ProtectedRoute permission="...">`), and an entry in `routes/navigation.js` if it needs a menu link.

## Scripts

| Script                            | What it does                       |
| --------------------------------- | ---------------------------------- |
| `npm run dev`                     | dev server on :5173 with API proxy |
| `npm run build`                   | production build into `dist/`      |
| `npm run lint`                    | oxlint                             |
| `npm run format` / `format:check` | Prettier (write / check only)      |

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
