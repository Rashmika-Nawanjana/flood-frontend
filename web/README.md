# 🌊 FloodSense LK — Intelligence Portal

Real-time flood monitoring, AI-powered predictions, and emergency response management for Sri Lanka's Kelani River basin.

> **Built by Group A3** — Frontend Portal Team

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![License](https://img.shields.io/badge/License-Private-red)

---

## Table of Contents

- [Quick Start](#-quick-start)
- [Project Architecture](#-project-architecture)
- [File Structure](#-file-structure)
- [Design System](#-design-system)
- [Environment Variables](#-environment-variables)
- [API Integration](#-api-integration-group-a2)
- [Integration Guide: Mapbox (Member 3)](#-integration-guide-mapbox--member-3)
- [Integration Guide: Socket.IO (Member 4)](#-integration-guide-socketio--member-4)
- [Integration Guide: Keycloak SSO (Group A4)](#-integration-guide-keycloak-sso--group-a4)
- [Integration Guide: RBAC (Member 5)](#-integration-guide-rbac--member-5)
- [Pages Overview](#-pages-overview)
- [Deployment](#-deployment)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### Setup

```bash
# 1. Clone and enter the project
git clone <repo-url>
cd "Floodsense LK"

# 2. Install dependencies
npm install

# 3. Create local environment file
cp .env.local.example .env.local

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the portal should load with the dashboard.

### Build for Production

```bash
npm run build
npm start
```

---

## 🏗️ Project Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Browser (Client)                  │
├──────────────────────────────────────────────────────┤
│  Next.js 14 App Router                               │
│  ┌────────────────────────────────────────────────┐  │
│  │  (dashboard) Route Group                       │  │
│  │  ┌──────────┬─────────────────┬────────────┐   │  │
│  │  │ Sidebar  │   Page Content  │            │   │  │
│  │  │ (shared) │   (per-route)   │            │   │  │
│  │  └──────────┴─────────────────┴────────────┘   │  │
│  │  Topbar (shared) │ Footer (shared)             │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  lib/api.ts ──── REST ────► Group A2 Backend         │
│  SocketContext ── WS ─────► Member 4 Socket Server   │
│  RoleGate ────── Auth ────► Group A4 Keycloak        │
│  MapPlaceholder ─ Map ────► Member 3 Mapbox GL       │
└──────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | CSS Modules + CSS Custom Properties |
| Icons | Lucide React |
| Charts | Recharts |
| Auth | next-auth (Keycloak provider) |
| Real-time | socket.io-client |
| Maps | Mapbox GL JS (placeholder) |
| Deployment | Vercel |

---

## 📂 File Structure

```
src/
├── app/
│   ├── globals.css                 ← Design system tokens (colors, fonts, spacing)
│   ├── layout.tsx                  ← Root layout (Google Fonts, metadata)
│   ├── not-found.tsx               ← Custom 404 page
│   ├── login/
│   │   ├── page.tsx                ← Login page (Keycloak SSO + dev bypass)
│   │   └── page.module.css
│   └── (dashboard)/                ← Route group — shared layout shell
│       ├── layout.tsx              ← Wraps ALL dashboard pages with Sidebar/Topbar/Footer
│       ├── layout.module.css
│       ├── page.tsx                ← Dashboard home (/)
│       ├── page.module.css
│       ├── live-map/               ← /live-map
│       ├── alerts/                 ← /alerts
│       ├── sensors/                ← /sensors
│       ├── predictions/            ← /predictions
│       ├── evacuation/             ← /evacuation
│       ├── anomalies/              ← /anomalies
│       ├── zones/                  ← /zones
│       └── shelters/               ← /shelters
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx             ← Navigation sidebar (single source of truth)
│   │   ├── Topbar.tsx              ← Top bar with search, notifications, avatar
│   │   └── Footer.tsx              ← Status footer
│   ├── ui/
│   │   ├── StatCard.tsx            ← KPI stat cards with colored accent strip
│   │   ├── RiskBadge.tsx           ← Risk level pills (LOW → CRITICAL)
│   │   ├── ProgressBar.tsx         ← Capacity / percentage bars
│   │   ├── Modal.tsx               ← Glassmorphic overlay modals
│   │   └── FilterBar.tsx           ← Dropdown filter strips
│   ├── maps/
│   │   └── MapPlaceholder.tsx      ← ⭐ MEMBER 3: Replace this with Mapbox
│   └── auth/
│       └── RoleGate.tsx            ← ⭐ MEMBER 5: Extend with Keycloak roles
│
├── context/
│   └── SocketContext.tsx           ← ⭐ MEMBER 4: WebSocket provider
│
└── lib/
    ├── api.ts                      ← Centralized REST client (18 endpoints)
    ├── types.ts                    ← All TypeScript interfaces
    └── constants.ts                ← Nav items, risk colors, status labels
```

> **Key design decision:** The `(dashboard)` route group in Next.js wraps all inner pages with a single `layout.tsx` that renders `<Sidebar />`, `<Topbar />`, and `<Footer />`. This guarantees every page has an identical shell — layout inconsistencies are structurally impossible.

---

## 🎨 Design System

The **"Tectonic Sentinel"** design system is defined entirely in `src/app/globals.css` using CSS custom properties.

### Colors

| Token | Value | Purpose |
|-------|-------|---------|
| `--bg-root` | `#0b1326` | Page background |
| `--bg-surface` | `#131b2e` | Card surfaces |
| `--bg-surface-high` | `#1a2540` | Elevated surfaces, table headers |
| `--primary` | `#3B82F6` | Buttons, links, active states |
| `--text-primary` | `#dbe2fd` | Main text |
| `--text-muted` | `#8c909f` | Labels, captions |

### Risk Semantic Colors

| Token | Color | Level |
|-------|-------|-------|
| `--risk-low` | `#22C55E` | Low / Safe |
| `--risk-watch` | `#EAB308` | Watch |
| `--risk-warning` | `#F97316` | Warning |
| `--risk-critical` | `#EF4444` | High / Critical |

### Typography

| Font | Variable | Usage |
|------|----------|-------|
| Inter | `--font-inter` | Body text, UI labels |
| Space Grotesk | `--font-space-grotesk` | Section headers, table headers |
| JetBrains Mono | `--font-jetbrains-mono` | Data values, IDs, timestamps |

### Spacing & Shape

| Token | Value |
|-------|-------|
| `--radius` | `10px` |
| `--radius-pill` | `999px` |
| `--sidebar-width` | `260px` |
| `--topbar-height` | `64px` |

---

## 🔐 Environment Variables

Copy `.env.local.example` to `.env.local` and fill in as needed:

```bash
# API Gateway (Group A2 backend)
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Socket.IO Server (Member 4)
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_WS_PATH=/ws/live
NEXT_PUBLIC_WS_NAMESPACE=/public

# Clerk auth (frontend)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_REPLACE_WITH_YOUR_KEY
CLERK_SECRET_KEY=sk_test_REPLACE_WITH_YOUR_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Optional if you want to route auth through a public tunnel
# NEXT_PUBLIC_CLERK_PROXY_URL=

# Mapbox (Member 3)
NEXT_PUBLIC_MAPBOX_TOKEN=
```

For local development, `npm run dev` now starts the Next.js app and the ngrok tunnel together. The tunnel is only for Clerk webhooks and other public callbacks; the app itself still runs on `localhost`.

The backend already includes an ngrok config at [flood-backend/ngrok.yml](../../flood-backend/ngrok.yml) that exposes the webhook endpoint. Point the Clerk dashboard webhook to:

`https://revenge-crank-bobcat.ngrok-free.dev/v1/webhooks/clerk`

Backend Clerk verification still needs these env vars:

```bash
CLERK_JWKS_URL=https://useful-hen-13.clerk.accounts.dev/.well-known/jwks.json
CLERK_ISSUER=https://useful-hen-13.clerk.accounts.dev
CLERK_WEBHOOK_SECRET=
```

`CLERK_WEBHOOK_SECRET` is only required if you validate the webhook signature in the backend.

---

## 📡 API Integration (Group A2)

All REST calls go through `src/lib/api.ts`. The client auto-injects Bearer tokens from the next-auth session.

### Endpoint Map

```typescript
import { api } from '@/lib/api';

// ---- Sensors (6 endpoints) ----
await api.sensors.list();                          // GET  /sensors
await api.sensors.get('SEN-001');                  // GET  /sensors/:id
await api.sensors.history('SEN-001', { from, to }); // GET  /sensors/:id/history
await api.sensors.create({ ... });                 // POST /admin/sensors
await api.sensors.update('SEN-001', { ... });      // PATCH /admin/sensors/:id
await api.sensors.deactivate('SEN-001');            // DELETE /admin/sensors/:id

// ---- Zones (5 endpoints) ----
await api.zones.list();                            // GET  /zones
await api.zones.get('ZONE-K1');                    // GET  /zones/:id
await api.zones.create({ ... });                   // POST /admin/zones
await api.zones.update('ZONE-K1', { ... });        // PATCH /admin/zones/:id
await api.zones.deactivate('ZONE-K1');             // DELETE /admin/zones/:id

// ---- Shelters (3 endpoints) ----
await api.shelters.create({ ... });                // POST /admin/shelters
await api.shelters.update('SHL-001', { ... });     // PATCH /admin/shelters/:id
await api.shelters.remove('SHL-001');              // DELETE /admin/shelters/:id

// ---- Alerts (1 endpoint) ----
await api.alerts.list({ severity: 'HIGH', status: 'ACTIVE' }); // GET /alerts

// ---- Predictions (1 endpoint) ----
await api.predictions.list({ zone_id: 'ZONE-K1' }); // GET /predictions

// ---- Anomalies (2 endpoints) ----
await api.anomalies.list({ status: 'UNRESOLVED' }); // GET /anomalies
await api.anomalies.resolve('ANO-001', {             // PATCH /admin/anomalies/:id
  status: 'RESOLVED',
  resolution_note: 'Fixed',
  resolved_by: 'ADMIN'
});
```

### Response Format

All API responses follow this shape (see `src/lib/types.ts`):

```json
{
  "status": "success",
  "timestamp": "2024-01-15T10:30:00Z",
  "count": 5,
  "data": [ ... ]
}
```

---

## 🗺️ Integration Guide: Mapbox — Member 3

### What exists now

`src/components/maps/MapPlaceholder.tsx` is a placeholder with a floating pin animation. It accepts a props interface that your real map component should also accept.

### Steps to integrate

1. **Install Mapbox GL JS**

   ```bash
   npm install mapbox-gl
   npm install --save-dev @types/mapbox-gl
   ```

2. **Set your token** in `.env.local`

   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
   ```

3. **Create your map component** — replace `MapPlaceholder.tsx` or create a new file alongside it:

   ```tsx
   // src/components/maps/FloodMap.tsx
   'use client';

   import { useEffect, useRef } from 'react';
   import mapboxgl from 'mapbox-gl';
   import 'mapbox-gl/dist/mapbox-gl.css';
   import type { Zone, Sensor, Shelter } from '@/lib/types';

   mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

   interface FloodMapProps {
     height?: string;
     zones?: Zone[];
     sensors?: Sensor[];
     shelters?: Shelter[];
     selectedZoneId?: string;
     showEvacuationRoutes?: boolean;
     onZoneClick?: (zoneId: string) => void;
     onSensorClick?: (sensorId: string) => void;
   }

   export default function FloodMap({
     height = '500px',
     zones = [],
     sensors = [],
     selectedZoneId,
     onZoneClick,
     onSensorClick,
   }: FloodMapProps) {
     const mapContainer = useRef<HTMLDivElement>(null);
     const map = useRef<mapboxgl.Map | null>(null);

     useEffect(() => {
       if (!mapContainer.current) return;

       map.current = new mapboxgl.Map({
         container: mapContainer.current,
         style: 'mapbox://styles/mapbox/dark-v11', // matches our dark theme
         center: [80.5925, 7.2713], // Kelani River Basin
         zoom: 10,
       });

       return () => { map.current?.remove(); };
     }, []);

     // Add zone polygons, sensor markers, etc. here
     // Use zone.geometry (GeoJSON Polygon) for zone layers
     // Use sensor.location.lat/lng for markers

     return <div ref={mapContainer} style={{ height, borderRadius: '10px' }} />;
   }
   ```

4. **Update pages that use the map** — the following pages import `MapPlaceholder`:
   - `src/app/(dashboard)/live-map/page.tsx` — Main map page
   - `src/app/(dashboard)/evacuation/page.tsx` — Evacuation routes overlay

   Simply change the import:
   ```tsx
   // Before
   import MapPlaceholder from '@/components/maps/MapPlaceholder';

   // After
   import FloodMap from '@/components/maps/FloodMap';
   ```

### Data you'll receive

| Data | Source | Type |
|------|--------|------|
| Zone polygons | `api.zones.list()` | `Zone[]` — each has `.geometry` (GeoJSON Polygon) |
| Sensor pins | `api.sensors.list()` | `Sensor[]` — each has `.location.lat/lng` |
| Shelter pins | nested in zones | `Shelter[]` — each has `.lat/.lng` |
| Risk colors | `zone.color_code` | Hex string for polygon fill |

### Real-time updates (after Member 4 integrates Socket.IO)

```tsx
import { useSocket } from '@/context/SocketContext';

// Inside your map component:
useSocket<SensorUpdateEvent>('sensor:update', (data) => {
  // Update sensor marker position or reading on the map
});

useSocket<ZoneRiskUpdateEvent>('zone:risk_update', (data) => {
  // Update zone polygon color based on new risk level
});
```

---

## 🔌 Integration Guide: Socket.IO — Member 4

### What exists now

`src/context/SocketContext.tsx` provides:
- `<SocketProvider>` — wraps the app, auto-connects when `NEXT_PUBLIC_WS_URL` is set
- `useSocket(event, handler)` — hook to subscribe to events from any component

### Steps to integrate

1. **Set your WebSocket server URL** in `.env.local`:

   ```
   NEXT_PUBLIC_WS_URL=ws://your-server:3001
   NEXT_PUBLIC_WS_PATH=/ws/live
   NEXT_PUBLIC_WS_NAMESPACE=/public
   ```

   That's it — the connection is now configured to use the backend Socket.IO path and public namespace automatically.

2. **The provider is already wired** in `src/app/layout.tsx`. No setup needed.

3. **Subscribe to events** in any page component:

   ```tsx
   import { useSocket } from '@/context/SocketContext';
   import type { SensorUpdateEvent } from '@/lib/types';

   export default function SomePage() {
     useSocket<SensorUpdateEvent>('sensor:update', (data) => {
       console.log('Sensor updated:', data.sensor_id, data.current_reading);
       // Update local state, trigger re-render, etc.
     });
   }
   ```

### Event Types (from Group A2 spec)

All event payload types are pre-defined in `src/lib/types.ts`:

| Event Name | Type Interface | Description |
|------------|---------------|-------------|
| `sensor:update` | `SensorUpdateEvent` | Periodic sensor telemetry (water level, rainfall, etc.) |
| `zone:risk_update` | `ZoneRiskUpdateEvent` | Zone risk level changed |
| `prediction:new` | `PredictionNewEvent` | New AI flood prediction generated |
| `alert:new` | `AlertNewEvent` | New emergency alert triggered |
| `alert:resolved` | `AlertResolvedEvent` | Alert has been resolved |
| `sensor:offline` | `SensorOfflineEvent` | Sensor went offline |
| `anomaly:new` | `AnomalyNewEvent` | New anomaly detected |

### Connection config (in `SocketContext.tsx`)

```typescript
const socket = io(wsUrl, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
});
```

If your server needs authentication, add the `auth` option:

```typescript
const socket = io(wsUrl, {
  transports: ['websocket'],
  auth: { token: await getAuthToken() },
});
```

---

## 🔑 Integration Guide: Keycloak SSO — Group A4

### What exists now

- Login page at `/login` with a "Sign in with FloodSense SSO" button (currently non-functional)
- **Dev bypass mode**: Admin/Officer role selector that stores the role in `localStorage`
- `next-auth` is installed and ready for configuration

### Steps to integrate

1. **Provide these values** from your Keycloak realm:

   ```
   KEYCLOAK_ISSUER=https://your-keycloak-server/realms/floodsense
   KEYCLOAK_CLIENT_ID=floodsense-portal
   KEYCLOAK_CLIENT_SECRET=your-client-secret
   ```

2. **Create the next-auth route handler** at `src/app/api/auth/[...nextauth]/route.ts`:

   ```typescript
   import NextAuth from 'next-auth';
   import KeycloakProvider from 'next-auth/providers/keycloak';

   const handler = NextAuth({
     providers: [
       KeycloakProvider({
         clientId: process.env.KEYCLOAK_CLIENT_ID!,
         clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
         issuer: process.env.KEYCLOAK_ISSUER!,
       }),
     ],
     callbacks: {
       async jwt({ token, account }) {
         if (account) {
           token.accessToken = account.access_token;
           token.role = account.role || 'officer'; // map from Keycloak roles
         }
         return token;
       },
       async session({ session, token }) {
         session.accessToken = token.accessToken;
         session.user.role = token.role;
         return session;
       },
     },
   });

   export { handler as GET, handler as POST };
   ```

3. **Update the login page** — the SSO button in `src/app/login/page.tsx` should call:

   ```typescript
   import { signIn } from 'next-auth/react';
   
   // On SSO button click:
   signIn('keycloak', { callbackUrl: '/' });
   ```

4. **Update `RoleGate.tsx`** to read from the real session:

   ```typescript
   import { useSession } from 'next-auth/react';

   function useCurrentRole(): UserRole {
     const { data: session } = useSession();
     return (session?.user?.role as UserRole) || 'officer';
   }
   ```

### Keycloak Roles

| Role | Access Level |
|------|-------------|
| `admin` | Full system access — CRUD operations on sensors, zones, shelters |
| `officer` | Monitoring & response — read-only dashboards, alert acknowledgment |

> `public` role users do not visit the web portal (mobile app only).

---

## 🛡️ Integration Guide: RBAC — Member 5

### What exists now

`src/components/auth/RoleGate.tsx` — a wrapper component that conditionally renders children based on user role.

### Current usage across the app

```tsx
import RoleGate from '@/components/auth/RoleGate';

// Only admins see the "Create Alert" button
<RoleGate allowed={['admin']}>
  <button>Create Alert</button>
</RoleGate>

// Both roles see this content
<RoleGate allowed={['admin', 'officer']}>
  <div>Resolution actions</div>
</RoleGate>
```

### Pages with role-gated content

| Page | Gated Element | Allowed Roles |
|------|--------------|---------------|
| `/alerts` | "Create Alert" button | `admin` |
| `/sensors` | "Add Sensor" button | `admin` |
| `/zones` | "Create Zone" button | `admin` |
| `/shelters` | "Add New Shelter" button, row actions | `admin` |
| `/anomalies` | "Mark as Resolved", "False Alarm" buttons | `admin`, `officer` |
| `/evacuation` | "New Evacuation Order" button | `admin` |

### How to extend

To add more granular permissions (e.g., per-zone access):

```tsx
// Extend the RoleGate props:
interface RoleGateProps {
  children: React.ReactNode;
  allowed: UserRole[];
  requiredPermissions?: string[]; // e.g., ['zones:write', 'alerts:create']
  fallback?: React.ReactNode;
}
```

---

## 📄 Pages Overview

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Keycloak SSO + dev bypass role selector |
| `/` | Dashboard | KPI overview, recent alerts, predictions, system health |
| `/live-map` | Live Flood Map | Interactive map with zone polygons + sensor markers |
| `/alerts` | Alert Management | Filterable alert table with create/acknowledge actions |
| `/sensors` | Sensor Network | Sensor grid with status, battery, and detail modals |
| `/predictions` | AI Predictions | ML prediction table with risk factors breakdown |
| `/evacuation` | Evacuation Routes | Active evacuation orders and route management |
| `/anomalies` | Anomaly Detection | Expandable anomaly table with resolution workflow |
| `/zones` | Zone Management | Split-view zone cards with detail panel |
| `/shelters` | Shelter Management | Shelter CRUD table with capacity progress bars |

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard
4. Deploy — Vercel auto-detects Next.js

### Environment variables needed for production

```
NEXT_PUBLIC_API_URL=https://api.floodsense.lk/api/v1
NEXT_PUBLIC_WS_URL=wss://ws.floodsense.lk
NEXT_PUBLIC_WS_PATH=/ws/live
NEXT_PUBLIC_WS_NAMESPACE=/public
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxxx
KEYCLOAK_ISSUER=https://auth.floodsense.lk/realms/floodsense
KEYCLOAK_CLIENT_ID=floodsense-portal
KEYCLOAK_CLIENT_SECRET=xxxxx
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://portal.floodsense.lk
```

---

## 🤝 Team Responsibilities

| Member/Group | Responsibility | Key Files to Modify |
|-------------|---------------|-------------------|
| **Group A2** | Backend API | Update `NEXT_PUBLIC_API_URL` in `.env.local` |
| **Member 3** | Mapbox GL | Replace `MapPlaceholder.tsx`, update live-map & evacuation pages |
| **Member 4** | Socket.IO | Set `NEXT_PUBLIC_WS_URL`, optionally extend `SocketContext.tsx` |
| **Group A4** | Keycloak SSO | Create next-auth route handler, provide Keycloak credentials |
| **Member 5** | RBAC | Extend `RoleGate.tsx` with Keycloak session + fine permissions |

---

*Built with ❤️ for Sri Lanka's disaster resilience infrastructure*
