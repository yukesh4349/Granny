# 👵 Granny Web Portal (Frontend Application)

A modern, accessible, and dignified Web Portal for **Granny & Grandpa (தாத்தா & பாட்டி)** built with React 18, Vite, TypeScript, and Vanilla CSS.

---

## 🧭 Application Routing & Architecture

The application uses standard **React Router v6** declarative routing with role-based `ProtectedRoute` guards and a shared `AppContext` provider.

### 🌐 Complete Route Map

| Path | Component | Protected | Allowed Roles | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `LandingPage` | ❌ No | Public | Hero showcase, live feature highlights & instant demo login |
| `/login` | `AuthPage (mode: login)` | ❌ No | Public | User sign-in with phone, email, or username |
| `/register` | `AuthPage (mode: register)` | ❌ No | Public | New account registration for Elders and Caregivers |
| `/auth` | `AuthPage` | ❌ No | Public | Auth gateway |
| `/home` | `HomePage` | ✅ Yes | `ELDER` | Elder daily dashboard with voice companion & quick sparks |
| `/companion` | `CompanionPage` | ✅ Yes | `ELDER` | Asha AI Voice Companion chat with real-time TTS & memory extraction |
| `/games` | `GamesPage` | ✅ Yes | `ELDER` | 20 AI Traditional Games library with category filters |
| `/games/play` | `GamePlayPage` | ✅ Yes | `ELDER` | Active game arena with dynamic Groq question generation |
| `/games/:gameKey` | `GamePlayPage` | ✅ Yes | `ELDER` | Direct game launcher |
| `/family` | `FamilyPage` | ✅ Yes | `ELDER` | 1-tap family circle calling with emergency SOS contact support |
| `/health` | `HealthPage` | ✅ Yes | `ELDER` | Daily medication schedule, water reminders & alarm confirmations |
| `/memory` | `MemoryPage` | ✅ Yes | `ELDER` | Family photo album & 10 Traditional Game video memory reels |
| `/theatre` | `TheatrePage` | ✅ Yes | `ELDER` | Life-Story Memory Theatre interactive reminiscence |
| `/settings` | `SettingsPage` | ✅ Yes | `ELDER` / `CAREGIVER` | Language toggle, contrast, audio chime test & 6-digit link code |
| `/dashboard` | `DashboardPage` | ✅ Yes | `CAREGIVER` | Caretaker cognitive health overview, safety feed & daily limits |
| `/caretaker/alarms` | `AlarmsPage` | ✅ Yes | `CAREGIVER` | Medicine & daily routine alarm creator |
| `/caretaker/medical` | `MedicalPage` | ✅ Yes | `CAREGIVER` | Geriatric medical reports, prescriptions & lab test records |
| `/caretaker/memories` | `MemoriesPage` | ✅ Yes | `CAREGIVER` | Family photo & heritage game video vault upload |
| `/caretaker/contacts` | `ContactsPage` | ✅ Yes | `CAREGIVER` | Emergency contacts & family circle editor |
| `/caretaker/guide` | `GuidePage` | ✅ Yes | `CAREGIVER` | Situation notes, sundowning care protocols & AI guidance |
| `/caretaker/link` | `LinkPage` | ✅ Yes | `CAREGIVER` | 6-digit code linking to connect Caregiver to an Elder |
| `*` | `NotFoundPage` | ❌ No | Public | 404 Not Found fallback with quick navigation buttons |

---

## ⚡ Real-Time Cross-Portal Data Synchronization

When a caregiver adds a medicine alarm, uploads a memory, or edits medical records in the Caretaker Portal, the data is **instantly propagated** to the Elder Portal:

1. **BroadcastChannel (`granny_data_sync`)**: Synchronizes across separate browser tabs in real time without page reload.
2. **Custom Window Events (`granny_data_sync`)**: Dispatches instant UI state updates within the current application tab.
3. **Storage Events**: Cross-window fallback ensuring consistency across any browser storage modification.
4. **Heartbeat Sync**: Background polling every 10 seconds guaranteeing offline-to-online reconciliation.

---

## 📦 Project Structure

```text
apps/web/
├── src/
│   ├── components/
│   │   └── navigation/
│   │       ├── AppShell.tsx         # Unified layout header & sidebar
│   │       └── ProtectedRoute.tsx   # Role & authentication route guard
│   ├── contexts/
│   │   └── AppContext.tsx           # Global state, real-time sync & audio actions
│   ├── features/
│   │   └── games/                   # 20 cognitive game engines & types
│   ├── pages/
│   │   ├── LandingPage.tsx          # Public landing page
│   │   ├── AuthPage.tsx             # Authentication page
│   │   ├── NotFoundPage.tsx         # 404 error page
│   │   ├── Home/HomePage.tsx        # Elder home
│   │   ├── Companion/CompanionPage.tsx # Voice AI chat
│   │   ├── Games/
│   │   │   ├── GamesPage.tsx        # Games library
│   │   │   └── GamePlayPage.tsx     # Active game arena
│   │   ├── Family/FamilyPage.tsx    # Family circle
│   │   ├── Health/HealthPage.tsx    # Medication & water reminders
│   │   ├── Memory/MemoryPage.tsx    # Memories & video vault
│   │   ├── Theatre/TheatrePage.tsx  # Memory theatre
│   │   ├── Settings/SettingsPage.tsx# Settings & link code
│   │   ├── Dashboard/DashboardPage.tsx # Caretaker overview
│   │   └── Caretaker/
│   │       ├── AlarmsPage.tsx       # Alarms manager
│   │       ├── MedicalPage.tsx      # Medical reports
│   │       ├── MemoriesPage.tsx     # Memory uploader
│   │       ├── ContactsPage.tsx     # Contacts manager
│   │       ├── GuidePage.tsx        # Care guide & protocols
│   │       └── LinkPage.tsx         # Elder linking
│   ├── services/
│   │   ├── groqService.ts           # 4-Key Failover Groq AI integration
│   │   └── supabase.ts              # Supabase auth, DB & fallback cache
│   ├── utils/
│   │   └── audioChime.ts            # High-pitch audio chimes & Web Audio API
│   ├── i18n/                        # Bilingual Tamil & English dictionary
│   ├── App.tsx                      # Declarative React Router setup
│   ├── main.tsx                     # React root & BrowserRouter mount
│   └── index.css                    # Design system tokens & styles
├── index.html
├── package.json
└── vite.config.ts
```

---

## 🚀 Running the Web Application

```bash
# In project root or apps/web:
npm run dev:web

# Or from apps/web directly:
cd apps/web
npm run dev
```

Build for production:
```bash
npm run build
```
