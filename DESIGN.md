# DESIGN.md — Design System (from original)

Source: `parking_maintenance/asset/style.css`. Legacy design is the source of truth. Reproduce in Tailwind theme + utilities; do not invent a new system.

## Legacy design preservation

```text
Existing Design → Extract → Document → Reproduce in React/Tailwind → Verify against Original
```

## Colors & theme

| Token | Value | Use |
|-------|-------|-----|
| `--navy` | `#0F2438` | Sidebar, dark buttons, toast |
| `--navy-2` | `#16324A` | Sidebar hover/active |
| `--navy-3` | `#1E4260` | Accents, avatar, tracks |
| `--teal` | `#0E8C86` | Brand glyph, focus, active inset |
| `--teal-dk` | `#0B6E69` | Primary button, links |
| `--bg` | `#EEF1F4` | Page background |
| `--surface` | `#FFFFFF` | Panels, topbar |
| `--line` | `#D8DFE6` | Borders |
| `--line-soft` | `#E8EDF1` | Soft borders / dividers |
| `--hover` | `#F7F9FB` | Row/button hover |
| `--ink` | `#132434` | Primary text |
| `--ink-2` | `#4A5D6E` | Secondary text |
| `--ink-3` | `#7A8A99` | Muted / captions |
| `--ok` / `--ok-bg` | `#1B7F4B` / `#E6F2EB` | Success |
| `--warn` / `--warn-bg` | `#B0710A` / `#FBF0DC` | Warning |
| `--bad` / `--bad-bg` | `#B62F26` / `#FAE8E6` | Danger / open |
| `--info` / `--info-bg` | `#1E4260` / `#E7EDF3` | Info strip |

Sidebar text: `#C6D4E0`, muted `#7E93A6`, sub `#93A7B8`.

Pick selected: background `#EAF3F2`. Group header bg: `#F3F6F8`. Split resolution header: `#EAF3F2`.

## Fonts

| | |
|--|--|
| Family | **Archivo** (Google Fonts weights 400, 500, 600, 700) |
| Fallback | `system-ui, -apple-system, sans-serif` |
| Base size | `14px` |
| Line height | `1.45` |
| Minimum | Nothing smaller than **12px** (product rule) |

Import: `https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap`

## Typography

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Brand h1 | 14px | 600 | White |
| Topbar h2 | 17px | 600 | letter-spacing -0.01em |
| Panel h3 | 14px | 600 | |
| Record h3 | 20px | 700 | Device/ticket title |
| Body / td | 13–14px | 400–500 | |
| th / muted / crumb | 12px | 600 / 400 | ink-3 |
| Fleet total | 34px (28px ≤820) | 700 | |
| Legend b | 22px | 700 | |
| Tile b | 24px | 700 | |
| Mobile inputs | 15px | — | height 46px |
| Buttons | 13px (sm 12px, mobile sticky 15px) | 500–600 | |

## Layout

| Token | Value |
|-------|-------|
| `--rail` | `248px` (0 on ≤820 with drawer) |
| `--r` | `8px` panel radius |
| `--r-sm` | `5px` control radius |
| Page max width | `1360px` (forms often `980px`, mobile flows `580px`) |
| Page padding | `22px 24px 48px` (≤820: `16px 14px 40px`) |
| Topbar | sticky, min-height `60px`, padding `0 24px` |
| Panel margin | bottom `18px` |

Grids: `.grid-2` 1.25fr/1fr; `.grid-2-even` 1fr/1fr; collapse ≤1080. `.grid-master` 340px/1fr; collapse ≤940. `.tiles` 4-col / `.tiles.five` 5-col; ≤900 → 2-col. `.form-grid` 2-col; ≤760 → 1-col.

## Visual styles

| Item | Value |
|------|-------|
| Panel border | 1px `--line`, radius 8px |
| Pill | padding 3px 9px, radius 20px |
| Chip | padding 9px 13px, radius 22px |
| Toast shadow | `0 6px 20px rgba(15,36,56,.28)` |
| Sticky bar shadow | `0 -3px 14px rgba(15,36,56,.07)` |
| Focus | `:focus-visible` 2px teal outline |
| Active nav | inset box-shadow `3px 0 0` teal |
| Reduced motion | disable transitions/animations |

## Breakpoints (original)

| Width | Behavior |
|-------|----------|
| ≤820px | Sidebar off-canvas; menu button; hide `.topbar-actions`; page padding shrink; sticky-bar full width; facts 2-col |
| ≥821px | Sticky bar offset by rail |
| ≤760px | Form grid / class-pair stack |
| ≤900px | Tiles → 2 columns |
| ≤940px | Master grid stacks |
| ≤1080px | `.grid-2` stacks |

## Components (visual)

Fleet strip, ranked bars, filterbar, panels, tables (incl. `.split`), tabs, views switcher, timeline, scanbox, mobile step heads, seg buttons, chips, photo grid, person blocks, util bars, permission matrix, jump pills, hint-strip, reclass strip, device card, sticky-bar.

## Manual design maintainability

- Map tokens into Tailwind `theme` / CSS variables once.
- Prefer readable utility strings on components over opaque style maps.
- Document any remaining custom CSS classes in `src/index.css` with comments pointing to original section numbers in `style.css`.
- Do not invent new radii, colors, or fonts.

## Unknowns

| Item | Status |
|------|--------|
| Exact Archivo metric rendering across browsers | Needs verification on device |
| Print QR label output | Toast-only in original |
| Real camera scan chrome | Needs verification when implemented |
