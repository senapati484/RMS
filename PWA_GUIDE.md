# 📱 Lease360 Progressive Web App (PWA) & Mobile Guide

Welcome to the **Lease360 PWA Architecture Guide**. This document outlines how Lease360 functions as a Progressive Web Application (PWA) on mobile devices, tablets, and desktop browsers, and provides step-by-step instructions for installation and offline management.

---

## 🌟 1. Overview of PWA Features

Lease360 is engineered touch-first with PWA capabilities built directly into Next.js 14 App Router:

| Feature | Description |
|---|---|
| **Standalone Display** | Launches in its own frameless window (no browser URL bar or navigation controls). |
| **Mobile Bottom Navigation** | Native-feel bottom tab bar for quick switching between Dashboard, Orders, Products, Quotations, and AI. |
| **Viewport Fit Cover** | Supports modern edge-to-edge mobile screens with safe-area notch and home bar insets (`safe-area-bottom`). |
| **Touch Feedback** | Zero tap highlight delay (`-webkit-tap-highlight-color: transparent`) with tactile button scaling (`active:scale-[0.98]`). |
| **Dynamic Responsive Fallbacks** | Data tables automatically transition to touch-friendly card stacks on mobile devices. |
| **Offline Resilience** | Built-in manifest configuration and caching headers for offline static asset fallback. |

---

## 📲 2. How to Install Lease360 as an App

### iOS (iPhone & iPad Safari)
1. Open **Safari** on your iPhone/iPad and navigate to your deployed URL (e.g. `https://your-domain.vercel.app` or `http://localhost:3000`).
2. Tap the **Share** button (the square icon with an up arrow at the bottom of the screen).
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add** in the top-right corner.
5. **Lease360** will now appear on your home screen with its custom app icon and launch as a standalone application.

### Android (Chrome & Edge)
1. Open **Google Chrome** on your Android device and navigate to your deployed URL.
2. You will see an automatic prompt at the bottom: **"Add Lease360 to Home Screen"** or **"Install app"**.
3. If no prompt appears, tap the **Three Dots Menu (⋮)** in the top-right corner.
4. Tap **"Install app"** or **"Add to Home screen"**.
5. Tap **Install** to confirm.

### Desktop (Chrome & Mac Safari)
1. In Google Chrome, click the **Install Lease360** icon located on the right side of the URL bar.
2. Click **Install** to open Lease360 as a dedicated macOS/Windows desktop window.

---

## ⚙️ 3. PWA Architecture Details

### Manifest Configuration (`public/manifest.json`)
The Web App Manifest defines application credentials and appearance:

```json
{
  "name": "Lease360 — Equipment Rental & Security Engine",
  "short_name": "Lease360",
  "description": "Enterprise Equipment Rental & Lease Management System",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0A0A0A",
  "theme_color": "#F26522",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ]
}
```

### Layout Metadata (`src/app/layout.tsx`)
Configured with Next.js `Viewport` and `Metadata` APIs:

```typescript
export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Lease360',
  },
}
```

---

## 🎨 4. Mobile & PWA UX Best Practices Implemented

1. **Safe Area Insets (`src/app/globals.css`)**:
   ```css
   .safe-area-bottom {
     padding-bottom: env(safe-area-inset-bottom, 1rem);
   }
   ```
2. **Touch Target Size**:
   All buttons and tab targets have a minimum height of `44px` for effortless thumb navigation.
3. **Optimized Card Stacks**:
   Orders and inventory lists switch from multi-column tables to single-column interactive cards on `< 768px` screens.

---

## 🚀 5. Future Roadmap & Web Push Notifications

For production deployment with background push notifications:
- **Service Worker (`sw.js`)**: Integrate `@ducanh2912/next-pwa` or Serwist for full offline asset precaching.
- **Web Push API**: Send push alerts directly to iOS & Android lock screens for overdue rental reminders and return inspection updates.
