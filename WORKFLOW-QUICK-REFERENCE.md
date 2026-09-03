# Luna Frontend - Workflow Quick Reference

## Branch Strategy

```
main (production)
  ↑ PR + manual approval
development (staging)
  ↑ PR + auto-merge
feature/*, fix/*, chore/*
```

## Daily Development

### Starting a New Feature
```bash
git checkout development
git pull origin development
git checkout -b feature/my-feature-name
```

### Committing Work
```bash
git add .
git commit -m "feat: description of change"
git push origin feature/my-feature-name
```

### Opening a PR
1. Go to GitHub
2. Open PR: `feature/my-feature-name` → `development`
3. Wait for CI to pass (lint, test, build)
4. Request review
5. Merge after approval
6. **Preview auto-deploys to Vercel**

## Production Release

### When Development is Ready
1. Open PR on GitHub: `development` → `main`
2. Request review from Marc
3. After PR approval and merge:
   - Go to GitHub Actions
   - Find "Deploy Production" workflow
   - Click "Review deployments"
   - **Approve deployment manually**
4. Production deploys to Vercel
5. GitHub release tag created automatically

## Commit Message Format

Use Conventional Commits:
- `feat: add new feature`
- `fix: correct bug`
- `test: add test coverage`
- `chore: update dependencies`
- `docs: update documentation`
- `refactor: restructure code`

## CI/CD Pipeline

### What Runs Automatically
- **On every PR**: Lint, test, build
- **On push to development**: CI + deploy to preview
- **On push to main**: CI + manual approval + deploy to production

### Deployment URLs
- **Preview**: Check GitHub Actions logs or PR comments
- **Production**: https://luna-frontend.vercel.app (update with actual URL)

## Troubleshooting

### CI Fails
```bash
# Run locally to debug
npm run lint
npm run test
npm run build
```

### Need to Rollback Production
1. Go to Vercel dashboard
2. Find last working deployment
3. Click "Promote to Production"

OR

```bash
git revert <commit-hash>
git push origin main
# Approve new deployment
```

## Important Rules

- ✅ Always branch from `development` (not `main`)
- ✅ Always open PRs to `development` (not `main`)
- ✅ Wait for CI to pass before merging
- ✅ Delete feature branch after merge
- ⚠️ Never push directly to `main` or `development`
- ⚠️ Never force push to protected branches

## Questions?

See full documentation:
- Setup guide: `.github/README.md`
- Git workflow: `../docs/frontend-git-workflow.md`
