# 📋 Granny Companion Platform — Master Technical Audit Report
**Project:** Granny (Bilingual Tamil/English Cognitive Healthcare & Companion Platform for Seniors)  
**Audit Scope:** Full Monorepo (`apps/web`, `apps/mobile`, `supabase/`, `ai-services/`, `backend/`, `others/`, root configs)  
**Audit Mode:** Read-Only Technical Audit (Strict Zero-Code Modification Policy)  
**Date:** September 15, 2026  
**Auditor:** Antigravity Engineering System  

---

## Executive Summary

The **Granny** platform is an ambitious, culturally attuned (Tamil/English) dual-interface system (Senior Sanctuary & Caregiver Dashboard) comprising:
- A React / Vite responsive web application (`apps/web`)
- A React Native / Expo mobile application (`apps/mobile`)
- Supabase backend with PostgreSQL migrations (`supabase/migrations/`)
- Deno Edge Functions for AI companion chat and adaptive difficulty engine (`supabase/functions/`)
- Multi-tier AI fallback pipelines (Groq Llama 3, Google Gemini, and localized bilingual template engines)

This audit reveals that while the visual UI design system, bilingual localization dictionaries, and game UX foundations are thoughtfully designed, **multiple critical architectural disconnections prevent the system from functioning seamlessly end-to-end in production.**

### Core Root Causes Identified:
1. **Broken AI Model IDs:** Both Edge Functions and client-side AI services request nonexistent Groq model slugs (e.g. `openai/gpt-oss-120b`, `qwen/qwen3.8-27b`), causing AI requests to fail and collapse into fallback modes.
2. **Invalid & Mismatched Environment Variables:** The Supabase Service Role key is an unfilled placeholder, the Anon key has an invalid format, and the Gemini API key has an invalid prefix.
3. **Database Schema vs Client Mismatches:** Several client services call tables (`caretaker_notifications`, `elder_personal_facts`) that do not exist in the SQL migrations, causing silent 404/REST errors.
4. **Phantom Backend Dependency:** Web `apps/web/src/services/api.ts` routes network requests to `http://localhost:4000/api`, but no active Node/Express backend server exists in the repository.
5. **Mobile Native Audio Crash / Incompatibility:** `apps/mobile/src/services/audioService.ts` attempts to instantiate browser `window.AudioContext`, which fails silently or crashes on native Android/iOS.
6. **Hardcoded Mock Fallbacks:** Key mobile screens (`CaregiverScreen.tsx`, `CompanionScreen.tsx`, `HomeScreen.tsx`) bypass database services in critical flows and bind to hardcoded mockup elder identities.

---

## Issue Severity Index

| Severity | Count | Primary Impact Areas |
| :--- | :---: | :--- |
| 🔴 **CRITICAL** | 12 | Complete failure of AI pipelines, authentication token rejections, missing screens, phantom servers |
| 🟠 **HIGH** | 10 | Native audio failure, missing DB tables, cross-device SOS breakdown, unsent email alerts |
| 🟡 **MEDIUM** | 9 | Game fallback pool imbalance, missing type bindings, mock data leakage in production |
| 🟢 **LOW** | 4 | Build script warnings, icon asset dimensions, documentation sync |

---

## 1. 🔴 CRITICAL SEVERITY ISSUES

### Issue 1.1: Supabase Service Role Key is a Placeholder
- **File:** `d:\SIH 2026\Granny\.env` (Line 8)
- **Problem:** `SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"` is left as an unconfigured template string.
- **Why It Happens:** The development environment file was initialized from `.env.example` without injecting real credentials from the Supabase project dashboard.
- **Expected Behavior:** A valid JWT `eyJhbGciOi...` service role secret should be provided to allow Edge Functions and administrative scripts to bypass RLS policies when saving conversation logs and evaluating user difficulty tiers.
- **Suggested Fix:** Copy the actual `service_role` secret from the Supabase Dashboard (`Project Settings > API > Project API keys`) into `.env` and configure it in Supabase Edge Secrets (`supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`).
- **Severity:** 🔴 **CRITICAL**

---

### Issue 1.2: Invalid Format for `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **File:** `d:\SIH 2026\Granny\.env` (Line 7)
- **Problem:** The key begins with `sb_publishable_...` instead of a standard Supabase JWT (`eyJ...`).
- **Why It Happens:** Supabase REST endpoints require a signed JWT containing role claims (`anon`). A publishable key format that does not decode to a valid JWT causes Supabase PostgREST gateways to reject all client queries with `401 Unauthorized`.
- **Expected Behavior:** A valid `anon` JWT key generated for the project URL `https://lqyljfllyyabjdfmfnas.supabase.co`.
- **Suggested Fix:** Replace the `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env` with the true anon public key from the Supabase dashboard.
- **Severity:** 🔴 **CRITICAL**

---

### Issue 1.3: Web App Supabase URL Missing from `.env`
- **File:** `d:\SIH 2026\Granny\.env` & `apps/web/src/services/supabase.ts` (Line 18)
- **Problem:** `apps/web/src/services/supabase.ts` reads `import.meta.env.VITE_SUPABASE_URL`, but `.env` only defines `EXPO_PUBLIC_SUPABASE_URL`.
- **Why It Happens:** Vite only exposes environment variables prefixed with `VITE_` to client-side bundles. The `.env` file only prefixes variables with `EXPO_PUBLIC_`.
- **Expected Behavior:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be populated so the web frontend client can instantiate `@supabase/supabase-js`.
- **Suggested Fix:** Add the corresponding Vite variables to `.env`:
  ```env
  VITE_SUPABASE_URL="https://lqyljfllyyabjdfmfnas.supabase.co"
  VITE_SUPABASE_ANON_KEY="<valid-anon-jwt>"
  ```
- **Severity:** 🔴 **CRITICAL**

---

### Issue 1.4: Invalid Google Gemini API Key Format
- **File:** `d:\SIH 2026\Granny\.env` (Lines 23–24)
- **Problem:** `GEMINI_API_KEY` starts with `AQ.Ab8R...` which is not a valid Google AI Studio API key format.
- **Why It Happens:** Valid Google Gemini API keys start with the prefix `AIzaSy...`. The existing key is corrupted or copied from another service token.
- **Expected Behavior:** A standard Gemini API key enabling fallback calls in `supabase/functions/converse/index.ts` and `apps/web/src/services/groqService.ts`.
- **Suggested Fix:** Generate a fresh Gemini API key from Google AI Studio (`aistudio.google.com`) and update `.env`.
- **Severity:** 🔴 **CRITICAL**

---

### Issue 1.5: Invalid Groq AI Model Identifiers in Edge Functions
- **File:** `d:\SIH 2026\Granny\supabase\functions\converse\index.ts` (Lines 140–145)
- **Problem:** The Edge Function requests non-existent model slugs:
  ```typescript
  const models = [
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
    "groq/compound-mini",
  ];
  ```
- **Why It Happens:** These slugs are fictional or unsupported by Groq's official API. Groq returns `404 Not Found` or `400 Bad Request` (`model_not_found`).
- **Expected Behavior:** The function should use official Groq model identifiers such as `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, or `mixtral-8x7b-32768`.
- **Suggested Fix:** Replace the `models` array with supported Groq production models:
  ```typescript
  const models = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768"
  ];
  ```
- **Severity:** 🔴 **CRITICAL**

---

### Issue 1.6: Invalid Groq AI Model Identifiers in Client Services
- **Files:**  
  - `d:\SIH 2026\Granny\apps\web\src\services\groqService.ts` (Lines 22–27)  
  - `d:\SIH 2026\Granny\apps\mobile\src\services\groqService.ts` (Lines 15–20)
- **Problem:** Both client services list the same nonexistent model slugs: `"openai/gpt-oss-120b"`, `"qwen/qwen3.8-27b"`, `"groq/compound-mini"`.
- **Why It Happens:** Copied across services without validating against Groq's model capability endpoints.
- **Expected Behavior:** Client-side companion chats and dynamic quiz generation should communicate with valid Groq inference models.
- **Suggested Fix:** Update the fallback model list across both files to valid Groq identifiers:
  ```typescript
  const GROQ_MODELS = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'llama3-70b-8192'
  ];
  ```
- **Severity:** 🔴 **CRITICAL**

---

### Issue 1.7: Web App Routes API Calls to Nonexistent `localhost:4000` Server
- **File:** `d:\SIH 2026\Granny\apps\web\src\services\api.ts` (Lines 5–6)
- **Problem:** `API_BASE = 'http://localhost:4000/api'`. Methods like `gamesApi.submitAttempt()`, `authApi.login()`, and `remindersApi.getAll()` make `fetch()` calls to this URL.
- **Why It Happens:** The project monorepo contains a stub `backend/` directory without an active or running HTTP server.
- **Expected Behavior:** In a Supabase-centric architecture, all persistence, authentication, and game scoring must route directly through `supabaseService` or Supabase Edge Functions.
- **Suggested Fix:** Refactor `api.ts` to either point directly to Supabase client methods or remove the `localhost:4000` dependency entirely in favor of `databaseService` in `supabase.ts`.
- **Severity:** 🔴 **CRITICAL**

---

### Issue 1.8: Game Score Persistence Fails Silently in Web App
- **File:** `d:\SIH 2026\Granny\apps\web\src\App.tsx` (Line 813)
- **Problem:** When an elder finishes a game, `App.tsx` calls `gamesApi.submitAttempt(...)` which routes to `http://localhost:4000/api/games/attempts`. It catches the error silently (`.catch(() => {})`), leaving game attempts unrecorded in the database.
- **Why It Happens:** The code relies on the dead backend service instead of `databaseService.submitGameAttempt()` or Supabase tables.
- **Expected Behavior:** Completed game scores, times, and accuracy percentages must be saved directly to the `attempts` table in Supabase.
- **Suggested Fix:** Replace `gamesApi.submitAttempt(...)` with `databaseService.submitGameAttempt(...)` or direct Supabase inserts.
- **Severity:** 🔴 **CRITICAL**

---

### Issue 1.9: Mobile `SettingsScreen` is Completely Missing
- **Directory:** `d:\SIH 2026\Granny\apps\mobile\src\screens\Settings\`
- **Problem:** The folder contains only a `.gitkeep` file. There is no `SettingsScreen.tsx`.
- **Why It Happens:** The mobile application implementation was left incomplete prior to the initial build.
- **Expected Behavior:** Elders and caregivers should be able to navigate to a Settings screen to toggle languages (Tamil/English), adjust voice speed/pitch, calibrate high-contrast mode, and unlink/switch profiles.
- **Suggested Fix:** Implement `apps/mobile/src/screens/Settings/SettingsScreen.tsx` matching the web settings design and bind it to mobile state.
- **Severity:** 🔴 **CRITICAL**

---

### Issue 1.10: Mobile `CaregiverScreen` Disconnected from Supabase
- **File:** `d:\SIH 2026\Granny\apps\mobile\src\screens\Family\CaregiverScreen.tsx` (Lines 30–120)
- **Problem:** The mobile Caregiver Dashboard relies 100% on hardcoded mock state (`initialElders`, mock alarms, mock reports).
- **Why It Happens:** The UI was scaffolded with static demonstration objects, but API binding to `databaseService` was never wired up.
- **Expected Behavior:** Caregivers linking via 6-digit code or logging in should see real-time data fetched from `elder_profiles`, `reminders`, `attempts`, and `medical_reports`.
- **Suggested Fix:** Connect `CaregiverScreen.tsx` to `databaseService.getLinkedElders()`, `databaseService.getReminders()`, and `databaseService.getAttempts()`.
- **Severity:** 🔴 **CRITICAL**

---

### Issue 1.11: Mobile Companion Hardcodes Senior Profile Name
- **File:** `d:\SIH 2026\Granny\apps\mobile\src\screens\Companion\CompanionScreen.tsx` (Lines 95–99)
- **Problem:** The companion greeting and prompt state hardcodes the elder name as `'Lakshmi Amma & Ramanathan Thatha'`:
  ```typescript
  const [profile, setProfile] = useState({
    name: 'Lakshmi Amma & Ramanathan Thatha',
    preferredLanguage: 'ta',
  });
  ```
- **Why It Happens:** Local testing fallback was left in place and never connected to the logged-in user profile or context.
- **Expected Behavior:** Profile should be pulled dynamically from active session state or AsyncStorage `granny_user`.
- **Suggested Fix:** Read active elder profile from `user` prop / context rather than a static default.
- **Severity:** 🔴 **CRITICAL**

---

### Issue 1.12: PostgREST Join Filter Syntax in `get-difficulty` Edge Function
- **File:** `d:\SIH 2026\Granny\supabase\functions\get-difficulty\index.ts` (Lines 99–104)
- **Problem:** The Edge Function executes:
  ```typescript
  .from("attempts")
  .select("score, time_taken, accuracy, created_at, game_sessions!inner(user_id, game_key)")
  .eq("game_sessions.user_id", userId)
  ```
- **Why It Happens:** PostgREST requires a foreign key relationship to embed `game_sessions`. In migration `004`, `attempts` has a `session_id` foreign key, but the nested filter syntax `.eq("game_sessions.user_id", userId)` may fail or return an empty set if PostgREST schema cache cannot disambiguate the relation.
- **Expected Behavior:** The query should reliably query recent attempts filtered by `user_id` and `game_key`.
- **Suggested Fix:** Query `attempts` directly with `.eq("user_id", userId)` if `user_id` is maintained on attempts, or query `game_sessions` first to retrieve `session_id` list.
- **Severity:** 🔴 **CRITICAL**

---

## 2. 🟠 HIGH SEVERITY ISSUES

### Issue 2.1: Native Audio Failure in Mobile `audioService.ts`
- **File:** `d:\SIH 2026\Granny\apps\mobile\src\services\audioService.ts` (Lines 12–30)
- **Problem:** `getAudioContext()` looks for `window.AudioContext || (window as any).webkitAudioContext`.
- **Why It Happens:** React Native runs on Hermes/JavaScriptCore on iOS and Android where `window.AudioContext` does not exist. This only functions on Expo Web.
- **Expected Behavior:** SOS sirens, chime feedback, and audio cues must play reliably on native Android and iOS devices.
- **Suggested Fix:** Use `expo-av` (already declared in `package.json`) `Audio.Sound.createAsync()` to synthesize or play audio assets natively instead of Web Audio oscillator nodes.
- **Severity:** 🟠 **HIGH**

---

### Issue 2.2: Mobile Emergency SOS Does Not Write to Database
- **File:** `d:\SIH 2026\Granny\apps\mobile\App.tsx` (Lines 187–205)
- **Problem:** Tapping Emergency SOS triggers `audioService.playSosSiren()` and displays a native alert modal, but does **not** insert an SOS alert into Supabase.
- **Why It Happens:** The event handler lacks an asynchronous call to notify the remote caregiver.
- **Expected Behavior:** Tapping SOS should immediately push a high-priority alert to the database so linked caregivers receive real-time notifications on their devices.
- **Suggested Fix:** Add `await databaseService.createSosAlert(...)` inside `handleEmergencySos()`.
- **Severity:** 🟠 **HIGH**

---

### Issue 2.3: `caretaker_notifications` Table Missing from Database Migrations
- **Files:** `d:\SIH 2026\Granny\apps\web\src\services\supabase.ts` (Lines 770–785) & `supabase/migrations/`
- **Problem:** `databaseService.addCaretakerNotification()` executes `.from('caretaker_notifications').insert(...)`, but no migration creates `caretaker_notifications`.
- **Why It Happens:** The table was added to the client layer without an accompanying SQL schema migration.
- **Expected Behavior:** Caregiver notifications should persist in a dedicated database table with columns for `elder_id`, `type`, `title`, `message`, `severity`, and `read_status`.
- **Suggested Fix:** Add a migration creating `caretaker_notifications`:
  ```sql
  CREATE TABLE IF NOT EXISTS public.caretaker_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_id UUID REFERENCES public.elder_profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- **Severity:** 🟠 **HIGH**

---

### Issue 2.4: `sendCaretakerEmailAlert()` is a Non-Functional Stub
- **File:** `d:\SIH 2026\Granny\apps\web\src\services\supabase.ts` (Lines 831–853)
- **Problem:** The function only logs to `console.info()` and writes to `localStorage`. No actual email or SMS is dispatched.
- **Why It Happens:** External notification providers (Resend, SendGrid, Twilio) were never wired up.
- **Expected Behavior:** In a cognitive care and medical emergency platform, critical SOS alerts must dispatch actual notifications (email/SMS/Webhook).
- **Suggested Fix:** Connect this function to a Supabase Edge Function configured with Resend or Brevo API to send transactional emails.
- **Severity:** 🟠 **HIGH**

---

### Issue 2.5: Web App Emergency SOS BroadcastChannel Confined to Local Browser
- **File:** `d:\SIH 2026\Granny\apps\web\src\App.tsx` (Lines 340–355)
- **Problem:** Emergency SOS alerts use `new BroadcastChannel('granny_sos_' + targetElderId)`.
- **Why It Happens:** `BroadcastChannel` is a browser API that only broadcasts between tabs on the same computer and browser origin. It cannot notify a family member on another device.
- **Expected Behavior:** Caregivers on remote mobile phones or separate laptops should receive the SOS alert via Supabase Realtime WebSocket subscriptions (`supabase.channel(...)`).
- **Suggested Fix:** Replace local `BroadcastChannel` with `supabase.channel('elder-alerts:' + elderId).subscribe(...)`.
- **Severity:** 🟠 **HIGH**

---

### Issue 2.6: Web App `toggleReminder` Runtime TypeError
- **File:** `d:\SIH 2026\Granny\apps\web\src\App.tsx` (Line 547)
- **Problem:** Calling `databaseService.toggleReminder(targetElderId, remId)` crashes with `TypeError: databaseService.toggleReminder is not a function`.
- **Why It Happens:** The method `toggleReminder` was called in `App.tsx` but was never implemented in `apps/web/src/services/supabase.ts`.
- **Expected Behavior:** Toggling a medicine or meal reminder should update `is_active` / `completed` status in both local cache and Supabase `reminders` table.
- **Suggested Fix:** Add `toggleReminder(elderId: string, reminderId: string)` method to `databaseService` in `supabase.ts`.
- **Severity:** 🟠 **HIGH**

---

### Issue 2.7: Missing `user_id` on Memory Inserts Violates Foreign Key Constraint
- **File:** `d:\SIH 2026\Granny\apps\web\src\App.tsx` (Line 753)
- **Problem:** `addMemory()` inserts objects with `{ title, content, image_url, tags, uploaded_by }` where `uploaded_by` is a name string, omitting the mandatory `user_id` UUID foreign key.
- **Why It Happens:** Mismatch between the frontend form model and the PostgreSQL `memories` table schema defined in `004_fix_link_codes_and_auth.sql`.
- **Expected Behavior:** The memory record must supply a valid `user_id` matching an authenticated user UUID.
- **Suggested Fix:** Inject the active user's UUID into the insert payload: `user_id: activeElder.id`.
- **Severity:** 🟠 **HIGH**

---

### Issue 2.8: Mobile `features/games` Lacks Traditional Tamil Games
- **Directories:** `d:\SIH 2026\Granny\apps\mobile\src\features\games\` vs `apps/web/src/data/games.ts`
- **Problem:** The web app provides 20 nostalgic Indian games (Nondi, Gilli Danda, Kanche, Pallanguzhi, etc.), whereas the mobile codebase only implements 10 Western-style cognitive screens (`RememberMyHome`, `MemoryMarket`, etc.).
- **Why It Happens:** The mobile application was developed against an older generic spec rather than the finalized 20-game Tamil cultural specification.
- **Expected Behavior:** Mobile elders should have access to the same nostalgic games (Nondi, Pallanguzhi, Dayakattai, etc.) as the web application.
- **Suggested Fix:** Port the nostalgic game engines and question banks from `apps/web/src/data/games.ts` to `apps/mobile/src/features/games/`.
- **Severity:** 🟠 **HIGH**

---

### Issue 2.9: Web Auth Mixes Phone and Email Fields
- **File:** `d:\SIH 2026\Granny\apps\web\src\App.tsx` (Lines 1035–1041)
- **Problem:** If a user enters a phone number into the input field, the state handler sets both `email` and `phone` to that same value, creating synthetic email addresses like `9876543210@granny.app`.
- **Why It Happens:** A workaround for unified login input was implemented without strict validation or sanitization.
- **Expected Behavior:** Phone numbers and email addresses should be distinguished clearly and validated before passing to Supabase Auth.
- **Suggested Fix:** Sanitize input; if regex detects a phone number, set `phone` and generate email via a controlled helper.
- **Severity:** 🟠 **HIGH**

---

### Issue 2.10: `expo-router` Declared but Unused
- **File:** `d:\SIH 2026\Granny\apps\mobile\package.json` (Line 23)
- **Problem:** `expo-router: ~3.5.24` is installed as a top-level dependency, but `apps/mobile/App.tsx` uses custom state-based navigation (`activeTab === 'home'`).
- **Why It Happens:** The project started with Expo Router scaffolding, but shifted to single-file tab switching without cleaning up dependencies.
- **Expected Behavior:** Navigation should either leverage `expo-router`'s file-based routing or remove the heavy package to optimize APK bundle size.
- **Suggested Fix:** Either migrate screen transitions to Expo Router or remove `expo-router` from `package.json`.
- **Severity:** 🟠 **HIGH**

---

## 3. 🟡 MEDIUM SEVERITY ISSUES

### Issue 3.1: AI Fallback Question Pool Skewed to Single Game
- **Files:**  
  - `d:\SIH 2026\Granny\apps\web\src\services\groqService.ts` (Lines 140–180)  
  - `d:\SIH 2026\Granny\apps\mobile\src\services\groqService.ts` (Lines 130–160)
- **Problem:** When Groq AI requests fail, the fallback question engine only has hardcoded pools for `nondi`, `gilli_danda`, and `kanche`. The other 17 games fall back to `nondi` (hopscotch) questions.
- **Why It Happens:** The user specifically noted: *"if the game is nondi u have to show the questions related to that not customize the entire game itself... you have to customize the questions according to the game not give an entirely different game"*. The fallback dictionary was incomplete.
- **Expected Behavior:** Every game must have its own dedicated question bank and cognitive rule set.
- **Suggested Fix:** Complete the fallback question matrix for all 20 game identifiers in `groqService.ts`.
- **Severity:** 🟡 **MEDIUM**

---

### Issue 3.2: Mobile `HomeScreen` Greets Lakshmi & Ramanathan by Default
- **File:** `d:\SIH 2026\Granny\apps\mobile\src\screens\Home\HomeScreen.tsx` (Line 49)
- **Problem:** Line 49 displays `vanakkam("Lakshmi Amma & Ramanathan Thatha")` instead of greeting the currently logged-in elder.
- **Why It Happens:** Static demo string was left in the render template.
- **Expected Behavior:** The greeting should read `user?.name || (isTamil ? 'தாத்தா / பாட்டி' : 'Grandparent')`.
- **Suggested Fix:** Replace hardcoded string with dynamic prop `user.name`.
- **Severity:** 🟡 **MEDIUM**

---

### Issue 3.3: Medical Reports Seeded with Fake Apollo Records on Fresh Logins
- **File:** `d:\SIH 2026\Granny\apps\web\src\services\supabase.ts` (Lines 720–740)
- **Problem:** If `getMedicalReports()` returns an empty array for an elder, it automatically injects mock reports from "Apollo Hospitals / Dr. Rangarajan".
- **Why It Happens:** Seed logic was added for UI demo purposes, but it triggers even for genuine new user registrations.
- **Expected Behavior:** A newly registered real elder should display an empty state ("No medical records uploaded yet").
- **Suggested Fix:** Only seed mock records if a specific `isDemoMode` flag is set.
- **Severity:** 🟡 **MEDIUM**

---

### Issue 3.4: Duplicate Icon Assets in Mobile App
- **Directory:** `d:\SIH 2026\Granny\apps\mobile\assets\`
- **Problem:** `icon.png`, `adaptive-icon.png`, and `favicon.png` are identical copies of `logo.png` (exact same byte size: 65,839 bytes).
- **Why It Happens:** Quick asset copy was performed without tailoring dimensions to Android Adaptive Icon guidelines (foreground 432x432 inside 108dp canvas).
- **Expected Behavior:** `adaptive-icon.png` should have a transparent background with proper padding to prevent circular cropping clipping on Android devices.
- **Suggested Fix:** Generate properly sized icon assets with safe padding zones using an asset generator.
- **Severity:** 🟡 **MEDIUM**

---

### Issue 3.5: Missing Web OpenGraph and Social Meta Tags
- **File:** `d:\SIH 2026\Granny\apps\web\index.html`
- **Problem:** `index.html` lacks Open Graph (`og:title`, `og:image`, `og:description`) and Twitter card meta tags.
- **Why It Happens:** Standard Vite starter template was not fully enhanced with production SEO meta tags.
- **Expected Behavior:** Sharing the web app link on WhatsApp or family communication channels should produce a preview card with the Granny logo and Tamil/English description.
- **Suggested Fix:** Add proper `<meta property="og:...">` tags to `apps/web/index.html`.
- **Severity:** 🟡 **MEDIUM**

---

### Issue 3.6: Missing `SafeAreaProvider` Context Wrapper in Mobile App
- **File:** `d:\SIH 2026\Granny\apps\mobile\App.tsx` (Lines 12–15)
- **Problem:** `App.tsx` imports `SafeAreaView` from standard `react-native` instead of `react-native-safe-area-context`, omitting the `<SafeAreaProvider>` wrapper.
- **Why It Happens:** Built-in React Native `SafeAreaView` only supports iOS and does not handle modern Android punch-hole cameras or navigation bars.
- **Expected Behavior:** UI should not clip under the Android status bar or navigation pill on modern devices.
- **Suggested Fix:** Wrap the mobile application in `<SafeAreaProvider>` from `react-native-safe-area-context`.
- **Severity:** 🟡 **MEDIUM**

---

### Issue 3.7: `elder_link_codes` Cascade Delete Discrepancy
- **File:** `d:\SIH 2026\Granny\supabase\migrations\004_fix_link_codes_and_auth.sql`
- **Problem:** `elder_link_codes` references `elder_profiles(id)` but does not consistently maintain unique indexes across active vs expired link codes.
- **Why It Happens:** Successive schema migrations patched the table without unifying the index definition for expired codes.
- **Expected Behavior:** Each elder should have at most one active (non-expired) 6-digit code at any given time.
- **Suggested Fix:** Add a partial unique index: `CREATE UNIQUE INDEX unique_active_code ON public.elder_link_codes (elder_id) WHERE is_active = true;`.
- **Severity:** 🟡 **MEDIUM**

---

### Issue 3.8: Deno TypeScript IDE Errors in Supabase Functions
- **Files:** `d:\SIH 2026\Granny\supabase\functions\converse\index.ts` & `get-difficulty\index.ts`
- **Problem:** TypeScript language servers flag errors on imports from `https://deno.land/...` and `Deno.env.get(...)`.
- **Why It Happens:** The IDE uses Node.js TypeScript typings rather than Deno LSP.
- **Expected Behavior:** Supabase Edge Functions should run in Deno runtime while local workspace tooling recognizes Deno namespace declarations.
- **Suggested Fix:** Ensure `.vscode/settings.json` or `supabase/functions/tsconfig.json` correctly enables the Deno extension.
- **Severity:** 🟡 **MEDIUM**

---

### Issue 3.9: `expo` Package Minor Version Mismatch in `app.json`
- **File:** `d:\SIH 2026\Granny\apps\mobile\app.json`
- **Problem:** `sdkVersion` is specified as `"51.0.0"` while `package.json` installs `expo: ~51.0.39`.
- **Why It Happens:** Expo SDK version strings in `app.json` are best expressed as major integer strings (`"51"` or omitted to infer from `package.json`).
- **Expected Behavior:** EAS build tools expect standard SDK version formatting to prevent build engine warnings.
- **Suggested Fix:** Remove the explicit `sdkVersion` field from `app.json` and let Expo infer it from `package.json`.
- **Severity:** 🟡 **MEDIUM**

---

## 4. 🟢 LOW SEVERITY ISSUES

### Issue 4.1: Redundant Development Scripts in Root `package.json`
- **File:** `d:\SIH 2026\Granny\package.json`
- **Problem:** Root scripts reference outdated command flags (`npm run dev:web`, `npm run dev:mobile`).
- **Suggested Fix:** Clean up script definitions to match Turborepo or npm workspace conventions.
- **Severity:** 🟢 **LOW**

### Issue 4.2: Missing `.env.example` Synchronization
- **File:** `d:\SIH 2026\Granny\.env.example`
- **Problem:** `.env.example` does not list the `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` variables required by the web application.
- **Suggested Fix:** Update `.env.example` to document all necessary keys for both web and mobile environments.
- **Severity:** 🟢 **LOW**

### Issue 4.3: Unused Binary Artifacts in Project Root
- **Files:** `Granny-preview.apk` (67MB) and `Granny-Companion-Release.apk` (70MB)
- **Problem:** Heavy pre-compiled Android APK binaries are stored directly in the root repository.
- **Suggested Fix:** Move APK releases to GitHub Releases or git-lfs to keep the workspace lightweight.
- **Severity:** 🟢 **LOW**

### Issue 4.4: Console Logging in Production Data Services
- **Files:** `apps/web/src/services/supabase.ts` and `apps/mobile/src/services/supabaseService.ts`
- **Problem:** Verbose debug logs (`console.log('[Supabase] Sync successful')`) run unconditionally.
- **Suggested Fix:** Wrap non-critical logs in `if (__DEV__)` or `if (import.meta.env.DEV)` checks.
- **Severity:** 🟢 **LOW**

---

## 5. Architectural Map & Data Flow Verification

```mermaid
flowchart TD
    subgraph Clients["Frontend Clients"]
        Web["Web App (Vite/React)\napps/web"]
        Mobile["Mobile App (Expo/React Native)\napps/mobile"]
    end

    subgraph AI["AI Inference Engine"]
        Groq["Groq API (Llama 3)\n[Broken Model Slugs]"]
        Gemini["Google Gemini\n[Broken API Key]"]
        Local["Local Bilingual Fallback\n[Defaulted to Nondi Quiz]"]
    end

    subgraph Edge["Supabase Edge Functions"]
        Converse["converse/index.ts"]
        Difficulty["get-difficulty/index.ts"]
    end

    subgraph Database["Supabase PostgreSQL"]
        Tables["users, elder_profiles, reminders, attempts"]
        MissingTables["❌ caretaker_notifications\n❌ elder_personal_facts"]
    end

    subgraph DeadServer["Dead Dependency"]
        Localhost4000["❌ http://localhost:4000/api\n(No Server Exists)"]
    end

    Web -.->|Calls Dead Endpoint| Localhost4000
    Web -->|Fails Auth (Bad Key)| Database
    Mobile -->|Fails Auth (Bad Key)| Database
    Web -->|Invokes| Converse
    Converse -->|Fails Model Name| Groq
    Groq -.->|Falls Back| Gemini
    Gemini -.->|Falls Back| Local
    Web -->|Inserts Missing Table| MissingTables
```

---

## 6. Database Schema Comparison Table

| Schema Table | In Migration 004? | In Web Service? | In Mobile Service? | Status / Discrepancy |
| :--- | :---: | :---: | :---: | :--- |
| `users` | ✅ Yes | ✅ Yes | ✅ Yes | Fully aligned |
| `elder_profiles` | ✅ Yes | ✅ Yes | ✅ Yes | Fully aligned |
| `elder_link_codes` | ✅ Yes | ✅ Yes | ✅ Yes | Active flag index needs refinement |
| `caregiver_patient_links` | ✅ Yes | ✅ Yes | ✅ Yes | Fully aligned |
| `memories` | ✅ Yes | ⚠️ Partial | ⚠️ Partial | Missing `user_id` FK in insert calls |
| `games` | ✅ Yes | ✅ Yes | ⚠️ Partial | Mobile lacks 10 nostalgia game definitions |
| `game_sessions` | ✅ Yes | ⚠️ Partial | ⚠️ Partial | Edge function join query syntax issue |
| `attempts` | ✅ Yes | ❌ Broken | ⚠️ Partial | Web routes to dead `localhost:4000` |
| `conversations` | ✅ Yes | ✅ Yes | ✅ Yes | Fully aligned |
| `reminders` | ✅ Yes | ⚠️ Partial | ✅ Yes | Web lacks `toggleReminder()` method |
| `medical_reports` | ✅ Yes | ✅ Yes | ⚠️ Mock Only | Mobile hardcodes mock reports |
| `caretaker_notifications` | ❌ **NO** | ⚠️ Called | ⚠️ Called | **Missing from migrations** (Causes 404) |
| `elder_personal_facts` | ❌ **NO** | ⚠️ Called | ❌ No | **Missing from migrations** (Local-only) |

---

## 7. Actionable Fix Priority Roadmap

When switching from **AUDIT MODE** to **IMPLEMENTATION MODE**, execute fixes in this strict order:

### Phase 1: Environment & Credentials (Zero Code Risk, Maximum Unblock)
1. Inject true Supabase `anon` JWT key into `.env` for both `EXPO_PUBLIC_` and `VITE_` variables.
2. Inject valid `SUPABASE_SERVICE_ROLE_KEY` in `.env` and Supabase secrets.
3. Replace corrupted `GEMINI_API_KEY` with a valid `AIzaSy...` key.
4. Correct Groq model identifiers to `llama-3.3-70b-versatile` in Edge Functions, Web, and Mobile services.

### Phase 2: Database Migrations (Schema Integrity)
1. Add migration `005_caretaker_notifications.sql` to create the missing `caretaker_notifications` table.
2. Fix foreign key insertion parameters in `memories` and `attempts` service layers.

### Phase 3: Web Application Corrections
1. Eliminate `http://localhost:4000/api` references in `apps/web/src/services/api.ts` by routing directly to Supabase client methods.
2. Implement `databaseService.toggleReminder()` in `apps/web/src/services/supabase.ts`.
3. Upgrade Emergency SOS from local-only `BroadcastChannel` to Supabase Realtime Channels.

### Phase 4: Mobile Application Corrections
1. Replace Web Audio API calls in `audioService.ts` with `expo-av` native sound players.
2. Create `apps/mobile/src/screens/Settings/SettingsScreen.tsx` and wire it to app navigation.
3. Connect `CaregiverScreen.tsx` and `CompanionScreen.tsx` to dynamic data from `databaseService` instead of hardcoded demo states.
4. Expand `groqService.ts` fallback quiz pools so each of the 20 nostalgic games receives contextually accurate questions.

---
*Report generated and validated for the Granny Project workspace. Complies with the SIH 2026 Technical Architecture Specification.*
