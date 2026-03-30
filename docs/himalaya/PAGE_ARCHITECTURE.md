# HIMALAYA — Page Architecture

## Phase 1 Pages

### / (Landing / Home)
- Hero: "Start, structure, or scale your business"
- Two paths: "Start from scratch" | "Improve my business"
- How it works (3 steps)
- Social proof / results (when available)
- If authenticated: redirect to /dashboard

### /onboarding
- Entry flow router
- Determines path (scratch vs improve)
- Minimal, guided, one-step-at-a-time

### /onboarding/scratch
- Step-by-step: business model → niche → goal → optional context
- Card-based selection (not dropdowns)
- Progress indicator
- Smart defaults and suggestions at every step

### /onboarding/improve
- Website URL input + business description
- Quick diagnostic questions
- Asset upload (optional)
- Progress indicator

### /diagnosis
- Loading state while engines run
- Progressive result reveal
- For scratch: viability + alignment assessment
- For improve: full business audit with scores
- Visual score breakdown
- Bottleneck map
- Fastest wins

### /strategy
- Prioritized action plan
- "Do first / Do next / Do later / Don't do yet"
- Each item has: what, why, expected impact
- Clear "Build This" CTA to trigger generation

### /build
- Generation hub
- Shows all assets being generated
- Progressive reveal as each completes
- Status per asset: generating → ready → reviewed → launched

### /build/[asset-type]
- Individual asset view
- Full preview
- "Why this was built this way" panel
- Edit mode
- Regenerate with direction adjustment
- Export / deploy

### /dashboard
- Post-onboarding home
- Status summary (stage, score, progress)
- Next Action card (always one clear action)
- Assets grid (organized by category)
- Roadmap progress
- Quick actions bar

### /assets
- All generated assets in one place
- Filter by type: website, copy, email, ads, strategy, operations
- Status badges: draft, reviewed, launched
- Search and sort

### /roadmap
- Full action plan timeline
- Checkable items
- Impact indicators
- "What's next" always highlighted

### /settings
- Profile
- Business context (editable — feeds into all generation)
- Preferences (beginner/operator mode toggle)
- Account

---

## Phase 2+ Pages (Not Built Yet)

### /optimize
- Optimization engine interface
- Current weaknesses detected
- Suggested improvements with impact
- Regeneration controls

### /automations
- Workflow builder
- Email/SMS flow builder
- CRM pipeline setup

### /analytics
- Performance tracking
- Conversion metrics
- Before/after comparisons

---

## Navigation Structure

### Primary Nav
- Dashboard
- Build (assets + generation)
- Roadmap
- Settings

### Contextual
- Next Action card (appears on every page)
- Breadcrumbs in multi-step flows

### Mobile
- Bottom tab navigation
- Collapsible sections
- Touch-optimized cards

---

## Page Rules

1. Every page has one clear purpose
2. Every page has one clear next action
3. No page shows raw data — everything is interpreted
4. Loading states explain what's happening
5. Empty states guide the user to get started
6. Pages adapt to beginner vs operator mode
