# CI/CD Workflow Diagram

## Branch and Deployment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Developer Workflow                          │
└─────────────────────────────────────────────────────────────────┘

    feature/my-feature
           │
           │ git checkout -b feature/my-feature
           │ (branch from development)
           │
           ▼
    ┌──────────────┐
    │   Develop    │
    │   & Commit   │
    └──────────────┘
           │
           │ git push origin feature/my-feature
           │
           ▼
    ┌──────────────┐
    │   Open PR    │────────────────┐
    │      to      │                │
    │ development  │                │
    └──────────────┘                │
           │                        │
           │                        ▼
           │                 ┌─────────────┐
           │                 │  CI Checks  │
           │                 │  - Lint     │
           │                 │  - Test     │
           │                 │  - Build    │
           │                 └─────────────┘
           │                        │
           │                        │ ✅ Pass
           │                        │
           ▼                        ▼
    ┌──────────────┐         ┌─────────────┐
    │   Review &   │◄────────│  Approval   │
    │    Merge     │         └─────────────┘
    └──────────────┘
           │
           │ Squash merge to development
           │
           ▼
    ┌──────────────────────────────────────┐
    │         development branch           │
    │     (staging/integration branch)     │
    └──────────────────────────────────────┘
           │
           │ Automatic trigger
           │
           ▼
    ┌──────────────┐
    │  CI Checks   │
    │  - Lint      │
    │  - Test      │
    │  - Build     │
    └──────────────┘
           │
           │ ✅ Pass
           │
           ▼
    ┌──────────────────────────────────────┐
    │   Deploy to Vercel Preview           │
    │   (Automatic - No Approval)          │
    │   🔗 Preview URL in PR comment       │
    └──────────────────────────────────────┘
           │
           │ When ready for production
           │
           ▼
    ┌──────────────┐
    │   Open PR    │
    │      to      │
    │     main     │
    └──────────────┘
           │
           │
           ▼
    ┌──────────────┐
    │  CI Checks   │
    │  - Lint      │
    │  - Test      │
    │  - Build     │
    └──────────────┘
           │
           │ ✅ Pass
           │
           ▼
    ┌──────────────┐
    │   Review &   │
    │   Approval   │
    │  (Required)  │
    └──────────────┘
           │
           │ Merge to main
           │
           ▼
    ┌──────────────────────────────────────┐
    │            main branch               │
    │       (production branch)            │
    └──────────────────────────────────────┘
           │
           │ Automatic trigger
           │
           ▼
    ┌──────────────┐
    │  CI Checks   │
    │  - Lint      │
    │  - Test      │
    │  - Build     │
    └──────────────┘
           │
           │ ✅ Pass
           │
           ▼
    ┌──────────────────────────────────────┐
    │      ⏸️  MANUAL APPROVAL GATE        │
    │   (GitHub Environment Protection)    │
    │   Requires: Marc or designated       │
    │   approver to click "Approve"        │
    └──────────────────────────────────────┘
           │
           │ ✅ Approved
           │
           ▼
    ┌──────────────────────────────────────┐
    │   Deploy to Vercel Production        │
    │   🚀 Live to users                   │
    └──────────────────────────────────────┘
           │
           │
           ▼
    ┌──────────────────────────────────────┐
    │   Create GitHub Release Tag          │
    │   (Automatic versioning)             │
    └──────────────────────────────────────┘
```

## Parallel Workflows

### CI Workflow (All Branches)
```
PR or Push
    │
    ▼
┌─────────────┐
│   Checkout  │
└─────────────┘
    │
    ▼
┌─────────────┐
│ Setup Node  │
└─────────────┘
    │
    ▼
┌─────────────┐
│npm ci       │
└─────────────┘
    │
    ├──────────┬──────────┬──────────┐
    │          │          │          │
    ▼          ▼          ▼          ▼
┌────────┐ ┌──────┐ ┌──────┐ ┌────────────┐
│  Lint  │ │ Test │ │Build │ │  Coverage  │
└────────┘ └──────┘ └──────┘ └────────────┘
    │          │          │          │
    └──────────┴──────────┴──────────┘
                  │
                  ▼
            ✅ or ❌
```

### Preview Deployment (development branch)
```
Push to development
    │
    ▼
┌─────────────┐
│ CI Checks   │
└─────────────┘
    │
    ▼
┌─────────────┐
│   Deploy    │
│   Vercel    │
│  Preview    │
└─────────────┘
    │
    ▼
┌─────────────┐
│  Comment    │
│  on PR      │
│  with URL   │
└─────────────┘
```

### Production Deployment (main branch)
```
Push to main
    │
    ▼
┌─────────────┐
│ CI Checks   │
└─────────────┘
    │
    ▼
┌─────────────────────┐
│ Wait for Manual     │
│ Approval            │
│ (Environment Gate)  │
└─────────────────────┘
    │
    │ Approver clicks "Approve"
    │
    ▼
┌─────────────┐
│   Deploy    │
│   Vercel    │
│ Production  │
└─────────────┘
    │
    ▼
┌─────────────┐
│   Create    │
│  Release    │
│    Tag      │
└─────────────┘
```

## Environment Protection

```
┌─────────────────────────────────────────┐
│         GitHub Environments             │
├─────────────────────────────────────────┤
│                                         │
│  production                             │
│  ├─ Deployment branches: main only     │
│  ├─ Required reviewers: Marc (min 1)   │
│  ├─ Wait timer: 0 minutes              │
│  └─ Secrets: Vercel credentials        │
│                                         │
│  preview                                │
│  ├─ Deployment branches: all           │
│  ├─ Required reviewers: none           │
│  ├─ Wait timer: 0 minutes              │
│  └─ Secrets: Vercel credentials        │
│                                         │
└─────────────────────────────────────────┘
```

## Branch Protection

```
┌─────────────────────────────────────────┐
│         Branch Protection               │
├─────────────────────────────────────────┤
│                                         │
│  main (production)                      │
│  ├─ Require PR before merge            │
│  ├─ Require 1+ approvals               │
│  ├─ Require status checks              │
│  │  └─ "Lint, Test & Build"            │
│  ├─ Require conversation resolution    │
│  └─ No force push, no deletion         │
│                                         │
│  development (staging)                  │
│  ├─ Require status checks              │
│  │  └─ "Lint, Test & Build"            │
│  ├─ Require conversation resolution    │
│  └─ No force push, no deletion         │
│                                         │
└─────────────────────────────────────────┘
```

## Rollback Strategy

```
Production Issue Detected
    │
    ├─────────────┬─────────────┐
    │             │             │
    ▼             ▼             ▼
Vercel        Git Revert    Hotfix
Dashboard                   Branch
    │             │             │
    │             │             │
    ▼             ▼             ▼
Promote       Push to       Fast-track
Previous      main          PR to main
Deployment                      │
    │             │             │
    └─────────────┴─────────────┘
              │
              ▼
    ✅ Production Restored
```

## Key Points

- **Automatic**: CI runs on all PRs and pushes
- **Automatic**: Preview deploys on push to `development`
- **Manual**: Production deploys require approval on `main`
- **Protected**: Both `main` and `development` have branch protection
- **Tested**: All code must pass CI before merge
- **Versioned**: Production deployments create release tags
