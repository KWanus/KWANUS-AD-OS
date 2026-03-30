# KWANUS — UI Doctrine

## Design Identity

KWANUS looks and feels like a **premium financial consultant's private dashboard** — not a flashy fintech app, not a credit repair tool with aggressive CTAs, and not a generic SaaS product.

## Core Principles

### 1. Calm Over Urgent
- No flashing elements, countdown timers, or urgency tricks
- The interface communicates: "You're in control. Here's what to do next."
- Transitions are smooth. States are clear. Nothing surprises.

### 2. Dark, Premium, Structured
- Dark mode primary (deep navy/charcoal, not pure black)
- Clean typography (system fonts or premium sans-serif)
- Generous whitespace
- Card-based layouts with clear visual hierarchy
- Subtle accent colors for status (green = good, amber = attention, red = action needed)

### 3. One Purpose Per Screen
- Every screen answers one question or enables one action
- No multi-purpose dashboards with competing information
- Secondary information is accessible but not competing for attention

### 4. Maximum 2-3 Clicks
- Any primary action is reachable in 2-3 clicks from the dashboard
- Navigation is flat, not deeply nested
- The "Next Action" card on the dashboard provides a one-click shortcut to the most important thing

### 5. The System Thinks, The User Decides
- Complex analysis happens behind the scenes
- The user sees: what's happening, what it means, and what to do
- No raw data dumps. Everything is interpreted and presented with context.

## Component Standards

### Cards
- Primary container for information units
- Clear header, body, and action area
- One card = one concept

### Status Indicators
- Simple, consistent color coding
- Always accompanied by text labels (not color-only)
- States: Active, Pending, Resolved, Needs Attention, Upcoming

### Navigation
- Persistent top/side nav with stage indicators
- Current stage highlighted
- Progress breadcrumb showing position in the core loop

### Forms
- Minimal fields per step
- Inline validation
- Progress indicators for multi-step flows
- Smart defaults where possible

### Empty States
- Never show blank screens
- Always show: what this section is for, and what to do to get started
- Friendly, educational tone

## Responsive Requirements

- Mobile-first design
- Touch-friendly tap targets (min 44px)
- Collapsible navigation on mobile
- Card stacking on narrow viewports

## Accessibility

- WCAG 2.1 AA minimum
- Keyboard navigable
- Screen reader compatible
- Color is never the only indicator of state
- Sufficient contrast ratios on dark backgrounds
