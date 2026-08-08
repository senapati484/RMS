# Lease360 — Project Context (Aug 2026)

> Drop-in context file for AI IDEs/agents. Covers architecture, business rules, auth, billing, AI, PWA, and conventions as of the latest commit on `main`.

## 1. What This Is

**Lease360** is an enterprise equipment rental & lease management platform (built for the Odoo Hackathon). It combines:
- **Customer storefront**: browse/rent equipment, cart, UPI-QR checkout, rental orders, eKYC (DigiLocker + Driving License)
- **Operator dashboard** (ADMIN/STAFF): products, orders & lifecycle (quotation → confirm → pickup → return → deposit settlement), maintenance tickets, reports/analytics, schedule, users, invoice/PDF, settings
- **AI hub** (operators only): chat assistant with live DB context, return-inspection deduction suggester, maintenance auto-triage, dynamic pricing, predictive maintenance, anti-fraud risk audit
- **SaaS billing**: 90-day free trial for operators, then ₹499/mo platform + ₹199/mo AI add-on (UPI simulated) — **portal users are always free**

## 2. Tech Stack & Critical Version Notes

| Area | Choice |
|---|---|
| Framework | **Next.js 16.3.0** (App Router, React 19.2) — ⚠️ READ `node_modules/next/dist/docs/` before writing Next code; this version has breaking changes vs training data |
| Styling | **Tailwind CSS v4** (PostCSS plugin, no tailwind.config; theme via CSS `@theme`) + custom `.liquid-glass`, `.safe-area-bottom`, `.scrollbar-none` utilities in `src/app/globals.css` |
| DB | **MongoDB Atlas** via Mongoose 8 (`src/lib/db.ts` → `connectDB()`); no ORM layers, models in `src/models/` |
| Auth | JWT (HS256, jose) in `auth-token` **cookie** (`src/lib/auth.ts`); middleware sets `x-user-id`/`x-user-role`/`x-user-email` headers |
| AI | **Groq** `llama-3.1-8b-instant` primary, **Gemini** `gemini-1.5-flash` fallback (`src/lib/ai.ts` for quick calls; `src/lib/ai/complete.ts` has OpenAI-SDK clients + mock fallbacks) |
| Email | Nodemailer SMTP (`src/lib/mailer.ts`) — order confirmations, invoices, quotation ready |
| Misc | `qrcode` (UPI QR), `jspdf` (invoice PDF), `recharts` (reports), `zustand`/`swr` installed, `sonner` toasts, `lucide-react` icons, `bcryptjs` |

### Path alias
`@/*` → `./src/*` (tsconfig). Import via `@/components`, `@/lib`, `@/models`, `@/context`.

## 3. Getting Started

```bash
npm install
# copy .env keys (section 4) into .env.local
npm run seed          # npx tsx scripts/seed.ts — 19 products + demo users
npm run dev           # localhost:3000
npm run typecheck     # tsc --noEmit — ALWAYS run after changes
npm run build         # next build — ALWAYS run after changes
```

## 4. Environment Variables (`.env.local` — gitignored, never commit)

```
MONGODB_URI=          # Atlas connection string (db: rms)
JWT_SECRET=
DIGILOCKER_ENCRYPTION_KEY=
GROQ_API_KEY=         # primary AI provider
GEMINI_API_KEY=       # AI fallback
SMTP_EMAIL=           # nodemailer sender (developersayan01@gmail.com)
SMTP_PASS=            # SMTP app password
NEXT_PUBLIC_UPI_ID=   # VPA, e.g. sayansenapati2544@okicici
NEXT_PUBLIC_UPI_NAME=Lease360 Rentals
NEXT_PUBLIC_PLATFORM_PRICE=499     # ₹/mo platform after trial
NEXT_PUBLIC_AI_ADDON_PRICE=199     # ₹/mo AI add-on
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 5. Auth & RBAC

- **Roles**: `ADMIN` (vendor/owner), `STAFF`, `PORTAL_USER` (customer). Stored in JWT + DB.
- **Registration** (`POST /api/auth/register`): role escalation requires secret codes — STAFF: `LEASE360-STAFF`/`staff123`; ADMIN: `LEASE360-ADMIN`/`admin123`/`LEASE360-VENDOR`. Plain registration = PORTAL_USER.
- **Middleware** (`src/middleware.ts`): public paths are `/`, `/login`, `/register`, `/forgot-password`, `/api/auth/*` (+ static assets). Everything else needs a valid token. `/admin*` + `/api/admin*` restricted to ADMIN/STAFF.
- **API guards** (`src/lib/api-helpers.ts`): `getUserFromRequest` (reads cookie), `requireAuth`, `requireAdmin` (ADMIN|STAFF), `apiOk`, `apiError`.

## 6. Models (`src/models/`)

| Model | Key fields |
|---|---|
| `User` | email, passwordHash (bcrypt), name, role, trustScore, isGovIdVerified, aadhaarMasked, digiLocker*, drivingLicense{status: NOT_SUBMITTED/PENDING_REVIEW/VERIFIED/REJECTED}, companyName, gstin |
| `Product` | slug, productType (camera/lens/audio/lighting/monitor/vehicle/support/furniture/event/other), itemKind (GOODS/SERVICE), sku, condition, totalStock, **availableStock** (decremented on order), **dailyRate**, costPrice, **salesPrice** (overrides dailyRate for billing), **baseDepositAmt + depositIsPercent**, variants[], specifications Map, isPublished |
| `Order` | orderNumber, userId, status: DRAFT→QUOTATION→CONFIRMED→PICKED_UP→RETURN_PENDING→RETURNED_ON_TIME/RETURNED_LATE/CANCELLED, items[], subTotal, depositAmount, totalAmount, rentalStart/End, lateFeeCharged, **payment{method:UPI,status:PAID/PENDING,amount,upiTxnRef,paidAt}**, **deposit{amount,status:HELD/PARTIALLY_REFUNDED/FULLY_REFUNDED/FORFEITED,transactions[]}**, pickupReturnLogs[], invoiceRef, fromQuotationId |
| `Quotation` | quoteNumber, userId (resolved to customer), items[], validUntil, status |
| `MaintenanceTicket` | ticketNumber, orderId, category, priority, status, estimatedCost, description |
| `Subscription` | userId (unique), plan: FREE_TRIAL/PLATFORM/PRO, status: TRIAL/ACTIVE/EXPIRED, trialStart/EndsAt, aiEnabled, payments[{tier,amount,method:UPI,paidAt}] |
| `Notification` | type enum: ORDER_CONFIRMED, PICKUP_REMINDER, RETURN_DUE, OVERDUE_ALERT, DEPOSIT_SETTLED, **TRUST_SCORE_UPDATE**, MAINTENANCE_UPDATE, QUOTATION_READY, QUOTATION_EXPIRING, SYSTEM; linkHref, relatedOrderId/TicketId |
| `Attribute`, `Pricelist` | product attribute definitions; tiered pricelist rules |

## 7. API Routes (`src/app/api/`)

**Auth**: `auth/login`, `auth/register`, `auth/logout`, `auth/me` (returns user + subscription summary), `auth/forgot-password`
**Catalog**: `products` (GET public filters q/category/page; POST admin), `products/[id]` (GET public; PATCH/DELETE admin), `attributes`, `pricelists`
**Orders**: `orders` (GET — PORTAL_USER sees own only; POST — create, server-side pricing, **requires platform access for ADMIN/STAFF, portal users free**), `orders/[id]` (GET/PATCH), `orders/[id]/status` (PATCH QUOTATION→CONFIRMED + stock reserve, admin), `orders/[id]/pickup`, `orders/[id]/request-return`, `orders/[id]/return` (late fee + damage deduction + deposit settlement + trust score), `orders/[id]/pay` (simulated UPI PAID)
**Quotations**: `quotations` (GET/POST; staff-created quotes owned by customer via customerEmail), `quotations/[id]/convert` (→ Order, owner/staff/admin)
**Checkout**: `checkout/confirm` (storefront: validates stock, KYC gate for vehicles, tiered pricing, records payment, sends email; **403 for ADMIN role — admins cannot place storefront orders**)
**Admin**: `admin/dashboard` (stats), `admin/users` (list + subscription plan attached)
**Users**: `users` (list/register — creates FREE_TRIAL subscription), `users/[id]`, `user/profile`, `user/driving-license`
**Maintenance**: `maintenance` (GET admin/staff; POST), `maintenance/[id]` (PATCH, stock release on RESOLVED)
**Notifications**: `notifications` (list + mark read)
**Subscriptions**: `subscriptions` (GET summary, POST simulated UPI activation)
**AI** (all ADMIN/STAFF; 403 for portal): `ai/assist` (chat w/ live DB context, requires AI access), `ai/return-inspection`, `ai/triage`, `ai/predictive-maintenance`, `ai/pricing-optimizer`, `ai/risk-audit`

## 8. Key Business Rules (source of truth)

1. **Pricing engine** (`src/lib/rental-pricing.ts`): `calculateItemRentalPrice(rate, days, qty)` — tiered discounts by duration: 1–2d 0%, 3–6d 10%, 7–13d 20%, 14–29d 30%, 30d+ 40%. **Effective rate = `product.salesPrice || product.dailyRate`**. All checkout paths (cart total, checkout/confirm, orders POST, payment deposit estimate) must use the same engine so displayed = charged.
2. **Deposit**: `depositIsPercent ? baseDepositAmt% of lineTotal : baseDepositAmt × qty`. Held on confirmation; deposit status on return derives from `lateFeeCharged + damageDeduction` (damage-only → PARTIALLY_REFUNDED, never FULLY_REFUNDED).
3. **Late fees** (`src/lib/fee-calculator.ts`): pure engine — grace period, HOURLY/DAILY/WEEKLY/MONTHLY units, fee cap; result drives deposit status + trust score.
4. **Vehicle rentals** require `drivingLicense.status === 'VERIFIED'` (KYC gate in both order-creation APIs).
5. **Subscription gating** (`src/lib/subscription.ts`): `requirePlatformAccess(userId, role)` + `requireAiAccess(userId, role)` — **skip/block PORTAL_USER appropriately (customers always free; AI is operator-only 403)**. Gates on: orders POST, checkout/confirm, all AI routes. Trial = 90 days, auto-rolls TRIAL→EXPIRED; platform ₹499/mo, AI add-on ₹199/mo, PRO = ₹698.
6. **Admin cannot place storefront orders**: `checkout/confirm` returns 403 for ADMIN; storefront UI hides cart/Add-to-Cart for admin. Admins CAN create orders via dashboard (orders/new, quotation convert) — that's the vendor workflow.
7. **Payments are simulated UPI** (`src/lib/upi.ts`): `buildUpiUri` builds `upi://pay?pa&pn&am&cu=INR&tn`; QR rendered client-side with `qrcode`; user taps "Pay via UPI" (deep-link opens in **new tab** — never navigate the page), enters optional UTR, confirms → order records payment PAID/PENDING. Production = replace with Razorpay/Cashfree webhook.
8. **Quotation lifecycle**: dashboard quotations/new → POST → QUOTATION order (or Quotation doc) → "Confirm Order" PATCH status (reserves stock) → pickup → return.
9. **Order numbers** (`src/lib/order-number.ts`): time+entropy derived (ORD-/QT-/MT- prefixes) — no counters, collision-safe across instances.
10. **Notifications** must use only enum types in `src/models/Notification.ts` (adding new types requires updating the enum — missing types crash with 500).

## 9. Frontend Structure (`src/app/`)

- **Public/landing** `page.tsx` (hero + live product cards from `/api/products?limit=50`), `products`, `products/[id]`, `cart` (Pay Now via UPI QR modal), `checkout/address` (persists `lease360_checkout` in sessionStorage), `checkout/payment` (QR + paid-gated confirm), `checkout/success`, `login`, `register`, `forgot-password`
- **Dashboard** `dashboard/layout.tsx`: sidebar (desktop) + bottom nav (mobile, top-5 items), role-gated nav items, `SubscriptionBanner` (hidden for PORTAL_USER), `PwaInstallButton`. Pages: home (stats), products (+new/[id]/edit/attributes/pricelists), orders (+new/[id]), schedule (calendar), quotations (+new), reports (recharts), settings (tabs — late-fee/password tabs are **simulated toasts, not functional**), maintenance (+new/[id]), ai, users (plan badges: PORTAL_USER shows FREE ACCESS), billing (plans + UPI QR, ADMIN/STAFF nav only), profile
- **Contexts** (`src/context/`): `AuthContext` (user/loading/logout, fetches `/api/auth/me`), `CartContext` (persisted cart, `addToCart` with rental dates, `cartTotal` via pricing engine)
- **Components** (`src/components/`): NotificationBell, SubscriptionBanner, PwaInstallButton (+ legacy PWAInstallPrompt), DigiLockerVerificationModal, DrivingLicenseModal, RentalCalendarPicker, CartHeaderIcon, HeroShader (GL shaders, dynamic), LondonClock

## 10. PWA

- `src/app/manifest.ts` → generated `/manifest.webmanifest` (name Lease360, standalone, theme #F26522, maskable + any icons, shortcuts to New Order/Quotation/Billing/AI). Old `public/manifest.json` is **deleted**.
- `public/sw.js`: precache shell, network-first navigations, cache-first `_next/static`, **bypasses `/api/*` and localhost** (so dev is never stale). Version via `CACHE_NAME`.
- Icons live in `public/icons/` (sourced from `public/appstore-images/`): android 48–512, maskable 192/512, iOS apple-touch 120/152/167/180.
- `PwaInstallButton`: registers SW, listens `beforeinstallprompt`, shows iOS "Add to Home Screen" hint; mounted in dashboard layout (bottom-right chip, hidden when standalone).

## 11. AI Details

- **Groq** model `llama-3.1-8b-instant`, temp 0.3, JSON mode via `response_format`; **Gemini** `gemini-1.5-flash` via REST (fallback).
- `src/lib/ai.ts`: `callGroq`, `callGemini`, `aiComplete`, `aiJson`. `src/lib/ai/complete.ts`: OpenAI-compatible clients + typed mock fallbacks per feature (used by older AI pages).
- `api/ai/assist` builds live context: overdue orders, returns due ≤3 days, low stock, open tickets, pending quotations, revenue, deposit risk.
- Feature list (dashboard/ai): AI Assistant chat, Return Inspection (suggests damage deduction from condition notes → pre-fills return modal), Maintenance Auto-Triage (category/priority/cost), Dynamic Pricing optimizer, Predictive Maintenance, Risk Audit.

## 12. Conventions & Gotchas

- **Never add code comments unless asked**; follow existing style (dark UI, `liquid-glass`, orange #F26522 accent).
- **Never commit `.env*`**. Only commit when asked. Push to `origin` (`https://github.com/senapati484/RMS.git`, branch `main`).
- Type-only imports where possible; interfaces per-file (no shared types package).
- Date handling: rental dates are ISO strings; `calculateRentalDays` ceil-day diff.
- Money: stored as numbers (₹), formatted `₹`/`Rs.` with `toLocaleString('en-IN')`.
- `npm run typecheck` + `npm run build` must pass before committing. SW/PWA behaviors verify best via `npm run build && npm start` (SW is disabled on localhost).
- Live DB is production Atlas — smoke tests create real data/emails; prefer unauthenticated curl checks or ask first.
- Known gap: dashboard Settings tabs (late-fee config, password change) are simulated (fake toasts), not functional.
