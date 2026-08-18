# Restore patient rescheduling

LumaHealth is a care-management product. Patients book visits, move them, and cancel them. Clinicians manage their day. Admins can see the directory and the audit log.

Something is wrong with **patient rescheduling**. When a patient changes the time of an existing visit, the product is creating a second appointment instead of updating the one they already have.

Your job is to restore the existing product behavior. Do not redesign the interface, add features, change who can see what, or invent new scheduling rules.

## What should happen

A patient who already has a visit can reschedule it.

After a successful reschedule:

- The same visit remains. Its identifier does not change.
- The total number of appointments does not increase.
- The visit now starts at the chosen time and ends thirty minutes later.
- The old time is no longer held.
- The new time is held.
- The visit is confirmed.
- The confirmation experience is for that same visit, not a newly created one.
- Reloading the reschedule screen and confirming must still change the original visit.

A genuine **new booking** (the patient is not moving an existing visit) must still create a new appointment.

Cancelling a visit must still cancel that visit. It must not create another one.

## Times that must be refused

The product clock is 18 August 2026, 08:00 UTC. Published hours are 30-minute openings on the clinician’s calendar.

A reschedule must be rejected, and the original visit must be left unchanged, when the requested time is:

- already held by another **confirmed** visit with that clinician
- already held by another **pending** visit with that clinician
- the visit’s own current time (that chip stays held while they pick a new one)
- at or before the product clock
- outside that clinician’s published hours

The refusal is the existing “no longer available” outcome. Do not add new overlap rules (for example, blocking a patient who already has a visit with a *different* clinician at the same clock time).

Cancelled and completed visits do not hold a time.

## Ownership and access

Only the patient who owns a visit can read or change it.

A patient who tries to read or change someone else’s visit must get the existing **not found** outcome (404, “We could not find that appointment.”). That is **not** a 403.

Nothing should be created for the person who made the request. The other person’s visit must not change.

A clinician who does not own a visit must also get that not-found outcome on the clinician visit tools. Crossing into the wrong portal is still forbidden as a wrong-area request.

Existing role rules stay as they are.

## Audit and inbox

After a successful **patient reschedule**:

- The audit log records that they **rescheduled an appointment**.
- It must not look like they booked a new visit.
- No new “Appointment confirmed” or “New appointment” inbox rows are added.

A genuine new booking still records a booking in the audit log and still notifies the patient (“Appointment confirmed”, when appointment reminders are on) and the clinician (“New appointment”).

A clinician moving a visit still writes no audit row and no inbox row, and does not change the visit’s status.

A patient cancel still records that they cancelled an appointment and notifies the clinician.

## Constraints

- Do not redesign the UI or change the visual system.
- Do not add live video, email, admin appointment editing, or other new product surfaces.
- Do not change published hours, the seed records, or the product clock.
- Do not change existing booking, cancellation, prescription, or sign-in behavior except as needed to restore reschedule.
- Keep `npm test` passing.

## How to work in this project

```bash
npm install
npm test
npm run typecheck
npm run dev
```

Demo password for every account: `luma-demo`

| Role | Email |
| --- | --- |
| Patient | david@luma.health |
| Clinician | amara@luma.health |
| Admin | admin@luma.health |

David Daniel has an upcoming visit with Dr. Amara Okafor. Use that path to reproduce and verify the fix.
