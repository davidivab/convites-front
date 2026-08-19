# Design tokens (Convites)

**Single source of truth:** [`src/styles/design-tokens.css`](../src/styles/design-tokens.css)

To rebrand or fork this project, edit **only that file** (and the hex mirrors
in [`src/lib/design-tokens.ts`](../src/lib/design-tokens.ts) for favicons/meta).

## Naming (generic / semantic)

| Token | Role |
|-------|------|
| `--color-primary` | Brand / main actions |
| `--color-secondary` | Soft supporting surface |
| `--color-accent` | Secondary actions / success |
| `--color-warning` | Caution / highlight CTAs |
| `--color-destructive` | Errors / danger |
| `--color-background` / `--color-foreground` | Page canvas and body text |
| `--color-muted` / `--color-muted-foreground` | Subtle surfaces and secondary text |
| `--font-display` / `--font-body` | Headings (serif) / UI body (sans) |
| `--text-*` / `--space-*` / `--radius` | Type scale, spacing, corners |

In components prefer Tailwind classes that already map to these tokens:
`bg-primary`, `text-muted-foreground`, `font-serif`, `rounded-xl`, `bg-warning`.

## Rules

1. Never hardcode `lab()`, `oklch()`, `#hex`, or `rgb()` in feature components.
2. If a value is missing, **add a generic token** in the design file, then use it.
3. Do not invent product nicknames for tokens — keep standard semantic names.
4. **Exceptions allowed:** third-party brand colors (e.g. Google logo in
   `google-button.tsx`); static favicon SVG/ICO (use hex mirrors from the
   token files and keep them synced).

## Fonts (loading)

Next Font in `src/app/layout.tsx` sets `--font-fraunces` and
`--font-instrument-sans`. The token file aliases them as `--font-display`
and `--font-body`.

## Hex mirrors

`lab()` is canonical in CSS. Hex copies live as `--color-*-hex` in the CSS
file and in `src/lib/design-tokens.ts` for `themeColor`, favicons, and similar.
