# LumaHealth healthy baseline

Frozen snapshot: git tag `healthy-baseline-v1` (`3d4feec`).

This document describes the product as it exists on that tag. It is not a proposal. Behaviors listed under **Known frozen behaviors** are part of the baseline and must not be “fixed” during Odyssey authoring unless a later task explicitly regresses them.

Project clock: **2026-08-18**. Slot availability uses `startsAt > 2026-08-18T08:00:00.000Z`.

---

## Project architecture

LumaHealth is a self-contained care-management app with three role portals (patient, clinician, admin) over one Express API and one in-memory store.

```
Browser (React + Vite)
    │  fetch + Bearer token
    ▼
Express 5  (/api/auth, /api/patient, /api/doctor, /api/admin)
    │
    ▼
In-memory store (reset from seed on process start / test beforeEach)
```

- Client and API are separate processes in `npm run dev` (Vite `:5173`, API `:4000` with Vite proxy).
- `npm start` serves the built client from `dist/` through the compiled API (`dist-server/server/index.js`).
- Shared TypeScript types and Zod schemas live in `shared/` and are imported by both sides.
- There is no external database, mailer, queue, or live video service. Notifications and audit entries are rows in the in-memory store.
- Sessions are Bearer tokens in a process-local `Map`.

---

## Folder structure

```
lumahealth/
  src/                      React app
    App.tsx                 Route table
    main.tsx                QueryClient, providers
    components/layout/      Public header, role shells, RBAC gate
    components/ui/          Design system
    context/                Auth, theme, toasts
    lib/                    fetch helper, dates
    pages/public/           Landing, sign-in, sign-up, forgot, 404, unauthorized
    pages/patient/          Patient portal
    pages/doctor/           Clinician portal
    pages/admin/            Admin portal
    test/                   RTL helpers
  server/
    index.ts                Listen
    app.ts                  Express app, static client, API mount
    store.ts                In-memory db + sessions + resetDatabase
    seed.ts                 Synthetic records
    lib.ts                  Views, slots, notify, audit
    middleware.ts           authRequired, requireRole
    routes/auth.ts
    routes/patient.ts
    routes/doctor.ts
    routes/admin.ts
    *.test.ts               Supertest suites
  shared/
    types.ts
    schemas.ts              Zod
    constants.ts            Demo accounts, specialties
  scripts/                  QA / screenshot helpers (not product)
  qa-shots/                 Visual QA captures
  docs/                     Authoring documentation (this tree)
```

---

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 19, TypeScript, Vite 7, React Router 7 |
| Data | TanStack Query (`staleTime` 15s, `retry` 1, no refetch on focus) |
| API | Express 5, Zod 4 |
| Auth | bcryptjs passwords, Bearer sessions |
| Styles | Tailwind 3, Manrope + DM Serif Display |
| Tests | Vitest, Testing Library, Supertest |
| Design | Canvas `#F2F0E9`, surface `#FAF9F5`, ink `#27352F`, terracotta `#D46B4C` |

---

## Patient flows

Desktop nav: Overview, Appointments, Find Care, Prescriptions, Notifications, Profile. Footer: Settings. Mobile bottom nav (5): Overview, Appointments, Find Care, Updates, Profile. Account sheet on mobile: Profile, Settings, Sign out.

| Route | Purpose |
| --- | --- |
| `/patient` | Greeting, next visit (from appointments query), care signal, week strip, recent activity |
| `/patient/appointments` | Tabs: upcoming / past / cancelled |
| `/patient/appointments/:id` | Detail, join (video + confirmed), reschedule, cancel |
| `/patient/appointments/:id/confirmed` | Booking / reschedule confirmation |
| `/patient/find-care` | Search + filters (verified clinicians only) |
| `/patient/find-care/:doctorId` | Clinician profile + weekday strip + time chips |
| `/patient/find-care/:doctorId/book` | Three-step book or reschedule |
| `/patient/prescriptions` | Medication list |
| `/patient/prescriptions/:id` | Prescription detail |
| `/patient/notifications` | Inbox, mark all read |
| `/patient/profile` | Personal details |
| `/patient/settings` | Notification prefs, appearance |

**Booking path**

1. Find Care → clinician profile.
2. Pick a weekday (strip starts Monday 17 Aug, five weekdays) and an open chip.
3. Continue carries the chosen time in navigation state to `/book`.
4. Steps: time → type + reason → review.
5. Confirm creates a **new** confirmed visit and opens the confirmation page.

**Reschedule path**

1. Appointment detail (confirmed or pending only) → Reschedule.
2. Lands on `/patient/find-care/:doctorId/book?reschedule=:appointmentId`.
3. Same three steps. Confirm **updates that visit** and opens confirmation.

**Cancel path**

1. Detail → Cancel → confirm modal (Keep appointment / Cancel appointment).
2. Visit becomes cancelled. Patient is sent back to the list.

---

## Clinician flows

Desktop nav: Overview, Schedule, Patients, Prescriptions, Notifications, Profile, Availability. Mobile bottom nav (5): Overview, Schedule, Patients, Rx, Updates. Account sheet: Profile, Availability, Sign out.

| Route | Purpose |
| --- | --- |
| `/doctor` | Today’s counts and list |
| `/doctor/schedule` | Day rail + hour list |
| `/doctor/appointments/:id` | Visit actions: start (pending only), reschedule, complete, cancel |
| `/doctor/patients` | People this clinician has seen |
| `/doctor/patients/:id` | Chart (403 without a care relationship) |
| `/doctor/prescriptions` | Rx list |
| `/doctor/prescriptions/new` | Write Rx |
| `/doctor/notifications` | Inbox |
| `/doctor/profile` | Clinical profile |
| `/doctor/availability` | Published hours |

**Reschedule path**

- Button on the visit page opens an in-page dialog.
- Weekday strip + open chips for the selected day.
- Save new time moves **that** visit. Status does not change.
- No new inbox row. No new audit row.

**Other visit actions**

- Start consultation (pending → confirmed).
- Complete → completed + patient inbox “Visit completed”.
- Cancel uses the same Keep / Cancel appointment confirm as the patient side.

---

## Admin flows

Desktop nav: Overview, Users, Doctors, Appointments, Audit log, System. Mobile: Overview, Users, Doctors, Visits, Audit. Account sheet: System, Sign out.

| Route | Purpose |
| --- | --- |
| `/admin` | Counts + recent audit |
| `/admin/users` | Directory; status edits |
| `/admin/doctors` | Verification + account status |
| `/admin/appointments` | Read-only directory with date / doctor / status / type filters |
| `/admin/audit-log` | Full audit list |
| `/admin/settings` | Synthetic environment notice |

Admins cannot create, move, or cancel appointments.

---

## Authentication and RBAC rules

- Sign-in: `POST /api/auth/sign-in` → `{ token, user }`.
- Sign-up: patient or clinician. New clinicians start `verificationStatus: pending`.
- Forgot password records a reset row and always returns the same success copy (no email enumeration).
- Missing / invalid token → **401** “Please sign in to continue.”
- Suspended account → **401** “This account is no longer active.” (sign-in of a suspended user → **403**).
- Wrong portal (`requireRole`) → **403** “You do not have access to this area.”
- UI: unauthenticated visitors go to `/sign-in`; wrong role goes to `/unauthorized`.
- Appointment that exists but is not this actor’s → **404** “We could not find that appointment.” (not 403).
- Clinician opening a patient they have never seen → **403** “You do not have a care relationship with this person.”

---

## Appointment lifecycle

Statuses: `confirmed` | `pending` | `completed` | `cancelled`.

| Transition | Who | Result |
| --- | --- | --- |
| New booking | Patient | Always `confirmed` |
| Patient reschedule | Patient | Times change; status becomes `confirmed` (pending is promoted) |
| Patient cancel | Patient | `cancelled` |
| Start consultation | Clinician | `pending` → `confirmed` |
| Complete | Clinician | `completed` |
| Clinician cancel | Clinician | `cancelled` |
| Clinician reschedule | Clinician | Times change; **status unchanged** |

The UI only offers reschedule / cancel on `confirmed` or `pending`. The API does not reject a time change on `completed` or `cancelled`.

Upcoming list = `confirmed` + `pending`. Past = `completed`. Cancelled tab = `cancelled`.

---

## Booking behavior

A new booking requires:

- A signed-in patient.
- A clinician who exists.
- A consultation type the clinician actually offers (otherwise 400: “That clinician does not offer this kind of visit.”).
- A reason of at least three characters.
- A start time that is an **open** published slot for that clinician.

Success:

- New appointment id.
- Status `confirmed`.
- End time is thirty minutes after start.
- Audit: `{patient name} booked an appointment with Dr. {lastName}`.
- Patient inbox: “Appointment confirmed” (if appointment reminders are on).
- Clinician inbox: “New appointment”.

Find Care lists only `verified` clinicians. Adebayo is `pending` and does not appear.

---

## Reschedule behavior

**Patient**

- Entry: visit detail → Reschedule, or a refresh of `/book?reschedule={id}`.
- Confirm updates **the same appointment**.
- Id does not change. Count of appointments does not increase.
- Old start time is no longer held by that visit.
- Status becomes `confirmed`.
- Audit: `rescheduled an appointment`.
- No new inbox rows for patient or clinician.
- Refresh of `/book` **without** `?reschedule=` is a new booking, not a move.

**Clinician**

- Entry: visit dialog, not a separate route.
- Same appointment id. Status unchanged.
- No audit row. No inbox row.

Moving onto the visit’s **current** start time is rejected (that chip stays occupied). Moving onto another patient’s confirmed or pending start time is rejected.

---

## Notification rules

Inbox rows are stored on the recipient. Patient prefs:

| Pref | Kind gated |
| --- | --- |
| Appointment reminders | `appointment` |
| Prescription updates | `prescription` |
| Care team messages | `care-team` |

Clinicians have no prefs object; they always receive rows addressed to them.

| Event | Patient inbox | Clinician inbox |
| --- | --- | --- |
| Book | “Appointment confirmed” | “New appointment” |
| Patient cancel | — | “Appointment cancelled” |
| Patient reschedule | — | — |
| Clinician cancel | “Appointment cancelled” | — |
| Clinician complete | “Visit completed” | — |
| Clinician confirm / reschedule | — | — |

---

## Audit log rules

Newest first. Clinician actor name is `Dr. {lastName}`. Patient / admin actor name is `{firstName} {lastName}`.

| Event | Action |
| --- | --- |
| Book | `booked an appointment with Dr. {lastName}` |
| Patient cancel | `cancelled an appointment` |
| Patient reschedule | `rescheduled an appointment` |
| Clinician status change | `{status} an appointment` |
| Clinician reschedule | *(none)* |
| Availability save | `updated availability` |
| Account created | `created an account` |
| Admin user / doctor edit | `updated {name}` / `updated clinician {lastName}` |

Admin overview shows the first 12 entries. Audit log shows all.

---

## Availability rules

Clinicians publish weekday windows (`dayOfWeek` 0 = Sunday … 6 = Saturday, `HH:MM` start < end).

Amara Okafor (UTC):

- Mon 09:00–12:00 and 14:00–17:00
- Tue 09:00–13:00
- Wed 09:30–12:30
- Thu 10:00–16:00
- Fri 09:00–12:00

Slots are 30 minutes, aligned to the window, discarded if they would end after the window. The patient weekday strip is Mon 17 Aug – Fri 21 Aug. The clinician schedule strip is seven days from 17 Aug (weekend days have no published hours).

Monday 17 Aug chips exist in the strip but every slot that day is before the frozen clock, so none are selectable.

---

## Occupancy rules

A start time is occupied when **this clinician** already has a `confirmed` or `pending` visit at that **exact** start timestamp.

A start time is unavailable when it is occupied **or** it is not after `2026-08-18T08:00:00.000Z` **or** it is not a published 30-minute slot.

Seed trap: `apt_leila_pending` is pending at Tuesday 14:00, but Amara’s Tuesday window is 09:00–13:00. That timestamp is unpublished. It sits in the occupied set, yet it is not a chip a patient can pick. Pending occupancy must be shown on a published chip (see `docs/odyssey/SEEDING_NOTES.md`).

Not occupied:

- `cancelled` visits
- `completed` visits
- Another clinician’s calendar
- A different start time for the same patient (a patient may hold two overlapping visits with two clinicians)

The visit being moved still occupies its current start time. Choosing that same chip is rejected.

---

## Query keys

Client default: `staleTime` 15 seconds.

| Key | Source |
| --- | --- |
| `['patient', 'overview']` | Patient home |
| `['patient', 'appointments', tab]` | Appointment list (`upcoming` / `past` / `cancelled`) |
| `['patient', 'appointment', id]` | Detail + confirmation |
| `['clinician', doctorId]` | Clinician profile and booking slots |
| `['clinicians', filters…]` | Find Care |
| `['patient', 'profile']` | Profile / settings |
| `['patient', 'notifications']` | Inbox |
| `['patient', 'prescriptions']` / `['patient', 'prescription', id]` | Rx |
| `['doctor', 'overview']` | Clinician home |
| `['doctor', 'schedule', date]` | Day schedule |
| `['doctor', 'appointment', id]` | Visit detail |
| `['doctor', 'patients', q]` / `['doctor', 'patient', id]` | Directory / chart |
| `['doctor', 'availability']` | Hours editor |
| `['admin', 'overview']` / `['admin', 'users', q]` / `['admin', 'doctors']` / `['admin', 'appointments', …]` / `['admin', 'audit']` / `['admin', 'settings']` | Admin |

Invalidation today:

- Patient cancel → `['patient']`
- Clinician visit update or reschedule → `['doctor']`
- Patient book / patient reschedule → **none**

Confirmation uses navigation state as initial data and skips a refetch when that state is present.

---

## Seed users

| Id | Email | Role | Notes |
| --- | --- | --- | --- |
| `user_david` | david@luma.health | patient | Primary patient; reminders on |
| `user_sarah` | sarah@luma.health | patient | Amara’s Tuesday 10:30 |
| `user_james` | james@luma.health | patient | Amara’s Tuesday 11:30; Rx updates off |
| `user_leila` | leila@luma.health | patient | Pending Tuesday 14:00; care-team messages off |
| `user_amara` | amara@luma.health | clinician | Cardiology, verified, video + in person |
| `user_weber` | weber@luma.health | clinician | Family medicine, verified |
| `user_chen` | maya@luma.health | clinician | Dermatology, verified |
| `user_adebayo` | tunde@luma.health | clinician | Endocrinology, **pending**, video only |
| `user_admin` | admin@luma.health | admin | Nora Ellis |

Password for every seed account: `luma-demo`.

---

## Demo accounts

Published in `README.md` and `shared/constants.ts`:

| Role | Email | Password |
| --- | --- | --- |
| Patient | david@luma.health | luma-demo |
| Clinician | amara@luma.health | luma-demo |
| Admin | admin@luma.health | luma-demo |

---

## Known frozen behaviors

These are baseline facts, not defects to clean up while authoring:

1. Occupancy is exact start-time equality, not interval overlap.
2. A patient can hold overlapping visits with two different clinicians.
3. The visit being moved still occupies its current chip (same-time “move” is rejected).
4. Clinician reschedule writes no audit and no inbox row, and does not change status.
5. Patient reschedule writes no inbox row and always sets status to `confirmed`.
6. Wrong appointment owner is **404**, not 403.
7. Patient book / reschedule does not invalidate TanStack Query.
8. The API will accept a time change on cancelled or completed visits; the UI hides those actions.
9. Patient time-change does not re-check that the consultation type is still offered.
10. Combined cancel + new time on one request: the time change wins and status becomes `confirmed`.
11. Monday 17 Aug chips are all unavailable because they are before the clock.
12. Admin appointment directory is read-only.
13. Join appointment is a waiting-room modal, not live video.
14. Forgot password does not send mail.

---

## Existing test coverage

| File | What it locks |
| --- | --- |
| `server/appointments.test.ts` | David’s next visit `2026-08-19T10:30`; new booking of an open slot → 201 confirmed; Sarah’s 10:30 cannot be booked again → 409; patient cancel; clinician complete |
| `server/rbac.test.ts` | Clinician cannot read patient overview (403); patient cannot read admin (403); admin can read audit; Weber cannot open Sarah’s chart (403); unauthenticated 401 |
| `server/auth.test.ts` | Sign-in, bad credentials, sign-up, forgot-password copy |
| `server/prescriptions.test.ts` | David’s Rx list; Amara writes Rx; Weber cannot prescribe for Sarah |
| `shared/schemas.test.ts` | Empty book reason rejected |
| `src/pages/patient/PatientOverview.test.tsx` | Appointments query can fail in isolation; retry; next-visit render |
| `src/lib/dates.test.ts` | Time / relative-day / grouping |
| Landing, Sign-in, Button, ErrorState | Presentation only |

---

## Untested areas

- Patient time-change of an existing visit
- Clinician time-change of an existing visit
- Same appointment id after a move
- Appointment count after a move
- Audit wording for book / reschedule / cancel
- Inbox rows (and reminder-pref gating) on book / move / cancel
- Appointment ownership (David acting on Sarah’s visit)
- 404 copy for a missing or foreign appointment
- Pending visit occupying a chip (`apt_leila_pending`)
- Rejection of the visit’s own current chip
- Consultation-type offering on a new booking
- `?reschedule=` surviving a refresh
- Booking flow and clinician visit-detail components
- Slot generation as a unit
- Admin appointment filters
- Availability editor persistence

Visible `npm test` will stay green if a later task only breaks reschedule identity, occupancy-on-move, audit/inbox pairing, or appointment ownership. Those gaps are intentional space for hidden verification.

---

## Commands

```bash
npm install
npm run dev          # client + API
npm run build
npm start
npm test
npm run lint
npm run typecheck
```

---

## Out of scope for later product work

Do not add, while preparing or running the Odyssey task: UI redesign, architecture changes, new features, RBAC changes, API contract changes, cache invalidation on booking, live video, email, admin appointment mutations, or extra product functionality.
