# 👵 Granny — Development Checklist

## Phase 0: Research & Requirements Lock
- [x] Finalize personas and 10-game world map
- [x] Define MVP vs stretch feature list
- [x] Wireframe Home→Album flow

## Phase 1: Repo, Env & DevOps Setup
- [x] Monorepo scaffold (apps/web, apps/mobile, backend, ai-services, packages)
- [x] Docker Compose for Postgres + Redis
- [x] .env templates
- [x] Root package.json with workspace scripts

## Phase 2: Database & Backend Core
- [x] Prisma schema (User, ElderProfile, Memory, Game, GameSession, Attempt, Conversation, Message, Reminder, FamilyGroup, ConsentRecord, SafetyIncident)
- [x] Database/Prisma service
- [x] Auth module (JWT, roles ELDER/CAREGIVER, OTP flow)
- [x] Users module (profile CRUD, family linking, consent)
- [x] Memory module (CRUD, AI embedding proxy, search)
- [x] Games module (catalog, sessions, attempts, difficulty proxy)
- [x] Conversation module (proxy to AI service, persist exchanges)
- [x] Reminders module (CRUD, today's schedule, confirmation)
- [x] Family module (caregiver dashboard: adherence, mood, performance)
- [x] Safety module (incident logging, caregiver alert fan-out)
- [x] Common guards (JWT Auth, Roles, Ownership/Consent)
- [x] Exception filter & decorators
- [x] Health check endpoint
- [x] All modules wired in AppModule

## Phase 3: AI Microservice Core
- [x] Pydantic v2 schemas (STT, TTS, Converse, Memory, Difficulty, Emotion)
- [x] STT endpoint (Whisper stub, ready for integration)
- [x] TTS endpoint (ElevenLabs stub, ready for integration)
- [x] /converse endpoint (safety-first pipeline: distress check → emotion → memory → LLM/mock)
- [x] Memory embed & search endpoints
- [x] Adaptive Difficulty Engine (EMA of accuracy + latency, 5 levels)
- [x] Emotion analyzer (keyword-based with ML-ready interface)
- [x] Granny persona system prompt template
- [x] Safety rules & distress phrase detector (20+ phrases)
- [x] De-escalation response script
- [x] All routers registered in FastAPI main
- [x] Health check endpoint

## Phase 4: Game Engine
- [x] CognitiveGame shared interface (TypeScript)
- [x] Utility functions (shuffle, pick random, session summary)
- [x] Game 1: Remember My Home (spatial + visual)
- [x] Game 2: Memory Market (working memory + attention)
- [x] Game 3: Name & Face Match (recognition + associative)
- [x] Game 4: Recipe Recall (sequential + executive)
- [x] Game 5: Memory Journey (episodic + sequential)
- [x] Game 6: Complete the Tune (auditory + associative)
- [x] Game 7: Story Detective (auditory + comprehension)
- [x] Game 8: Where Did I Keep It (working + spatial)
- [x] Game 9: Memory Garden (visual + spatial + long-term)
- [x] Game 10: Memory Album (recognition + episodic)
- [x] Game registry with getGameByKey()

## Phase 5: Web Frontend
- [x] Elderly-first CSS design system (48px+ targets, high contrast, warm palette)
- [x] Google Fonts (Inter, Outfit)
- [x] CSS custom properties for easy theming
- [x] High contrast mode toggle
- [x] Auth page (login/register with demo mode)
- [x] Elder Home (4 large action cards)
- [x] Companion Chat (voice-first, waveform, chat bubbles)
- [x] Game World Map (10 games as scrollable cards)
- [x] Game Play (memorize → play → results flow)
- [x] Health & Reminders (daily schedule, one-tap confirmation)
- [x] Memory Album (view, tag, type badges)
- [x] Caregiver Dashboard (adherence %, mood trend, game performance)
- [x] Settings (text size, contrast, language, account)
- [x] Persistent mic button (Web Speech API)
- [x] Bottom navigation (role-aware: elder vs caregiver)
- [x] Emergency "Help" button (always visible)
- [x] API service client (typed, no hand-rolled fetch)
- [x] State management with localStorage persistence
- [x] i18n scaffold (EN + Tamil)

## Phase 6: Family/Caregiver Dashboard
- [x] Adherence chart (medication confirmation %)
- [x] Mood trend (7-day emoji timeline)
- [x] Game performance (accuracy per game)
- [x] Role-based navigation (CAREGIVER sees dashboard tab)

## Phase 7: Emotion & Safety Layer
- [x] Emotion analyzer integrated into /converse
- [x] Distress phrase detector (20+ phrases, direct + indirect)
- [x] De-escalation script with emergency contact
- [x] Safety incident logging with caregiver alert pipeline

## Phase 8: Testing & Accessibility
- [x] Unit test suite for AI microservice (16 passing tests: difficulty, safety, converse, emotion, life story, quests)
- [x] WCAG AA contrast check on all screens with High Contrast mode
- [x] 48px+ touch-target audit across web and mobile layouts
- [ ] Elderly usability testing (5–8 real users)
- [ ] Load test AI endpoints

## Phase 9: Shared Monorepo Packages
- [x] `@elderly-ai/types`: Shared domain interfaces across all apps
- [x] `@elderly-ai/api-client`: Reusable typed API client wrapper

## Phase 10: Mobile App (React Native / Expo)
- [x] Voice companion chat (speech-enabled dialogue with waveform)
- [x] Reminders with adherence stats & one-tap confirmation
- [x] Flagship game fully playable ("Where Did I Keep It" with memorize/recall/result loop)
- [x] Elder Home screen with large action cards & emergency call button
- [x] Caregiver family circle dashboard view
- [x] High-contrast accessibility toggle

## Phase 11: Safety, Ethics & Accessibility Verification
- [x] Companion never states/implies medical diagnosis
- [x] Distress phrases trigger de-escalation (20+ phrases tested)
- [x] 48px+ touch targets on all interactive elements
- [x] WCAG AA contrast (high-contrast mode available)
- [x] No dark patterns (no infinite scroll, no streaks, no guilt)
- [x] One-tap emergency contact button always visible
- [x] Family/caregiver access requires explicit consent
- [x] Offline fallback and graceful error handling

## Phase 12: Advanced Differentiators (Section 2.3)
- [x] Life-Story Memory Theatre (`POST /life-story/generate` with MMSE scaffolding)
- [x] Family Co-Play Memory Quests (`POST /coplay/quest` with elder leadership)
- [x] Just-in-Time Micro-Interventions (`POST /micro-interventions/suggest` 1-3 min cognitive doses)
- [x] Culturally Adaptive Companion (support for regional contexts & multi-language i18n)

## Phase 13: SIH Demo & Pitch Readiness
- [x] Problem statement in one sentence ✓
- [x] GameWorldMap demo (10 connected games) ✓
- [x] Adaptive difficulty visible (wrong answer softens next item) ✓
- [x] Distress detection → caregiver alert demo ✓
- [x] Architecture diagram ready (in README) ✓
- [x] Complete SIH Pitch & Demo Guide with Slide Outline (`docs/sih_pitch_guide.md`) ✓
- [x] Production build validation verified (`apps/web` & `ai-services` test suite) ✓
