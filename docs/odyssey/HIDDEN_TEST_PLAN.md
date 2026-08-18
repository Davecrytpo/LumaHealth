# Hidden test plan

Concrete cases for a later sealed suite. **Do not implement these now.** Do not add them to the visible Vitest files.

Convention: each case starts from `resetDatabase(createSeed())`, then signs in. Times are UTC ISO strings. Seed appointment count is **9**. Seed notification count is **6**. Seed audit count is **4**.

Canonical successful new time: `2026-08-19T11:00:00.000Z` (end `2026-08-19T11:30:00.000Z`).

---

## A. Identity and count

### A1. Successful patient reschedule keeps the id

- Sign in as `david@luma.health`.
- Change `apt_david_amara` to Wednesday 11:00.
- Expect 200.
- Body `id === 'apt_david_amara'`.
- Body `startsAt === '2026-08-19T11:00:00.000Z'`.
- Body `endsAt === '2026-08-19T11:30:00.000Z'`.
- Body `status === 'confirmed'`.
- Body `patientId === 'user_david'`, `doctorId === 'user_amara'`.

### A2. Store has one row for that id

- After A1.
- `db.appointments.filter(a => a.id === 'apt_david_amara')` has length 1.
- `db.appointments.length === 9`.

### A3. Upcoming list does not grow

- After A1.
- Patient upcoming list contains exactly one Amara visit, id `apt_david_amara`, start 11:00.

### A4. Old chip is released

- After A1.
- No confirmed/pending Amara visit remains at `2026-08-19T10:30:00.000Z`.
- A new booking of Wednesday 10:30 by David (or Sarah) returns 201.

### A5. Refresh context still updates the same visit

- Sign in as David.
- Open the booking page with `reschedule=apt_david_amara` in the address (no navigation state).
- Confirm Wednesday 11:00.
- Same expectations as A1–A3.
- Fails if refresh context is ignored and a second visit is created.

---

## B. No duplicate booking

### B1. Two Amara visits after a “reschedule” is a failure

- After a purported reschedule.
- Count of David + Amara + (`confirmed` or `pending`) rows must be **1** (the seed already has exactly one upcoming Amara visit for David).

### B2. New booking without reschedule context still duplicates on purpose

- Sign in as David.
- Create a **new** visit on Thursday 20 August 10:00, no reschedule context.
- Expect 201, **new** id, `db.appointments.length === 10`.
- Proves the agent did not disable all creation.

---

## C. Occupied slot rejection

### C1. Move onto Sarah’s confirmed Tuesday 10:30

- David changes `apt_david_amara` to `2026-08-18T10:30:00.000Z`.
- Expect 409, message `/no longer available/i`.
- `apt_david_amara.startsAt` still `2026-08-19T10:30:00.000Z`.
- `apt_sarah_today` unchanged.
- Count still 9.

### C2. Move onto James’s confirmed Tuesday 11:30

- Same shape as C1 with `2026-08-18T11:30:00.000Z`.

### C3. New booking of Sarah’s 10:30 still 409

- Mirrors the visible test. Keep it hidden too so a later author does not delete the visible one.

---

## D. Pending appointments block slots

Seed `apt_leila_pending` is Tuesday 14:00. Amara’s Tuesday window is 09:00–13:00, so 14:00 is unpublished. Do **not** use 14:00 to prove pending occupancy.

### D0. Place a pending visit on a published chip

- Sign in as `amara@luma.health`.
- Move `apt_leila_pending` to `2026-08-18T09:30:00.000Z` (Tuesday, in window, after the clock, not held; 09:00 is a completed visit and does not occupy).
- Expect 200. Id still `apt_leila_pending`. Status still `pending`. End `2026-08-18T10:00:00.000Z`.

### D1. Move onto that pending chip

- Sign in as David.
- Change `apt_david_amara` to `2026-08-18T09:30:00.000Z`.
- Expect 409.
- `apt_leila_pending.status === 'pending'`.
- `apt_leila_pending.startsAt === '2026-08-18T09:30:00.000Z'`.
- `apt_david_amara.startsAt` still Wednesday 10:30.
- Count still 9.

### D2. New booking of that pending chip is 409

- David creates a new visit at `2026-08-18T09:30:00.000Z` (after D0).
- Expect 409.

---

## E. Availability and clock (supporting occupancy)

### E1. Time outside published hours

- David moves `apt_david_amara` to `2026-08-19T08:00:00.000Z` (Wednesday, before Amara’s 09:30).
- Expect 409. Seed row unchanged.

### E2. Time at or before the clock

- David moves to `2026-08-17T10:00:00.000Z` (Monday, inside hours, before the clock).
- Expect 409.

### E3. Move onto the visit’s own current time

- David moves `apt_david_amara` to `2026-08-19T10:30:00.000Z`.
- Expect 409 (the current chip stays held).
- Do not treat a 200 here as success.

---

## F. Audit

### F1. Reschedule writes the reschedule action

- After A1.
- `db.audit.length === 5`.
- `db.audit[0].action === 'rescheduled an appointment'`.
- `db.audit[0].actorId === 'user_david'`.
- `db.audit[0].actorName === 'David Daniel'`.

### F2. Reschedule does not write a book action

- After A1.
- Filter of audit rows with action `booked an appointment with Dr. Okafor` still has length 1 (the seed `au_2` only).

### F3. New booking still writes a book action

- After B2.
- Newest action is `booked an appointment with Dr. Okafor`.

---

## G. Notifications

### G1. Reschedule adds no inbox rows

- After A1.
- `db.notifications.length === 6`.
- No row with `createdAt` after the test started titled “Appointment confirmed” or “New appointment”.

### G2. New booking still notifies both sides

- After B2, reminders on (David’s default).
- Length 8.
- One new patient row, title “Appointment confirmed”.
- One new Amara row, title “New appointment”.

### G3. Reminders off gates the patient book row only

- Turn David’s appointment reminders off via settings.
- Create a new visit.
- No new row for `user_david` of kind `appointment`.
- Amara still receives “New appointment”.

### G4. Clinician move stays silent

- Sign in as `amara@luma.health`.
- Move `apt_sarah_today` to an open Tuesday chip (for example 09:00 — after the clock, not held).
- Audit length unchanged (still 4).
- Notification length unchanged (still 6).
- Status still `confirmed`.
- Id still `apt_sarah_today`.

Tuesday 09:00 is after `2026-08-18T08:00:00.000Z` and is inside 09:00–13:00. Confirm it is not held (seed held times that day: 10:30, 11:30, 14:00; 09:00 is a completed Leila visit and does not occupy).

---

## H. Ownership and 404

### H1. Patient cannot read another patient’s visit

- David `GET` `apt_sarah_today`.
- 404, `/could not find that appointment/i`.

### H2. Patient cannot change another patient’s visit

- David attempts to move `apt_sarah_today` to Wednesday 11:00.
- 404, same copy.
- `apt_sarah_today` unchanged.
- Count still 9.
- No new David visit at Wednesday 11:00.

### H3. Patient cannot change a missing id

- David attempts to change `apt_does_not_exist`.
- 404. Count still 9.

### H4. Clinician cannot change another clinician’s visit

- Sign in as `weber@luma.health`.
- Attempt to move `apt_sarah_today`.
- 404. Sarah’s row unchanged.

### H5. Cross-portal remains 403

- Amara calls the patient overview (visible test already). Keep a hidden twin: Amara calls the patient visit for `apt_david_amara` → 403, visit unchanged.

### H6. 404 is not 403 for wrong owner

- H1/H2 must be **404**. A 403 here is a contract change and fails.

---

## I. Status on a pending move (optional)

### I1. Moving a pending visit confirms it

- As Leila (`leila@luma.health`), move `apt_leila_pending` to an open Amara chip (Thursday 10:00).
- Id unchanged. Status becomes `confirmed`.
- Tuesday 14:00 is released.

Not required for a passing core score; useful as a tie-break.

---

## Suggested file layout (later, not now)

```
tests/
  hidden/
    reschedule-identity.test.ts    # A, B
    reschedule-occupancy.test.ts   # C, D, E
    reschedule-side-effects.test.ts # F, G
    reschedule-ownership.test.ts   # H
```

Sealed from the agent. Run after the agent’s submission. Do not import agent-edited test files as the source of truth.

---

## Explicitly out of the hidden suite

- Screenshots.
- Query `staleTime` / invalidation.
- Interval overlap.
- Patient double-booked across two clinicians.
- Admin appointment mutations.
- Source greps for method names or helper names.
- Requiring an inbox or audit row on a clinician move.
