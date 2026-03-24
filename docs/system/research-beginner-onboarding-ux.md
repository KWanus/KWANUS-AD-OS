# Research: Zero-Friction SaaS Onboarding UX
## Source: Synthesized from Canva, Duolingo, Shopify, Wix, Headspace, Notion, Stripe, and top mobile-first onboarding patterns

---

## Core Principles

### Intent Capture First
Ask WHY before HOW. The first question should surface what the user actually wants — not what features they'll use. This shapes everything downstream.

### Progressive Disclosure
Show only what's needed for this step. Never show all questions at once. One question per screen, always.

### Outcome Labels, Not Feature Labels
"Find a product to sell" not "Product Discovery Module." "See how it's going" not "Analytics Dashboard."

### Immediate Visual Feedback
Something changes on screen within 10 seconds of starting. Beginners need proof the system is working.

### Possessive Language for All Outputs
Every AI-generated result is named after the user: "Your Marketing Plan", "Your Offer", "Your Hook" — never "A marketing plan" or "The result."

---

## The Endowed Progress Effect
**Source:** Nunes & Dreze (2006) — people are more likely to complete a task if they feel they've already started.

**Application:** A progress bar that starts at 20% (not 0%) increases completion rates significantly.
- Give users credit for arriving: signing up = Step 1 already complete
- Start onboarding flow at Step 2 of 5, never Step 1 of 5
- First step should be easy — guarantee a quick win before anything hard

---

## "3 Questions to Full Personalization" Pattern

### Best examples:
- **Headspace**: 3 questions → named daily plan appears ("Your Calm Morning Plan")
- **Duolingo**: 4 questions → personalized learning path with first lesson queued
- **Typeform**: 3 questions → pre-built template dropped in matching answers
- **Wix**: 3 questions → complete website draft generated

### Language formula:
- Maximum 5 words per question (preferably 3–4)
- One question per screen
- Answer options are concrete first-person statements: "I sell physical products" not "Physical goods"
- Always include "Not sure yet" — beginners fear being wrong
- Micro-copy below each option validates the choice

**Avoid:** "Select your industry", "Choose your use case", "What is your primary objective"
**Use:** "What do you sell?", "Who do you want to reach?", "What does winning look like?"

---

## Reducing Decision Fatigue

### Choice chunking (4±1 rule)
Never present more than 5 options at once. Canva uses 4 categories then 4-5 featured templates per category — not 200 templates.

### Default selection with override
Don't ask "which plan?" — say "We've picked the Starter plan for you. It's perfect for beginners." Then small text: "See other options." Most beginners won't click it.

### The "just enough information" rule
- Wix onboarding copy: 11 words avg per screen
- Shopify setup wizard: 14 words avg per instruction
- More than 20 words on an onboarding step = dropout risk

### Blank page elimination
Every empty state needs:
1. An example of what it looks like when filled
2. A one-action CTA to fill it automatically
3. Optional: "see an example" link showing the finished state

---

## "Done For You" UX — Gold Standard

### Wix ADI (best-in-class example)
- 3 questions → full website
- Loading animation says "Building your website..." for 8 seconds even if faster is possible — *anticipation increases perceived value*
- Result presented with user's business name already in it
- Edit controls appear only AFTER user sees the result

### The 5 "Done For You" Principles
1. **Name the output after the user**: "Your Marketing Plan" not "A marketing plan"
2. **Show the result before asking for edits**: Never ask "what do you want?" — show something and ask "what would you change?"
3. **The loading moment is sacred**: "Creating your personalized plan..." not just a spinner
4. **Make "accept as-is" the path of least resistance**: Editing should require more clicks than accepting
5. **Explain the why in one sentence**: "We picked this because you said you sell physical products"

---

## Loading Screen Design
- 8–12 seconds, even if the computation is faster
- Pulse through specific steps: "Analyzing your answers... Matching your budget... Building your kit..."
- This creates anticipation and makes the result feel more valuable when it arrives

---

## Progress and Momentum UX

### Celebration moments that work:
- Confetti/particle animation on significant completion only (not every click)
- Sound + visual together registers deeper than either alone
- First-person past tense: "You created your first design" (not "Design created")
- "You're almost there" beats "Step 4 of 5"

### Shopify's setup checklist pattern:
- Completed items stay visible (crossed out), don't disappear — you can see how much you've done
- First item is deliberately easy — instant checkmark
- "X of 5 complete" counter always visible

---

## Plain Language Glossary for Marketing AI Tools

| Never say | Say instead |
|---|---|
| Configure | Set up / Choose |
| Integrate | Connect |
| Deploy | Launch / Go live |
| Audience segment | The people you want to reach |
| Content strategy | What you'll post |
| Analytics | How it's going / Your results |
| Conversion | People who buy / Signups |
| Brand identity | How your brand looks |
| Marketing funnel | Getting customers (avoid early on) |
| Campaign | Post / Ad / Message |
| Traffic | Visitors / People clicking |
| CPM | Ad cost |
| ROAS | Return on ad spend |
| Above the fold | Top of the page |

### Grade-level rule:
Best beginner SaaS tools write at **Grade 5–6 Flesch-Kincaid level** during onboarding.
After first value delivery, graduate to Grade 8. Never exceed Grade 10 in user-facing copy.

---

## Recommended Onboarding Architecture (5-Minute Flow)

### Screen 0 — Preview of payoff (before questions start)
> Show a blurred/watermarked preview of the full package they'll receive
> "Answer 3 questions. Get your complete launch kit. Takes 2 minutes."
> One button: "Let's build it"
> Social proof: "Join 50,000+ beginners who got their first offer this way"

### Screen 1 — Intent capture (20 seconds)
> "What do you want to promote?"
> Large visual tiles, single tap, auto-advance
> Time estimate visible: "30 seconds"

### Screen 2 — Budget signal (15 seconds)
> "How much can you spend on ads per day?"
> This matches offer to budget; user doesn't need to know that's what it's doing

### Screen 3 — Platform (15 seconds)
> "Where do you want to run ads?"
> Simple choices, validation copy under each

### Loading screen (8–10 seconds)
> "Building your personal launch kit..."
> Pulse through: "Matching your niche... Finding your best offer... Creating your hook..."

### Results screen — the payoff
> "Your launch kit is ready."
> Show previews of each component
> Primary CTA: "See my full kit" (possessive)
> Make accept-as-is the default — editing is secondary

---

## The 3 Emotional States to Engineer

- **Steps 1–2**: "This is easy" — short questions, instant responses, no wrong answers
- **Step 3 + loading**: "Something exciting is being made for me" — anticipation + personalization language
- **Results screen**: "I can't believe this took 2 minutes" — genuine surprise at quality + completeness

**Goal:** Users feel *competent* before they even understand what they're doing.
Competence → confidence → continued use. That's the retention loop.

---

## Mobile-First Onboarding Rules

- All primary CTAs in bottom 40% of screen (thumb zone)
- Minimum 48×48pt tap targets
- One question per screen — no scrolling during onboarding
- Auto-advance after selection (saves 1 tap per step)
- State persistence through interruptions: "Pick up where you left off"
- Full-width CTA buttons (90%+ screen width) at bottom
- Bottom sheet modals over full-screen navigation for supplementary info
