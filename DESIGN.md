---
name: Lease360
description: Operations-console design system for an enterprise equipment-rental platform. Dark, glass-layered, single-accent.
colors:
  brand-orange: "#F26522"
  brand-orange-light: "#FF8C42"
  brand-orange-dark: "#D4541A"
  surface-base: "#0A0A0A"
  surface-elevated: "#111111"
  surface-700: "#1A1A1A"
  surface-600: "#222222"
  surface-500: "#333333"
  text-primary: "#FAFAFA"
  text-muted: "rgba(255, 255, 255, 0.50)"
  text-subtle: "rgba(255, 255, 255, 0.30)"
  glass-tint: "rgba(255, 255, 255, 0.05)"
  glass-border: "rgba(255, 255, 255, 0.10)"
  status-confirmed: "#22c55e"
  status-pending: "#eab308"
  status-overdue: "#ef4444"
  status-pickup: "#3b82f6"
  status-returned: "#9ca3af"
  status-cancelled: "#6b7280"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 700
    fontSize: "1.5rem"
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 600
    fontSize: "1rem"
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 400
    fontSize: "0.875rem"
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 500
    fontSize: "0.75rem"
    letterSpacing: "0.01em"
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 500
    fontSize: "0.6875rem"
    lineHeight: 1.3
  micro:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 500
    fontSize: "0.625rem"
    lineHeight: 1.2
    letterSpacing: "0.05em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontWeight: 500
    fontSize: "0.75rem"
rounded:
  xs: "3px"
  sm: "6px"
  md: "12px"
  lg: "16px"
  skeleton: "8px"
  pill: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.25rem"
  "2xl": "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.brand-orange}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1.5rem"
    height: "auto"
    width: "auto"
  button-secondary:
    backgroundColor: "{colors.glass-tint}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1.5rem"
    height: "auto"
    width: "auto"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.pill}"
    padding: "0.625rem 1.25rem"
    height: "auto"
    width: "auto"
  stat-card:
    backgroundColor: "rgba(255, 255, 255, 0.02)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "1.25rem"
    height: "auto"
    width: "auto"
  glass-panel:
    backgroundColor: "rgba(255, 255, 255, 0.04)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "1.25rem"
    height: "auto"
    width: "auto"
  input-glass:
    backgroundColor: "{colors.glass-tint}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1rem"
    height: "auto"
    width: "100%"
  status-pill:
    backgroundColor: "{colors.glass-tint}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "0.125rem 0.625rem"
    height: "auto"
    width: "auto"
  sidebar-item:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.md}"
    padding: "0.625rem 0.875rem"
    height: "auto"
    width: "auto"
---

# Design System: Lease360

## Overview

**Creative North Star: "The Operations Console."**

Lease360 is designed as a precision operations console. The surface is a calm, dark, glass-layered field; brand orange is the single high-signal accent. Every other color exists to support scanability — muted text, low-opacity glass, status colors reserved for state. The orange should feel like one indicator light on an otherwise quiet instrument panel: a confident focal point, never a decoration.

The system is dense where operators live (dashboard, list pages, return inspection) and quiet where customers glance (the portal, the deposit settlement screen). Both register as the same product, but density is the staff truth and quietness is the customer truth; the design system serves both without splitting.

The system borrows from the liquid-glass vocabulary already in the CSS: translucent panels, backdrop-blur, layered surfaces. But every "glass" element earns its blur — they are containers, separators, and elevated surfaces, not ornaments. Image outlines, hover shadows, and motion are calibrated so the system feels alive without ever feeling busy.

**Key Characteristics:**

- **Single-accent discipline.** Brand orange is the only chromatic color in interactive surfaces. Status colors (green / yellow / red / blue) appear only on state pills and alerts.
- **Dark by default.** The product has no light theme. Every token assumes a dark surface; light mode would require a separate design system, not a token swap.
- **Glass as structure, not decoration.** Translucent layers communicate containment and elevation. No panel exists for visual flair alone.
- **Operate-mode polish.** Buttons, cards, and lists are sized and spaced for fast scanning on a 14" laptop at 100% zoom.
- **Mobile is a peer.** The mobile bottom-nav, the touch targets, and the safe-area insets are first-class. The PWA is installable.
- **Motion earns its place.** Every animation communicates a state change. The default scale on press is `0.96`; entrance animations are one-shot, never re-render.

## Colors

The palette is a single accent plus a dark neutral ramp and a small set of state colors. The accent does the talking; everything else provides contrast for reading.

### Primary

- **Signal Orange** (`#F26522`): The single brand accent. Used for primary CTAs, the active state in nav, the focus ring, the overdue indicator, and any "this is the action" element. Rarity is the point — it should appear on ≤10% of any given surface. Never used for body text.
  - **Signal Orange Light** (`#FF8C42`): Hover state of primary surfaces only.
  - **Signal Orange Dark** (`#D4541A`): Pressed / active state of primary surfaces only.

### Neutral

- **Ink Black** (`#0A0A0A`): Base canvas. Page background, top-bar background.
- **Panel Charcoal** (`#111111`): Elevated surface. Sidebar, mobile bottom-nav, list rows, popover bodies.
- **Surface 700** (`#1A1A1A`): Nested containers and dividers in dense list views.
- **Surface 600** (`#222222`), **Surface 500** (`#333333`): Tertiary surfaces and the scrollbar thumb.
- **Paper White** (`#FAFAFA`): Primary text. Always full opacity on dark surfaces; never used as a background.
- **Dim White** (`rgba(255,255,255,0.50)`): Secondary text — labels, captions, supporting copy.
- **Faint White** (`rgba(255,255,255,0.30)`): Tertiary text — timestamps, metadata, empty-state copy.
- **Glass Tint** (`rgba(255,255,255,0.05)`): Translucent fill for inputs, secondary buttons, and inline icons.
- **Glass Border** (`rgba(255,255,255,0.10)`): The structural border for glass panels, status pills, and dividers.

### Status (reserved for state pills and alerts — never for decoration)

- **Go Green** (`#22c55e`): Confirmed, on-time, resolved.
- **Hold Yellow** (`#eab308`): Pending, awaiting, in-progress.
- **Stop Red** (`#ef4444`): Overdue, damaged, urgent.
- **Route Blue** (`#3b82f6`): Picked-up, in-transit.
- **Returned Gray** (`#9ca3af`): Returned, completed, archived.
- **Cancelled Gray** (`#6b7280`): Cancelled, disabled.

### Named Rules

**The One Voice Rule.** Brand orange is the only chromatic accent on interactive surfaces. It appears on ≤10% of any given view. Its rarity is the point — when it shows, it means "this is the action" or "this is the alarm."

**The Status Reservation Rule.** Status colors (green / yellow / red / blue) are reserved for state pills, banners, and the unread notification highlight. They never color a button, an icon, or a body label. A green button is forbidden; a green pill that means "confirmed" is correct.

**The No-Tinted-Outline Rule.** Outlines on images, icons, and glass surfaces use pure white at low opacity (`rgba(255,255,255,0.10)`), not a tinted neutral that picks up the surface beneath. Tinted outlines read as dirt on the image edge.

## Typography

**Display / Body / Label Font:** Inter (with `system-ui, sans-serif` fallback), served via `next/font/google` and bound to `--font-inter`.

**Character:** Inter is doing the heavy lifting — a workhorse sans designed for long-form screen reading. The system doesn't pair a second face; weight, size, and letter-spacing carry the hierarchy. The visual register is operational: same family across display, body, and labels, varied by weight and tracking, not by typeface swap.

### Hierarchy

- **Display** (700, 1.5rem / `text-2xl`, line-height 1.15, `-0.01em` tracking): Page titles in the dashboard. One per page.
- **Headline** (600, 1rem / `text-base`, line-height 1.3): Section titles in cards and panels. Used inside the recent-orders card and the maintenance panel.
- **Title** (600, 0.875rem / `text-sm`): Card rows — order number, quotation number, customer name. Bold, not all-caps.
- **Body** (400, 0.875rem / `text-sm`): Default body text, form labels, list-row metadata. Line-height 1.5.
- **Label** (500, 0.75rem / `text-xs`, +0.01em): Captions, button text, sub-labels on stat cards.
- **Caption** (500, 0.6875rem / `text-[11px]`): One-line tertiary metadata — the stat-card sub-label, the popover footer. Not uppercase.
- **Micro** (500, 0.625rem / `text-[10px]`, +0.05em, uppercase): Status pills, role badges, KPI sub-labels. Reserved for system state and labels — never body text.

### Named Rules

**The Single-Family Rule.** Inter is the only typeface. Hierarchy comes from weight, size, and letter-spacing; never from a second face. A monospace face is allowed for technical fields (e.g. order numbers, IDs) but is not a system-wide secondary.

**The Tabular-Numbers Rule.** Any dynamically updating number (revenue, deposits, spend, prices in lists) uses `font-variant-numeric: tabular-nums` via the `.stat-value` utility. Proportional digits cause layout shift on every refresh; tabular digits keep the column stable.

## Layout

The shell is a fixed desktop sidebar plus a flexible main column, with a mobile bottom-nav that replaces the sidebar below the `lg` breakpoint. Inside the main column, content is centered in a `max-w-6xl` container and stacked in `space-y-6` sections.

- **Breakpoint:** `lg` is the only meaningful boundary. Below `lg`, the sidebar collapses to a slide-in overlay and a 5-item bottom-nav. Above `lg`, the sidebar is fixed at `w-64` and the bottom-nav is hidden.
- **Sidebar width:** `256px` (`w-64`).
- **Content max width:** `72rem` (`max-w-6xl`).
- **Vertical rhythm:** `1.5rem` (`space-y-6`) between major sections; `0.75rem` (`gap-3`) inside card grids; `1rem` (`gap-4`) at the sm breakpoint and up.
- **Page padding:** `1rem` on mobile, `1.5rem` on sm+. Header is `h-16` with `px-4 sm:px-6`.
- **Card grid:** KPI cards use `grid-cols-2 lg:grid-cols-4` so two cards sit side-by-side on mobile without forcing the user to scroll past a single-column stack.
- **Touch targets:** 44×44 minimum on mobile. The notification bell, the menu button, and the bottom-nav items are all sized to that floor.

## Elevation & Depth

The system uses **layered glass, not shadows, as the primary depth signal**. Surfaces stack through translucency and a subtle `inset 0 0 12px rgba(255,255,255,0.05)` highlight, not through drop shadows. Shadows appear in two narrow cases: hover state on cards (to communicate "lifted in response") and on the active primary CTA (to communicate "this is the action"). Everywhere else, depth is achieved by tone, border, and blur.

### Shadow Vocabulary

All ambient shadows use `rgba(0,0,0,0.35)` (the system ambient value) as their base alpha. Documented as a sidecar color (`ambient-shadow`) so future passes don't drift the alpha.

- **Glass Drop** (`box-shadow: 0 8px 20px rgba(0,0,0,0.35)`): Hover state on `.glass-card` and stat cards. Communicates "lifted in response" — not a resting depth.
- **Orange CTA Glow** (`box-shadow: 0 8px 24px rgba(242,101,34,0.4)`): Hover state on the primary button. Communicates "this is the action you're hovering."
- **Orange Focus Ring** (`box-shadow: 0 0 0 3px rgba(242,101,34,0.15)`): On focused inputs. Communicates "this input is currently active."
- **Inset Glass Highlight** (`box-shadow: inset 0 0 12px rgba(255,255,255,0.05)`): Resting state of `.liquid-glass`. Communicates "this is a translucent layer above another."

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. Depth appears only as a response to state (hover, focus, active) or as the resting inset highlight on glass layers. A card does not cast a shadow when nothing is happening to it.

**The No-Drop-Shadow-At-Rest Rule.** No box-shadow on a surface that is not currently responding to user input. The orange CTA glow and the glass-card hover lift are the only ambient shadows in the system.

## Shapes

The form language is restrained: corners are either soft rectangles (`rounded-xl` 12px, `rounded-2xl` 16px) or full pills (`rounded-full` 9999px). Status pills use a tighter 6px corner so they read as chips, not as buttons. Inputs and inline icons match the card radius. Borders are 1px in `rgba(255,255,255,0.10)`; they communicate structure, not decoration.

Two utility radii are deliberately outside the main scale:

- **Scrollbar thumb** (3px): the only near-square radius in the system. Communicates that the scrollbar is a UI primitive, not a content surface.
- **Skeleton placeholder** (8px): sits between the chip radius (6px) and the input radius (12px). Reserved for the loading shimmer; never reused on a content surface.

- **Cards / Panels:** `rounded-2xl` (16px) outer, `rounded-xl` (12px) inner icons and tiles.
- **Buttons:** `rounded-xl` (12px) on inline CTAs; `rounded-full` (9999px) on the global `.btn-primary` / `.btn-secondary` / `.btn-ghost` utilities.
- **Inputs:** `rounded-xl` (12px).
- **Status pills:** `rounded-md` (6px) so they read as chips.
- **Bottom-nav items:** `rounded-xl` (12px).

## Components

### Buttons

- **Shape:** Rounded pill on the global utilities; soft rectangle (`rounded-xl`) on inline page-level CTAs like "Create Order" and "New Proposal."
- **Primary:** Signal Orange fill, white text, semibold label. Hover lifts and glows; press scales to `0.96`. Transitions: `background`, `transform`, `box-shadow` (200ms, `cubic-bezier(0.2,0,0,1)`).
- **Secondary:** Glass-tint fill, white text at 80%, medium label, 1px glass border. Hover deepens the tint and the border. Press scales to `0.96`. Transitions: `background`, `color`, `border-color`, `transform` (200ms, ease).
- **Ghost:** Transparent fill, muted text, no border. Hover reveals a 1px glass border and full-white text. Press scales to `0.96`. Used for tertiary actions like "Sign out" in the sidebar footer.

### Cards / Containers

- **Corner Style:** `rounded-2xl` (16px).
- **Background:** `rgba(255,255,255,0.02)` for stat cards, `rgba(255,255,255,0.04)` for list panels, both via the `.liquid-glass` utility. Backdrop-blur 8–12px.
- **Shadow Strategy:** Flat at rest. The `.glass-card` variant gains a glass drop on hover; the stat-card variant does not.
- **Border:** 1px `rgba(255,255,255,0.10)`. Hover deepens to `rgba(255,255,255,0.20)` on the `.glass-card` variant.
- **Internal Padding:** `1.25rem` (`p-5`) on stat cards and list rows; `1rem` (`px-4 py-3`) inside list items.

### Inputs / Fields

- **Style:** 1px glass border, glass-tint fill, `rounded-xl` (12px), `0.75rem 1rem` padding, body-size text in `0.875rem`.
- **Focus:** Border shifts to brand orange; outer ring appears at `box-shadow: 0 0 0 3px rgba(242,101,34,0.15)`. The focus ring is the focus indicator — never `outline: none` alone.
- **Placeholder:** `rgba(255,255,255,0.30)` — visible but never competing with filled text.

### Status Pills

- **Style:** `rounded-md` (6px), `0.125rem 0.625rem` padding, `text-[10px]` uppercase, semibold. Background is a 15% alpha version of the status color; text is the full status color; border is a 30% alpha version of the same color.
- **Mapping:** Confirmed → green, Pending → yellow, Overdue → red, Picked-up → orange (the brand color, used here as a status marker), Returned → gray, Cancelled → dark gray.

### Navigation

- **Desktop sidebar (≥ lg):** Fixed left column, `w-64`, `bg-[#111]` with `border-r border-white/5`. Logo at top, nav stack, user footer. Active item: brand-orange pill (`bg-brand-orange text-white shadow-lg shadow-brand-orange/20`). Hover: `bg-white/5`. Items use a 16px Lucide icon, semibold label, and a `ChevronRight` indicator when active.
- **Top bar:** Sticky, `h-16`, `bg-[#0a0a0a]/90 backdrop-blur-xl`. Holds the menu button (mobile), the logo (mobile), the notification bell, and the user avatar.
- **Mobile bottom-nav (< lg):** Fixed bottom, 5 items, `bg-[#111111]/90 backdrop-blur-xl`, safe-area honored. Active item: brand-orange text + scaled icon. Press: `scale(0.96)` on the link. Touch targets are sized to the 44×44 floor.

### Notification Popover

- **Trigger:** Bell icon button in the top bar, 36×36 hit area, glass-tint fill. Unread badge: brand orange, pulses when count > 0.
- **Container:** 320px wide (sm: 384px), `bg-[#121212]`, `rounded-2xl`, `shadow-2xl shadow-black/90`. Slides in from top-right with a 180ms `popoverIn` animation (transform-origin: top right).
- **List:** Each row is `p-3.5` with a 32×32 icon tile, the title (`text-xs font-semibold`), the message (`text-xs text-white/50 line-clamp-2`), and a relative timestamp.
- **Unread state:** `bg-brand-orange/10` fill + `border-l-2 border-l-brand-orange`.

## Do's and Don'ts

### Do:

- **Do** use `bg-brand-orange` / `text-brand-orange` for interactive accents, never the literal `bg-[#F26522]`. Tokens are the single source of truth.
- **Do** apply `.stat-value` (or `tabular-nums`) to any number that updates on refresh or sits in a list of numbers.
- **Do** set `transition-property` explicitly — `background, transform, box-shadow` for buttons; `background, border-color, transform, box-shadow` for cards. Never `transition: all`.
- **Do** use `ring-1 ring-white/10` for image outlines, not `border border-white/15`. The ring is pure white at low opacity and does not tint the surface.
- **Do** honor `prefers-reduced-motion` — wrap `animate-pulse`, `popoverIn`, and the mobile bottom-nav `scale-110` in a media query that disables them at the system level.
- **Do** keep touch targets ≥ 44×44px on mobile. Extend with a pseudo-element when the visible element is smaller.
- **Do** pair the brand orange with `scale(0.96)` on press, never smaller. Anything below `0.95` reads as exaggerated.
- **Do** use `cubic-bezier(0.2, 0, 0, 1)` as the default motion curve on every interactive transition.

### Don't:

- **Don't** use `transition: all`. Specify the exact properties.
- **Don't** use `scale-95` or any value below `0.96` on `:active`. Press feedback should feel tactile, not exaggerated.
- **Don't** use `bg-[#F26522]` or `text-[#F26522]` literals. The brand-orange token exists; use it.
- **Don't** use the gradient-text pattern (`background-clip: text` on a brand-orange gradient). The detector will flag it; the system uses solid color for text.
- **Don't** color a button, an icon, or a body label with a status color. Green / yellow / red / blue are reserved for state pills, banners, and the unread notification highlight.
- **Don't** introduce a second styling system (CSS modules, styled-components, vanilla-extract). Tailwind 4 utilities plus the `@theme` tokens and the named component classes in `globals.css` are the entire system.
- **Don't** animate on every re-render. Entrance animations are one-shot on mount; high-frequency interactions (hover, focus, keystroke) respond with ≤150ms color or opacity transitions, not motion.
- **Don't** use tinted outlines (`border-slate-200`, `border-zinc-300`) on images or glass surfaces. Outlines must be pure white at low opacity.
- **Don't** ship a shadow on a resting card. Depth is a response, not a state.
- **Don't** assume a light mode exists. Every token is a dark-mode token. Building light mode is out of scope and would require a separate design system.
