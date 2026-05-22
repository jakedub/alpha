# UI Redesign — Design Document
**Date:** 2026-05-22  
**Scope:** Option C — Shell + Events flagship page  
**Status:** Approved

---

## Overview

Alpha is a Gen Con convention planning tool. Its core user journeys are event discovery and scheduling, group/family calendar coordination, vendor visit planning, and map-based travel-time warnings between venues. The current UI uses a muted slate palette, floating hamburger navigation, and a collapsible table for events. The redesign targets a futuristic/clean aesthetic with a moody dark default and warm amber accent — professional enough to match the app's ambition.

This document covers the MUI theme overhaul, AppBar navigation replacement, and Events page redesign. The Events page serves as the design template for future page updates.

---

## 1. Theme & Typography

### Font
Replace `Arial, sans-serif` with `Inter, sans-serif`. Load via a single `<link>` in `index.html`. Inter is tight, highly legible at small sizes, and is the standard for modern dashboards.

### Dark Default
Flip `darkMode` initial state from `false` to `true` in `App.tsx`. Light mode remains available via the theme toggle.

### Color Tokens

| Token | Dark | Light |
|---|---|---|
| `background.default` | `#111827` (gray-900) | `#f8fafc` |
| `background.paper` | `#1f2937` (gray-800) | `#ffffff` |
| `primary.main` | `#f59e0b` (amber) | `#f59e0b` |
| `primary.contrastText` | `#111827` | `#111827` |
| `secondary.main` | `#fbbf24` (amber-400) | `#fbbf24` |
| `text.primary` | `#f9fafb` | `#0f172a` |
| `text.secondary` | `#9ca3af` | `#6b7280` |
| `error.main` | `#ef4444` | `#ef4444` |

### Component Overrides

- **MuiButton:** `textTransform: 'none'`, `borderRadius: 8`
- **MuiCard:** border `1px solid rgba(255,255,255,0.08)` (dark) / `#e5e7eb` (light), remove hardcoded `#fffffe` background — use `background.paper` from theme
- **MuiAppBar:** `background.paper` color, `elevation: 0`, bottom border `1px solid` divider color
- **MuiTabs indicator:** `#f59e0b` (amber)
- **MuiChip (filled primary):** amber background, dark text

The existing calendar event colors (`#00F0FF`, `#FFA900`, `#6F2DBD`, `#00FF81`, `#FF6800`) are preserved — they contrast well against the dark base.

---

## 2. Navigation (AppBar)

### Replaces
- `HamburgerToggle` component
- `StyledDrawer` and temporary drawer
- `mobileOpen` state
- Framer-motion drawer animation
- Floating lightbulb `Fab` in `App.tsx`
- `drawerItems` array

### AppBar Structure

```
[ ALPHA 🎲 ]  [ Events | Schedule | Vendors | Map ]  [ ⚙ | ☀/🌙 | 👤 ]
```

**Left — Wordmark:**  
`"ALPHA"` in amber, bold, `variant="h6"`. Paired with a small `CasinoIcon` (d6 die). Wrapped in a `RouterLink` to `/`.

**Center — Primary Tabs:**  
MUI `Tabs` with `useLocation()` for active tab detection. Amber underline indicator.

| Tab Label | Route | Icon |
|---|---|---|
| Events | `/events` | `EventIcon` |
| Schedule | `/fullcalendar2` | `CalendarMonthIcon` |
| Vendors | `/vendors` | `StorefrontIcon` |
| Map | `/map` | `MapIcon` |

**Right — Utility Icons (3 buttons):**

1. **Settings** (`SettingsIcon`) — `IconButton` that opens a `Menu` dropdown containing: Locations, Rooms, Users, Data Sync, Dashboard (auth-gated). This is where admin/power-user navigation lives.
2. **Theme toggle** (`LightModeIcon` / `DarkModeIcon`) — replaces the floating FAB. Calls existing `setDarkMode` prop.
3. **User button** — shows `AccountCircleIcon` with user initials when authenticated, `LoginIcon` when not. Opens a `Popover` with user display name + Logout button (or Login link).

### Active Tab Logic
`useLocation()` from `react-router-dom` maps the current pathname to a tab index. Unmatched routes (e.g., `/events/:id`) highlight the parent tab (`/events`).

### DevConsoleButton
Retained as a fixed-position element (dev-only). Can be moved to the Settings dropdown in a future pass.

---

## 3. Events Page Redesign

### Layout
Two-column: sticky filter sidebar (280px) left, scrollable results right. On viewports under 900px, the sidebar collapses and a "Filters" toggle button appears above the results.

### Filter Panel (Left Sidebar)
All existing filter logic and state is preserved — only the presentation changes.

- Panel background: `background.paper`
- Top: "Filters" label + "Clear All" button (right-aligned)
- Existing multi-select dropdowns: Event Type, Game System, Day, Start Time, Group, Location
- Existing checkbox groups: Age Requirements, Experience Level
- Active filter chips rendered in amber below each relevant dropdown
- Amber focus rings on all inputs (from theme `primary.main`)

### Results Area (Right)
**Header row:** `"Events"` heading (left) + `"{n} results · {x} filters active"` (right, secondary text).

**Card grid:** 2 columns on ≥ 1200px, 1 column below. Cards use `MuiCard` with the new theme border.

**Card anatomy:**
```
┌─┬──────────────────────────────────────┐
│█│ [Event Type Badge]          [Cost]   │  ← color strip left edge (event_type color)
│█│ Event Title                          │
│ │ 📅 Sat Aug 2 · 10:00 AM  ⏱ 120 min  │
│ │ 📍 JW Marriott · Room 203            │
│ │                                      │
│ │ [Add to Schedule]  or  [Scheduled ✓] │
└─┴──────────────────────────────────────┘
```

- Left-edge color strip (4px wide, full height) keyed to `event_type` using the existing CalendarColors palette
- Event type shown as a small `Chip` (top right of card)
- Cost badge: amber if `$0` / free, gray otherwise
- `"Add to Schedule"` — amber outlined `Button`; transitions to `"Scheduled ✓"` (amber filled, disabled) when `selectedEventIds` contains the event
- Full card is clickable (navigates to `/events/:id`) except for the action button
- On hover: subtle amber border glow (`box-shadow: 0 0 0 1px #f59e0b`)

**Load More:** Retained at bottom of grid, restyled as amber outlined button.

**Snackbar:** Unchanged in behavior, picks up new theme colors automatically.

### What Gets Removed
- `CollapsibleTable` and `TableContainer`
- `TableHead`, `TableBody`, `TableRow`, `TableCell` structure
- Expandable row pattern (`Collapse`, `KeyboardArrowDown/Up`)
- `OpenInNewIcon` button inside table cell (replaced by full-card click)
- Floating scroll `Fab` buttons (up/down)

### Preserved
- All filter state, API calls, pagination logic
- `refreshUserEvents`, `selectedEventIds`, `handleAddToSchedule`, `handleRemoveFromSchedule`
- `EventFilter` component (restyled in place)
- `Snackbar` feedback

---

## Files Touched

| File | Change |
|---|---|
| `src/theme/theme.ts` | New palette, typography, component overrides |
| `src/App.tsx` | Dark default, remove lightbulb Fab, pass `setDarkMode` to Layout |
| `src/components/Shared/Layout.tsx` | Full replacement — AppBar + Tabs nav |
| `src/components/Events/EventList.tsx` | Card grid replaces collapsible table |
| `src/components/Events/EventFilter.tsx` | Restyle as sidebar panel |
| `public/index.html` (or `index.html`) | Add Inter font link |

---

## Out of Scope (Future Passes)

- Vendors page layout
- Schedule/Calendar page styling
- Map page styling
- Group/friends scheduling UI
- Vendor visit planning UI
- Mobile responsive polish beyond the filter sidebar collapse
