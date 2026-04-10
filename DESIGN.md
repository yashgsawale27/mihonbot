# Design Brief

## Direction

MihonBot — Anime-inspired dark manga tracker dashboard with WhatsApp bot integration, featuring vivid magenta and cyan accents for energy and tech identity.

## Tone

Bold, immersive dark mode with anime poster energy and tech-forward refinement. High contrast magenta and cyan hierarchy over deep charcoal surfaces.

## Differentiation

Dual-mode interface: content dashboard for discovery (trending, recommendations, series details) + bot command panel with monospace typography for WhatsApp integration reference.

## Color Palette

| Token         | OKLCH           | Role                      |
| ------------- | --------------- | ------------------------- |
| background    | 0.13 0.015 260  | Deep charcoal primary     |
| foreground    | 0.93 0.01 260   | High-contrast text        |
| card          | 0.17 0.018 260  | Elevated content surfaces |
| primary       | 0.7 0.22 310    | Vivid magenta (CTA)       |
| accent        | 0.78 0.2 190    | Cyan tech/bot highlights  |
| destructive   | 0.65 0.19 22    | Red warning states        |
| muted         | 0.21 0.02 260   | Secondary surfaces        |

## Typography

- Display: Space Grotesk — Headers, titles, bot command labels. Bold, tech-forward, uppercase sections.
- Body: Satoshi — Content, descriptions, series metadata. Refined, readable.
- Mono: JetBrains Mono — Bot command reference, code snippets, webhook config.
- Scale: Hero `text-4xl md:text-6xl font-bold tracking-tight`, h2 `text-2xl md:text-4xl font-bold`, label `text-xs font-semibold tracking-widest uppercase`, body `text-base leading-relaxed`.

## Elevation & Depth

Soft shadows on cards (shadow-subtle/shadow-elevated) create depth without noise. Primary cards on muted surfaces; interactive elements pop via magenta buttons and cyan accents.

## Structural Zones

| Zone    | Background        | Border         | Notes                           |
| ------- | ----------------- | -------------- | ------------------------------- |
| Header  | card (0.17)       | border         | Subtle elevated bar             |
| Content | background (0.13) | —              | Primary surface; series cards   |
| Sidebar | card (0.17)       | border         | Bot commands, navigation        |
| Footer  | muted (0.21)      | border top     | Secondary info, metadata links  |

## Spacing & Rhythm

Spacious gaps between content sections (gap-6, gap-8). Series cards stack in responsive grid (2–4 columns). Micro-spacing: 4px, 8px, 12px, 16px for consistent rhythm. Accent colors (magenta buttons, cyan badges) create visual breaks.

## Component Patterns

- Buttons: Magenta background (primary), white text; hover dims. Secondary buttons use muted background. Outline style on accent.
- Cards: Subtle rounded (6px), card background, shadow-subtle on hover.
- Badges: Cyan for notifications (new chapter), magenta for featured, muted for secondary info.

## Motion

- Entrance: Fade-in 0.3s for card lists, staggered. Buttons have smooth color transition (0.3s).
- Hover: Cards lift with shadow-elevated, primary buttons brighten slightly.
- Decorative: Smooth transitions only; no bounces.

## Constraints

- Only magenta and cyan as accent colors; no gradients or glow effects.
- Cards must have visible surface hierarchy; no flat design.
- Monospace font reserved for bot command reference panel only.

## Signature Detail

Dual display of content (dashboard) and bot commands side-by-side on desktop, creating a unique "watch + command" interface that reinforces the notification-driven product identity.
