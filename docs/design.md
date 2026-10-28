# Uppend — Design Language & Visual System

*Single source of truth for Uppend's visual language established in Session 28, extended in Session 29, and updated in Session 32 (Settings redesign). Future UI development—including the full redesign of application pages—must follow these tokens, components, and rules.*

---

## 1. Identity (IMPLEMENTED)

- **Concept**: *"Ledger meets terminal"* — a spreadsheet that grew a brain. Tactile, disciplined, utilitarian, calm.
- **Pillars**:
  - **Paper & Ink**: Warm tactile surfaces (`--paper`) paired with crisp, high-contrast foreground ink (`--ink`).
  - **Hairline Rules**: 1px structural dividers (`--hairline`) replacing heavy cards and drop shadows.
  - **Ruled Grid**: Faint 32px by 32px background grid on marketing surfaces (`.ruledGrid` in `landing.module.css`).
  - **Numbered Eyebrows**: Uppercase monospace markers (`01 / WORKFLOW`, `02 / PRIVACY`) preceding section headlines.
  - **Editorial Headlines**: Dignified, high-contrast serif headlines in Fraunces (`.font-display` / `.serifHeadline`).
  - **Voice**: Sentence-case, benefit-led, candid, engineering-driven. No inflated AI hype.

---

## 2. Tokens (IMPLEMENTED)

Values extracted from `app/globals.css:6-33` and `components/landing/landing.module.css:6-26`:

| Token | Light Value | Dark Value | Role | Tailwind Alias |
| :--- | :--- | :--- | :--- | :--- |
| `--paper` / `--landing-paper` | `#F6F3EC` | `#0E0E0C` | Page background | `bg-paper` |
| `--ink` / `--landing-ink` | `#121212` | `#EDEAE2` | Primary text, borders | `text-ink` |
| `--accent` / `--landing-accent` | `#D4F03C` | `#D4F03C` | Chartreuse highlight/fill | `bg-accent` |
| `--on-accent` | `#121212` | `#121212` | Text fill on top of accent | `text-on-accent` (`--color-on-accent`) |
| `--hairline` / `--landing-hairline` | `#E5E0D4` | `#23221E` | 1px border dividers | `border-hairline` |
| `--hairline-subtle` / `--landing-hairline-subtle` | `#ECE8DE` | `#191815` | Faint 32px grid lines | (CSS variable) |
| `--field-border` | `#8E887E` | `#6E685D` | Form input & select borders (3:1 contrast) | `border-field-border` (`--color-field-border`) |
| `--muted` / `--landing-muted` | `#525252` | `#A3A3A3` | Secondary text, captions | `text-muted-ink` |
| `--card` / `--landing-card` | `#FAF8F3` | `#141311` | Container surfaces | `bg-card` |
| `--row-hover` / `--landing-row-hover` | `#F0EDE4` | `#1A1916` | Interactive hover | `bg-row-hover` |
| `--scrim` | `rgba(18, 18, 18, 0.6)` | `rgba(18, 18, 18, 0.6)` | Modal backdrop overlay | `bg-scrim` (`--color-scrim`) |
| `--radius-ledger` | `0.125rem` (2px) | `0.125rem` (2px) | Standard ledger corner radius | `rounded-ledger` |

### Tailwind `@theme inline` Aliases (`app/globals.css:218-261`)

- Classes: `bg-paper`, `text-ink`, `bg-accent`, `text-on-accent`, `bg-card`, `border-hairline`, `border-field-border`, `bg-row-hover`, `text-muted-ink`, `bg-scrim`, `rounded-ledger`.
- Base border reset: `@layer base { *, ::before, ::after { border-color: var(--hairline); } }`
- `--color-white`: aliased to `#FAF8F3`.
- `--color-on-accent`: bound to `var(--on-accent)`.
- `--color-scrim`: bound to `var(--scrim)`.
- `--color-field-border`: bound to `var(--field-border)` (guaranteeing >= 3.0:1 contrast for form inputs).
- `rounded-ledger`: bound to `--radius-ledger: 0.125rem` (2px, used for ledger rows, popovers, and modal cards).
- **Stone Ramp Remap (Contrast Tuned)**:
  - `gray-*` (light mode) and `zinc-*` (dark mode) alias to Tailwind v4 stone scales.
  - Tuned stops for >= 4.5:1 contrast: `gray-400` $\rightarrow$ `stone-500` (line 233), `gray-500` $\rightarrow$ `stone-600` (line 234), `zinc-400` $\rightarrow$ `stone-400` (line 252), `zinc-500` $\rightarrow$ `stone-400` (line 253).

---

## 3. Color Rules (IMPLEMENTED)

- **Accent Discipline**: `--accent` (`#D4F03C`) is strictly a **fill behind dark text (`--on-accent: #121212`)** or an active focus outline.
  - **NEVER** use `--accent` as text on light backgrounds (contrast on `#F6F3EC` is **1.16:1**, failing WCAG AA).
- **Contrast Ratios (WCAG AA)**: Normal text >= 4.5:1; borders/large text >= 3:1.
  - `ink` on `paper`: **16.90:1** (light) / **16.07:1** (dark)
  - `ink` on `card`: **17.65:1** (light) / **15.45:1** (dark)
  - `muted` on `paper`: **7.05:1** (light) / **7.66:1** (dark)
  - `muted` on `card`: **7.36:1** (light) / **7.36:1** (dark)
  - `on-accent` on `accent`: **14.57:1**
- **Buttons**: Ink-filled (`bg-[var(--ink)] text-[var(--paper)]`) with chartreuse hover (`hover:bg-[var(--accent)] hover:text-[#121212]`).
- **Functional Colors**: Red is strictly reserved for errors, validation, destructive actions, Rejected chip (`.chip-rejected`), error alerts, and error toasts (`text-red-700 dark:text-red-400`); green is strictly reserved for the positive Offer chip (`.chip-offer`) and nowhere else in the application; chartreuse accent (`#D4F03C`) is reserved for primary interactive hover/focus, active Applied status (`.chip-applied`), and AI suggestions (`.ai-suggested`); amber is prohibited across authenticated surfaces.
- **Success Notifications**: Success alerts use a neutral ink tint (`border-ink` with `bg-[color-mix(in_srgb,var(--ink)_10%,transparent)]` and `text-ink`) or plain ink text rather than green, aligning positive confirmation with the editorial ledger identity.
- **Partial Fills Behind Text**: Use an ink tint (`color-mix(in srgb, var(--ink) 10%, transparent)`), never chartreuse, except `.ai-suggested` (~25% accent tint with dark ink border and text).

---

## 4. Typography (IMPLEMENTED)

Fonts defined in `lib/fonts.ts` and loaded globally in `app/layout.tsx:33`.

| Font | Weights | CSS Variable | Utility | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Fraunces** | 400, 600 | `--font-landing-fraunces` | `.font-display` / `.serifHeadline` | Titles, section headers |
| **JetBrains Mono** | 400, 500 | `--font-landing-mono` | `.font-label` / `.monoLabel` | Eyebrows, chips, tables, code |
| **Geist Sans** | Variable | `--font-geist-sans` | `font-sans` | Body text, form fields, UI copy |
| **Geist Mono** | Variable | `--font-geist-mono` | `font-mono` | Technical data, raw telemetry |

### Heading & Eyebrow Sizing in `components/landing` (from grep)

- Hero Title: `text-4xl sm:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.08] font-normal` (`LandingHero.tsx:22`)
- Section Title: `text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight` (`PrivacyNotice.tsx:16`, `OriginStory.tsx:17`, `SiteFooter.tsx:13`)
- Step Title: `text-2xl sm:text-3xl font-normal mb-3` (`HowItWorks.tsx:38,67,91`)
- Eyebrows: `text-xs uppercase tracking-widest font-medium` (`LandingHero.tsx:14`, `PrivacyNotice.tsx:11`)
- Step Counter: `text-2xl sm:text-3xl font-bold opacity-30` (`HowItWorks.tsx:28,57,86`)
- Nav/Links: `text-xs tracking-wider uppercase` (`LandingHeader.tsx:37`, `PrivacyNotice.tsx:69`)

---

## 5. Components (IMPLEMENTED)

| Component | Class Name | Defined In | Used In | Visual Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Button** | `.btn-primary` | `globals.css:44` | Settings, Onboarding, Modals, Uploader | Ink fill, paper text. Hover/focus shifts to chartreuse with dark text. |
| **Secondary Button** | `.btn-secondary` | `globals.css:64` | Settings, Modals, Dashboard, Detail | Card fill, hairline border, ink text. Hover shifts to row-hover. |
| **Text Link** | `.link-ink` | `globals.css:82` | Settings, Cookie Banner, Legal | Underlined ink text, transitions to muted on hover. |
| **Focus Ring** | `.focus-ink` | `globals.css:92` | Inputs, Textareas, Selects | Focus outline with `box-shadow: 0 0 0 2px var(--ink)`. |
| **Display Font** | `.font-display` | `globals.css:104` | Page and section titles | Fraunces serif typeface. |
| **Label Font** | `.font-label` | `globals.css:108` | Status chips, headers, metadata | JetBrains Mono monospace typeface. |
| **AI Suggested** | `.ai-suggested` | `globals.css:205` | Form inputs in `new/page.tsx:781,797,804,859` | 25% accent tint fill with dark ink border and text. |
| **Ledger Card** | `.ledgerCard` | `landing.module.css:48` | `FlowDemo.tsx`, `DemoPanels.tsx` | Background `var(--card)`, border 1px `var(--hairline)`, radius `rounded-sm`. |
| **Outbound Link** | `.group` + `<ArrowUpRight />` | `SiteFooter.tsx` | Footer, external references | Desktop: arrow revealed on hover with subtle offset slide. Mobile: full-width 44px tap area with always-visible arrow. |
| **Heatmap Popover** | `rounded-ledger border-hairline bg-card` | `ActivityHeatmapDropdown.tsx` | Dashboard streak cell | Token-based anchored dropdown panel; tile ramp via `color-mix(in srgb, var(--ink) N%, transparent)` at five opacity levels; nav buttons use `.btn-secondary`; month label in `.font-label`. |
| **Logout Modal** | `bg-scrim` / `rounded-ledger` | `LogoutButton.tsx` | Dashboard nav | Full-screen `bg-scrim` backdrop (portal to `document.body`); inner card `bg-card rounded-ledger border-hairline`; confirm button `.btn-primary`, cancel `.btn-secondary`; 44px min-height touch targets. |
| **Dashboard Loading Skeleton** | `animate-pulse bg-row-hover` | `app/(protected)/dashboard/loading.tsx` | Dashboard page route | Server component; mirrors final layout structure (nav bar, stats grid, toolbar, ledger rows, pagination) with `animate-pulse` placeholder blocks using `bg-row-hover` on `bg-card` cells. |
| **Alert** | `border border-hairline bg-card text-ink` | `components/ui/Alert.tsx` | New Application, Settings | Surface banner primitive (`rounded-ledger p-4 text-sm`). Supports `tone="default"`, `tone="success"` (neutral ink tint `border-ink` + 10% ink mix), and `tone="error"` (red tint). |
| **Back Button** | `.btn-secondary rounded-ledger min-h-[44px] min-w-[44px]` | `app/(protected)/new/page.tsx` | Secondary flows | Touch target navigation button with `ArrowLeft`; uses `resolveBackNavigation` for history-aware back navigation with modified-click bypass. |

### Presentational UI Primitives (`components/ui/*`)

Shared presentational building blocks implemented on `redesign/dashboard`:
- **Button** (`components/ui/Button.tsx`): Variants `'primary'` (`.btn-primary`) and `'secondary'` (`.btn-secondary`). Prop `isTouchTarget` (defaults to `true`) enforces `min-h-[44px]`. Forwards `ref`, `className`, and HTML button attributes.
- **Alert** (`components/ui/Alert.tsx`): Surface notification primitive (`rounded-ledger p-4 text-sm`). Props: `tone?: 'default' | 'success' | 'error'`.
  - `tone="default"`: `border border-hairline bg-card text-ink`. Used for Local Mode banner and credit exhaustion notices.
  - `tone="success"`: `border border-ink bg-[color-mix(in_srgb,var(--ink)_10%,transparent)] text-ink`. Neutral ink tint (10% ink mix) rather than green; contrast evaluated in `contrast.mjs` (14.34:1 light / 12.10:1 dark text, 17.65:1 light / 15.45:1 dark decorative border).
  - `tone="error"`: `border border-red-700/40 bg-red-700/10 text-ink dark:border-red-500/40 dark:bg-red-950/20`. Contrast evaluated in `contrast.mjs` (14.65:1 light / 15.29:1 dark text, 6.05:1 light / 4.88:1 dark border).
  Forwards `ref`, `className`, and HTML div attributes.
- **Chip** (`components/ui/Chip.tsx`): Hairline status and metadata tag wrapper (`font-label text-xs uppercase tracking-wider px-2 py-0.5 rounded-ledger inline-flex items-center`). Does not stop propagation; forwards `ref`, `className`, and HTML div attributes.
- **Panel** (`components/ui/Panel.tsx`): Surface container (`bg-card border border-hairline rounded-ledger`). Forwards `ref`, `className`, and HTML div attributes.
- **PageHeader** (`components/ui/PageHeader.tsx`): Standard page title block with mono eyebrow (`font-label text-xs uppercase tracking-widest text-muted-ink`), serif heading (`font-display text-2xl sm:text-3xl font-normal text-ink`), and optional action slot. Prop `hideActionsOnMobile` (`boolean`, default `false`) hides actions below `sm` (`hidden sm:flex`) in favor of mobile quick actions.
- **Field** (`components/ui/Field.tsx`): Four-variant input/select/textarea/toggle wrapper forwarding `ref` and props:
  - `variant="input"`: Text input with optional leading icon slot (`icon?: React.ReactNode`), styled with `pl-9` (or `px-4`), `w-full min-w-0 max-w-full rounded-ledger border border-field-border bg-card text-base sm:text-sm text-ink placeholder:text-muted-ink focus-ink transition-colors`. Supports `aiSuggested?: boolean` (adds `.ai-suggested`).
  - `variant="select"`: Native select with custom chevron indicator (`ChevronDown`). Supports `tone="default"` (`rounded-ledger border border-field-border bg-card pr-8 pl-3 py-2 text-base sm:text-sm text-ink focus-ink`) and `tone="chip"` (`appearance-none border-none pl-2.5 pr-7 py-1 text-inherit font-label uppercase text-base sm:text-xs tracking-wider`), plus optional `wrapperClassName`.
  - `variant="textarea"`: Multi-line text entry with `px-4 py-3 rounded-ledger border border-field-border bg-card text-base sm:text-sm text-ink placeholder:text-muted-ink focus-ink transition-colors`. Supports `aiSuggested?: boolean` (adds `.ai-suggested`).
  - `variant="toggle"`: Labeled 44px bordered cell (`min-h-[44px] rounded-ledger border border-field-border bg-card px-3 flex items-center justify-between`) containing a text label and an accent-ink styled checkbox switch (`w-5 h-5 accent-ink shrink-0`). Supports `label: string`, `checked`, `onChange`, and standard HTML input checkbox attributes.
  Does not provide external label, validation message, or hint props (except `variant="toggle"` which renders its inline label); form controls receive standard HTML attributes and styling directly.
- **Back Button Pattern**: Standalone navigation trigger for secondary flows:
  - Markup: `<Link href="/dashboard" className="btn-secondary rounded-ledger min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 mb-4" aria-label="Back"><ArrowLeft className="w-4 h-4" aria-hidden="true" /></Link>`.
  - Behavior: Intercepted in `onClick` with modified-click bypass (`if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;`). Invokes `resolveBackNavigation(window.history.length, isDirty)`: if clean and `history.length > 1`, calls `e.preventDefault(); router.back();` to return to referrer; if dirty or history is minimal, falls through to standard `/dashboard` link navigation (or unsaved changes guard).
- **ThemeToggle** (`components/ThemeToggle.tsx`): Supports optional `label?: string` prop. When omitted, renders an icon-only theme toggle button without `title` attribute.
- **MobileNavMenu** (`components/MobileNavMenu.tsx`): Mobile disclosure menu panel (`z-30 bg-card border border-hairline rounded-ledger`) providing mobile navigation and quick-action access.
- **LogoutButton** (`components/LogoutButton.tsx`): Supports `menuItem?: boolean` prop. When `true`, renders a full-width menu button for `MobileNavMenu`; when `false`, renders standard icon/text button.

### Settings Layout Primitives (`components/settings/SettingsLayout.tsx`)

Shared presentational layout primitives implemented on `redesign/settings`:
- **SettingsSection**: Panel with `id`, `role="region"`, `aria-labelledby`, `scroll-mt-6 p-5` and a header with `border-b border-hairline` (eyebrow `font-label text-xs uppercase tracking-widest text-muted-ink`; h2 `font-display text-2xl font-normal text-ink mt-0.5`; description `text-sm text-muted-ink mt-0.5`).
- **SettingsGroup**: `mt-5` wrapper with an h3 (`font-label text-xs uppercase tracking-wider text-muted-ink`), no card/border, and child wrapper `mt-2`.
- **SettingsRow**: Ruled grid with `sm:grid-cols-[200px_minmax(0,1fr)]`, `border-t border-hairline first:border-t-0 first:pt-1 py-3.5 sm:gap-x-6 sm:items-start`, label or span (`block font-medium text-ink`), optional hint (`text-sm text-muted-ink mt-0.5`), and child container `min-w-0`.
- **SettingsFooter**: Border-t grid (`mt-1 pt-3.5 border-t border-hairline grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center`) with a `role="status"` line (`text-sm sm:min-h-5 sm:order-1 empty:hidden sm:empty:block`; red on error `text-red-700 dark:text-red-400`, otherwise `text-ink`) and action slot (`sm:order-2`).
- **SettingsSaveButton**: forwardRef wrapper around Button (variant primary) with `w-full sm:w-auto sm:min-w-[176px] px-4 disabled:opacity-40 disabled:cursor-not-allowed`. There is NO spinner.

### Status Chips (`app/globals.css:112-203`, `DashboardClient.tsx:14-21`)

Standardized hairline badge system using `.chip-*` utility naming (not `.status-*`):
- **Draft** (`.chip-draft`): Transparent background, 1px solid `var(--ink)`, ink text.
- **Applied** (`.chip-applied`): Chartreuse background (`var(--accent)`), solid border, `#121212` text.
- **Screening** (`.chip-screening`): 30% chartreuse mix (`color-mix(in srgb, var(--accent) 30%, transparent)`), 1px solid `var(--ink)`, ink text.
- **Interview** (`.chip-interview`): Solid ink background (`var(--ink)`), paper text (`var(--paper)`).
- **Offer** (`.chip-offer`): Green fill (`var(--color-green-700)` light / `var(--color-green-800)` dark), `#ffffff` text.
- **Rejected** (`.chip-rejected`): Red fill (`var(--color-red-700)` light / `var(--color-red-800)` dark), `#ffffff` text.
- **Withdrawn** (`.chip-withdrawn`): Transparent background, 1px dashed `var(--muted)`, muted text.
- **Ghosted** (`.chip-ghosted`): Transparent background, 1px dotted `var(--muted)`, muted text.

---

## 6. Dashboard: Ledger Sheet (IMPLEMENTED on redesign/dashboard)

The authenticated dashboard is redesigned as a clean accounting ledger sheet:

- **App Navigation**:
  - Pinned sticky nav bar on mobile (`sticky top-0 z-30 -mx-4 -mt-4 px-4 pt-4 bg-paper sm:static sm:z-auto sm:mx-0 sm:mt-0 sm:px-0 sm:pt-0 sm:bg-transparent pb-3 mb-6 border-b border-hairline`).
  - Wordmark and primary text links (`Dashboard`, `New Application`, `Settings`) visible on desktop (`sm:flex`).
  - Mobile disclosure menu via `MobileNavMenu` (`z-30 bg-card border-hairline rounded-ledger`) containing navigation links, quick-action trigger, and `LogoutButton menuItem`.
- **Stats Cell Structure & Mobile Compaction**:
  - Four stat cells: Goal, Week, Streak, and Quote in a shared `Panel` (`grid grid-cols-2 lg:flex mb-6`).
  - Standardized three-row vertical structure across desktop (`lg:min-h-[120px] lg:flex-col lg:gap-3`):
    - Row 1: Label (`font-label text-xs uppercase tracking-wider h-4 leading-4 text-muted-ink`).
    - Row 2: Numeral / body (`min-h-[2.5rem] font-display text-3xl leading-none tabular-nums text-ink`).
    - Row 3: Footer (`min-h-[1rem]` progress bar or empty).
  - Mobile layout: 2-column grid (`grid grid-cols-2`) with compact padding (`p-3`) and baseline-aligned single-row items.
- **Streak States & Single-Row Mobile Layout**:
  - `active`: Cell fill `bg-accent text-on-accent`.
  - `at_risk`: Cell fill `bg-card text-ink` with trailing warning text "apply today to keep it!".
  - Layout: Cell 3 button uses `w-full h-full flex flex-row flex-nowrap items-center justify-start gap-x-3 text-left min-h-[44px] lg:flex-col lg:items-start lg:justify-start lg:gap-3`. Label and numeral wrappers use `shrink-0` with `whitespace-nowrap` on count. Tail wrapper is conditional (`min-w-0 flex-1 flex items-center lg:flex-none lg:min-h-[1rem]` when at_risk, `hidden lg:block lg:min-h-[1rem]` otherwise) with `leading-snug` text, ensuring warning copy wraps inside its own box on mobile without displacing label or numeral.
- **Toolbar**:
  - Search input using `Field variant="input"` with leading Search icon.
  - Status filter pills and popover using `Field variant="select"` and custom dropdown.
  - `PageHeader` using `hideActionsOnMobile` to suppress desktop header action on mobile in favor of the mobile quick-action bar.
- **Columns**: Standardized ledger columns: Company, Role, Status, Applied, Fit, and Priority. Next Action Date was removed from the dashboard table only (retained in DB schema and detail page).
- **Formatting Utilities (`lib/utils/ledger-format.ts`)**:
  - `formatMonthDay(dateStr)`: Formats ISO dates into clean "MMM D" strings (e.g. "Oct 23").
  - `averageFit(scores)`: Computes mean AI fit percentage with null-safe handling.
- **Sortable Fit**: Numeric column sorting on Fit score with null values sorted last (`compareNullsLast`), fully covered by unit tests in `tests/ledger-format.test.ts`.
- **Mobile Cards**: Responsive card layout below `md` (`thead hidden md:table-header-group`, `tbody block md:table-row-group`, `tr block md:table-row`), rendering each application as a distinct card with company, role, status chip, applied date, priority, and fit score.
- **Heatmap Ramp**: Anchored popover (`ActivityHeatmapDropdown.tsx`) with 5-level tile opacity ramp using `color-mix(in srgb, var(--ink) N%, transparent)` at 8%, 25%, 45%, 70%, and 100% ink, evaluated against `--card`. Month navigation buttons remain visible when disabled but faded (`disabled:opacity-40 disabled:cursor-not-allowed`).
- **Logout Modal**: Full-screen modal portal (`z-[100]`) with `bg-scrim` backdrop, centered card (`bg-card border-hairline rounded-ledger`), `.btn-primary` and `.btn-secondary` actions, all with `min-h-[44px]` touch targets.
- **Loading Skeleton**: Plain server component (`app/(protected)/dashboard/loading.tsx`) mirroring navigation, stats grid, toolbar, ledger rows, and pagination with `animate-pulse` placeholder blocks (`bg-[color-mix(in_srgb,var(--ink)_10%,transparent)] rounded-ledger`).

---

---

## 7. New Application Page (/new): Split-Intake Form (IMPLEMENTED on redesign/new)

The `/new` application creation view uses a responsive split-intake layout:

- **Desktop Two-Column Grid**: Viewport at `lg` renders `grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start`.
  - Left column (`340px`): Encapsulates job description input (`min-h-[10rem]`), model selection dropdown trigger and anchored popover menu, extraction trigger button, and model fallback badge.
  - Right column (`1fr`): Houses the manual application details form inside a `Panel` (`p-4 sm:p-6 space-y-4`): company, role, location, status select, salary/currency, priority select, fit scores, and notes textarea.
- **Local Mode Compaction**: When unauthenticated (`isLocal`), container width is capped at `max-w-4xl` (`${isLocal ? 'max-w-4xl' : 'max-w-7xl'} mx-auto px-4 sm:px-8 py-8`). The entire left extraction panel is omitted; the page displays a top Local Mode informational banner (`<Alert className="mb-6 flex items-center justify-between gap-4">`) followed by the centered single-column form.
- **Mobile 50/50 Action Row**: Below `lg`, the model selection trigger and extraction action button sit side-by-side in a 2-column grid (`mt-4 grid grid-cols-2 lg:grid-cols-1 gap-3 items-start`).
- **Full-Row Fallback Badge**: When model fallback triggers (`activeModelName && activeModelName !== preferredModel`), renders a full-width `Chip` spanning both mobile columns (`<Chip className="col-span-2 lg:col-span-1 w-full break-words border border-field-border text-ink normal-case tracking-normal">Falling back to {activeModelName}</Chip>`).
- **Reserved Analyzing Status Slot**: An always-rendered `<div className="min-h-5 text-center lg:text-right">` under the Extract button permanently reserves 20px (1.25rem) height. Renders `<span role="status" className="font-label text-xs uppercase tracking-wider text-muted-ink animate-pulse">Analyzing fit...</span>` during `isMatching`, otherwise renders the byte-identical free-uses counter (`{freeUses} of 5 free AI uses remaining`). Because slot height is permanently allocated, the Extract button never moves or shifts when analysis begins or ends on mobile or desktop.

---

## 8. Application Detail (/applications/[id]): Split-Rail Form (IMPLEMENTED on redesign/application-detail)

The `/applications/[id]` detail view implements direction B (split rail):

- **Desktop Split-Rail Layout**: Two-column layout on viewports at `lg` (`max-w-6xl mx-auto px-4 sm:px-8 py-8`, `grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start`).
  - **Sticky Summary Rail (left, 280px)**: Encapsulated in a sticky `Panel` (`lg:sticky lg:top-6 p-5 space-y-4`). Houses a monospace section header (`Summary`), live status chip (`STATUS_CHIP[form.status]`), priority indicator, tabular Fit numerals (`role_fit` and `culture_fit` in `font-display text-2xl tabular-nums`), next action date (`formatMonthDay`), and active resume version.
  - **Three Form Panels (right, 1fr)**: The `<form id="application-detail-form">` groups fields into three `Panel` cards (`p-5` with `grid grid-cols-1 md:grid-cols-2 gap-5`):
    1. *Extracted details*: Company (shortened label), Role, Location, Salary (shortened label).
    2. *Tracking details*: Status select, Priority select, Applied date, Next action date, Follow-up date, and two 44px toggle cells (`Field variant="toggle"`) for Reminder enabled and Cover letter sent.
    3. *Evaluation and interviews*: Role fit, Culture fit, Job description textarea (`min-h-48 resize-y col-span-full md:col-span-2`), and Notes textarea (`min-h-48 resize-y col-span-full md:col-span-2`).
- **Header & Navigation**:
  - `PageHeader` with mono eyebrow `03 / APPLICATION`, serif heading (`form.role_title || 'Untitled application'`), and an action slot containing a `.btn-secondary` Delete button (`min-h-[44px]`).
  - Standalone `Link` back navigation (`<Link href="/dashboard" className="btn-secondary rounded-ledger min-h-[44px] min-w-[44px] ... aria-label="Back"><ArrowLeft ... /></Link>`) without `resolveBackNavigation` or `onClick` intercept, ensuring users deep-linking from reminder emails can always navigate directly to `/dashboard`.
- **Full-Bleed Sticky Save Bar**:
  - Outer container positioned outside `max-w-6xl` as a direct sibling in the page fragment: `sticky bottom-0 z-10 bg-card border-t border-hairline pb-[max(0.75rem,env(safe-area-inset-bottom))]`.
  - Inner container: `max-w-6xl mx-auto px-4 sm:px-8 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`.
  - Form connection via HTML5 attribute: `<button type="submit" form="application-detail-form" ...>Save changes</button>`.
  - Single plain-text toast notification: `<p role="status" className={`text-sm ${toast.type === 'success' ? 'text-ink' : 'text-red-700 dark:text-red-400'}`}>{toast.message}</p>`. Replaces the old duplicate top-of-form banner toasts.
- **Delete Confirmation Modal**:
  - Full-screen `createPortal` modal (`z-[100]`) with `bg-scrim` backdrop, centered card (`bg-card rounded-ledger border-hairline p-6 max-w-md w-full`), and `role="dialog"` accessibility attributes.
  - Retains state machine (closing/closed states), Esc key listener, and `stopPropagation` backdrop click handler.
  - Delete button styled in red-700 light / red-800 dark (`bg-red-700 hover:bg-red-700/90 text-white dark:bg-red-800 dark:hover:bg-red-800/90 min-h-[44px]`), verified against WCAG AA in `contrast.mjs`.
- **Loading Skeleton**:
  - Server component `loading.tsx` mirroring the two-column grid layout, sticky summary rail, and three form panels with `animate-pulse` placeholder cells (`bg-[color-mix(in_srgb,var(--ink)_10%,transparent)] rounded-ledger`).

---

## 9. Layout and Motion (IMPLEMENTED)

- **Max Width**: Standardized `max-w-7xl mx-auto px-4 sm:px-8`.
- **Section Dividers**: Separated by explicit `border-t border-[var(--hairline)]`.
- **Hero**: Asymmetric 2-column layout (headline/CTAs left; interactive `FlowDemo` card right).
- **Mobile Stack**: Stacks into single-column flows on screens `< 1024px` (`lg:grid-cols-12`).
- **Fixed-Height Demo**: `FlowDemo.tsx` maintains rigid height (`h-[480px]` sm / `h-[540px]` lg / `h-[580px]` xl) to prevent layout shifts.
- **Motion Principles**:
  - CSS-first transitions (`0.15s ease`).
  - Animations pause off-screen via `IntersectionObserver` and document `visibilitychange` (`FlowDemo.tsx:112-132`).
  - `prefers-reduced-motion`: Cursors freeze and meter animations show final frame (`landing.module.css:114-123`).
  - Decorative animations use `aria-hidden="true"` with accompanying `.sr-only` descriptions.

---

## 10. Copy and Claims Rules (IMPLEMENTED)

- **Benefit-Led Voice**: Focus on calm execution and organization; avoid inflated AI hype.
- **Strict Verification of Claims**:
  - **Local Mode**: Operates **strictly offline with no AI features** (`new/page.tsx:109-122`, `api/extract/route.ts:50`). Copy must state: "offline tracking only, no account needed."
  - **Account Requirements**: AI extraction, resume matching, and email reminders require an account or BYOK.
  - **Privacy Claims**: Never claim "zero data transmission" (AI routes transmit text to Google or Groq). Never claim user BYOK keys are exempt from provider training without specifying that terms depend on the user's direct agreement with the provider (`docs/decisions.md:14-20`).
  - **License Line**: Footer must state `"MIT licensed"`, never `"All rights reserved"` (`SiteFooter.tsx:126`).
  - **Free AI Runs**: `"5 free AI runs"` claim depends on `profiles.free_ai_uses_remaining` (Default `5` in `docs/schema.md:20`).

---

## 11. Don'ts (IMPLEMENTED)

1. **NO Purple/Blue Gradients or Neon Glows**: Surfaces stay rooted in paper and ink.
2. **NO Glassmorphism**: Avoid `backdrop-blur` layers, translucent glass, or diffuse shadows.
3. **NO Stock Grids with Numbered Circles**: Use mono eyebrows (`01 /`) rather than floating circles.
4. **NO Emoji or Stock Icon Rows**: Use crisp Lucide SVG icons (`strokeWidth={1.5}` or `1.75`).
5. **NO Default Blue Buttons (`bg-blue-600`)**: Always use `.btn-primary` or `.btn-secondary`.
6. **NO Centered-Everything Layouts**: Preserve left-aligned editorial hierarchy.
7. **NO Accent as Text Color**: Never apply `text-[var(--accent)]` on light surfaces.
8. **NO Raw Hex Literals in Markup**: Reference `--paper`, `--ink`, `--card`, `--hairline` via tokens or utilities.
9. **NO Undefined Theme Utilities**: Never introduce classes like `bg-card` without verifying `--color-card` exists under `@theme` (Session 28 `bg-card` bug).
10. **NO Dead Plugin Classes**: Do not use `animate-in`, `fade-in`, `zoom-in`, or `prose-invert` unless `tailwindcss-animate` or `@tailwindcss/typography` are in `package.json`.

---

## 12. Guardrails for UI Work (IMPLEMENTED)

1. **iOS Zoom Guard**: Inputs and textareas must NOT have `text-xs` or `text-sm` on mobile (`new/page.tsx:657`, `ApplicationDetailClient.tsx:357`).
2. **Select + ChevronDown Pattern**: 8 native `<select>` elements use `appearance-none` + right padding + positioned `ChevronDown` (`new/page.tsx:669,707,756,781`, `ApplicationDetailClient.tsx:343,375,431,441`).
3. **Textarea Geometry**: Notes and descriptions enforce `min-h-48 resize-y` (`new/page.tsx:859`, `ApplicationDetailClient.tsx:489,493`).
4. **Sticky Save Bar Pattern**:
   - Outer container uses `sticky bottom-0 z-10 bg-card border-t border-hairline pb-[max(0.75rem,env(safe-area-inset-bottom))]`. Placed outside the page's width-capped container (`max-w-7xl` or `max-w-4xl`) as a direct child of the page fragment, spanning the full viewport width.
   - Inner flex row uses matching container constraint (`${isLocal ? 'max-w-4xl' : 'max-w-7xl'} mx-auto px-4 sm:px-8 pt-3 flex flex-col sm:flex-row sm:items-center gap-3`). Save button connects to the form via HTML5 `form="new-application-form"` attribute.
   - **Why sticky and not fixed**: `app/globals.css:45` `.animate-page-fade-in` (mounted on `app/(protected)/template.tsx`) defines `animation: pageFadeIn 0.25s ease-out forwards;` ending on `to { opacity: 1; transform: scale(1); }` (`app/globals.css:218`). The non-none `transform` property creates a new CSS containing block for all `position: fixed` descendants per the CSS spec, forcing a fixed save bar to be positioned relative to the page wrapper rather than the viewport. `position: sticky` anchors to the document scrolling context without being broken by the transform containing block.
   - **Plain-Text Toasts**: Save bar toast notifications render as unadorned paragraph elements `<p role="status" className={`text-sm ${toast.type === 'success' ? 'text-ink' : 'text-red-700 dark:text-red-400'}`}>{toast.message}</p>` inside a scrollable container (`flex-1 min-w-0 max-h-16 overflow-y-auto`). No alert boxes, borders, backgrounds, or decorative icons.
   - **Status Typography**: Status and metadata indicators strictly use `.font-label` (`JetBrains Mono text-xs uppercase tracking-wider`).
5. **Status Badges**: Must be `inline-flex` without `w-full` (`DashboardClient.tsx:440`).
6. **Stacked Mobile Dashboard**: Tables transition to stacked cards on mobile (`thead hidden md:table-header-group`, `tbody block md:table-row-group`, `tr block md:table-row` in `DashboardClient.tsx:379,409,490`).
7. **Portal Modals**: Modals mount to `document.body` via `createPortal` with fixed positioning (`ApplicationDetailClient.tsx:520`, `ResumePreviewModal.tsx:80`, `UnsavedChangesModal.tsx:64`, `LogoutButton.tsx`).
8. **Touch Targets**: Minimum 44px tap targets (`min-h-[44px]` in `LandingHeader.tsx:31`, `ThemeToggle.tsx:37`, `DashboardClient.tsx:247`, logout modal action buttons).
9. **Presentational Scope**: UI tasks must never touch data fetching, API routes, or RLS (`AGENTS.md:13`).
10. **Z-Index Stack**: Sticky nav (`z-30`), popovers / anchored dropdowns (`z-20`), overlay backdrops (`z-10`), modal portals (`z-[100]`). Never assign an ad-hoc z-value outside this ladder.
11. **Form Input & Grid Cell Contraction Guard**:
   - Form inputs (`variant="input"` in `Field.tsx`) must declare `w-full min-w-0 max-w-full`. Native date pickers (`<input type="date">`) enforce rigid intrinsic minimum content widths in WebKit/iOS Safari; `min-w-0 max-w-full` enables the input to shrink fluidly and strictly adhere to container bounds without overflowing.
   - Grid cell wrappers containing form controls inside CSS Grid containers must declare `min-w-0` to override the CSS Grid default `min-width: auto`, preventing intrinsic-size track blowout and cross-column overlaps on narrow viewports (`ApplicationDetailClient.tsx:625,646,663,676,689,702,715,731`).
12. **No Opacity on Text-Bearing Cards**: Never apply container opacity utilities (`opacity-50`, `opacity-60`) to cards, panels, or rows containing text (such as unavailable model cards or disabled options). Reducing container opacity degrades WCAG AA text contrast below acceptable thresholds. Instead, communicate unavailable or disabled states using dashed borders (`border-dashed border-hairline`), subdued status chips, or explicit status labels while maintaining full text opacity.
13. **Per-Panel Save Footer Pattern (Settings)**: Settings uses per-panel save footers (`SettingsFooter` + `SettingsSaveButton` with `w-full sm:w-auto sm:min-w-[176px] px-4 disabled:opacity-40 disabled:cursor-not-allowed`; there is NO spinner) rather than a viewport-docked sticky save bar. Global save bars are ill-suited to settings because saves are heterogeneous: profile, reminders, Daily goal, and preferred-model changes write to independent columns on `profiles` via direct client-side supabase updates in `SettingsClient.tsx`; BYOK keys and preferred provider use server actions in `actions.ts`; provider selection, preferred model, and theme write immediately on action/change via autosave; resume upload and deletion are discrete mutations; account deletion is an irreversible 3-step sequence. A single global save button would create ambiguous dirty state across unrelated concerns.

---

## 13. Verification Checklist for UI Work (IMPLEMENTED)

Every UI task must execute and report the following verification gates:
1. **WCAG AA Contrast**: Run relative luminance script on modified tokens/colors; text >= 4.5:1, borders >= 3.0:1.
2. **Dead-Class Scan**: Check all modified class strings against compiled `.next/static/chunks/*.css` and `.next/static/css/*.css`.
3. **Class-Only Proof (for retheming)**:
   - Report lines added that do not contain `"class"`.
   - Report dynamic className lines containing `${`, `?`, or `&&`.
   - Confirm zero changes to props, handlers, layout structure, or component logic.
4. **TypeScript & Linter**: `npx tsc --noEmit` exit 0; scoped ESLint on modified files passes.
5. **Production Build**: `npm run build` succeeds without CSS errors.
6. **Unit Tests**: `npm test` (all tests pass).
7. **Owner Terminal Merge Gate**: Merges and remote pushes occur strictly via owner terminal.
8. **Real-Device Pass**: Test on iOS Safari for tap targets, bottom clearance, and input zoom.

---

## 14. Direction for Full App Redesign (DIRECTION)

*Directional proposals pending owner review and approval per page:*
- **Page Headers**: Numbered mono eyebrow (`01 / DASHBOARD`, `02 / NEW`) and Fraunces serif heading (`.font-display`).
- **Ledger Tables**: Dashboard table becomes a true ledger sheet:
  - JetBrains Mono headers (`.font-label text-xs uppercase tracking-wider`).
  - Subtle hairline grid rules (`border-b border-hairline`).
  - Tabular numerals (`font-mono`) for dates, salaries, fit scores.
  - Compact row padding with hairline row-hover highlights (`bg-row-hover`).
- **Ruled Forms**: Form views styled as ruled accounting sheets with mono field indicators above hairline inputs.
- **Radii Unification**: Replace legacy rounded-xl/2xl panels with disciplined `rounded-sm` or `rounded-md`.
- **Empty & Loading States**: Clean terminal ledger skeletons with calm, conversational empty copy.
- **Signature Moments**: Re-use `DemoPanels` cards for match breakdowns and milestone celebrations.
- **Process Per Page**: 2 design directions as static previews $\rightarrow$ Owner picks $\rightarrow$ File-level plan $\rightarrow$ Implement $\rightarrow$ Verify $\rightarrow$ Owner merge.

---

## 15. Known Gaps (IMPLEMENTED list)

- **Token Duplication**: Color tokens are declared in both `components/landing/landing.module.css` (`--landing-*`) and `app/globals.css` (`--*`). Unify into `globals.css` as single source.
- **Landing Hardcoded Literals**: In `components/landing/DemoPanels.tsx` and `landing.module.css`, `#121212` is hardcoded for text on `--landing-accent` buttons instead of referencing `var(--on-accent)`.
- **Cookie Banner Mobile Clearance**: Fixed CookieConsentBanner mobile clearance above footer is estimated and unmeasured on small viewports.
- **App Radii Inconsistency**: Most authenticated pages still use legacy `rounded-lg`, `rounded-xl`, `rounded-2xl`. Dashboard components on `redesign/dashboard`, application detail on `redesign/application-detail`, and Settings on `redesign/settings` have been migrated to `rounded-ledger` / `rounded-sm`; remaining pages (auth, onboarding, terms/privacy) pending.
- **Dead Plugin Classes**: References to `animate-in`, `fade-in`, and `prose` exist in code while `tailwindcss-animate` and `@tailwindcss/typography` are not in `package.json`.
- **Unused Hero Video Asset**: `public/videos/uppend-vid-demo.mp4` (~4.65 MB) remains in the repository after landing redesign.
- **Missing `metadataBase` & OG Image**: Next.js logs build warnings regarding unconfigured `metadataBase`, and OG images are pending creation.
- **Heatmap tile contrast (Group D)**: `scripts/ui-checks/contrast.mjs` evaluates all five tile levels (0–4) and the today-ring against `--card`; results are informational — no failing pair found at the chosen opacity ladder, but values should be re-verified if the tile ramp changes.
- **Modal Component Legacy Styling**: `UnsavedChangesModal` and `ResumePreviewModal` retain legacy styling with dead Tailwind animation classes (`animate-in`, `fade-in-0`, `zoom-in-95`). Scheduled for migration in the final modals + cookie banner redesign pass.
- **Alert Success Tone Usage**: The `Alert` component's `success` tone (`border-ink bg-[color-mix(in_srgb,var(--ink)_10%,transparent)]`) is compiled and contrast-verified but currently unused across `/new` and `/applications/[id]` (save bar toasts on both pages are plain text; local mode and exhaustion banners use `default`).
- **Dead-Class Scanner Object-Literal Limitations**: `scripts/ui-checks/dead-class-scan.mjs` parses uppercase-named const declarations (`const [A-Z0-9_]+ = { ... }`) as class dictionary tables, causing any uppercase display-string maps (such as the former `STATUS_LABEL`) to produce false-positive dead-class errors. Conversely, object maps with lowercase or camelCase names (such as `toneStyles` in `Alert.tsx`) are ignored entirely by the scanner and require manual verification and compile proof via grep.
- **Form handleBlur isDirty Marking**: In `ApplicationDetailClient.tsx`, numeric score field blur handlers (`handleBlur`) unconditionally call `setIsDirty(true)` on every blur event regardless of whether the field value was modified (pre-existing behavior).
- **Unbroken Page Titles in PageHeader**: `PageHeader.tsx` heading does not include `break-words`. Extremely long unbroken application titles (e.g. URLs or single long strings) are untested for horizontal overflow.
- **STATUS_CHIP Token Map Duplication**: The `STATUS_CHIP` class dictionary is duplicated locally between `DashboardClient.tsx` and `ApplicationDetailClient.tsx` rather than shared from a single utility module.
- **Chip and Red-Outline Button Class Duplication**: Status chip class strings and red-outline button classes are duplicated locally inside `SettingsClient.tsx` rather than shared as extracted component primitives.
- **Settings Loading Skeleton Panel Count**: `app/(protected)/settings/loading.tsx` renders four placeholder panels while the implemented `SettingsClient.tsx` contains six panels (`account`, `reminders`, `ai`, `resumes`, `data`, `danger`).
- **Unenforced Dropzone Accept Filter**: The `ResumeUploader` drag-and-drop zone relies on server-side validation; dropped non-PDF files are not client-rejected prior to upload.
- **Hard-coded Free Uses Total**: The AI panel free uses counter hard-codes `"of 5"` rather than referencing a centralized configuration constant.
- **handleModelChange Error Suppression**: In `SettingsClient.tsx`, `handleModelChange` ignores the Supabase error return (silent failure, pre-existing).
- **Daily Goal Snap-to-1**: In `SettingsClient.tsx`, the daily goal `onChange` handler uses `parseInt(...) || 1`, so clearing the field snaps the value back to 1 (pre-existing).

---

## 16. File Map (IMPLEMENTED)

All paths verified via `git ls-files`:

- **Tokens & CSS**:
  - `app/globals.css` (global tokens, `@theme inline`, `@layer utilities`, base hairline border reset)
  - `components/landing/landing.module.css` (landing tokens, ruled grid, ledger card, demo animations)
- **Typography**:
  - `lib/fonts.ts` (Fraunces and JetBrains Mono Google Fonts configuration)
  - `app/layout.tsx` (global font variable mounting on `<body>`)
- **Landing Components**:
  - `components/landing/LandingHeader.tsx`
  - `components/landing/LandingHero.tsx`
  - `components/landing/FlowDemo.tsx`
  - `components/landing/DemoPanels.tsx`
  - `components/landing/HowItWorks.tsx`
  - `components/landing/PrivacyNotice.tsx`
  - `components/landing/OriginStory.tsx`
  - `components/landing/SiteFooter.tsx`
- **Dashboard (redesign/dashboard branch)**:
  - `app/(protected)/dashboard/DashboardClient.tsx` (stats strip, ledger table, mobile card layout, toolbar, pagination)
  - `app/(protected)/dashboard/ActivityHeatmapDropdown.tsx` (token-based heatmap popover with 5-level tile ramp)
  - `app/(protected)/dashboard/loading.tsx` (static token-based loading skeleton server component)
  - `app/(protected)/dashboard/page.tsx` (server component; auth, data fetch, layout shell)
  - `components/LogoutButton.tsx` (logout trigger + scrim modal portal)
  - `components/ThemeToggle.tsx` (icon-only theme toggle, no title attribute)
  - `components/ui/Button.tsx`, `components/ui/Chip.tsx`, `components/ui/Panel.tsx`, `components/ui/PageHeader.tsx`, `components/ui/Field.tsx`, `components/ui/Alert.tsx` (shared UI primitives)
- **New Application (/new)**:
  - `app/(protected)/new/page.tsx` (split-intake form, model fallback badge, reserved analyzing slot, full-bleed save bar)
  - `lib/utils/navigation.ts` (`resolveBackNavigation` helper for history-aware back navigation)
- **Application Detail (/applications/[id])**:
  - `app/(protected)/applications/[id]/page.tsx` (server component; auth, data fetch, layout shell)
  - `app/(protected)/applications/[id]/ApplicationDetailClient.tsx` (split-rail layout, sticky summary rail, three form panels, toggle cells, full-bleed save bar, restyled delete modal)
  - `app/(protected)/applications/[id]/loading.tsx` (static token-based loading skeleton server component)
- **Settings (/settings)**:
  - `app/(protected)/settings/page.tsx` (server component shell; auth/profile fetch, sticky anchor rail `#account` through `#danger`, PageHeader `04 / SETTINGS`, back button)
  - `app/(protected)/settings/SettingsClient.tsx` (client component; six panels: account, reminders/goals, ai/keys, resumes, data export, danger zone; inline 3-step account deletion; bfcache guard)
  - `app/(protected)/settings/actions.ts` (server actions: saveApiKey, deleteApiKey, updatePreferredProvider; profile, reminders, daily goal, and preferred model use direct client-side supabase updates in SettingsClient.tsx)
  - `app/(protected)/settings/loading.tsx` (static token-based loading skeleton server component)
  - `components/settings/SettingsLayout.tsx` (`SettingsSection`, `SettingsGroup`, `SettingsRow`, `SettingsFooter`, `SettingsSaveButton`)
  - `components/ResumeUploader.tsx` (shared resume uploader supporting `'stacked'` and `'rows'` layouts)
  - `components/ClearLocalDataButton.tsx` (IndexedDB local wipe trigger)
  - `lib/utils/message-tone.ts` (`messageTone` helper for toast tone resolution)
  - `lib/utils/dropzone-state.ts` (`getDropzoneState` helper for resume uploader dropzone styling)
- **Tooling**:
  - `scripts/ui-checks/contrast.mjs` (WCAG contrast checker for all token pairs including heatmap tile ramp Groups A–D)
  - `scripts/ui-checks/dead-class-scan.mjs` (scans TSX class strings against compiled CSS chunks)
  - `scripts/ui-checks/token-delta.mjs` (diffs token usage across a commit range)
- **Documentation**:
  - `docs/design.md` (this file; single source of truth for visual language)
  - `docs/architecture.md` (system architecture and conventions)
  - `docs/manifest.md` (documentation file index and token budgets)
  - `AGENTS.md` (operating constraints and design guidelines for AI agents)

---

## 17. Settings (/settings): Split-Rail Panels (IMPLEMENTED on redesign/settings)

The `/settings` view implements a split-rail panel layout:

- **Desktop Split-Rail Layout**: Two-column layout on viewports at `lg` (`max-w-6xl mx-auto px-4 sm:px-8 py-8`, `grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 items-start`).
  - **Sticky Anchor Rail (left, 200px)**: The rail is `<nav aria-label="Settings sections" className="hidden lg:block lg:sticky lg:top-6">` containing six `<a>` links (`className="font-label text-xs uppercase tracking-wider flex items-center min-h-[40px] px-3 border-l-2 border-hairline text-ink hover:bg-row-hover hover:border-ink focus-ink"`) linking to six panel sections (`#account`, `#reminders`, `#ai`, `#resumes`, `#data`, `#danger`). It is NOT a Panel and has no `space-y-1`; navigation uses standard in-page fragment links without scroll tracking.
  - **Six Content Panels (right, 1fr)**: The right column renders the six `<SettingsSection>` articles with IDs matching the rail anchors:
    1. *Account (`#account`)*: Profile settings (name input, email display) and theme selector segmented control in order `Light`, `Dark`, `System`.
    2. *Reminders and goals (`#reminders`)*: Timezone (+Auto-detect), Send time, Applications per day, and Daily summary toggle; there is NO "reminder enabled toggle" in Settings.
    3. *AI and keys (`#ai`)*: Read-only free uses text (`"{n} of 5 remaining"`), active provider selector, encrypted BYOK key management (Google, Groq), and preferred model picker with model cards and chip family.
    4. *Resumes (`#resumes`)*: Resume management with `ResumeUploader` in `'rows'` layout and saved resume list with preview, default toggle, and delete actions.
    5. *Data export (`#data`)*: Three export cards for downloading user data in CSV, JSON, and XLSX formats.
    6. *Danger zone (`#danger`)*: Account deletion with inline 3-step progressive disclosure confirming by typing the account email (NO password step) and optional "Clear Local Data" trigger when IndexedDB data is present.
- **Header & Navigation**:
  - `PageHeader` with mono eyebrow `04 / SETTINGS`, serif heading `Settings`, and standalone `<Link href="/dashboard" className="btn-secondary rounded-ledger min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 mb-4" aria-label="Back"><ArrowLeft className="w-4 h-4" aria-hidden="true" /></Link>` back button.
- **SettingsLayout Primitives**: Standardized presentational building blocks (`SettingsSection`, `SettingsGroup`, `SettingsRow`, `SettingsFooter`, `SettingsSaveButton` with `w-full sm:w-auto sm:min-w-[176px] px-4 disabled:opacity-40 disabled:cursor-not-allowed`; NO spinner) ensuring consistent spacing, typography, and borders across all panels.
- **Per-Panel Save Model**: Profile, Reminders, Daily goal and preferred-model changes use direct client-side supabase `profiles` updates in `SettingsClient.tsx`; API keys and preferred provider use server actions in `actions.ts`. Each form is equipped with a right-aligned save button (`SettingsSaveButton`) and `role="status"` line. Autosave applies to provider selection, preferred model, and theme. Mutations for keys, resumes, and export execute immediately. No global save bar.
- **ResumeUploader Layout Prop & Dropzone**:
  - `layout?: 'stacked' | 'rows'` prop (`'stacked'` default for onboarding, `'rows'` for Settings).
  - Dropzone states: `idle` (`border-dashed border-field-border bg-card`), `selected` (`border-ink bg-[color-mix(in_srgb,var(--ink)_10%,transparent)]`), and `drag` (`border-ink bg-accent text-on-accent`).
  - Underlying file input has `absolute inset-0 h-full w-full cursor-pointer opacity-0` covering the dropzone, enabling native browser drop handling without `e.preventDefault()`.
- **Palette and Model Cards**:
  - Selected model card and selected dropzone use a 10% ink tint fill (`bg-[color-mix(in_srgb,var(--ink)_10%,transparent)] border-ink`).
  - Unavailable models use a dashed border (`border-dashed border-hairline`) without opacity to preserve WCAG AA text contrast.
  - Chip family: Preferred = solid ink chip (`bg-[var(--ink)] text-[var(--paper)]`), Unavailable = red-outline chip (`border border-red-700 dark:border-red-500 text-red-700 dark:text-red-400`), Current (on RESUMES, not "fallback") = ink-outline chip (`border border-ink text-ink`), all as inline classes in `SettingsClient.tsx` — NOT `.chip-interview`/`.chip-draft`.
  - Destructive actions: Red text (`text-red-700 dark:text-red-400`), red outlines (`border-red-700 dark:border-red-500`), confirm buttons (`bg-red-700 dark:bg-red-800 text-white`).
- **Danger Zone Inline Flow & Width Caps**:
  - Account deletion is handled entirely inline within the danger panel (no portal modal).
  - The initial delete card and both confirmation step blocks (`deleteStep === 1` and `deleteStep === 2`) are capped at `max-w-[480px]`.
  - Native `window.confirm` and `alert()` dialogs are retained for key deletion, resume deletion, and local data clearing pending the dedicated modals redesign pass.
- **Theme Segmented Control**:
  - Three-option segmented control in order `Light`, `Dark`, `System` styled with `rounded-ledger border border-field-border bg-card` with active segment highlighted via `bg-ink text-paper`.
- **Loading Skeleton**:
  - Server component `app/(protected)/settings/loading.tsx` providing token-based placeholder blocks (`animate-pulse bg-[color-mix(in_srgb,var(--ink)_10%,transparent)] rounded-ledger`).

