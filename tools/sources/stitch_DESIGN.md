---
name: Israeli Tourism Matriculation Portal
colors:
  surface: '#fff8f3'
  surface-dim: '#e0d9d2'
  surface-bright: '#fff8f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf2eb'
  surface-container: '#f4ede6'
  surface-container-high: '#eee7e0'
  surface-container-highest: '#e9e1db'
  on-surface: '#1e1b17'
  on-surface-variant: '#444840'
  inverse-surface: '#33302c'
  inverse-on-surface: '#f7efe9'
  outline: '#75786f'
  outline-variant: '#c5c8bd'
  surface-tint: '#536348'
  primary: '#28361f'
  on-primary: '#ffffff'
  primary-container: '#3e4d34'
  on-primary-container: '#acbd9d'
  inverse-primary: '#bbccac'
  secondary: '#9e4225'
  on-secondary: '#ffffff'
  secondary-container: '#fe8b69'
  on-secondary-container: '#752409'
  tertiary: '#4f2800'
  on-tertiary: '#ffffff'
  tertiary-container: '#6f3b00'
  on-tertiary-container: '#ffa24c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e8c6'
  primary-fixed-dim: '#bbccac'
  on-primary-fixed: '#121f0a'
  on-primary-fixed-variant: '#3c4b32'
  secondary-fixed: '#ffdbd1'
  secondary-fixed-dim: '#ffb59f'
  on-secondary-fixed: '#3a0a00'
  on-secondary-fixed-variant: '#7e2b10'
  tertiary-fixed: '#ffdcc2'
  tertiary-fixed-dim: '#ffb77a'
  on-tertiary-fixed: '#2e1500'
  on-tertiary-fixed-variant: '#6d3a00'
  background: '#fff8f3'
  on-background: '#1e1b17'
  surface-variant: '#e9e1db'
typography:
  display-hero:
    fontFamily: Newsreader
    fontSize: 44px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: 0em
  headline-md:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Newsreader
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system serves high school students, matriculation teachers, and educational coordinators preparing for the official Israeli Tourism Matriculation Exam (שאלון 880387). The product blends academic prestige, national heritage, and pastoral exploration into an authoritative yet inviting digital workspace.

### Design Direction
- **Style:** Academic Editorial Minimalism meets Warm Mediterranean Groundedness. The interface avoids cold institutional bureaucracy in favor of tactile, museum-grade pedagogy: generous whitespace, refined hairline dividers, deliberate typographic hierarchy, and warm earth-toned surfaces reminiscent of local stone, terracotta, and olive groves.
- **Tone:** Dignified, scholarly, intuitive, and reassuring during high-stakes exam preparation.
- **RTL-Native Ergonomics:** All layout geometry, reading paths, visual anchors, icon directions, and navigation cues are strictly designed from right to left (`dir="rtl"`).

## Colors

The color palette captures the natural landscape of Israel—from the Judean desert hills to ancient olive orchards—balancing grounding earthy tones with academic clarity.

### Functional Roles
- **Primary (`#3E4D34` Deep Desert Olive):** Core brand anchor. Used for primary navigation headers, high-level subject categories, exam code callouts, key buttons, and active structural states. Deep state variant: `#2A3624`.
- **Secondary (`#C15C3D` Terracotta / Clay):** Action, editorial emphasis, primary interactive highlights, active filter indicators, and urgent revision milestones. Darker hover variant: `#A3482C`.
- **Tertiary (`#D9822B` Sunlit Amber):** Highlights, audio/podcast media flags, warning statuses, and teacher notes/recommendations.
- **Neutrals & Surfaces:**
  - Base canvas: `#FBF8F2` (Stone Cream).
  - Raised cards & containers: `#FFFFFF` (Pure White) and `#F4EFE6` (Desert Sand).
  - Borders & Hairlines: `#E8DFD1` (Limestone Border).
  - Body Typography: `#24211D` (Deep Earth Slate) for high contrast and legibility.
  - Secondary/Caption Typography: `#4A463E` (Muted Umber).

## Typography

Typographic execution emphasizes bilingual balance and academic dignity. Headings utilize a refined literary serif font family to convey the tradition and state-level status of the matriculation curriculum, while body and functional controls use an ultra-legible, modern sans-serif typeface optimized for Hebrew reading comprehension.

### Application Rules
- **Editorial Headings:** Use serif styling strictly for main unit titles, exam block headers, and section landmarks. Maintain generous line height (`1.3` to `1.4`) to accommodate Hebrew vowel marks (Nikud) if present.
- **Pedagogical Body:** All reading passages, study summaries, and unit overviews run on the body sans-serif scale, keeping line lengths between 58 and 72 characters per line for optimal scanning.
- **Numbers & Matriculation Codes:** Exam questionnaires (e.g., 880387) and chapter notations must retain monospaced or tabular numeral properties within label tokens to prevent text jumping.

## Layout & Spacing

The portal is built around a responsive 12-column fluid grid system with structural right-to-left layout constraints.

### Breakpoints & Adaptive Rhythm
- **Desktop (1280px+):** 12-column grid, `margin`: `2.5rem`, `gutter`: `1.5rem`. Max container constraint is capped at `1320px` to maintain comfortable readability.
- **Tablet (768px – 1279px):** 8-column layout, `margin`: `1.5rem`, `gutter`: `1.25rem`. Sticky sub-navigation for regions collapses into an edge-faded horizontal scroll lane.
- **Mobile (< 768px):** 4-column layout, `margin`: `1rem`, `gutter`: `1rem`. Floating bottom action bar houses core filter/search actions.

### Right-to-Left Layout Philosophy
- The visual flow begins at the top-right corner with the state emblem, matriculation questionnaire identifier badge, and breadcrumbs.
- Asymmetrical study cards display media indicators and iconography docked to the right, directing the user's scan sequence naturally through title, meta description, and download buttons docked on the left.

## Elevation & Depth

This design system avoids heavy shadows, adopting soft tactile surfaces, subtle border boundaries, and natural ambient light mimicking Mediterranean sunlight.

### Depth Strategy
- **Layer 0 (Canvas Base):** Ground color `#FBF8F2`.
- **Layer 1 (Card & Content Blocks):** Flat `#FFFFFF` panels framed by subtle 1px `#E8DFD1` outlines. On hover, apply a diffused ambient drop: `box-shadow: 0 8px 24px -4px rgba(36, 33, 29, 0.06), 0 2px 6px -1px rgba(36, 33, 29, 0.04)`.
- **Layer 2 (Sticky Region Bar & Modals):** Backdrop-filtered navigation strip using `background: rgba(251, 248, 242, 0.88)` with a `12px` blur and a crisp bottom edge border `#E8DFD1`.
- **Layer 3 (Overlays, Feedback Panels & Drawers):** High-focus sheets layered with a tinted scrim (`rgba(36, 33, 29, 0.45)`) and soft deep falloff shadow (`0 20px 40px -8px rgba(36, 33, 29, 0.16)`).

## Shapes

The portal implements soft, tailored corner radiuses (`roundedness: 1`), conveying structured pedagogical authority rather than overly playful or casual consumer tech.

### Radius Assignments
- **Core Panels & Resource Cards:** `0.5rem` (soft-lg). Balances box geometry with gentle corners.
- **Buttons, Form Inputs & Filters:** `0.25rem` (soft-base). Delivers sharp, distinct click targets.
- **Format Indicator Chips & Badges:** Full pill radius (`9999px`) to visually differentiate metadata and status chips from interactive rectangular cards and action triggers.

## Components

### 1. Resource Media Pills (7 Distinct Material Types)
Resource chips identify the specific format of study content. All chips use pill geometry (`9999px`), right-aligned mini format icons, and explicit Hebrew labeling:
- **מצגת (Presentation):** Olive tint background (`rgba(62, 77, 52, 0.08)`), text `#3E4D34`, border `#3E4D34/20`.
- **סרטון מבוא (Intro Video):** Terracotta tint (`rgba(193, 92, 61, 0.08)`), text `#C15C3D`, border `#C15C3D/20`.
- **הסכת / פודקאסט (Podcast):** Amber tint (`rgba(217, 130, 43, 0.10)`), text `#A65F17`, border `#D9822B/25`.
- **יחידת מט״ח (Matah Unit):** Slate blue-olive tint (`rgba(42, 54, 36, 0.08)`), text `#2A3624`, border `#2A3624/20`.
- **דף עבודה - PDF (PDF Worksheet):** Deep clay accent (`rgba(163, 72, 44, 0.09)`), text `#A3482C`, border `#A3482C/20`.
- **דף עבודה - Word (Editable Doc):** Warm stone neutral (`rgba(74, 70, 62, 0.08)`), text `#4A463E`, border `#4A463E/20`.
- **משוב והערכת מורה (Teacher Feedback):** Laurel sage background (`rgba(62, 77, 52, 0.15)`), text `#24211D`, border `#3E4D34/30`.

### 2. Sticky Geographic Navigation Bar
- Positioned immediately beneath the main header.
- Displays regional Israeli study clusters: **הגליל והגולן**, **מישור החוף והשפלה**, **ירושלים וסביבתה**, **מדבר יהודה וים המלח**, **הנגב והערבה**.
- Features smooth horizontal scrolling for touchscreens with directional edge gradients.
- Active item uses an under-line border in Terracotta (`#C15C3D`, 3px height) and bold weight.

### 3. Study Resource Cards
- Constructed with a `#FFFFFF` body and `#E8DFD1` 1px border.
- Layout order (RTL):
  1. Top bar: Format Pill on the right; exam sub-topic code badge on the left.
  2. Body: Serif sub-heading (`headline-sm`), followed by 2 lines of descriptive synopsis in `#4A463E`.
  3. Footer: Estimated study time (e.g., ״20 דקות״), file size or external indicator, and prominent download/launch button anchored to the left.

### 4. Search & Filter Bar
- Single-line search input with an inset magnifying glass icon pinned to the right edge.
- Accompanied by segmented multi-select filter tags for "סוג תוכן" (Content Type), "אזור בארץ" (Region), and "רמת קושי/תרגול" (Difficulty/Format).
- Features clear count indicators showing available materials per selection.

### 5. Exam Questionnaire Badge (תג שאלון 880387)
- Compact, prominent identity chip placed beside the main site title.
- Deep Olive container (`#3E4D34`), pure white monospaced typography, and subtle inner glow (`inset 0 0 0 1px rgba(255,255,255,0.2)`).