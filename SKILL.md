---
name: parking-device-maintenance
description: >-
  Build and change the parking device maintenance frontend. Use when creating
  or editing pages, components, routes, menus, tickets, devices, QR flows,
  masters, dashboard, users, reports, or any UI in this project.
---

# Parking Device Maintenance Skill

This skill is binding for **every create and every change** in this frontend.

Product decisions come from the agreed parking-maintenance spec (Claude share
[Parking device maintenance and repair log](https://claude.ai/share/12b4ac7c-e8d9-4b1d-b1cf-ca8db5cc63bd)).
Later decisions in that spec override earlier ones. Repository code wins for
file layout and libraries already in use.

Do not invent a parallel product. Do not reintroduce features that were
stripped out. Do not merge multiple screens into one page.

---

## 1. What this app is

A small maintenance system for ~1,000 parking devices on 5 roads.

The whole point is **per-device history**: why a machine broke, what was done,
what part was changed, how long it stayed open, and what it cost.

Two masters make that history usable:

1. **Device master** — unique device, QR code, road, slot.
2. **Issue master** — category → sub-category. Technicians pick from the list.
   Free-text is never the cause of a ticket.

---

## 2. Create / change gate

Before adding or changing a page, field, status, or menu item:

1. Inspect existing routes, layout, nav, components, and types.
2. Reuse the shared layout, nav config, and existing screens.
3. Check this skill: is it a **landing page** or a **flow step**?
4. Check the **do not add** list below.
5. Implement the smallest change that matches the spec.
6. Wire internal links (no dead buttons, no orphan screens).
7. Field ticket screens must stay mobile-first.

If the user asks for something this skill forbids, do not silently add it.
Confirm, because it was already removed on purpose.

### Do not add (unless the user explicitly asks again)

- Preventive maintenance, inventory, SLA, live health map
- SIM number, battery, solar panel, charge controller
- Part numbers, manufacturer serials, warranty dates
- Cost on list/dashboard/master pages, “cost borne by”, liability flags
- Issue codes such as `CT-01` / `MC-01` — names only
- Manual device status editing
- A second open ticket on a device that already has one
- Top-level menu links for raise / update / close / detail / add device /
  device history / scan QR

---

## 3. Information architecture

### Menu (landing pages only)

```text
Dashboard
Tickets        → All tickets, Work report
Devices
Masters        → Issue master, Road master
Users
───────────────
Settings       (bottom utility — not a flow parent)
```

Everything else is a **flow**, reached by clicking through. The sidebar still
highlights the parent while the user is inside a flow. Settings sits above the
company/version footer and is not part of the main `MENU` list.

### Flows (not menu items)

| Flow | Path |
|------|------|
| Raise | Tickets list → Raise ticket → back to list |
| Attend | Tickets list → Ticket detail → Update on site → Close |
| Field | Devices → Scan QR → device found → raise or update |
| Add device | Devices → Add device (link to Add road if the road is missing) |
| History | Devices list → device id → Device history |
| Assign | Tickets list (New tab) → Assign → ticket detail trail |

Breadcrumbs are links. Landing pages may have a small “Go to” pill strip for
jumps that are not obvious from the table.

---

## 4. Domain model

### device

- `device_id`, `device_code` (printed on QR, auto-generated)
- `road_id`, `slot_number` (always say **slot**, never bay)
- `install_date`, `remarks`
- `current_status` — **derived**, never a form field

No SIM, battery, solar, part serials, or warranty on the device.

### road

- Identity, stretch, zone/ward, status
- **Surveyed slots** and **installed devices** are separate counts
- Slot numbering prefix (so slots match what is painted on site)
- Optional site supervisor for routing

### issue_category / issue_subcategory

Names only. Sub-category belongs to one category.

Default categories:

- Mechanical
- Electrical
- Power — mains supply cut, SMPS failure, power cable damaged, MCB tripped
- Communication — network cable, module, server sync, weak network
- Sensor
- QR/Payment
- External Damage
- Civil
- Operational

Each sub-category has **severity**: Critical / Major / Minor.

- Critical (and typically Major) → device **Not working**
- Minor → device can stay **Working**
- Used rows can only be **deactivated**, never deleted

### part

Names from a part list, picked as chips on ticket update/close.
No part master in the menu unless the user asks. No serials.

### ticket

- Identify device by **scan QR** or **road → slot**
- `reported_category` / `reported_subcategory`
- `found_category` / `found_subcategory` (technician may reclassify)
- description, photos (multiple), reporter, timestamps, assignee
- Cost exists only on visits / close, then rolls up to the ticket total

### ticket_update (work history)

Day-by-day log. An engineer can visit, write what they did, and **leave the
ticket open**. Only a “resolved / close” action closes it.

Each update may include: type, work done, category/sub-category change,
parts changed (names), cost of this visit, photos, next visit date,
handover/reassign.

---

## 5. Status rules (do not weaken these)

### Ticket list tabs

`New` | `Assigned` | `Closed`

- **New** — unassigned. Primary action is Assign, not Open.
- **Assigned** — someone holds it. Only that person can update or close.
- **Closed** — resolved.

Assignment can be skipped at raise (“Assign later”). The current holder may
hand over to someone else. Control room can assign; they cannot close.

If the same fault returns within **7 days**, reopen the **same ticket**.
Do not create a duplicate.

### Device status — derived only

| Condition | Device status |
|-----------|----------------|
| No open ticket (or only Minor) | Working |
| Open ticket, not yet being attended | Not working |
| Open ticket, engineer attending / under repair | Under Repair |
| Ticket closed | Working |

Never let anyone type device status by hand. Dashboard counts must match
the ticket list.

Block a second open ticket on the same device. Offer “update the existing
ticket” instead.

---

## 6. Screen requirements

### Dashboard

- Fleet strip: total devices split as Working / Under Repair / Not working,
  plus count of tickets open **more than 3 days**
- Why devices are down — ranked by **issue found**, with category
- Road-wise: total / working / repair / down
- Open tickets: oldest first; >3 days highlighted
- Filters: road, date range
- Every number, road, ticket, and device code is clickable

### Tickets — list

- Tabs: New, Assigned, Closed, with counts
- Columns include issue reported, issue found, updates count
- Raise ticket is a flow button, not a menu item

### Tickets — raise (mobile-first)

1. Scan QR **or** road → slot (slot list filtered by road)
2. Device card: status + existing ticket count
3. If an open ticket exists, warn and offer to update it
4. Category → sub-category (sub-category filtered by category) → description
5. Multiple photos
6. Optional assign, default **Assign later**

### Tickets — update on site (mobile-first)

Load the open ticket. Show reported category. Changing category/sub-category
shows an amber “changed from / to” strip.

Fork:

- **Yes, fixed** → work done, parts chips, cost of this visit, after photos →
  close flow
- **No, still open** → work done today, reason (spare not available, civil,
  traffic police, no access, rain, …), next visit, optional parts/cost,
  optional “Hand over to”

Sticky action bar. Only the current assignee can submit.

### Tickets — close (mobile-first)

Final category confirmed, resolution text, parts, cost of this visit, visit
cost table with ticket total, “was the device tested?”, multiple photos.

### Tickets — detail

- Reported vs found side by side, with who/when
- Work history: one row per visit, status tag (still open vs closed)
- Assignment trail: who held it, in order, with Reassign
- Add update / close from here

### Work report

Person-centric daily work report, not a ticket dump.

- Views: Day, Week, Month, Date range
- Team strip: days worked, visits, tickets worked, closed, still open,
  close rate, load
- Per person: every ticket they touched, what they did, closed vs in progress
- Week/month aggregate utilisation (day-by-day or week-by-week)
- A ticket is “touched” if a visit, handover, or note was logged that period
- Close rate is not performance by itself (spares vs technician)

### Devices — list

- Road + slot on every row
- Current open ticket / current issue inline
- Tickets in last 6 months — flag at 3 or more (replace-vs-repair)
- Row opens history; open-ticket ref opens that ticket; Ticket action
  raises or continues the existing ticket

### Devices — history (the main screen)

Header: device code, **road and slot** prominent.

One table, split:

- Left: ticket no., when, issue reported, issue found
- Right: action taken, parts replaced (names), days open, cost

Totals row: days down, spend.

Part replacement panel: date, part name, ticket. No serials.

### Devices — add

QR/device code auto-generated. Road from road master. Slot number.
Link to add road if missing. Replacement parts are captured on tickets,
never on this form.

### Devices — scan QR

Scan or type the code (damaged sticker). Show status, open ticket, ticket
count, then raise or update.

### Issue master

One screen: categories left, sub-categories of the selected category right.
Severity per sub-category. Ticket count. Delete disabled when in use
(deactivate instead).

### Road master

List + add/edit. Add-road lives under Road master, not as its own menu line.

### Users

Two tabs: Roles, Users.

- Roles have a permission matrix: View / Create / Edit / Assign / Close /
  Delete, grouped like the menu
- Scope is separate from checkboxes (technician = assigned roads only)
- Control room can assign but not close
- Closing belongs to whoever is attending the slot
- Deactivate users; never delete (names must remain on old tickets)

Suggested roles: Admin, Control room, Technician, Project manager,
AMC officer, OEM.

---

## 7. UI rules

- Font: **Archivo**. Nothing smaller than **12px**.
- Separate pages/routes. Shared layout, nav, and styles. One nav config
  drives the sidebar on every screen.
- Field pages (raise / update / close): one column, ~46px inputs, thumb-sized
  tap targets, sticky bottom action bar.
- Multiple photos as a grid with add + remove, not a single file input.
- Do not show cost except on ticket visit/close and totals fed by those
  entries (ticket total, device history totals, work report).
- Always show **road + slot** wherever a device is identified.
- Keep reported issue and found issue as **two columns / two fields**.
- Empty, loading, and error states on every async view.

---

## 8. React implementation

This repo is a Vite + React app. Implement the spec as React routes and
components, not as a folder of standalone HTML files.

- Shared `Layout` + single nav config (equivalent of the old `nav.js`)
- Shared CSS / design tokens (equivalent of the old `asset/style.css`)
- One route per screen; flow screens are routes, not extra menu items
- Reuse existing components before creating new ones
- Do not install a library if the repo already solves it
- A router is required for this multi-page app; add one if missing
- Types for domain objects; no `any`
- Authorization in the UI must match roles; backend remains authoritative
- After changes: lint, typecheck if present, and click the affected flow
  end to end, including the other screens that read the same state

---

## 9. Definition of done

A create or change is done only when:

- It matches this skill (menu, flow, fields, statuses)
- Device status is still derived
- No duplicate open ticket can be created
- Reported vs found issues are both preserved
- Cost is not leaking onto pages that must not show it
- Field ticket screens still work on a phone-width viewport
- Internal links, breadcrumbs, and the parent menu highlight work
- Existing landing pages still reach the new screen if they should
