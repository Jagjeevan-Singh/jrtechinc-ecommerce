# Firebase Authentication Setup for Vercel

## Issue
Getting `auth/unauthorized-domain` error on Vercel deployment.

## Solution Checklist

### ✅ 1. Firebase Console - Authorized Domains
Go to [Firebase Console](https://console.firebase.google.com/) → Your Project → Authentication → Settings → Authorized domains

**Add these domains:**
- `jrtechinc-ecommerce.vercel.app`
- `localhost` (for local development)
- Any preview deployment domains from Vercel (optional)

### ✅ 2. Vercel Environment Variables
Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

**Add ALL these variables:**
```
VITE_FIREBASE_API_KEY=AIzaSyDhxcwjpy3KYoghlE60MYG8mKVwyN3BB8o
VITE_FIREBASE_AUTH_DOMAIN=jrtechinc-fc90b.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=jrtechinc-fc90b
VITE_FIREBASE_STORAGE_BUCKET=jrtechinc-fc90b.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=212409706164
VITE_FIREBASE_APP_ID=1:212409706164:web:9d4d5883458fed8ea919e1
VITE_FIREBASE_MEASUREMENT_ID=G-7N66KZL8VW
VITE_BACKEND_URL=https://jrtechinc-ecommerce.onrender.com
```

**IMPORTANT:** After adding variables, you MUST redeploy for changes to take effect.

### ✅ 3. Clear Browser Cache
After deployment completes:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or use Incognito/Private mode

### ✅ 4. Verify Deployment
Check these in browser console (F12):
```javascript
// Check if Firebase config is loaded
console.log(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN)
// Should output: jrtechinc-fc90b.firebaseapp.com
```

## Common Issues

### Still Getting Error?
1. **Double-check Vercel env vars** - Make sure they're added to "Production" environment
2. **Redeploy** - Changes to env vars require a new deployment
3. **Check Firebase Console** - Verify domain is in authorized list
4. **Browser extensions** - Disable ad blockers and privacy extensions
5. **Try different browser** - Rule out browser-specific issues

### Domain Not Showing in Firebase?
- Wait a few minutes after adding
- Try removing and re-adding the domain
- Check for typos (no `https://`, just the domain)

## Testing Locally
Local development should work with `localhost` in Firebase authorized domains.

Run: `npm run dev`
