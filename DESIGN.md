---
name: Memory Journey
colors:
  surface: '#f5fbf6'
  surface-dim: '#d6dbd7'
  surface-bright: '#f5fbf6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff5f0'
  surface-container: '#e9efea'
  surface-container-high: '#e4eae5'
  surface-container-highest: '#dee4df'
  on-surface: '#171d1a'
  on-surface-variant: '#404942'
  inverse-surface: '#2c322f'
  inverse-on-surface: '#ecf2ed'
  outline: '#707972'
  outline-variant: '#bfc9c0'
  surface-tint: '#2a6a48'
  primary: '#206140'
  on-primary: '#ffffff'
  primary-container: '#3b7a57'
  on-primary-container: '#c5ffd8'
  inverse-primary: '#93d5ac'
  secondary: '#974818'
  on-secondary: '#ffffff'
  secondary-container: '#fc9761'
  on-secondary-container: '#742e00'
  tertiary: '#00579d'
  on-tertiary: '#ffffff'
  tertiary-container: '#1e70c0'
  on-tertiary-container: '#edf2ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#aff1c6'
  primary-fixed-dim: '#93d5ac'
  on-primary-fixed: '#002111'
  on-primary-fixed-variant: '#0a5132'
  secondary-fixed: '#ffdbcb'
  secondary-fixed-dim: '#ffb692'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#793101'
  tertiary-fixed: '#d4e3ff'
  tertiary-fixed-dim: '#a4c9ff'
  on-tertiary-fixed: '#001c39'
  on-tertiary-fixed-variant: '#004883'
  background: '#f5fbf6'
  on-background: '#171d1a'
  surface-variant: '#dee4df'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.01em
  display-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.005em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 34px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 30px
  body-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '400'
    lineHeight: 34px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 26px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 2rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1.25rem
  space-lg: 2rem
  space-xl: 3rem
---

## Brand & Style

This design system is tailored for an AI-assisted cognitive engagement experience built for older adults and their supporting families. The brand personality is dignified, compassionate, reassuring, and restorative—deliberately shedding the sterile, clinical tropes of traditional medical software in favor of an inviting, sensory-rich sanctuary. 

The aesthetic is Tactile Organic Minimalism:
- Grounded in tactile warmth, subtle paper-like surfaces, and organic serenity.
- High physical legibility, forgiving interaction spaces, and clear cognitive wayfinding.
- Visual pacing is deliberate and gentle, reducing cognitive fatigue through expansive spacing and low-friction interactions.
- Every state shift evokes peace, encouragement, and cognitive empowerment rather than diagnostic urgency.

## Colors

The color palette centers on warm, restorative earth tones paired with high-contrast, readable neutrals to ensure effortless accessibility (conforming to WCAG AAA standards for text).

- **Primary (`#3B7A57` / Sage Green):** Used for main affirmative actions, progress indicators, and stabilizing focal points. Evokes vitality, clarity, and calm focus.
- **Secondary (`#C86D3B` / Warm Terracotta):** Used for creative moments, prompts, memory anchors, and heartfelt milestone accomplishments.
- **Tertiary (`#4A90E2` / Soft Sky Blue):** Reserved for contextual cognitive assistance, audio playbacks, and subtle informational highlights.
- **Neutrals & Surfaces:**
  - Base Canvas: `#FBF9F5` (Warm Cream), with inset paneling in `#F5F1EA` and `#EFE9DE`.
  - Surface Cards: `#FFFFFF` layered over warm tints, bound by `#E8E2D6` borders.
  - Text Primary: `#242A27` (Deep Forest Charcoal) providing a 12:1 contrast ratio against base creams.
  - Text Secondary: `#4A5550` (Muted Slate Sage) for subtitles, metadata, and timestamps.

## Typography

Typography prioritizes maximum legibility and reduced ocular stress for aging eyes. `Plus Jakarta Sans` is selected across all roles for its wide apertures, clear distinguishing character geometries, and balanced humanist rhythm.

- **Scale Floor:** The base body size never drops below 16px, with standard instructional narrative resting at 18px (`body-lg`) or 22px (`body-xl`).
- **Line Heights:** Generously budgeted between 1.5x and 1.65x to guarantee easy tracking across wide lines.
- **Letter Spacing:** Extended tracking (+0.01em to +0.03em) on body copy and interface labels avoids optical letter clustering.
- **Hierarchy:** Limited to simple, unambiguous visual tiers to prevent reading overwhelm.

## Layout & Spacing

The layout is anchored on a 12-column desktop fluid-responsive grid system designed specifically for comfortable desktop and large-tablet interactions:
- **Maximum Content Width:** Capped at `1360px` to maintain comfortable focal bounds and prevent horizontal head-scanning strain.
- **Margins & Gutters:** Generous 48px (`3rem`) page margins keep edges clear, with 32px (`2rem`) gutters providing natural physical breathing room between structural cards.
- **Pacing:** Vertical stack spacing uses `space-lg` (32px) and `space-xl` (48px) as primary section intervals. Items are never packed densely; cognitive breathing room is a functional requirement.

## Elevation & Depth

Visual hierarchy employs warm, ambient light scattering rather than sharp drop shadows, avoiding visually noisy borders and jarring skeuomorphic extremes:

- **Surface Tiers:**
  - Base canvas sits on `#FBF9F5`.
  - Secondary containers and wells nestle into `#F5F1EA`.
  - Primary interactive panels elevate on pure or tinted ivory (`#FFFFFF` with subtle 1.5px borders in `#E8E2D6`).
- **Ambient Lighting:** Shadows are soft, low-opacity, and warm-tinted using primary slate (`rgba(36, 42, 39, 0.05)`) with an extended blur radius (16px to 32px) and gentle Y-offsets (4px to 8px).
- **Interactive Rise:** On focus or hover, interactive panels elevate slightly (blur extends to 40px, Y-offset to 8px) with a warmer ambient rim, providing explicit yet gentle spatial confirmation.

## Shapes

The physical language prioritizes comfort and safety through softened forms:
- Small controls (chips, inputs, button states) utilize `rounded-lg` (16px).
- Major focal surfaces (cards, memory drawers, modal prompts) employ `rounded-xl` (24px).
- Sharp 90-degree corners are strictly avoided across all visual tiers to maintain a gentle, reassuring environment.

## Components

### Buttons
- **Touch/Click Target:** Strict minimum height of `56px` with horizontal padding of `28px` to ensure effortless motor acquisition.
- **Primary:** Background `#3B7A57`, text `#FFFFFF`, border-radius 16px. Focus rings display an outer 4px offset ring in `#4A90E2` at 60% opacity.
- **Secondary:** Background `#F5F1EA`, border 1.5px `#E8E2D6`, text `#242A27`.
- **States:** Hover introduces gentle darkening and slight scale; active press shows a 2px downward settle.

### Cards & Memory Tiles
- Minimum padding is `32px`. 
- Base background `#FFFFFF`, boundary border `1.5px solid #E8E2D6`, corner radius `24px`.
- Memory journey elements contain large visual thumbnails (aspect-ratio 16:10 or 1:1) with generous image margins and warm tone overlays.

### Form Inputs & Prompts
- Input field heights are standardized at `56px`, using large 18px body text.
- Fill is `#FFFFFF` with a `1.5px` border in `#E8E2D6`. On focus, the border transitions to `#3B7A57` alongside a soft `0 0 0 3px rgba(59, 122, 87, 0.15)` glow ring.
- Placeholder text is distinctly legible at `#4A5550` with clear labels permanently anchored above the field.

### Interactive Chips & Topic Tags
- Height is fixed at `44px` with `20px` horizontal padding.
- Neutral state: Fill `#F5F1EA`, border `1px solid #E8E2D6`, text `#242A27`.
- Selected state: Fill `#3B7A57`, text `#FFFFFF`, with an included checkmark icon for unambiguous status recognition.

### Audio & AI Voice Prompt Controller
- A dedicated sensory module featuring a persistent, clear `64px` circular play/pause button tinted in `#4A90E2`.
- Visual wave indicators using warm sage tones depict active AI listening and speech playback without startling flashes or rapid animations.