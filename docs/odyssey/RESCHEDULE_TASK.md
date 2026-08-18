# Selected task: patient reschedule updates the existing visit

This is the product specification a later Odyssey `instruction.md` should paraphrase. It describes **observable** behavior on the healthy baseline.

It does not describe HTTP verbs, handler names, helper names, or how the store is implemented.

---

## One-line goal

When a patient reschedules, the existing appointment changes time. A second appointment must not appear.

---

## Expected behavior

David Daniel has a confirmed video visit with Dr. Amara Okafor on Wednesday 19 August 2026 at 10:30.

He opens that visit, chooses Reschedule, picks a different open time on Dr. Okafor’s calendar, reviews, and confirms.

Afterwards:

- He still has that same visit. It is not a new booking.
- The visit identifier is unchanged.
- The visit now starts at the time he picked, and ends thirty minutes later.
- Wednesday 10:30 is no longer held for him.
- The new time is held for him.
- The visit is confirmed.
- The confirmation screen shows the new day and time with Dr. Okafor.
- His upcoming list still has one visit with Dr. Okafor, not two.
- Nobody receives a new “appointment confirmed” or “new appointment” message because of the move.
- The audit log records that he rescheduled an appointment.

If he instead books a new visit from Find Care, without opening an existing visit’s Reschedule action, a **new** visit is created. That path is unchanged.

---

## API behavior

Speak in outcomes, not verbs.

**Reading a visit**

- A signed-in patient can read their own visit.
- A signed-in patient who asks for someone else’s visit, or a missing id, receives **404** and the message “We could not find that appointment.”
- The other person’s visit is not changed.

**Changing the time of an existing visit**

- The patient must be signed in as the person who owns the visit.
- The body names the new start time (and may repeat type and reason).
- If the new start time is open for that clinician, the **same** visit is returned with the new start and end. Status is confirmed. HTTP 200.
- If the new start time is not open, HTTP 409 and “That time is no longer available.” The visit is unchanged.
- If the visit is not theirs or does not exist, HTTP 404 and “We could not find that appointment.” Nothing is created.
- After a successful move, listing the patient’s upcoming visits returns the same number of rows as before. The moved visit is present once.

**Creating a new visit**

- A new booking still creates a new identifier, returns 201, status confirmed, and is a separate record.
- A new booking of an already-held time (for example Dr. Okafor on Tuesday 18 August at 10:30) still returns 409.

**Clinician time change** (out of the prompt’s main story, still baseline)

- Dr. Okafor can move a visit she owns to another open time. Same identifier. Status unchanged.
- She cannot move a visit that belongs to another clinician (404).

---

## UI behavior

**Entry**

- On `/patient/appointments/:id`, Reschedule and Cancel show only when the visit is confirmed or pending.
- Reschedule goes to the booking steps for that clinician and keeps the visit id in the page address as `reschedule={id}`.
- Reloading that address still updates the existing visit. It must not create a second one.

**Steps**

- Step 1: weekday strip (Monday 17 August through Friday 21 August) and time chips.
- Step 2: consultation type (only types that clinician offers) and reason for visit.
- Step 3: review clinician, day, time, type, reason.
- Confirm shows “Appointment rescheduled.” and opens `/patient/appointments/:id/confirmed` for **that same id**.

**Chips**

- Held times are visible and not selectable.
- Times at or before the product clock, and times outside published hours, are not selectable.
- The visit’s current time stays held while choosing a new one.

**Non-reschedule booking**

- Find Care → clinician → Continue to booking, with no `reschedule` in the address, still creates a new visit and says “Appointment confirmed.”

**Cancel** (must keep working)

- Cancel opens “Cancel this appointment?” with Keep appointment / Cancel appointment.
- Confirming cancel marks that visit cancelled and returns to the list. It does not create a new visit.

---

## Audit behavior

After a successful patient reschedule, the newest audit row is:

- Actor: David Daniel (or whoever moved their own visit).
- Action: `rescheduled an appointment`.

It is not `booked an appointment with Dr. Okafor`.

A brand-new booking still writes `booked an appointment with Dr. {lastName}`.

A clinician moving a visit writes **no** audit row.

---

## Notification behavior

A patient reschedule adds **no** inbox rows.

| Event | Patient inbox | Clinician inbox |
| --- | --- | --- |
| New booking | “Appointment confirmed” (if reminders are on) | “New appointment” |
| Patient reschedule | none | none |
| Patient cancel | none | “Appointment cancelled” |
| Clinician reschedule | none | none |

If appointment reminders are off, a new booking must not add a patient inbox row. A reschedule still adds none.

---

## Ownership behavior

- Only the owning patient can change that visit’s time.
- Another patient receives 404 and the standard not-found copy. The visit and the appointment count are unchanged. No new visit is created for the attacker.
- A clinician who does not own the visit receives 404 on the clinician visit endpoints.
- A clinician calling the patient portal, or a patient calling the clinician portal, is refused as a wrong-area request (403). That is existing portal RBAC, not this task.

---

## Availability behavior

The new time must be a published 30-minute opening for **that** clinician.

For Dr. Okafor:

- Monday 09:00–12:00 and 14:00–17:00
- Tuesday 09:00–13:00
- Wednesday 09:30–12:30
- Thursday 10:00–16:00
- Friday 09:00–12:00

A time outside those windows is not available, even if nobody else is booked.

The product clock is 18 August 2026, 08:00. Any start at or before that instant is not available. Monday 17 August therefore has no selectable chips.

End time is always thirty minutes after start.

---

## Occupancy behavior

A chip is held when that clinician already has a confirmed **or pending** visit at that exact start time.

Examples against the seed:

| Time (Dr. Okafor) | Why it cannot be chosen |
| --- | --- |
| Tue 18 Aug 10:30 | Sarah Miller, confirmed |
| Tue 18 Aug 11:30 | James Wilson, confirmed |
| Wed 19 Aug 10:30 | David’s current visit (still held while he picks a new time) |

A **pending** visit holds its start time the same way a confirmed visit does. The seed’s pending Leila visit sits at Tuesday 14:00, which is also outside Dr. Okafor’s Tuesday hours (09:00–13:00), so that particular clock time is refused for two independent reasons. A later verifier should first place a pending visit on an otherwise open published chip, then show that chip cannot be taken.

Open examples that a move **may** use:

| Time (Dr. Okafor) | Why it is open |
| --- | --- |
| Wed 19 Aug 11:00 | Inside Wednesday hours, not held |
| Thu 20 Aug 10:00 | Inside Thursday hours, not held |

Cancelled and completed visits do not hold a chip.

A patient may already have another visit with a different clinician at the same clock time. That does not block a move on Dr. Okafor’s calendar. Do not add a new “patient overlap” rule.

---

## What success looks like (for a later agent)

The agent restores the product so that:

1. Reschedule changes one existing visit.
2. A second visit is not created.
3. Held, pending, past, and unpublished times are still refused.
4. Audit and inbox behave as a move, not as a new booking.
5. The wrong person still cannot see or change the visit.
6. A genuine new booking still creates a new visit.

The agent must not redesign the UI, add features, change portal RBAC, add mail or video, or invent new occupancy rules.

---

## What the later public instruction must not say

Do not name request methods, handler names, helper names, or store fields. Stay with the language in this file: existing visit, same identifier, no second booking, not available, not found, audit wording, inbox silence.
