# Verifier plan

How a later hidden suite should prove the selected task. Do not implement tests from this file.

The public instruction stays in product language (`RESCHEDULE_TASK.md`). This file is for the person who writes the sealed checks.

---

## Design goals

1. **Visible `npm test` stays green** on a broken starting snapshot that only mishandles reschedule identity / occupancy-on-move / side effects / ownership. Existing suites must not solve the task.
2. **Hidden checks assert outcomes**, not source text. Do not `grep` for a method name or a helper.
3. **Each case resets the in-memory store** from `createSeed()` so order does not leak.
4. **Partial credit** is possible: identity, occupancy, audit, inbox, ownership, and new-booking can fail independently.
5. **Anti-gaming:** a “always create a new visit then delete the old one” solution fails identity and usually fails audit / inbox. A “accept any start time” solution fails occupancy. A “notify on every write” solution fails inbox silence.

---

## Layers

| Layer | Role | Public? |
| --- | --- | --- |
| Existing Vitest files | Guard unrelated product surface | Yes — agent may run them |
| Hidden HTTP cases | Identity, count, occupancy, audit, inbox, 404 | No |
| Optional hidden UI case | Confirm action on `/book?reschedule=` updates the seeded id | No |
| `instruction.md` | Product story only | Yes, later |

Do not add the hidden cases to `server/appointments.test.ts`. A later bundle should run them from a sealed path the agent cannot edit.

---

## Core assertions (must pass for a full score)

### Same appointment identifier

After David moves `apt_david_amara` to an open Amara slot (Wednesday 19 August 11:00 is a good target):

- Response body `id` is still `apt_david_amara`.
- Store row `id` is still `apt_david_amara`.
- `startsAt` is the new time; `endsAt` is thirty minutes later.
- `status` is `confirmed`.
- `patientId` / `doctorId` unchanged.

### Appointment count unchanged

- `db.appointments.length` equals the seed length (9).
- David’s upcoming list still has exactly one visit with Amara.
- No second row shares David + Amara + the new start time.

### No duplicate booking

- There is no leftover row at `2026-08-19T10:30:00.000Z` for Amara in `confirmed` or `pending`.
- A later new booking of Wednesday 10:30 by another patient (or by David after the move) is allowed, because that chip was released.

### Occupied slot rejection

Moving `apt_david_amara` onto:

- `2026-08-18T10:30:00.000Z` (Sarah, confirmed) → 409, seed row unchanged.
- `2026-08-18T11:30:00.000Z` (James, confirmed) → 409.

A **new** booking of Sarah’s 10:30 still 409 (already visible). Hidden cases must also cover the **move** path.

### Pending appointments block slots

Leila’s seed pending time (Tuesday 14:00) is **outside** Amara’s Tuesday window. A 409 on that timestamp does not prove pending occupancy.

Isolate it:

1. As Amara, move `apt_leila_pending` to Tuesday 09:30 (published, after the clock, not held). Status stays pending.
2. As David, try to move `apt_david_amara` onto Tuesday 09:30 → 409.
3. Leila’s visit is still pending at 09:30. Count unchanged.
4. A new booking of Tuesday 09:30 also 409.

### Correct audit entry

After a successful move:

- Newest audit `action` is exactly `rescheduled an appointment`.
- `actorId` is `user_david`.
- There is **no** new `booked an appointment with Dr. Okafor` caused by the move.
- Audit list length = seed length + 1.

### No extra notifications

After a successful move:

- `db.notifications.length` equals the seed length (6).
- No new row titled “Appointment confirmed” or “New appointment”.

A **new** booking (control case) must still add those two rows when reminders are on, so the agent cannot “fix” the task by deleting all notify calls.

### Ownership protection and 404

- David reads or changes `apt_sarah_today` → 404, message matches `/could not find that appointment/i`.
- Sarah’s row is unchanged. Appointment count unchanged. No new row for David.
- Amara (clinician session) hitting the patient visit URL → 403 (portal RBAC).
- Weber changing `apt_sarah_today` on the clinician portal → 404.

---

## Control cases (must keep working)

These stop “rewrite the whole booking pipeline” solutions.

| Case | Expect |
| --- | --- |
| David books a truly open Amara chip with no reschedule context | 201, new id, count + 1, book audit, two inbox rows |
| David books Sarah’s 10:30 | 409 (existing visible test) |
| David cancels `apt_david_amara` | 200, status cancelled, cancel audit, clinician inbox “Appointment cancelled” |
| Amara completes `apt_sarah_today` | 200, completed (existing visible test) |
| Reminders off, then a new booking | No patient inbox row; clinician still notified |

---

## Scoring sketch (for a later rubric)

| Band | What passed |
| --- | --- |
| 0 | Visible tests only, or reschedule creates a second visit |
| 1 | Move path exists but identity **or** occupancy is wrong |
| 2 | Same id + count + old chip released |
| 3 | + occupied and pending rejection |
| 4 | + audit verb and inbox silence + new-booking control |
| 5 | + ownership 404 and clinician-portal 404 |

Do not award full score for a cancel-then-create implementation: the id will change.

---

## What the verifier must not require

- Query-cache invalidation after a patient move.
- Interval overlap or patient-vs-two-clinician overlap.
- An audit or inbox row when a **clinician** moves a visit.
- 403 (instead of 404) for the wrong appointment owner.
- Rejection of a move onto cancelled/completed history (API currently allows it; UI hides it).
- Acceptance of a move onto the visit’s **own** current start time (baseline rejects that).

---

## Suggested open target

Use **Wednesday 19 August 2026, 11:00 UTC** as the canonical successful move for David → Amara.

- Inside Amara’s Wednesday window (09:30–12:30).
- After the clock.
- Not held in the seed.
- Thirty-minute end is 11:30, which is also inside the window.

---

## Implementation notes for the suite author

- Sign in through `POST /api/auth/sign-in` with `luma-demo`.
- Reset via `resetDatabase(createSeed())` in `beforeEach`, same as visible tests.
- Prefer HTTP + store inspection over rendering React for identity, occupancy, audit, inbox, and 404.
- If a UI case is added, drive `/patient/find-care/user_amara/book?reschedule=apt_david_amara` and assert the confirm action does not increase appointment count.
- Never instruct the agent to read this file. Keep it out of the public task payload or mark it author-only.
