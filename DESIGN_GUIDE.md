# FinFlow ERP — Accessible Senior-Friendly Design System & Guide
**Product by MSR Solutions | Private Finance Management**

---

## 1. Design Principles & Target Audience
- **Target Persona**: Business owners, traders, senior accountants, and branch managers (50+ years old) in Tamil Nadu / South India reading in English.
- **Visual Needs**:
  - Reduced near vision: High-contrast typography, large minimum sizes (18px base text, 36–48px KPI numbers).
  - Reduced fine motor precision: Minimum tap targets of 56×56px (48px absolute min) with generous 12px+ spacing.
  - Bright daylight usage: WCAG 2.2 AAA text contrast (>7:1 standard, >12:1 on dark headers).
  - Cultural warmth & familiarity: Deep Kungumam Maroon (`#8B1A1A`), Turmeric Gold (`#B7791F`), Warm Off-White (`#FAF7F2`), crisp white cards with solid 2px stone borders.

---

## 2. Design Tokens

### Color Palette
| Token Name | Hex Code | Purpose / Application |
| :--- | :--- | :--- |
| **Primary Maroon** (`maroon-800`) | `#8B1A1A` | Header bars, active navigation, primary action buttons, branding accents. |
| **Dark Maroon** (`maroon-900`) | `#671010` | High-contrast headings, text links, active drawer borders. |
| **Turmeric Gold** (`gold-600`) | `#B7791F` | Subtle highlight borders and indicators (never for small text). |
| **Surface Background** (`surface-bg`) | `#FAF7F2` | Warm off-white global background (easy on the eyes in daylight). |
| **Surface Card** (`surface-card`) | `#FFFFFF` | Crisp white card containers with 2px solid stone borders. |
| **Text Primary** (`text-stone-900`) | `#1C1917` | High contrast body text (>14:1 contrast on white). |
| **Text Secondary** (`text-stone-600`) | `#57534E` | Secondary captions, helper text (>4.5:1 contrast). |
| **Success Green** (`status-paid`) | `#1F6B3A` | "Paid ✓", "Active ✓", settled collections, positive totals. |
| **Warning Amber** (`status-pending`) | `#B45309` | "Pending ⏱", "Upcoming ⏱", warning alerts. |
| **Danger Red** (`status-overdue`) | `#B91C1C` | "Overdue !", "High Risk !", destructive delete actions. |
| **Info Blue** (`status-draft`) | `#1E3A8A` | "Draft ✎", journal transaction indicators, helper pills. |

### Typography Hierarchy
- **Primary Fonts**: `Inter, Noto Sans, system-ui, sans-serif` (no thin/hairline weights).
- **Body Text**: `18px (1.125rem)` with `1.5 - 1.6` line-height.
- **Labels & Input Headings**: `18px semibold` (always placed above fields, never placeholder-only).
- **H3 Section Headings**: `24px (1.5rem)` bold.
- **H2 Page Headings**: `30px (1.875rem)` bold.
- **H1 Header Titles**: `36px (2.25rem)` black / extrabold.
- **KPI / Number Highlights**: `36px – 48px` bold font with right alignment and Indian digit grouping (`₹12,34,567.00`).

---

## 3. Reusable UI Components

### 1. `AccessibleButton`
- **Minimum Height**: `56px` (`h-14`) on mobile & desktop (`48px` for compact table actions).
- **Radius**: `12px` (`rounded-xl`).
- **Typography**: `18px` semibold with paired icons for immediate recognition.
- **Variants**:
  - `primary`: Solid `#8B1A1A` fill, white text, subtle shadow.
  - `outline`: 2px solid stone border, stone-900 text, warm hover state.
  - `danger`: Solid `#B91C1C` red fill, white text for destructive operations.

### 2. `AccessibleInput` & `AccessibleSelect`
- **Height**: `56px` (`h-14`).
- **Border**: `2px solid #D6CFC4` stone border.
- **Focus State**: `3px focus ring` (`ring-4 ring-maroon-800/20 border-maroon-800`).
- **Label**: Visible `18px` semibold label above input with `(Required)` indicator where needed.

### 3. `AccessibleCard`
- **Background**: `#FFFFFF` with warm padding (`20px – 24px`).
- **Border**: `2px solid #D6CFC4` with soft, natural shadow (`shadow-md`).

### 4. `StatusBadge`
- **Formula**: `Color + Icon + Word` (e.g. `Paid ✓`, `Pending ⏱`, `Overdue !`).
- **Never color alone**: Ensures color-blind and low-vision users understand state immediately.

### 5. `DataTable` & Responsive Mobile Layout
- **Desktop/Tablet**: High contrast table with `64px` row height, zebra striping, sticky headers, and clear monetary formatting.
- **Mobile (<768px)**: Automatically displays as stacked summary cards (Client, Amount, Status Badge, Due Date, View Action) to eliminate horizontal table scrolling.

---

## 4. Accessibility & Responsive Breakpoints
- **WCAG 2.2 AA / AAA Compliance**: All text and interactive states exceed 4.5:1 contrast, with majority >7:1 and primary body >14:1.
- **200% Browser Zoom Support**: Layout is fluid with rem-based spacing and avoids fixed clipping containers.
- **Breakpoints**:
  - `Mobile (320px - 767px)`: Single column, bottom navigation bar (64px high), stacked card lists.
  - `Tablet (768px - 1199px)`: 2-column grid, responsive drawer sidebar.
  - `Laptop/Desktop (1200px+)`: Persistent left sidebar (260px), full table grids.
