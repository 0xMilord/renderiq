# Vercel Preview Deployment Guide

## Overview

Vercel automatically creates **Preview Deployments** for testing before production. These are separate from your production deployment and perfect for testing new features.

---

## Quick Start: Deploy to Preview

### Option 1: Deploy Current Branch (Recommended)

```bash
# Deploy current branch to preview environment
vercel

# Or explicitly
vercel deploy
```

This creates a **preview deployment** with a unique URL like:
- `https://your-project-git-branch-name.vercel.app`
- `https://your-project-abc123.vercel.app`

### Option 2: Deploy Specific Branch

```bash
# Deploy a specific branch
vercel deploy --branch feature-branch-name
```

### Option 3: Deploy from Git (Automatic)

When you push to a branch (not `main`), Vercel automatically creates a preview deployment:

```bash
# Create a new branch
git checkout -b feature/new-feature

# Make your changes
# ... edit files ...

# Commit and push
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
```

Vercel will automatically:
1. Detect the push
2. Create a preview deployment
3. Give you a unique preview URL
4. Comment on your PR (if you create one)

---

## Deployment Commands Reference

| Command | What It Does | Environment |
|---------|-------------|-------------|
| `vercel` or `vercel deploy` | Deploys to **Preview** | Preview/Development |
| `vercel deploy --prod` | Deploys to **Production** | Production (main branch) |
| `vercel deploy --prebuilt` | Deploys pre-built app | Preview |
| `vercel deploy --yes` | Skip confirmation prompts | Preview |

---

## Environment Variables Setup

### Set Environment Variables for Preview

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Go to **Settings** → **Environment Variables**

2. **Add Variables for Preview Environment**
   - Click **Add New**
   - Enter variable name and value
   - Select **Preview** (or **Development**)
   - Click **Save**

3. **Environment Scopes**
   - **Production**: Only for `main` branch deployments
   - **Preview**: For all branch deployments (except main)
   - **Development**: For local `vercel dev` (optional)

### Example: Different API Keys for Preview vs Production

```
Variable: PADDLE_API_KEY
- Production: live_xxxxxxxxxxxxx (production key)
- Preview: test_xxxxxxxxxxxxx (sandbox/test key)
```

This way:
- Preview deployments use test/sandbox credentials
- Production uses real credentials
- No risk of affecting production data

---

## Workflow: Testing Before Production

### Step-by-Step Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b test/new-release
   ```

2. **Make Your Changes**
   ```bash
   # Make code changes
   # Fix bugs, add features, etc.
   ```

3. **Test Locally First** (Optional)
   ```bash
   npm run dev
   # Test at http://localhost:3000
   ```

4. **Deploy to Preview**
   ```bash
   # Option A: Push to trigger auto-deployment
   git add .
   git commit -m "Test new release"
   git push origin test/new-release
   
   # Option B: Manual deployment
   vercel deploy
   ```

5. **Get Preview URL**
   - Check Vercel Dashboard → Deployments
   - Or check the terminal output after `vercel deploy`
   - URL format: `https://your-project-abc123.vercel.app`

6. **Test on Preview**
   - Open the preview URL
   - Test all features
   - Check console for errors
   - Verify environment variables are working

7. **If Everything Works: Deploy to Production**
   ```bash
   # Merge to main
   git checkout main
   git merge test/new-release
   git push origin main
   
   # Or deploy directly
   vercel deploy --prod
   ```

8. **If Issues Found: Fix and Redeploy**
   ```bash
   # Fix issues on the branch
   git add .
   git commit -m "Fix issues"
   git push origin test/new-release
   # Vercel auto-deploys the fix
   ```

---

## Preview Deployment Features

### Automatic Preview Deployments

Vercel automatically creates preview deployments when you:
- Push to any branch (except `main`)
- Open a Pull Request
- Push new commits to a PR

### Preview URLs

- **Unique per branch**: `project-git-branch-name.vercel.app`
- **Unique per commit**: `project-abc123.vercel.app`
- **Shareable**: Send to team members for testing
- **Isolated**: Each preview is completely separate

### Preview vs Production

| Feature | Preview | Production |
|---------|---------|------------|
| URL | `project-abc123.vercel.app` | `yourdomain.com` |
| Branch | Any branch | `main` only |
| Environment | Preview env vars | Production env vars |
| Database | Test/Sandbox | Production |
| API Keys | Test/Sandbox | Production |
| Cost | Free | Free (within limits) |

---

## Advanced: Manual Preview Deployment

### Deploy with Specific Environment

```bash
# Deploy with custom environment
vercel deploy --env PADDLE_ENVIRONMENT=sandbox
```

### Deploy with Build Override

```bash
# Use custom build command
vercel deploy --build-env NODE_ENV=development
```

### Deploy from Specific Directory

```bash
# If your Next.js app is in a subdirectory
cd app
vercel deploy
```

---

## Checking Deployment Status

### Via CLI

```bash
# List all deployments
vercel ls

# Get deployment details
vercel inspect [deployment-url]
```

### Via Dashboard

1. Go to Vercel Dashboard
2. Click on your project
3. Go to **Deployments** tab
4. See all preview and production deployments
5. Click on any deployment to see:
   - Build logs
   - Environment variables used
   - Deployment URL
   - Build time and status

---

## Troubleshooting

### Preview Not Updating

```bash
# Force a new deployment
vercel deploy --force
```

### Wrong Environment Variables

1. Check Vercel Dashboard → Settings → Environment Variables
2. Ensure variables are set for **Preview** environment
3. Redeploy: `vercel deploy`

### Preview URL Not Working

1. Check deployment status in Vercel Dashboard
2. Check build logs for errors
3. Verify environment variables are set
4. Try redeploying: `vercel deploy --force`

### Need to Test Production Build Locally

```bash
# Build production version locally
npm run build
npm start

# Or use Vercel CLI
vercel dev
```

---

## Best Practices

1. **Always Test on Preview First**
   - Never deploy directly to production
   - Use preview for all testing

2. **Use Different Environment Variables**
   - Preview: Test/Sandbox credentials
   - Production: Real credentials

3. **Create PRs for Review**
   - Open PRs to get automatic preview deployments
   - Share preview URLs with team

4. **Monitor Preview Deployments**
   - Check build logs
   - Test thoroughly before merging

5. **Clean Up Old Previews**
   - Vercel automatically cleans up old previews
   - Or delete manually in dashboard

---

## Quick Reference Commands

```bash
# Deploy to preview (current branch)
vercel

# Deploy to preview (specific branch)
vercel deploy --branch feature-name

# Deploy to production (main branch only)
vercel deploy --prod

# List all deployments
vercel ls

# View deployment details
vercel inspect [url]

# Force new deployment
vercel deploy --force

# Deploy with custom env
vercel deploy --env KEY=value
```

---

## Example Workflow

```bash
# 1. Create feature branch
git checkout -b test/faq-fix

# 2. Make changes
# ... edit components/home/faq-section.tsx ...

# 3. Test locally
npm run dev

# 4. Commit
git add .
git commit -m "Fix FAQ section syntax errors"

# 5. Deploy to preview
vercel deploy
# Or push to trigger auto-deployment
git push origin test/faq-fix

# 6. Get preview URL from terminal or dashboard
# Example: https://renderiq-git-test-faq-fix.vercel.app

# 7. Test on preview URL

# 8. If good, merge to main
git checkout main
git merge test/faq-fix
git push origin main
# Production auto-deploys

# 9. Or deploy directly to production
vercel deploy --prod
```

---

## Summary

- **Preview Deployments**: Use `vercel deploy` (without `--prod`)
- **Production Deployments**: Use `vercel deploy --prod` or push to `main`
- **Automatic**: Pushing to branches creates preview deployments automatically
- **Isolated**: Each preview is separate with its own URL
- **Safe**: Test everything on preview before production

