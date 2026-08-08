# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16.3 (App Router) + React 19 + Tailwind CSS 4 + TypeScript 5. MongoDB Atlas via Mongoose. JWT cookie auth. PWA installable on iOS/Android/Desktop. Lucide icons, Sonner toasts, SWR, Zustand, Recharts. No framer-motion — animations are pure CSS keyframes and Tailwind transition utilities. AI assistant backed by Groq Llama 3.3 70B with Google Gemini 1.5 Pro fallback; transactional email via Nodemailer + Gmail SMTP.

## Users

Two roles with equal weight. Both flow through the same authenticated app shell.

- **Customers (role: `PORTAL_USER`)** — Renters of high-value equipment (cameras, gimbals, lighting, industrial tools). They arrive to browse the catalog, accept or request a quotation, place an order, track the deposit, and check return status. They log in, act, and leave; the customer portal must make their handful of interactions effortless and trustworthy.
- **Staff & Admins (roles: `STAFF`, `ADMIN`)** — Operators who live in the dashboard all day: pickup dispatch, return inspection with condition scoring, deposit reconciliation, maintenance ticket triage, and revenue analytics. They scan, react, and reconcile. Operate-mode polish (consistent density, fast list comprehension, no surprise motion) matters more here than expression.

The login, register, and `/dashboard` shell serve both audiences; surface-level copy and components branch on `user.role`.

## Product Purpose

Unify the full equipment-rental lifecycle — catalog, quotation, order, dispatch, return, deposit settlement, maintenance, and AI-assisted operations — into a single interface. The product's job is to remove the manual reconciliation steps that fragment rental operations today: deposit accounting is automated across `HELD` / `PARTIALLY_REFUNDED` / `FULLY_REFUNDED` / `FORFEITED`; late fees apply from a configurable grace period; condition scoring on return automatically isolates damaged stock into maintenance; live transit checkpoints and AI queries over MongoDB state are first-class.

Success means a single staff member can run a 50-order day without leaving the app, and a customer can resolve a deposit question from their phone in under 30 seconds.

## Positioning

A demo entry for the **Odoo Hackathon 2026**. The differentiator on the judging rubric is depth: not just orders and products, but a real deposit ledger with multi-transaction history, real condition-based maintenance isolation, real transit checkpoints, and a working AI co-pilot over the live database. The interface language — liquid-glass dark theme, brand orange `#F26522` — supports the demo by signaling polish, not by claiming market share.

Treating this as a real production product is out of scope for now; future work may revisit that framing.

## Operating Context

- **Single-tenant per deployment** — the seed script provisions one admin, one staff, and one customer; multi-tenancy is not in scope.
- **PWA installable** — `public/manifest.json` declares standalone display. Mobile bottom-nav bar replaces the desktop sidebar below the `lg` breakpoint; safe-area insets are honored.
- **Authenticated routes** — middleware redirects unauthenticated requests to `/login`. Static image assets are excluded from the auth redirect.
- **Roles drive visibility** — `ADMIN` and `STAFF` see all dashboards; `PORTAL_USER` is scoped to their own orders, quotations, and notifications.
- **Currency in INR** — the dashboard renders `₹` with locale-grouped numerals; this is the only currency.
- **Demo seed data** — `npx tsx scripts/seed.ts` populates the database. The seeded admin (`admin@lease360.ai` / `admin123`), staff (`staff@lease360.ai` / `staff123`), and customer (`user@lease360.ai` / `user123`) are the canonical test accounts.

## Capabilities and Constraints

**Capabilities (confirmed in code)**
- Authentication: register, login, session via JWT cookie, `/api/auth/me`.
- Orders: create, list, fetch, patch status, mark pickup, process return with condition scoring (`EXCELLENT` / `GOOD` / `DAMAGED` / `MAJOR_DAMAGE`).
- Quotations: create, list, fetch, convert-to-order with inventory re-check.
- Products: catalog search, product management, low-stock flag.
- Maintenance: open, list, resolve; auto-created from `DAMAGED` returns.
- Notifications: per-user list, mark-read, polled every 30 seconds; unread badge in the global bell.
- AI assistant: `/api/ai/query` runs natural-language over the live MongoDB collections.
- Email: HTML templates for order confirmation, pickup, deposit settlement, urgent maintenance.
- Trust score: dynamic reward/penalty system on return; admin adjustment API; tier badges.

**Constraints**
- Next.js 16 conventions may differ from prior training data — `node_modules/next/dist/docs/` is the local source of truth.
- No framer-motion or motion library; new motion must be implemented with CSS keyframes or Tailwind transition utilities.
- Dark theme only — no light mode token set exists; the design system is a single-theme system.
- No i18n pipeline — copy is English only, INR currency is hard-coded.
- Lucide React is pinned to a 1.x line; stroke-width defaults to 1.5px unless overridden per-instance.

**Open (deliberately undecided)**
- Multi-tenancy and SSO.
- Real payment processor integration (deposits and late fees are ledger entries, not charges).
- Mobile native apps (current PWA is installable, not native).
- Internationalization beyond English / INR.

## Brand Commitments

- **Name**: Lease360. The logo lives at `public/logo.png` and is rendered at every surface.
- **Voice**: Operational, plain-spoken, dashboard-grade. No marketing copy on the authenticated surfaces.
- **Palette**: Brand orange `#F26522` (tokenized as `--color-brand-orange` in `globals.css`), dark surfaces (`#0A0A0A` / `#111`), translucent glass layers. Light mode is not part of the identity.
- **Typeface**: Inter via `next/font/google`.
- **Visual language**: Liquid glass — translucent surfaces, backdrop blur, subtle inset highlights. Bound to the design system captured in `globals.css`; future work should not introduce a second styling system.

## Evidence on Hand

- `README.md` — full product description, ER diagram, API reference, demo logins.
- `PWA_GUIDE.md` — PWA install/manifest details.
- `src/models/` — Mongoose schemas (`User`, `Product`, `Order`, `Quotation`, `MaintenanceTicket`, `Notification`, `Catalog`, `Operations`).
- `src/app/api/` — route handlers enumerated in the README's API table.
- `public/logo.png`, `public/manifest.json` — branding and PWA assets.
- `src/app/globals.css` — the design system: tokens (brand colors, dark scale, glass white), shadows, button/glass utilities, status badges, keyframes.

**Absent (must not fabricate)**
- Real customer testimonials, case studies, or press.
- Production load numbers or SLAs.
- Multi-tenant deployment evidence.

## Product Principles

1. **Operate first, decorate second** — staff spend hours in this app; every list, badge, and transition must serve scanability and consistency.
2. **Deposit truth is the spine** — the deposit ledger, late-fee engine, and condition scoring are the product's reason to exist; the UI must never obscure them.
3. **One source of visual truth** — Tailwind utilities, the `@theme` tokens in `globals.css`, and the shared components are the entire design system. Inline literals and ad-hoc styles are a defect.
4. **Mobile is a peer** — the mobile bottom-nav, touch targets, and safe-area handling are first-class, not afterthoughts. PWA install is a feature.
5. **No motion that earns nothing** — every animation must communicate a state change; decoration-as-motion is rejected.

## Accessibility & Inclusion

**Standard:** WCAG 2.1 AA.

**Implications for future design work**
- Visible focus indicators on every focusable element (the current `outline: none` patterns must be replaced or paired with `:focus-visible` rings).
- Text contrast ≥ 4.5:1 against the glass surfaces — the current `white/30`–`white/50` over translucent dark layers needs verification.
- Keyboard reachability for the sidebar, mobile bottom nav, notification popover, and any modal.
- `prefers-reduced-motion` must be respected — disable the `animate-pulse` on the unread badge, the `fadeInUp` / `popoverIn` animations, and the `scale-110` icon motion.
- Touch targets ≥ 44×44px on mobile; current bottom-nav pills and the notification bell need a measurement pass.
- Screen-reader labels on icon-only buttons (the notification bell has `aria-label="Notifications"`; the menu button does not).
