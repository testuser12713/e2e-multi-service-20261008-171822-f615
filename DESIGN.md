# Design — Project Identity

> This document is project-long-lived. Tokens are not changed without
> the Architect's approval. Developers MUST use these tokens
> instead of improvising their own colors/spacings.

## Style Direction

Calm, dark developer dashboard (Linear/Stripe reference): near-black neutral surfaces, one restrained violet accent reserved for the single primary action, and status communicated only through small coloured badges plus muted monospace result text — so the job list stays scannable when dozens of entries pile up.

## Colors

- `--color-bg`: **#0F1115**
- `--color-surface`: **#171A21**
- `--color-surfaceRaised`: **#1E222B**
- `--color-fg`: **#E6E9EF**
- `--color-muted`: **#9BA3B4**
- `--color-mutedStrong`: **#C3C9D4**
- `--color-border`: **#2A2F3A**
- `--color-borderStrong`: **#3A4150**
- `--color-accent`: **#7C5CFF**
- `--color-accentHover`: **#8F73FF**
- `--color-accentActive`: **#6A47F0**
- `--color-accentSoft`: **rgba(124, 92, 255, 0.14)**
- `--color-focus`: **#A08CFF**
- `--color-statusPending`: **#D9A441**
- `--color-statusPendingSoft`: **rgba(217, 164, 65, 0.14)**
- `--color-statusRunning`: **#4C8DFF**
- `--color-statusRunningSoft`: **rgba(76, 141, 255, 0.14)**
- `--color-statusDone`: **#3FB950**
- `--color-statusDoneSoft`: **rgba(63, 185, 80, 0.14)**
- `--color-statusFailed`: **#F26D6D**
- `--color-statusFailedSoft`: **rgba(242, 109, 109, 0.14)**
- `--color-dangerSurface`: **rgba(242, 109, 109, 0.10)**
- `--color-codeBg`: **#12151B**

## Typography

- `font_family`: "Inter", "SF Pro Text", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
- `font_family_mono`: "JetBrains Mono", "SFMono-Regular", "SF Mono", ui-monospace, Menlo, Consolas, "Liberation Mono", monospace
- `heading_weight`: 600
- `body_weight`: 400
- `label_weight`: 500
- `size_xs`: 12px
- `size_sm`: 13px
- `size_base`: 15px
- `size_lg`: 18px
- `size_xl`: 24px
- `line_height_body`: 1.55
- `line_height_tight`: 1.3
- `letter_spacing_label`: 0.02em

## Spacing Scale

- `--space-0`: 4px
- `--space-1`: 8px
- `--space-2`: 12px
- `--space-3`: 16px
- `--space-4`: 24px
- `--space-5`: 32px
- `--space-6`: 48px

## Border-Radii

- `--radius-sm`: 4px
- `--radius-md`: 8px
- `--radius-lg`: 12px
- `--radius-pill`: 999px

## Components

### Button

Primary: height 44px (min touch target, also on desktop), padding 0 20px, radius md (8px), bg=accent #7C5CFF, text=#FFFFFF, weight 600, size 15px, no border, subtle shadow 0 1px 2px rgba(0,0,0,0.4). Hover: bg=accentHover #8F73FF, cursor pointer. Active: bg=accentActive #6A47F0, transform translateY(1px), shadow removed. Focus-visible: 2px outline focus #A08CFF with 2px offset, always visible (never outline:none without replacement). Disabled: bg=surfaceRaised #1E222B, text=muted #9BA3B4, opacity 1, cursor not-allowed, aria-disabled=true, and the label explains why (e.g. 'Submit (text required)'). Loading state: label replaced by 'Submitting…' plus inline 14px spinner, button stays disabled and keeps its width. Secondary/Ghost button for list actions: transparent bg, 1px border=borderStrong #3A4150, text=fg, hover bg=surfaceRaised. Never two primary (accent) buttons visible at once in the same panel.

### Textarea (job text)

Full width of the form column, min-height 120px, resize vertical, padding 12px 14px, radius md, bg=codeBg #12151B, text=fg 15px/1.55, border 1px solid border #2A2F3A. Placeholder text=muted 'Paste or type the text to analyse…'. Focus: border-color=accent + 2px accentSoft ring (box-shadow 0 0 0 3px rgba(124,92,255,0.25)). Invalid: border-color=statusFailed #F26D6D plus a 12px error line below in statusFailed (no layout shift, reserve the row). Character counter bottom-right in muted 12px, e.g. '348 characters'.

### Select (analysis)

Native <select> styled: height 44px, padding 0 12px, radius md, bg=codeBg #12151B, text=fg, border 1px solid border, mono font for the values. Options use the raw API values as labels with a German hint: 'word_count — words counted', 'top_words — most frequent words', 'reading_time — estimated reading time'. Focus/hover like the textarea. Empty/invalid selection is not possible: word_count is preselected and the field is never rendered as an empty placeholder option.

### JobCard / JobRow

One card per job, stacked vertically, gap 12px, padding 16px, radius lg (12px), bg=surface #171A21, border 1px solid border #2A2F3A, hover border-color=borderStrong. Layout: row 1 = status badge left, job id + timestamp right-aligned in mono 12px muted; row 2 = job text, clamped to 3 lines (max-height ~4.6em, overflow hidden, '…'), size 15px, click toggles full text (no navigation, no silent truncation without affordance); row 3 = analysis name in muted 12px mono + result block: bg=codeBg, radius sm, padding 12px, mono 13px, color=fg, white-space pre-wrap, max-height 200px scrollable. States: pending/running → result row shows 'Waiting for the worker…' / 'Analysing…' in muted italic plus a 12px indeterminate progress bar (2px accent bar) — never an empty grey box. failed → card border-left 3px solid statusFailed, result block text=statusFailed, bg=dangerSurface. done → border-left 3px solid statusDone. Newest job first; the card that appeared since the last poll gets a 600ms accentSoft background fade.

### StatusBadge

Inline-flex, height 22px, padding 0 10px, radius pill, font-size 12px, weight 500, letter-spacing 0.02em, uppercase optional off, text = German label with a 6px dot in the same colour before it. Mapping (label → colour, bg): wartend → statusPending #D9A441 on statusPendingSoft; in Arbeit → statusRunning #4C8DFF on statusRunningSoft (dot pulses 1.2s while running); fertig → statusDone #3FB950 on statusDoneSoft; fehlgeschlagen → statusFailed #F26D6D on statusFailedSoft. Same four colours and labels everywhere in the app — never a second colour vocabulary.

### ErrorBanner

Full width of the content column, radius md, padding 12px 16px, bg=dangerSurface, border 1px solid statusFailed, left icon 16px, text=fg 14px with a bold first clause, e.g. 'Submission failed. The API rejected the text (400).'. For an unreachable API: 'API not reachable. Showing the last known list from 14:03.' plus a 'Retry now' ghost button inline. role=alert, dismissible via an '×' button (44x44px hit area). Never auto-hides within 5s.

### RefreshStatus

Small header-right indicator, 12px muted, e.g. 'Auto-refresh every 5 s · last update 14:03:12'; while a poll is in flight it is replaced by a 12px spinner + 'Refreshing…'. When polling is stopped by an error the text turns statusFailed and reads 'Auto-refresh paused — retrying'. This is the visible proof for AC-08; never a silent background timer.

### EmptyState

Centred block, padding 48px 24px, radius lg, 1px dashed border border #2A2F3A, bg=surface. Headline 18px/600 'No jobs yet', body 15px muted 'Type a text above, choose an analysis and submit it.', plus a ghost button 'Fill in an example text' that perfoms that action (no dead control, per AC-11).

### Header / AppShell

Sticky top bar, height 56px, bg=bg with 1px bottom border border, backdrop-filter blur(8px) and 0.9 alpha when content scrolls under it. Left: product name 15px/600 fg with a 20px accent mark (2px rounded square in accent, not an image asset). Right: RefreshStatus, plus a ServiceHealth chip (8px dot + 'API ok' / 'API down') fed by GET /health — colour from statusDone / statusFailed.

### FormPanel

Single card above the list, max-width 720px, padding 24px, radius lg, bg=surface, border 1px border. Vertical stack with 16px gaps: label 13px/500 mutedStrong 'Text', textarea, label 'Analysis', select, and a footer row (justify-content space-between, align-items center) with the primary Button 'Create job' on the left and a 13px muted hint 'Jobs run in the background — results appear within a few seconds.' on the right. On <720px the footer stacks vertically, button full width, min-height 44px.

### DisabledControl (not-yet-available)

Any control that exists but does nothing yet is rendered with bg=surfaceRaised, text=muted, cursor not-allowed, aria-disabled=true, and a visible suffix '· coming soon' in 12px muted. Hovering shows a tooltip with the reason. No control may look active and do nothing (AC-11).

## Layout Principles

- Container: content column max-width 960px, centred, horizontal padding 24px (16px below 720px); the form panel is additionally capped at 720px so the textarea line-length never exceeds ~90 characters.
- Breakpoints: single column up to 720px (mobile: form stacked, list full width, card padding 16px); 720–1080px one column with a wider list; above 1080px the same 960px column, optionally form (400px) next to the list (560px) with a 24px gutter — never more than two columns, the app has one task.
- Vertical rhythm: 24px between the header and the form, 32px between form and list, 12px between job cards, 4/8/12/16px inside components only — spacing comes from the scale, no arbitrary pixel values.
- Surfaces: bg #0F1115 page, surface #171A21 cards, surfaceRaised #1E222B for hovered/disabled fills, codeBg #12151B for user text, results and select fields. Depth is expressed by this 3-step ladder plus 1px borders — no drop shadows except the 0 1px 2px on the primary button.
- Accent discipline: accent #7C5CFF appears only on the primary submit button, the focus ring and the header mark. Status colours (pending/running/done/failed) are never used for decoration and never for buttons.
- Text: the user's job text is primary content (fg, 15px); the worker's result is secondary technical output (mono 13px on codeBg); timestamps, job ids and analysis names are metadata in muted 12px. Results keep their line breaks (white-space pre-wrap) — the API returns a readable string, the UI must not collapse it.
- Date and time format — ONE format everywhere: ISO-like local time 'YYYY-MM-DD HH:MM' in 24-hour notation, seconds only in the refresh indicator ('14:03:12'). Never a relative time ('3 min ago'), never English month names, never a second format in tooltips.
- Durations (reading time, processing time) are always formatted as 'X min Y s' (e.g. '3 min 20 s'), seconds omitted when zero; word counts and word frequencies always as '1,234 words' with a comma as the thousands separator. One helper function per format in the frontend, shared by all components — no local re-formatting in a component.
- Numbers and counts in table-ish contexts (job id, word count) are rendered in the mono stack, everything else in the sans stack.
- Status is never colour-only: every badge carries its German label (wartend / in Arbeit / fertig / fehlgeschlagen) and a dot, so the states stay distinguishable in greyscale and for colour-blind users (WCAG AA: fg #E6E9EF on surface #171A21 is 12.6:1, muted #9BA3B4 is 6.1:1, accent #7C5CFF on bg is 4.9:1).
- Accessibility: all interactive targets ≥44x44px (including the badge row '×' and list toggles), visible focus ring on every focusable element, form fields have real <label> elements, error banners use role=alert, polling updates announce politely via aria-live=polite so screen readers are not flooded.
- Motion: only functional transitions — 120ms ease-out on hover/focus colours, 600ms fade-in for a newly arrived card, 1.2s pulse on the running dot. Honour prefers-reduced-motion by disabling the pulse and the fade-in.
