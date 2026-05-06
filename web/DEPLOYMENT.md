# 🚀 Frontend Deployment Checklist

## Pre-Deployment Verification

### ✅ Code Quality
- [ ] Run `npm run type-check` - No TypeScript errors
- [ ] Run `npm run lint` - No linting errors  
- [ ] All components render without console errors
- [ ] No hardcoded URLs (except localhost fallback in API client)
- [ ] No console.log statements in production code

### ✅ Environment Configuration
- [ ] `.env.local` configured for your environment
- [ ] `NEXT_PUBLIC_API_URL` points to correct backend
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
- [ ] `CLERK_SECRET_KEY` is set
- [ ] `NEXT_PUBLIC_ENVIRONMENT` is set correctly (development/staging/production)

### ✅ Build Verification
- [ ] Run `npm run build` - Build succeeds without errors
- [ ] Build output shows: ✓ Compiled successfully
- [ ] No warnings about missing dependencies
- [ ] Bundle size is reasonable

### ✅ Features Testing
- [ ] Sign In works: http://localhost:3000/sign-in
- [ ] Sign Up works: http://localhost:3000/sign-up
- [ ] Profile dropdown appears when logged in
- [ ] Logout button works
- [ ] User role displays correctly
- [ ] All pages load without errors
- [ ] Responsive design works on mobile

### ✅ Authentication
- [ ] Clerk is properly configured
- [ ] Webhook redirects are correct
- [ ] JWT token is being sent to API
- [ ] Session persists on refresh
- [ ] Logout clears session

---

## Deployment Steps

### For Staging Deployment

**1. Prepare Environment**
```bash
cd flood-frontend/web
npm run build:analyze  # Optional: check bundle size
```

**2. Set Environment Variables**
Copy from `.env.staging` template:
```bash
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_API_URL=https://api-stg.flodsense.lk/api
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=[staging-key]
CLERK_SECRET_KEY=[staging-secret]
```

**3. Build for Staging**
```bash
NODE_ENV=production NEXT_PUBLIC_ENVIRONMENT=staging npm run build
```

**4. Test Staging Build Locally**
```bash
npm run start:prod
# Visit http://localhost:3000 and verify
```

**5. Deploy to Hosting**
- For Vercel: Connect repo, set environment variables, deploy
- For Docker: Build image, push to registry, deploy
- For traditional server: Build, copy to server, restart Node process

### For Production Deployment

**1. Same steps as staging, but use production environment**
```bash
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_API_URL=https://api.flodsense.lk/api
```

**2. Additional Production Checks**
- [ ] HTTPS is enabled
- [ ] SSL certificate is valid
- [ ] Security headers are set (done in next.config.js)
- [ ] Analytics/monitoring is configured
- [ ] Error tracking is set up
- [ ] Backup/rollback plan is ready

---

## Deployment Configurations

### Vercel
```json
{
  "env": {
    "NEXT_PUBLIC_ENVIRONMENT": "staging",
    "NEXT_PUBLIC_API_URL": "https://api-stg.flodsense.lk/api",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_test_...",
    "CLERK_SECRET_KEY": "sk_test_..."
  },
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

### Docker
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN NEXT_PUBLIC_ENVIRONMENT=staging npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
EXPOSE 3000
CMD ["node", "server.js"]
```

### AWS S3 + CloudFront
- Build: `npm run build`
- Export: `next export` (if needed)
- Upload `.next/static` to S3
- Invalidate CloudFront cache

---

## Post-Deployment Verification

### ✅ Staging/Production Checks
- [ ] App loads without errors
- [ ] Staging badge appears (if staging)
- [ ] Sign In page works
- [ ] Profile dropdown appears
- [ ] Logout works
- [ ] API calls succeed (check Network tab)
- [ ] No console errors
- [ ] No security warnings
- [ ] Performance is acceptable

### ✅ Monitoring
- [ ] Error tracking is working
- [ ] Analytics is collecting data
- [ ] Health checks are passing
- [ ] Uptime monitoring is active

---

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm ci
npm run build
```

### Performance Issues
```bash
# Analyze bundle size
npm run build:analyze
```

### Environment Variables Not Working
- Check: Variables are prefixed with `NEXT_PUBLIC_` for client-side
- Check: `.env.local` is not committed to git
- Check: Hosting platform has environment variables set
- Check: Restart build after changing variables

### Clerk Authentication Not Working
- Check: Publishable key is correct
- Check: Redirect URLs are set in Clerk Dashboard
- Check: Domain is added to Clerk allowed origins
- Check: JWT is being sent to backend

---

## Rollback Plan

If issues occur after deployment:

1. **Immediate Rollback**
   ```bash
   # Revert to previous working version
   git revert [commit-hash]
   npm run build
   # Redeploy
   ```

2. **Or Switch Traffic**
   - Route to previous working deployment
   - Check logs for errors
   - Fix and redeploy

---

## Files Ready for Deployment

✅ `next.config.js` - Optimized for production
✅ `package.json` - Build scripts configured
✅ `src/lib/env.ts` - Environment detection
✅ `src/app/error.tsx` - Error boundary
✅ `src/components/layout/Topbar.tsx` - Staging badge support
✅ `.env.staging` - Staging environment template
✅ `.env.production` - Production environment template
✅ `.env.local.example` - Development template

---

## Next Steps

1. ✅ Run build: `npm run build`
2. ✅ Test build: `npm run start:prod`
3. ✅ Configure environment variables for hosting
4. ✅ Deploy to staging first
5. ✅ Run smoke tests
6. ✅ Deploy to production

**Ready to deploy!** 🚀!!
