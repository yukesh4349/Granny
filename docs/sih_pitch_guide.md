# 👵 Granny — SIH 2026 Pitch & Demo Guide (SIH26003)

## 1. One-Sentence Hook & Problem Statement
> **"Elderly individuals are constantly forced to adapt to complex technology — Granny flips the paradigm by adapting the entire technology to the elderly."**

---

## 2. 90-Second Live Demo Script

| Time | Action on Screen | Voiceover Script | Key Judge Wow Factor |
| :--- | :--- | :--- | :--- |
| **00:00 - 00:20** | **Elder Home & Large Action Cards** | *"Welcome to Granny. Notice the ultra-accessible, 64px touch targets, warm color contrast, and voice-first UI designed for older adults."* | Zero cognitive friction; WCAG AAA standard compliance. |
| **00:20 - 00:45** | **Game World Map → Play Game** | *"Granny is not isolated puzzles — it is an interconnected memory world. Let's enter 'Where Did I Keep It'. As Kamala memorizes the drawer location, our Adaptive Difficulty Engine quietly monitors accuracy and latency."* | Unified Cognitive Game engine across all 10 games. |
| **00:45 - 01:10** | **Adaptive Difficulty Softening** | *"If Kamala struggles or hesitates, the Exponential Moving Average engine immediately softens the distractor count and increases time buffers on the next item without any patronizing error messages."* | No frustration loops; pedagogy-driven dynamic adjustment. |
| **01:10 - 01:30** | **Voice Companion & Safety De-escalation** | *"Let's speak to Granny. When an elder expresses subtle or overt distress — 'I feel scared, help me please' — the safety guardrail halts normal dialogue, plays an empathetic de-escalation reassurance, and alerts the caregiver in real time."* | Safety-first architecture with emergency escalation. |

---

## 3. SIH Presentation Slide Outline

### Slide 1: Title & Team
- **Granny**: AI-Based Cognitive Gaming & Memory Assistance for the Elderly (SIH26003)
- Team Name & Monorepo Architecture Overview

### Slide 2: The Core Problem
- 138+ million elderly citizens in India facing early cognitive decline and isolation.
- Existing brain apps use stock puzzles, tiny buttons, and punitive streak counters that cause anxiety.

### Slide 3: The Granny Solution & Architecture
- **Layer 1 (Clients)**: Accessible React Vite Web + Expo React Native with voice/tap duality.
- **Layer 2 (Backend)**: NestJS microservice with PostgreSQL (Prisma), BullMQ, and WebSockets.
- **Layer 3 (AI Core)**: FastAPI powering Whisper STT, TTS, Adaptive Difficulty EMA, and Safety Guardrails.

### Slide 4: The 10-Game Connected Memory World
- Visual spatial, working memory, associative name-face recall, audio music humming, and real family photo memory albums.

### Slide 5: Proprietary Differentiators (Stretch Features)
- **Life-Story Memory Theatre**: Converts personal recorded family anecdotes into choose-your-own-path interactive reminiscence scenes.
- **Family Co-Play Quests**: Multi-generational memory quests where the elder leads as *Chief Storyteller*.
- **Just-in-Time Micro-Interventions**: 1–3 minute context-aware micro-doses (post-lunch melodies, evening observations).
- **Culturally Adaptive Companion**: Regional dialect, festival traditions, and local languages (English + Tamil).

### Slide 6: Safety, Ethics & Privacy
- Zero medical diagnoses; strictly non-diagnostic reminders.
- Pre-LLM distress phrase interception (20+ validated phrases).
- Revocable family consent and role-based guardrails.

---

## 4. Key Differentiator Comparison Matrix

| Feature | Generic Brain Apps (e.g. Lumosity) | Granny Platform (SIH26003) |
| :--- | :--- | :--- |
| **Input Modality** | Tap / Swipe only | **Voice-First** (Speech is primary, 64px tap fallback) |
| **Game Content** | Generic geometric puzzles | **Personalized to Elder's life, home & family photos** |
| **Difficulty Tuning** | Hardcoded per-game levels | **Centralized EMA Adaptive Engine (Accuracy + Latency)** |
| **Safety Guardrails** | None | **Architectural Distress Interception + Caregiver Alert** |
| **Family Inclusion** | Isolated single-player | **Caregiver Circle Dashboard + Asymmetric Co-Play Quests** |
| **Cognitive Reminiscence** | None | **Life-Story Interactive Memory Theatre** |
