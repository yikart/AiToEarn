---
name: AiToEarn Web
description: Calm, high-density workspace for AI-assisted multi-platform content publishing
colors:
  brand-purple: 'oklch(0.74 0.17 3)'
  brand-cyan: 'oklch(0.71 0.17 294)'
  gradient-foreground: 'oklch(0.985 0 0)'
  background: 'oklch(1 0 0)'
  foreground: 'oklch(0.145 0 0)'
  card: 'oklch(1 0 0)'
  muted: 'oklch(0.97 0 0)'
  muted-foreground: 'oklch(0.556 0 0)'
  secondary: 'oklch(0.97 0 0)'
  accent: 'oklch(0.97 0 0)'
  border: 'oklch(0.922 0 0)'
  destructive: 'oklch(0.577 0.245 27.325)'
  success: 'oklch(0.65 0.2 145)'
  warning: 'oklch(0.75 0.18 70)'
  info: 'oklch(0.6 0.18 250)'
  section-alt-bg: '#f8f9fa'
typography:
  display:
    fontFamily: 'Suisseintl, sans-serif'
    fontSize: '1.5rem'
    fontWeight: 600
    lineHeight: 1
    letterSpacing: '-0.01em'
  title:
    fontFamily: 'Suisseintl, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: 'Suisseintl, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: 'Suisseintl, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 500
    lineHeight: 1.4
  numeric:
    fontFamily: 'DIN, Suisseintl, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 500
rounded:
  sm: '6px'
  md: '8px'
  lg: '10px'
  xl: '14px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '16px'
  lg: '24px'
components:
  button-primary:
    backgroundColor: '{colors.brand-cyan}'
    textColor: '{colors.gradient-foreground}'
    rounded: '{rounded.md}'
    padding: '8px 16px'
    height: '36px'
  button-outline:
    backgroundColor: '{colors.background}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    padding: '8px 16px'
    height: '36px'
  button-secondary:
    backgroundColor: '{colors.secondary}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    padding: '8px 16px'
    height: '36px'
  input-default:
    backgroundColor: '{colors.background}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    padding: '4px 12px'
    height: '36px'
  card-default:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.lg}'
    padding: '24px'
---

# Design System: AiToEarn Web

## 1. Overview

**Creative North Star: "The Calm Growth Studio"**

AiToEarn is a professional workspace where creators and operators drive AI agents through high-volume, multi-account publishing. The interface should feel like a calm growth studio: capable and efficient, never cold or sterile. Surfaces stay quiet and neutral so dense publishing flows read clearly; the purple→cyan brand gradient appears deliberately across a small set of explicit roles to mark action, state, progress, identity, and page structure. The tool disappears into the task.

This system rejects decorative interfaces that distract from publishing, inconsistent form and modal patterns, and low-contrast controls that are hard to read in dense surfaces. It is not a marketing canvas: nothing here is drenched in brand color for its own sake. Familiarity is a feature. Forms, dialogs, tabs, and media controls follow well-known product conventions so users trust the interface mid-flow across fourteen-plus social platforms.

Depth is achieved through near-flat tonal layering, not heavy shadows. Light and dark themes are both first-class; every token resolves through semantic CSS variables so a surface is correct in either theme without a second styling pass.

**Key Characteristics:**

- Neutral grayscale surfaces; the brand gradient is the signature, deployed across action, state, progress, brand identity/frame, and seam roles while work surfaces stay neutral.
- High information density, with calm spacing rhythm to keep it legible.
- One sans family (Suisseintl) carries the whole UI; DIN for numerics, HYHanHeiJ for Chinese.
- Near-flat elevation via `shadow-sm` and tonal `color-mix` layering.
- Full light/dark parity through semantic tokens.

## 2. Colors

A neutral grayscale foundation with a single two-stop brand gradient and a standard semantic state vocabulary.

### Primary

- **Brand Cyan-Violet** (`oklch(0.71 0.17 294)`): The primary accent in light theme (`--primary`), the focus ring (`--ring`), and the warm stop of the brand gradient's resolved use. Carries primary actions, current selection, and sidebar active state.
- **Brand Magenta-Rose** (`oklch(0.74 0.17 3)`): The primary accent in dark theme and the second stop of the brand gradient (`--brand-purple`). Pairs with Brand Cyan-Violet in `--gradientBackColor` (`linear-gradient(to right in oklch, ...)`).
- **Gradient Foreground** (`oklch(0.985 0 0)`): Near-white text that sits on top of any brand-gradient or primary surface. The only correct foreground on the gradient.

### Neutral

- **Ink** (`oklch(0.145 0 0)` light / `oklch(0.985 0 0)` dark): Primary text (`--foreground`).
- **Surface** (`oklch(1 0 0)` light / `oklch(0.145 0 0)` dark): Page and card background (`--background`, `--card`, `--popover`).
- **Muted Surface** (`oklch(0.97 0 0)` light / `oklch(0.269 0 0)` dark): Secondary, muted, and accent fills for panels, toolbars, hover states.
- **Muted Ink** (`oklch(0.556 0 0)` light / `oklch(0.708 0 0)` dark): Secondary text, placeholders, descriptions (`--muted-foreground`).
- **Hairline** (`oklch(0.922 0 0)` light / `oklch(1 0 0 / 10%)` dark): Borders, inputs, dividers (`--border`, `--input`).
- **Section Alt** (`#f8f9fa` light / `rgba(255,255,255,0.03)` dark): Alternating section background for zebra rhythm on long surfaces.

### Tertiary (semantic states)

- **Destructive** (`oklch(0.577 0.245 27.325)`): Errors, delete actions.
- **Success** (`oklch(0.65 0.2 145)`): Successful publish, confirmations.
- **Warning** (`oklch(0.75 0.18 70)`): Pending / attention-needed states.
- **Info** (`oklch(0.6 0.18 250)`): Neutral informational callouts.

### Named Rules

**The Signature Gradient Rule.** The purple→cyan brand gradient is the system's signature. It is used deliberately across a defined set of roles, never sprayed as ambient decoration. Allowed roles, and nowhere else:

1. **Action** — the primary button, key CTAs.
2. **State** — selected/active states: the active-nav indicator bar and its text tint, unread/count badges, the active tab indicator, a toggle/switch in its `on` state.
3. **Progress & emphasis** — progress-bar fills, the emphasized series in a chart or a single highlighted metric.
4. **Brand identity & frame** — the brand mark, 1px gradient borders (via the `padding-box / border-box` technique) on a focused field or one featured card, an avatar ring, and an empty-state icon stroke.
5. **Brand seam** — a single thin gradient hairline accenting a page header (a seam, not a band).

The ceiling that keeps it product-grade: **work surfaces stay neutral.** Cards, tables, forms, list rows, and panel backgrounds are never filled or backed with the gradient. If the gradient is doing more than marking action, state, progress, identity, or a single brand frame/seam, it has crossed into decoration. Hard bans, always: no gradient **text** (`background-clip: text`), no gradient **side-stripe** wider than 1px, no full-bleed gradient on a work surface.

**The Semantic-Token Rule.** Never hardcode a color (no `text-gray-900`, no `#000`, no arbitrary CSS-variable background utilities). Always use the semantic variable (`bg-background`, `text-muted-foreground`, `border-border`) so light/dark both resolve correctly.

## 3. Typography

**Body Font:** Suisseintl (with `sans-serif` fallback)
**Numeric Font:** DIN (medium; metrics, counts, dates)
**Chinese Font:** HYHanHeiJ (`.btl-source-han-sans-cn` utility)

**Character:** One neutral, technical-humanist sans carries the entire UI. There is no display/body pairing; hierarchy comes from weight and size, not from a second typeface. DIN handles dense numerics where even-width digits aid scanning.

### Hierarchy

- **Display** (600, 1.5rem/24px, line-height 1): Card titles, section headings, modal titles. The ceiling for in-app headings; product UI does not shout.
- **Title** (600, 1.125rem/18px): Sub-section and panel headers.
- **Body** (400, 0.875rem/14px, line-height 1.5): The base size (`body` is `text-sm`). Default for all running text and controls. Cap prose at 65–75ch.
- **Label** (500, 0.75rem/12px): Form labels, badges, table headers, meta text.
- **Numeric** (DIN 500, 0.875rem): Counts, durations, dates, metrics.

### Named Rules

**The One-Family Rule.** Suisseintl carries headings, buttons, labels, body, and data. DIN and HYHanHeiJ are scoped tools (numerics, Chinese), not a second display voice. Display fonts in UI labels, buttons, or data are forbidden.

**The Fixed-Scale Rule.** Use the fixed rem scale, not fluid `clamp()` headings. Users view at consistent DPI; a heading that shrinks inside a sidebar looks worse, not better.

## 4. Elevation

Near-flat by default. Depth is conveyed through tonal layering (`color-mix` blends of the brand tint into the background for sidebars and accents) far more than through shadow. The only routine shadow is a soft `shadow-sm`; the primary button adds a tinted `shadow-primary/20` that deepens on hover.

### Shadow Vocabulary

- **Resting** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)` — Tailwind `shadow-sm`): Cards, inputs, buttons at rest.
- **Hover lift** (`shadow-md`): Primary button and interactive cards on hover only.
- **Brand glow** (`shadow-sm shadow-primary/20` → `shadow-md shadow-primary/25` on hover): Exclusive to the primary gradient button, tying elevation to brand intent.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear as a response to state (hover, focus, the primary action), never as ambient decoration. If a panel needs separation, reach for a hairline border or a tonal `color-mix` layer before a shadow.

## 5. Components

### Buttons

- **Shape:** Gently rounded (`rounded-md`, 8px). Default height 36px (`h-9`), padding `8px 16px`.
- **Primary:** Brand gradient fill (`bg-gradient-back`) with `gradient-foreground` text, `shadow-sm shadow-primary/20`. Hover deepens shadow; active scales to `0.98`. The Action role of the Signature Gradient.
- **Outline:** `background` fill, `input` border, `shadow-sm`; hover fills `accent`.
- **Secondary:** `secondary` fill; hover at 80% opacity.
- **Ghost:** Transparent; hover fills `accent`.
- **Destructive:** `destructive` fill with `destructive-foreground`.
- **Link:** `primary` text with underline on hover.
- **Loading:** inline `animate-spin` SVG ring prepended; label text is unchanged, button is disabled.
- **Sizes:** `sm` 32px / `default` 36px / `lg` 40px / `icon` 36×36.

### Cards / Containers

- **Corner Style:** `rounded-lg` (10px).
- **Background:** `card` on `border` hairline.
- **Shadow Strategy:** `shadow-sm` only (see Elevation).
- **Internal Padding:** 24px (`p-6`); header and content share the 6-unit rhythm.

### Inputs / Fields

- **Style:** 36px tall (`h-9`), `rounded-md`, `input` border, transparent background, `px-3 py-1`.
- **Focus:** 1px `ring` outline (`focus-visible:ring-1 ring-ring`), no glow.
- **Placeholder:** `muted-foreground` (must still clear 4.5:1).
- **Disabled:** `cursor-not-allowed`, 50% opacity.
- **Numeric inputs:** always the `NumberInput` component, never native `type="number"`.

### Navigation (Sidebar)

- **Style:** Tonal panel — `--sidebar` is the background with ~3% brand-cyan mixed in (light) / ~7% (dark), one step cooler than the content surface.
- **Active state (State role):** the active row carries a `--sidebar-accent` (10–14% brand-cyan mix) fill, a flush **2px gradient indicator bar** on its leading edge, and a gradient-tinted label (the icon + text shift toward the gradient hue). The indicator bar is the only gradient stripe permitted, and only at the leading edge of an active nav row — never as a card/list side-stripe.
- **Foreground:** inherits `--foreground`; primary/active foreground uses `gradient-foreground`.

### Toggles & Tabs (State role)

- **Switch `on`:** the track fills with the brand gradient (`bg-gradient-back`); the thumb stays `gradient-foreground`. The `off` track is `--input`.
- **Tab / segmented active:** the active segment is marked by a **2px gradient underline** (or a gradient-bordered pill for segmented controls); inactive segments stay `muted-foreground` text on a neutral track.

### Progress & Data (Progress role)

- **Progress bar:** the filled portion uses the brand gradient on a `--muted` track. The one place a horizontal gradient run is correct, because it encodes magnitude.
- **Chart emphasis:** at most one emphasized series or a single highlighted metric may use the gradient (as a stroke or fill); all other series stay neutral/semantic.

### Brand Identity & Frames (Brand-frame role)

- **Brand mark:** the product mark may use the gradient fill because it carries identity, not page decoration.
- **Avatar ring:** a 2px gradient ring around an account/user avatar (via the `padding-box / border-box` border technique), marking identity, not decoration.
- **Featured card / focused field:** a single featured card or a focused input may take a 1px gradient border — never a fill, never a side-stripe. One per surface, maximum.
- **Empty-state icon:** the empty-state glyph may use a gradient stroke to keep an otherwise neutral empty surface on-brand.

### Page Header (Brand-seam role)

- A single thin (1px) gradient hairline may accent a page header as a seam between the header and the content surface. One seam per page; it is an accent line, not a band, and never repeats down the page.

### Topic Mention (signature)

The publish editor's `@topic` / `#tag` chip: inline text with a thin brand-gradient underline (`linear-gradient(90deg, cyan, purple)` at `0.08em`), trigger character in purple-weighted bold, value in cyan-weighted semibold. On focus it gains a gradient border-box and a faint brand ring. A deliberate use of the gradient that obeys the Signature Gradient rule (it marks a live, meaningful token — a State + Brand-frame use), and notably is an underline, not gradient text.

## 6. Do's and Don'ts

### Do:

- **Do** deploy the brand gradient across its five defined roles — Action (primary button/CTA), State (active-nav indicator bar + tint, unread/count badge, active tab underline, switch `on`), Progress (progress fill, one emphasized metric/series), Brand identity/frame (brand mark, avatar ring, one featured card/focused-field border, empty-state icon stroke), and Brand-seam (a single page-header hairline) — the Signature Gradient Rule.
- **Do** keep work surfaces neutral: cards, tables, forms, list rows, and panel backgrounds are never filled or backed with the gradient.
- **Do** use semantic tokens (`bg-background`, `text-muted-foreground`, `border-border`) so every surface resolves in both light and dark.
- **Do** keep elevation near-flat: `shadow-sm` at rest, shadows only as a state response.
- **Do** carry the whole UI in Suisseintl; scope DIN to numerics and HYHanHeiJ to Chinese.
- **Do** use the `NumberInput` component for all numeric entry.
- **Do** verify body text and placeholders clear 4.5:1 contrast against tinted near-white surfaces.

### Don't:

- **Don't** use the brand gradient as a work-surface background, ambient decoration, or a flourish beyond its five roles — if it isn't marking action, state, progress, or a single brand frame/seam, drop it.
- **Don't** render gradient **text** (`background-clip: text`), a gradient **side-stripe** wider than 1px on a card/list/alert, or any full-bleed gradient on a work surface — permanent bans regardless of role.
- **Don't** hardcode colors (`text-gray-900`, `#000`, `black`, `bg-[var(--primary-color)]`) — always semantic variables, Tailwind v4 `bg-(--token)` syntax.
- **Don't** put display fonts in UI labels, buttons, or data.
- **Don't** use fluid `clamp()` headings in product UI; use the fixed rem scale.
- **Don't** reach for a modal as the first thought — exhaust inline and progressive alternatives first.
- **Don't** ship inconsistent component vocabulary: the same button, input, and dialog shape must look identical across every platform's flow.
- **Don't** use native `<input type="number">`; it has inconsistent browser behavior (can't clear, spinners).
- **Don't** add gratuitous motion — transitions are 150–250ms and convey state, never choreography.
