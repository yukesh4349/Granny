# Granny — Web Application Full Technical Architecture & Mobile Conversion Guide

> **Document Version:** 2.0  
> **Author:** Antigravity AI Engineering Team  
> **Project:** Granny — AI-Powered Cognitive Companion & Nostalgia Memory Vault for Elderly Care  
> **Workspace Directory:** `d:\SIH 2026\Granny`  

---

## 1. Executive Summary & Vision

**Granny** is an accessible, culturally-attuned AI platform designed for senior citizens (specifically tailored to Indian and Tamil cultural heritage) and their family caregivers. 

The system operates on a **Dual-Portal Architecture**:
1. **Elder Sanctuary**: High-contrast, large tactile touch targets, voice-first interaction, zero-distraction layout, soothing temple bell reminders, 20 culturally rich cognitive memory games, 1-tap family calls, and an instant emergency SOS siren.
2. **Caregiver Control Center**: Real-time linked elder monitoring, activity logs, cognitive game time limits, medication schedule management, photo vault uploads, and real-time health alert triage extracted automatically by AI during elder conversations.

---

## 2. Complete Technology Stack

### 2.1 Web Frontend
| Layer | Technology | Details & Purpose |
| :--- | :--- | :--- |
| **Framework** | React 18 + TypeScript | Component-based, type-safe reactive UI |
| **Build Tool** | Vite 5.x | Ultra-fast HMR and optimized production bundling |
| **Styling** | Vanilla CSS Design System | Custom accessible tokens, high-contrast palette, fluid typography, pulse/ripple animations, zero external bulky CSS runtime |
| **Audio Engine** | Web Audio API (`audioChime.ts`) | Algorithmic synthesis for Indian temple bells, pill reminders, SOS emergency sirens, and incoming call tones |
| **Voice & Speech** | Web Speech Recognition API + Web Speech Synthesis | Real-time speech-to-text and compassionate text-to-speech feedback |
| **Internationalization** | Custom Multi-Language Engine (`i18n.ts`) | Full bilingual support in **Tamil (தமிழ்)** and **English** |

### 2.2 Backend & Cloud Infrastructure
| Component | Provider / Tool | Purpose |
| :--- | :--- | :--- |
| **Database** | Supabase (PostgreSQL 15 + pgvector) | Profiles, medication schedules, memories, activity logs, game scores, link codes |
| **Real-time Engine** | Supabase Realtime (WebSockets) | Instant notification dispatch for SOS sirens, medication alerts, and caregiver health triggers |
| **Storage** | Supabase Storage Buckets | Encrypted storage for family photos (`family-vault`), voice notes, and memory archives |
| **Authentication** | Supabase Auth | Email/Password, Magic Link, and 6-Character Elder Link Codes (`GRN-XXXX`) |

### 2.3 AI & Cloud LLM Pool
| Engine | Model / Service | Function |
| :--- | :--- | :--- |
| **Groq AI Cloud Pool** | Llama 3.3 70B Versatile | **4 API Key Pool** with round-robin rotation & 429 rate-limit auto-failover |
| **Dynamic Game Generator** | Groq AI Engine | Produces 100% novel, non-repeating game questions tailored to the elder's profile |
| **Asha Dual-Output Analyzer** | Groq AI NLP | Simultaneously generates compassionate conversation replies, extracts biographical memories, and flags health safety concerns |
| **Google Gemini API** | Gemini 2.0 Flash / Pro | Secondary fallback for multilingual audio transcription & cognitive analysis |
| **Photography CDN** | Pexels API & Curated Cultural CDN | High-resolution photographs of South Indian village life, temples, vintage cinema, spices, and nature |

---

## 3. Web Application Directory Structure

```text
d:\SIH 2026\Granny\
├── .env                               # Root environment configuration (Supabase, 4 Groq Keys, Gemini, Pexels)
├── package.json                       # Monorepo root scripts & workspaces
│
├── apps/
│   ├── web/                           # Primary Web Application (Vite + React)
│   │   ├── index.html                 # HTML entry point with Google Fonts (Inter, Baloo Thambi 2)
│   │   ├── package.json               # Web dependencies
│   │   ├── vite.config.ts             # Vite configuration
│   │   ├── .env                       # Web environment variables
│   │   └── src/
│   │       ├── main.tsx               # React DOM bootstrapping
│   │       ├── App.tsx                # Master orchestration (Routing, Portals, Modals, State)
│   │       ├── index.css              # Universal design system, tokens, and CSS animations
│   │       │
│   │       ├── constants/             # Cultural presets, fallback games, and default profiles
│   │       │   └── index.ts           # 20 Nostalgia games definitions, mock memories, default elders
│   │       │
│   │       ├── features/              # Feature modules
│   │       │   ├── companion/         # Asha Voice Companion chat & speech interfaces
│   │       │   ├── family/            # Family Circle 1-tap call cards & contact management
│   │       │   ├── games/             # 20 Cognitive games (Outdoor, Indoor, Cinema/Music)
│   │       │   │   ├── engine/        # Dynamic question generator, score tracking, timer
│   │       │   │   └── types.ts       # GameItem, GameSession, Category types
│   │       │   ├── health/            # Medication reminders, alarms drawer, taken tracking
│   │       │   ├── memory/            # Nostalgia Vault photo albums, voice memos
│   │       │   └── personalization/   # Elder profile parameters (hobbies, hometown, favorite artists)
│   │       │
│   │       ├── i18n/                  # Multi-language dictionary
│   │       │   └── index.ts           # English & Tamil dictionary strings (`t()` translation helper)
│   │       │
│   │       ├── services/              # External communication services
│   │       │   ├── api.ts             # REST API helpers
│   │       │   ├── groqService.ts     # 4-Key Groq Pool, dynamic game generation, Asha NLP analyzer
│   │       │   ├── supabase.ts        # Database client, auth, realtime subscriptions, CRUD handlers
│   │       │   └── voice/             # Web Speech Synthesis & Recognition wrappers
│   │       │
│   │       ├── utils/                 # Utility functions
│   │       │   └── audioChime.ts      # Web Audio synthesizer (Temple Bell, Med Alarm, SOS Siren, Ringtone)
│   │       │
│   │       └── types/                 # Shared TypeScript interfaces
│   │
│   └── mobile/                        # React Native / Expo Mobile Application
│       ├── app.json                   # Expo configuration & plugins
│       ├── package.json               # Mobile dependencies
│       └── src/                       # Mobile screens, navigation, and components
│
├── others/                            # Documentation, blueprints, and architecture specs
│   ├── COMPLETE_FLOW.md               # User journey & functional flows
│   ├── Granny_Master_Build_Blueprint.pdf
│   └── WEB_APP_FULL_SPEC_AND_MOBILE_CONVERSION_GUIDE.md  <-- THIS FILE
│
└── supabase/
    └── migrations/                    # SQL Database Schemas, RLS Policies, Link Code Tables
        ├── 001_initial_schema.sql
        ├── 002_pgvector_memories.sql
        ├── 003_caregiver_linkage.sql
        └── 004_fix_link_codes_and_auth.sql
```

---

## 4. Full Functional Specifications & Options Inside the Web App

### 4.1 Landing Page & Role Entry
- **Dual 1-Tap Entry**: Immediate 1-tap demo access to *Elder Sanctuary* or *Caregiver Control Center* without mandatory sign-in friction.
- **Cultural Language Switcher**: Floating pill to toggle instantly between **English** and **தமிழ் (Tamil)** across all screens.
- **Pillars Overview**: Showcases Cognitive Stimulation, Family Nostalgia, Voice Companion, and Health Safety.

### 4.2 Elder Sanctuary (Elder Interface)
Designed with maximum accessibility:
- **Zero Clutter Home Grid**: 
  1. *Asha Voice AI Companion* (Large smiling avatar, 1-tap voice chat).
  2. *Brain Games (20 Nostalgia Games)* with dynamic personalized questions.
  3. *Family Circle (1-Tap Calls)* with quick-dial audio ringtones.
  4. *Nostalgia Vault (Photo & Voice Memories)*.
- **Top Quick Bar**:
  - **🚨 Instant SOS Button**: Emits a loud pulsing siren on both elder and linked caregiver portals with an urgent broadcast overlay.
  - **💊 Health & Alarms Tab**: Slide-over drawer containing the elder's daily medicine schedule, dosage instructions, and "Taken" status.
  - **Role Switcher & Language Switcher**.
- **Asha Voice Companion Screen**:
  - Voice-activated or typed conversational interface.
  - Real-time animated voice wave listening state.
  - Dual background extraction: saves memories automatically and sends health safety alerts to the caregiver if pain/symptoms are mentioned.
- **20 Cultural Cognitive Games**:
  - **Outdoor Heritage (10)**: *Nondi (Hopscotch), Kanche (Marbles), Gilli Danda, Pallanguzhi, Dhayakkattai, Seven Stones, Kabaddi Clues, Tyre Vandi, Kitti Pull, Maram Kothu*.
  - **Indoor Strategy (5)**: *Thayam, Paramapadham (Snakes & Ladders), Aadu Puli Aattam, Pandi, Stone Counting*.
  - **Cinema & Arts (5)**: *1970s MGR/Sivaji Cinema, Carnatic Ragas, Vintage Radio, Spices of Tamil Kitchen, Temple Bells & Festivals*.
  - **Game Play Screen**:
    - High-definition cultural photographs.
    - Non-repeating multiple-choice questions dynamically generated by Groq LLM.
    - Real-time score badges, gentle chimes on correct answers, and celebratory completion modals.
- **Medication Alert Overlay**:
  - Full-screen modal triggered automatically when medicine time arrives.
  - Resonant temple bell chime pulse ring.
  - "Mark as Taken" and "Snooze 5 Mins" buttons.

### 4.3 Caregiver Control Center (Caregiver Interface)
- **Multi-Elder Management**:
  - View all linked elders, current status, and connection codes (`GRN-XXXX`).
  - Add new elders via 6-character link code pairing.
- **Elder Activity Stream**:
  - Detailed chronological log of game sessions, scores, memory recall accuracy, and conversational summaries.
  - Total daily cognitive exercise time counter.
- **Daily Game Time Limit Slider**:
  - Adjustable limit (e.g., 15 mins to 120 mins).
  - Automatically locks games on the elder portal once the daily limit has elapsed to prevent fatigue.
- **Medication Schedule Controller**:
  - Add/modify prescriptions, dosage times (Morning, Afternoon, Evening, Night), and instructions.
- **Critical Health Safety Feed**:
  - Urgent alerts triaged from Asha AI conversations (e.g., "Elder reported dizziness and knee pain").
- **Nostalgia Vault Manager**:
  - Upload family photographs, add captions, tag family members, and attach recorded voice messages.

---

## 5. Mobile App Conversion Guide (React Native / Expo)

To convert the web application into a native mobile app for Android and iOS using **Expo / React Native**, follow this direct component-by-component architectural mapping:

### 5.1 Architecture & Primitive Mapping Table

| Web Component / Web API | React Native / Expo Equivalent | Recommended Library |
| :--- | :--- | :--- |
| `<div>`, `<section>`, `<article>` | `<View>`, `<SafeAreaView>` | `react-native`, `react-native-safe-area-context` |
| `<p>`, `<span>`, `<h1>` - `<h6>` | `<Text style={...}>` | `react-native` (Must wrap all text in `<Text>`) |
| `<button className="card-interactive">` | `<TouchableOpacity>`, `<Pressable>` | `react-native` (Supports `onPress` & active opacity) |
| `<input type="text">`, `<textarea>` | `<TextInput>` | `react-native` |
| `<img>` | `<Image source={{ uri: ... }}>` | `expo-image` (Faster caching & WebP support) |
| Web Audio API (`audioChime.ts`) | Audio Player / Sound Object | `expo-av` |
| Speech Recognition (`webkitSpeechRecognition`) | Native Speech-to-Text | `@react-native-voice/voice` or `expo-speech-recognition` |
| Text to Speech (`speechSynthesis`) | Native Text-to-Speech | `expo-speech` |
| Local Storage (`localStorage`) | Secure Async Storage | `@react-native-async-storage/async-storage` & `expo-secure-store` |
| Slide Drawer / Tabs | Bottom Tabs & Drawer Navigation | `@react-navigation/bottom-tabs`, `@react-navigation/drawer` |
| Modals (SOS / Medicine Alert) | Native Modal Component | `<Modal transparent animationType="slide">` |
| Realtime Notifications | Native Push & Local Notifications | `expo-notifications` |
| Haptic Feedback | Device Vibration / Haptics | `expo-haptics` |

---

### 5.2 Mobile Component Hierarchy (`apps/mobile/src`)

```text
apps/mobile/src/
├── navigation/
│   ├── RootNavigator.tsx              # Role check & Auth conditional navigation
│   ├── ElderTabNavigator.tsx          # Elder sanctuary bottom tab bar (Home, Games, Asha, Memories)
│   └── CaregiverTabNavigator.tsx      # Caregiver dashboard tabs (Elders, Activity, Meds, Alerts)
│
├── screens/
│   ├── landing/
│   │   └── LandingScreen.tsx          # 1-Tap Role select, Language switcher
│   ├── elder/
│   │   ├── ElderHomeScreen.tsx        # Tactile 4-card grid & SOS header
│   │   ├── AshaCompanionScreen.tsx    # Voice chat screen with pulsating microphone button
│   │   ├── BrainGamesScreen.tsx       # 20 Games category grid
│   │   ├── GamePlayScreen.tsx         # Active game screen with cultural images & dynamic Groq Qs
│   │   ├── FamilyCircleScreen.tsx     # 1-Tap speed dial cards
│   │   ├── NostalgiaVaultScreen.tsx   # Photo albums & voice player
│   │   └── MedicationDrawerScreen.tsx # Medicine schedule & taken tracker
│   └── caregiver/
│       ├── CaregiverDashboardScreen.tsx # Linked elders overview, time limits, activity stream
│       ├── HealthAlertsScreen.tsx     # Urgent health notifications triage
│       ├── MedicationManagerScreen.tsx# Add/edit prescriptions
│       └── MemoryUploadScreen.tsx     # Photo picker & memory creator
│
├── components/
│   ├── common/
│   │   ├── AccessibleButton.tsx       # Large touch target button with Haptic feedback
│   │   ├── HighContrastText.tsx       # Standardized WCAG AAA typography
│   │   ├── SosHeaderButton.tsx        # Pulsing SOS button with siren trigger
│   │   └── LanguageSwitchPill.tsx     # Floating Tamil/English toggle
│   └── modals/
│       ├── MedicationAlertModal.tsx   # Native modal with sound & snooze options
│       └── IncomingCallModal.tsx      # Full-screen incoming family call screen
│
├── services/
│   ├── audioService.ts                # Expo-AV implementation of temple bells & sirens
│   ├── groqService.ts                 # Shared TypeScript Groq 4-Key Pool & Dynamic LLM Engine
│   ├── supabase.ts                    # Supabase mobile client with Async Storage persistence
│   └── voiceService.ts                # Expo-Speech & Speech-to-Text handlers
│
└── theme/
    ├── colors.ts                      # Warm Sage (`#2D5A43`), Saffron (`#E65100`), Terracotta
    └── typography.ts                  # Elder font size scale (22px base, 28px header, 36px hero)
```

---

### 5.3 Code Conversion Examples

#### A. Audio Chimes Conversion (`audioChime.ts` Web ➔ `audioService.ts` Mobile)

**Web (`audioChime.ts` using Web Audio API):**
```typescript
const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
const osc = ctx.createOscillator();
osc.frequency.setValueAtTime(432, ctx.currentTime);
// ...
```

**Mobile (`audioService.ts` using `expo-av`):**
```typescript
import { Audio } from 'expo-av';

export async function playTempleBellChime() {
  const { sound } = await Audio.Sound.createAsync(
    require('../../assets/sounds/temple_bell.mp3')
  );
  await sound.playAsync();
}

export async function playSosSirenAudio() {
  const { sound } = await Audio.Sound.createAsync(
    require('../../assets/sounds/sos_alarm.mp3'),
    { shouldLoop: true, volume: 1.0 }
  );
  await sound.playAsync();
  return sound; // Can be stopped when alert dismissed
}
```

#### B. Accessible Button Conversion with Haptics

**Mobile Component (`AccessibleButton.tsx`):**
```tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

interface Props {
  title: string;
  icon?: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'secondary';
}

export const AccessibleButton: React.FC<Props> = ({ title, icon, onPress, variant = 'primary' }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress();
  };

  return (
    <TouchableOpacity 
      style={[styles.btn, styles[variant]]} 
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    minHeight: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginVertical: 8,
  },
  primary: { backgroundColor: '#2D5A43' },
  danger: { backgroundColor: '#C62828' },
  secondary: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#D1C4E9' },
  text: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  icon: { fontSize: 28, marginRight: 12 },
});
```

#### C. Shared AI Engine (`groqService.ts`)
The `groqService.ts` engine requires **zero changes** to its core business logic when running in React Native. It runs pure TypeScript using standard `fetch()`, handles 4-key rotation, non-repeating question hashing, and Asha NLP extraction identically on both Web and Mobile.

---

## 6. Mobile Conversion Checklist & Deployment Steps

1. **Initialize Project Assets**:
   - Ensure local MP3 audio assets (`temple_bell.mp3`, `pill_reminder.mp3`, `sos_alarm.mp3`, `ringtone.mp3`) are placed in `apps/mobile/assets/sounds/`.
2. **Install Expo Native Modules**:
   ```bash
   npx expo install expo-av expo-speech expo-haptics expo-notifications expo-image expo-image-picker expo-secure-store @react-native-async-storage/async-storage
   ```
3. **Configure Permissions in `app.json`**:
   - `RECORD_AUDIO` (For Asha voice interaction)
   - `VIBRATE` (For tactile haptic feedback)
   - `POST_NOTIFICATIONS` (For medication reminders and emergency SOS)
4. **Run Dev Environment**:
   ```bash
   cd apps/mobile
   npm run start
   ```
5. **Build Standalone APK / Bundle**:
   ```bash
   eas build -p android --profile preview
   ```

---

*End of Technical Specification Document.*
