# 🧪 Automated Test Suite (`/tests`)

This directory contains the **end-to-end integration, real-time data contract, and system smoke test suites** for the **Granny AI-Powered Elderly Companion Platform**.

---

## 📁 Directory Structure & Purpose

| Test Suite | File | Purpose |
|:---|:---|:---|
| **E2E Integration** | [`e2e-integration.test.ts`](file:///d:/SIH%202026/Granny/tests/e2e-integration.test.ts) | Validates all 20 cognitive heritage games, pre-LLM emergency distress triggers (Tamil & English regex), Exponential Moving Average (EMA) adaptive difficulty, and bilingual localization completeness. |
| **Data Contracts & Sync** | [`sync-contract.test.ts`](file:///d:/SIH%202026/Granny/tests/sync-contract.test.ts) | Verifies `BroadcastChannel` real-time sync event schemas, role persistence, and CRUD entity validation for reminders, clinical reports, memories, and SOS events. |
| **System Architecture Smoke** | [`system-smoke.test.ts`](file:///d:/SIH%202026/Granny/tests/system-smoke.test.ts) | Validates declarative React Router route structures, role-based access control (RBAC), and WebAudio synthesis profiles. |

---

## 🚀 Running the Tests

### 1. Run the Entire Test Suite
From the root repository directory, run:
```bash
npm test
```

### 2. Run Individual Test Suites
```bash
# Run End-to-End Integration Tests (20 games, safety, EMA, i18n)
npx ts-node tests/e2e-integration.test.ts

# Run Real-Time Data Sync & Contract Tests
npx ts-node tests/sync-contract.test.ts

# Run System Architecture Smoke Tests
npx ts-node tests/system-smoke.test.ts
```

---

## 🎯 Test Coverage Areas

### 1. Cognitive Game Engine
- **20 Heritage Games Registry**: 10 Outdoor games (Pandi, Gilli Danda, Dayakattai, Pallanguzhi, etc.), 5 Indoor games (Aadu Puli Aattam, Dhayam, etc.), 5 Classic Cinema Nostalgia games (MGR, Sivaji Ganesan, MSV, Gemini Ganesan, Old Tamil Songs).
- **Session Lifecycle**: Verification that every single game initializes with randomized item pools, prompts, choices, and correct answer keys.

### 2. Pre-LLM Emergency Distress Guardrail
- Sub-50ms deterministic regex pattern matching for both **Tamil** and **English** emergency distress cues (`"fell down"`, `"chest pain"`, `"cannot breathe"`, `"மயக்கம் வருகிறது"`, `"நெஞ்சு வலிக்கிறது"`, etc.).
- Negative assertion verification ensuring ordinary nostalgic and morning greeting conversations are never falsely flagged.

### 3. Adaptive Difficulty Math
- Mathematical validation of the Exponential Moving Average formula ($\alpha = 0.3$) ensuring difficulty scales smoothly under consistent performance without abrupt cliff drops.

### 4. Bilingual Localization
- Ensures 100% dictionary key parity between English (`en`) and Tamil (`ta`) across navigation, games, companion dialogue, settings, and caretaker portals.
