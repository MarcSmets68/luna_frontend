# CI/CD Pipeline Setup

This directory contains GitHub Actions workflows for the Luna Frontend CI/CD pipeline.

## Workflows

### 1. CI (`ci.yml`)
**Triggers**: PRs and pushes to `main` and `development`

Runs on every pull request and push to ensure code quality:
- Linting with ESLint
- Unit tests with Vitest
- Build verification
- Optional: Code coverage upload to Codecov

### 2. Deploy Preview (`deploy-preview.yml`)
**Triggers**: Pushes to `development`, PRs to `development`

Automatically deploys to Vercel preview environment:
- Runs full CI checks
- Deploys to Vercel preview
- Comments on PR with preview URL

### 3. Deploy Production (`deploy-production.yml`)
**Triggers**: Manual (workflow_dispatch) or push to `main`

Deploys to Vercel production with manual approval gate:
- Runs full CI checks
- **Requires manual approval** via GitHub Environments
- Deploys to Vercel production
- Creates GitHub release tag

### 4. Dependency Updates (`dependency-updates.yml`)
**Triggers**: Weekly schedule (Mondays 9 AM UTC) or manual

Checks for outdated dependencies and creates issues with update information.

## Setup Instructions

### 1. GitHub Secrets

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```
VERCEL_TOKEN          # Vercel API token
VERCEL_ORG_ID         # Vercel organization ID
VERCEL_PROJECT_ID     # Vercel project ID
CODECOV_TOKEN         # (Optional) Codecov token for coverage reports
```

#### Getting Vercel Credentials

1. **VERCEL_TOKEN**:
   - Go to https://vercel.com/account/tokens
   - Create a new token with appropriate scope
   - Copy the token

2. **VERCEL_ORG_ID** and **VERCEL_PROJECT_ID**:
   - Install Vercel CLI: `npm i -g vercel`
   - Run `vercel link` in your project directory
   - Find the IDs in `.vercel/project.json`

### 2. GitHub Environments

Configure two environments in GitHub (Settings → Environments):

#### Production Environment
- **Name**: `production`
- **Deployment branches**: Only `main`
- **Protection rules**:
  - ✅ Required reviewers: Add Marc or designated approvers (minimum 1)
  - ✅ Wait timer: 0 minutes
- **Environment secrets**: Same Vercel credentials as repository secrets

#### Preview Environment
- **Name**: `preview`
- **Deployment branches**: `development` and feature branches
- **Protection rules**: None (auto-deploy)
- **Environment secrets**: Same Vercel credentials as repository secrets

### 3. Branch Protection Rules

Configure branch protection for `main` and `development` (Settings → Branches):

#### Main Branch Protection
- ✅ Require a pull request before merging
  - ✅ Require approvals (minimum 1)
  - ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - Required checks: `Lint, Test & Build`
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings
- ✅ Restrict who can push to matching branches (optional)

#### Development Branch Protection
- ✅ Require status checks to pass before merging
  - Required checks: `Lint, Test & Build`
- ✅ Require conversation resolution before merging (optional)
- ⚠️ Allow force pushes: NO
- ⚠️ Allow deletions: NO

### 4. Vercel Project Configuration

1. **Create Vercel Project**:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Framework Preset: Next.js
   - Root Directory: `./` (or leave empty if repo root is the Next.js project)

2. **Configure Git Integration**:
   - Production Branch: `main`
   - Enable automatic deployments for `development` branch

3. **Environment Variables** (if needed):
   - Add any required environment variables in Vercel dashboard
   - Configure different values for Production vs Preview environments

### 5. First Deployment Test

1. **Test CI Workflow**:
   ```bash
   git checkout development
   git checkout -b feature/test-ci
   # Make a small change
   git commit -m "test: verify CI workflow"
   git push origin feature/test-ci
   # Open PR to development on GitHub
   ```

2. **Test Preview Deployment**:
   ```bash
   # Merge the test PR to development
   # Check GitHub Actions for deployment status
   # Verify preview URL in deployment logs
   ```

3. **Test Production Deployment**:
   ```bash
   # Open PR from development to main
   # Merge after approval
   # Go to GitHub Actions → Deploy Production workflow
   # Approve the deployment in the "Review deployments" step
   # Verify production deployment
   ```

## Workflow for Developers

### Feature Development
```bash
# Start from development
git checkout development
git pull origin development
git checkout -b feature/my-feature

# Work on feature
git add .
git commit -m "feat: implement my feature"
git push origin feature/my-feature

# Open PR to development on GitHub
# CI runs automatically
# After approval, merge to development
# Preview deployment happens automatically
```

### Production Release
```bash
# When development is ready for production
# Open PR on GitHub: development → main
# Request review from Marc or designated approver
# After PR approval and merge, deployment workflow triggers
# Approver must manually approve deployment in GitHub Actions UI
# Production deployment proceeds after approval
```

## Troubleshooting

### CI Fails
- Check GitHub Actions logs for specific error
- Run `npm run lint`, `npm run test`, `npm run build` locally
- Fix issues and push new commit

### Deployment Fails
- Verify Vercel secrets are correctly set
- Check Vercel dashboard for deployment logs
- Ensure Vercel project is correctly linked to GitHub repo

### Manual Approval Not Showing
- Verify `production` environment is configured in GitHub
- Check that required reviewers are added to environment protection rules
- Ensure the workflow is triggered from `main` branch

## Monitoring

- **GitHub Actions**: View workflow runs in the Actions tab
- **Vercel Dashboard**: Monitor deployments and logs
- **Production URL**: Check https://luna-frontend.vercel.app (update with actual URL)
- **Preview URLs**: Found in PR comments and deployment logs

## Rollback Procedure

### Via Vercel Dashboard
1. Go to Vercel project dashboard
2. Navigate to Deployments
3. Find the last working deployment
4. Click "..." → "Promote to Production"

### Via Git
1. Identify the last working commit
2. Create a revert or fix commit
3. Push to `main`
4. Approve new deployment

## Future Enhancements

- [ ] Add E2E tests with Playwright
- [ ] Implement visual regression testing
- [ ] Add performance budgets
- [ ] Set up Slack/Teams notifications
- [ ] Configure Sentry for error tracking
- [ ] Add backend CI/CD workflows
