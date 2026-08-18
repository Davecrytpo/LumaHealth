# Seeding notes

How to aim hidden checks at the frozen seed. Do **not** change `server/seed.ts` while authoring. The store is in-memory; `resetDatabase(createSeed())` in `beforeEach` is the only reset.

Clock: **2026-08-18**. A start time is selectable only if it is **after** `2026-08-18T08:00:00.000Z` and it is a published 30-minute opening that is not held.

Password for every account: `luma-demo`.

---

## Accounts

| Id | Email | Role | Useful for |
| --- | --- | --- | --- |
| `user_david` | david@luma.health | patient | Primary mover (`apt_david_amara`) |
| `user_sarah` | sarah@luma.health | patient | Occupied Tuesday 10:30; IDOR target |
| `user_james` | james@luma.health | patient | Occupied Tuesday 11:30 |
| `user_leila` | leila@luma.health | patient | Pending visit; isolate pending occupancy after moving it onto a published chip |
| `user_amara` | amara@luma.health | clinician | Calendar under test |
| `user_weber` | weber@luma.health | clinician | Wrong-clinician 404 |
| `user_chen` | maya@luma.health | clinician | David’s cancelled past visit |
| `user_adebayo` | tunde@luma.health | clinician | Pending verification — not in Find Care |
| `user_admin` | admin@luma.health | admin | Audit read; no appointment mutations |

Notification prefs that matter:

- David, Sarah, Leila: appointment reminders **on**.
- James: prescription updates **off** (irrelevant to this task).
- Leila: care-team messages **off** (irrelevant to this task).

---

## Appointments (9)

| Id | Patient | Clinician | Start | End | Status | Role in the task |
| --- | --- | --- | --- | --- | --- | --- |
| `apt_david_amara` | David | Amara | 2026-08-19T10:30Z | 11:00 | confirmed | **Move this** |
| `apt_david_past` | David | Weber | 2026-07-22T09:00Z | 09:30 | completed | Past tab only |
| `apt_sarah_today` | Sarah | Amara | 2026-08-18T10:30Z | 11:00 | confirmed | Occupied chip + IDOR target |
| `apt_james_today` | James | Amara | 2026-08-18T11:30Z | 12:00 | confirmed | Occupied chip |
| `apt_leila_pending` | Leila | Amara | 2026-08-18T14:00Z | 14:30 | pending | Pending holder — see trap below |
| `apt_sarah_past` | Sarah | Amara | 2026-08-12T10:00Z | 10:30 | completed | Does not occupy |
| `apt_james_past` | James | Amara | 2026-08-04T09:30Z | 10:00 | completed | Does not occupy |
| `apt_david_cancel` | David | Chen | 2026-08-05T11:00Z | 11:30 | cancelled | Does not occupy |
| `apt_amara_early` | Leila | Amara | 2026-08-18T09:00Z | 09:30 | completed | Tuesday 09:00 is **free** |

David’s upcoming list at seed: **one** visit (`apt_david_amara`). A correct reschedule keeps that count at one.

---

## Amara published hours (UTC)

| Weekday | Date on the strip | Hours |
| --- | --- | --- |
| Monday | 2026-08-17 | 09:00–12:00 and 14:00–17:00 — **all before the clock, none selectable** |
| Tuesday | 2026-08-18 | 09:00–13:00 |
| Wednesday | 2026-08-19 | 09:30–12:30 |
| Thursday | 2026-08-20 | 10:00–16:00 |
| Friday | 2026-08-21 | 09:00–12:00 |

Other clinicians (for filters / past visits only):

- Weber: Mon 08:30–12:30, Tue 08:30–15:00, Thu 09:00–17:00
- Chen: Tue 10:00–16:00, Wed 10:00–16:00, Fri 09:00–13:00
- Adebayo: Mon 13:00–17:00, Wed 09:00–13:00, Fri 13:00–17:00 (not listed in Find Care)

---

## Held vs free chips on Amara’s week

Held (`confirmed` or `pending` at that exact start):

| Start | Holder |
| --- | --- |
| 2026-08-18T10:30Z | Sarah |
| 2026-08-18T11:30Z | James |
| 2026-08-18T14:00Z | Leila pending — **not a published Tuesday slot** |
| 2026-08-19T10:30Z | David |

Safe open targets:

| Start | Why | Use as |
| --- | --- | --- |
| 2026-08-19T11:00Z | Wednesday window, after clock, not held | **Canonical patient move** |
| 2026-08-19T11:30Z | Same window | Alternate move |
| 2026-08-20T10:00Z | Thursday window, empty | **Canonical new booking** |
| 2026-08-18T09:00Z | Tuesday window; 09:00 is completed, not held | Clinician move of Sarah, or pending placement |
| 2026-08-18T09:30Z | Tuesday window, not held | **Place Leila pending here**, then prove occupancy |

Times that must 409 for a David → Amara move, and why:

| Start | Reason |
| --- | --- |
| 2026-08-18T10:30Z | Sarah confirmed |
| 2026-08-18T11:30Z | James confirmed |
| 2026-08-19T10:30Z | David’s own current chip |
| 2026-08-19T08:00Z | Outside Wednesday hours |
| 2026-08-17T10:00Z | Before the clock |
| 2026-08-18T14:00Z | Outside Tuesday hours (and also Leila pending) |

---

## Trap: Leila Tuesday 14:00

`apt_leila_pending` is pending at `2026-08-18T14:00:00.000Z`.

Amara’s Tuesday window ends at 13:00. 14:00 is a Monday afternoon window, not a Tuesday slot.

A 409 when David asks for Tuesday 14:00 does **not** prove that pending visits occupy chips. It only proves unpublished times are refused.

To isolate pending occupancy without editing the seed:

1. Sign in as Amara.
2. Move `apt_leila_pending` to Tuesday 09:30. Status stays pending. Count stays 9.
3. Sign in as David.
4. Try to take Tuesday 09:30 as a move or as a new booking → 409.

Tuesday 09:00 is also free (completed `apt_amara_early`) and is a good target when Amara moves Sarah in the clinician-silence control case.

---

## Inbox and audit at seed

Notifications (6):

| Id | User | Kind | Title |
| --- | --- | --- | --- |
| `nt_1` | David | appointment | Appointment confirmed |
| `nt_2` | David | prescription | Prescription renewed |
| `nt_3` | David | care-team | Message from your care team |
| `nt_4` | Amara | appointment | New appointment |
| `nt_5` | Amara | prescription | Prescription renewal requested |
| `nt_6` | Amara | system | Your schedule was updated |

Audit (4, newest first in the store):

| Id | Actor | Action |
| --- | --- | --- |
| `au_1` | Amara | created a prescription for Sarah Miller |
| `au_2` | David | booked an appointment with Dr. Okafor |
| `au_3` | Nora Ellis | updated doctor availability for Dr. Weber |
| `au_4` | Amara | completed a consultation with Leila Hassan |

After a correct David reschedule: notifications stay at **6**; audit becomes **5** with newest action `rescheduled an appointment`.

After a correct new booking (reminders on): notifications become **8**; audit becomes **5** with newest action `booked an appointment with Dr. Okafor`.

After a correct clinician time change: both counts stay at seed values.

---

## Consultation types

| Clinician | Offered |
| --- | --- |
| Amara, Weber, Chen | video and in-person |
| Adebayo | video only |

A new booking of a type the clinician does not offer returns 400. Patient reschedule does not re-check offering. Do not add that check as a hidden requirement.

---

## Counts to memorize

| Collection | Seed length |
| --- | --- |
| Appointments | 9 |
| Notifications | 6 |
| Audit | 4 |
| David upcoming with Amara | 1 |

---

## Do not

- Edit `server/seed.ts` to make hidden cases easier.
- Add a future cancelled visit “so rebook can be tested” — cancel in the test, then rebook the released chip.
- Rely on wall-clock `new Date()` for “today”. Use the frozen 18 August 2026 dates.
- Treat Monday 17 August chips as available.
- Treat `apt_amara_early` (completed 09:00 Tuesday) as occupying that chip.
