# Odyssey task candidates

Authoring notes only. The recommended task is documented in `RESCHEDULE_TASK.md`. Do not implement a defect, hidden suite, or bundle from this file.

Scores are 1–5. Higher is better for a hidden-test benchmark except **Difficulty** (higher = harder for the agent).

| Rank | Concept | Difficulty | Realism | Verifier | Anti-gaming | Partial credit | Non-trivial |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **1** | Patient reschedule must update the existing visit, not create a second one | 4 | 5 | 5 | 5 | 5 | 4 |
| 2 | Occupancy must hold when a visit is moved, not only when it is first booked | 4 | 5 | 5 | 4 | 5 | 4 |
| 3 | Book vs reschedule side-effect contract (audit + inbox) | 3 | 5 | 5 | 5 | 5 | 4 |
| 4 | Appointment ownership — 404 for the wrong person | 3 | 5 | 5 | 3 | 4 | 3 |
| 5 | Clinician reschedule must actually move the visit | 3 | 5 | 4 | 3 | 4 | 3 |

---

## 1. In-place patient reschedule (selected)

A reschedule that creates a second booking is a realistic production bug: the book form is reused, refresh loses context, and the confirm action books again.

**Healthy**

- Confirming a reschedule keeps the same appointment id.
- The number of appointments does not increase.
- The old time is released; the new time is held.
- Audit says the visit was rescheduled, not booked.
- No extra inbox rows.
- A brand-new booking (no reschedule context) still creates a new visit.

**Why it ranks first**

- Crosses UI, URL, identity, occupancy, audit, and inbox.
- Visible `npm test` never mentions moving an existing visit.
- Instruction can stay in product language (see `RESCHEDULE_TASK.md`).
- Partial credit is natural: URL context, in-place update, audit verb, no extra notify, new booking still works.

**Seams a later author could regress** (not now)

- Booking confirm always creates a new visit.
- Reschedule query string dropped, so refresh books again.
- Server-side time change inserts a second row.

**Do not ask the agent to** add cache invalidation, interval overlap, patient-vs-two-doctors checks, clinician-reschedule audit, or live video.

---

## 2. Occupancy on move

Visible tests already lock “Sarah’s Tuesday 10:30 cannot be newly booked.” A move onto that same chip, onto Leila’s pending 14:00, onto a pre-clock time, or onto a time outside published hours can still be broken while `npm test` stays green.

**Healthy**

- Taken confirmed times reject a move.
- Pending times reject a move (place the seed pending visit on a published chip first; Tuesday 14:00 is unpublished).
- Times at or before the clock reject a move.
- Times outside published hours reject a move.
- An open future chip succeeds and sets the end thirty minutes later.
- Moving onto the visit’s own current chip is rejected.

**Partial credit:** new-book occupancy only, patient move only, clinician move only, pending vs confirmed.

**Instruction risk:** naming internal slot helpers. Stay on HTTP status + copy + which seed times fail.

---

## 3. Book vs reschedule side effects

The pairing is asymmetric on purpose. Agents often “notify on every write” or drop audit on updates.

**Healthy**

- New booking: one book audit, patient “Appointment confirmed”, clinician “New appointment”.
- Patient move: one `rescheduled an appointment` audit, zero new inbox rows.
- Clinician move: zero new audit rows, zero new inbox rows.
- Appointment-reminder pref off: patient does not get the book row; clinician still does.

Strong companion assertions for task 1. Weak as a standalone story.

---

## 4. Appointment ownership (404)

David must not be able to read or change Sarah’s visit. Weber must not be able to read or change Amara’s Tuesday visit. Response is 404 with “We could not find that appointment.”

Easy to restore if the instruction mentions the owner field. Harder if the instruction only states the 404 copy and “the row is unchanged.” Pair GET and the time-change on both portals.

Do not change chart 403s or portal 403s. Those are a different contract.

---

## 5. Clinician modal actually moves the visit

Historical QA miss: Reschedule navigated to the schedule instead of changing the time.

**Healthy**

- Dialog, day chips, Save new time.
- Same id, new times, status unchanged, no audit, no inbox.

Useful as a secondary hidden case. Too UI-shaped to be the primary task.

---

## Recommended composition

Ship **one** Odyssey task: candidate 1 as the prompt.

Hide, without naming them in the instruction:

- Identity + count (core).
- Occupancy matrix from candidate 2 (depth).
- Audit + inbox from candidate 3 (anti-gaming).
- Ownership 404 from candidate 4 (security).

That is the plan in `VERIFIER_PLAN.md` and `HIDDEN_TEST_PLAN.md`.

---

## Explicitly rejected as the primary task

| Idea | Why not |
| --- | --- |
| Add interval overlap | New product rule |
| Add patient double-book checks | New product rule |
| Add clinician-reschedule audit | Changes frozen silence |
| Add Query invalidation on book | Product / UX change |
| Admin can mutate appointments | New feature |
| Live video or email | Out of scope |
| Change 404 to 403 for wrong owner | Contract change |
