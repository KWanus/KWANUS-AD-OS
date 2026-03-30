# KWANUS — Information Architecture

## Top-Level Structure

```
KWANUS
├── Onboarding
│   ├── Account Creation
│   ├── Profile Setup
│   └── Credit Report Upload
│
├── Dashboard (Home)
│   ├── Status Summary
│   ├── Active Stage Indicator (Repair/Build/Optimize/Prepare/Fund)
│   ├── Next Action Card
│   └── Progress Timeline
│
├── Repair Center
│   ├── Credit Items List
│   ├── Item Detail & Dispute Status
│   ├── Dispute Letter Builder
│   ├── Dispute Tracker
│   └── Repair Education Hub
│
├── Profile Builder (Phase 2)
│   ├── Profile Strength Score
│   ├── Account Mix Overview
│   ├── Utilization Monitor
│   ├── Tradeline Education
│   └── Build Recommendations
│
├── Optimizer (Phase 3)
│   ├── Score Factor Breakdown
│   ├── Timing Engine
│   ├── Inquiry Strategy
│   └── Optimization Recommendations
│
├── Funding Prep (Phase 4)
│   ├── Readiness Assessment
│   ├── Documentation Checklist
│   ├── Lender Education
│   └── Application Sequencing
│
├── Funding Guide (Phase 5)
│   ├── Opportunity Awareness
│   ├── Strategy Guidance
│   └── Post-Funding Protection
│
├── Settings
│   ├── Profile
│   ├── Notifications
│   └── Account Management
│
└── Education Library
    ├── Credit Basics
    ├── Dispute Process
    ├── Building Credit
    ├── Funding Readiness
    └── Financial Literacy
```

## Navigation Model

- **Primary nav**: Dashboard, Repair, Build, Optimize, Prepare, Fund
- **Secondary nav**: Settings, Education, Help
- **Contextual nav**: Next Action cards guide the user forward at every stage
- **Stage gating**: Users see their current stage prominently. Future stages are visible but clearly marked as upcoming.

## Data Architecture

### Core Entities
- `User` — account, profile, preferences
- `CreditReport` — uploaded report, parsed data, timestamp
- `CreditItem` — individual line item from report
- `Dispute` — challenge against a credit item, with status lifecycle
- `TimelineEvent` — any action, milestone, or status change
- `ProfileScore` — calculated profile strength (Phase 2+)
- `ReadinessAssessment` — funding readiness evaluation (Phase 4+)

### Relationships
- User → many CreditReports
- CreditReport → many CreditItems
- CreditItem → many Disputes
- User → many TimelineEvents
- User → one ProfileScore (recalculated)
- User → many ReadinessAssessments
