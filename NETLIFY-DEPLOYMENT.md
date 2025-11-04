# Netlify Deployment Guide

This guide will help you deploy the Dashboard Customer application to Netlify.

## Prerequisites

- A Netlify account ([sign up here](https://app.netlify.com))
- Your Git repository connected to GitHub/GitLab/Bitbucket
- All environment variables ready (see `env.sample`)

## Step 1: Install Dependencies

First, ensure you have the Netlify Next.js plugin installed:

```bash
yarn install
```

This will install `@netlify/plugin-nextjs` which is required for Next.js deployments on Netlify.

## Step 2: Configure Netlify Site

### Option A: Via Netlify Dashboard (Recommended)

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your Git provider (GitHub, GitLab, or Bitbucket)
4. Select your repository
5. Netlify will auto-detect the Next.js configuration from `netlify.toml`

### Option B: Via Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site (if not already connected)
netlify init
```

## Step 3: Configure Environment Variables

1. Go to your site settings in Netlify Dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variables (from `env.sample`):

### Required Variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (⚠️ Keep secret)
- `EMAIL_SERVICE_PROVIDER` - `resend` or `sendgrid`
- `EMAIL_SERVICE_API_KEY` - Email service API key
- `EMAIL_SERVICE_FROM` - From email address
- `METRICS_API_KEY` - API key for metrics endpoint

### Optional Variables:

- `AUTH_CODE_EXPIRATION_MINUTES` - Default: `10`
- `AUTH_CODE_MAX_ATTEMPTS` - Default: `5`
- `AUTH_SESSION_DURATION_HOURS` - Default: `24`
- `AUTH_REFRESH_TOKEN_DURATION_DAYS` - Default: `30`

### Environment Contexts

Set variables for different contexts:
- **Production**: Main branch deployments
- **Deploy Preview**: Pull request previews
- **Branch Deploy**: Other branch deployments

## Step 4: Build Settings

The build settings are automatically configured via `netlify.toml`:

- **Build command**: `yarn build`
- **Publish directory**: `.next`
- **Node version**: `22`
- **Framework**: Next.js (auto-detected)

These settings are automatically applied when you connect your repository.

## Step 5: Deploy

### Automatic Deployment

Once configured, Netlify will automatically:
- Deploy on every push to the main branch
- Create deploy previews for pull requests
- Deploy branch deploys for other branches

### Manual Deployment

```bash
# Deploy to production
netlify deploy --prod

# Deploy a preview
netlify deploy
```

## Step 6: Verify Deployment

1. Check the build logs in Netlify Dashboard
2. Verify your site is accessible
3. Test authentication flows
4. Verify API routes are working
5. Check environment variables are loaded correctly

## Troubleshooting

### Build Failures

1. **Check Node version**: Ensure Node 22 is specified (already in `netlify.toml`)
2. **Check dependencies**: Ensure `yarn install` completes successfully
3. **Check environment variables**: All required variables must be set
4. **Check build logs**: Look for specific error messages

### Environment Variables Not Loading

1. Verify variables are set in the correct environment context
2. Check variable names match exactly (case-sensitive)
3. Ensure `NEXT_PUBLIC_*` variables are set for client-side access
4. Restart the build after adding/updating variables

### API Routes Not Working

1. Ensure `@netlify/plugin-nextjs` is installed
2. Check that API routes are in `src/app/api/` directory
3. Verify middleware is not blocking API routes

### Performance Issues

1. Check build cache is working (configured in `netlify.toml`)
2. Enable Next.js image optimization
3. Review bundle size using `yarn build` locally

## Additional Resources

- [Netlify Next.js Plugin Documentation](https://github.com/netlify/netlify-plugin-nextjs)
- [Next.js on Netlify Guide](https://docs.netlify.com/integrations/frameworks/next-js/)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)

## Support

If you encounter issues:
1. Check the build logs in Netlify Dashboard
2. Review the [Netlify Status Page](https://www.netlifystatus.com/)
3. Check Next.js and Netlify documentation

