# 🔥 Firebase Login Not Working - Complete Fix Guide

## Current Issue
Getting `Firebase: Error (auth/unauthorized-domain)` when trying to login with Google.

## Root Cause
Firebase doesn't recognize your Vercel domain as authorized, OR the environment variables aren't loaded on Vercel.

---

## 🎯 Step-by-Step Fix (Follow Exactly)

### **Step 1: Verify Vercel Environment Variables** ⚠️ CRITICAL

1. Go to https://vercel.com/dashboard
2. Select your project: **jrtechinc-ecommerce**
3. Click **Settings** → **Environment Variables**
4. **Check if these variables exist:**

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_BACKEND_URL
```

5. **If ANY are missing**, add ALL of them with these values:

```
VITE_FIREBASE_API_KEY=AIzaSyCytJd9LdJszmfGA28zvLn9pC0dQ9ikcuU
VITE_FIREBASE_AUTH_DOMAIN=jrtechinc-44a1f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=jrtechinc-44a1f
VITE_FIREBASE_STORAGE_BUCKET=jrtechinc-44a1f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=284807188307
VITE_FIREBASE_APP_ID=1:284807188307:web:ccaada889caadf6ea85ba6
VITE_FIREBASE_MEASUREMENT_ID=G-G3FZ0QX9BS
VITE_BACKEND_URL=https://jrtechinc-ecommerce.onrender.com
```

6. **Set environment to:** Production (check the box)
7. Click **Save**

---

### **Step 2: Firebase Console - Add Authorized Domain**

1. Go to https://console.firebase.google.com/
2. Select project: **jrtechinc-44a1f**
3. Click **Authentication** (left sidebar)
4. Click **Settings** tab
5. Scroll to **Authorized domains** section
6. Click **Add domain**
7. Add: `jrtechinc-ecommerce.vercel.app` (NO https://, NO trailing slash)
8. Click **Add**
9. Verify these domains are listed:
   - ✅ jrtechinc-44a1f.firebaseapp.com (default)
   - ✅ localhost
   - ✅ jrtechinc-ecommerce.vercel.app

---

### **Step 3: Redeploy on Vercel**

After adding environment variables, you MUST redeploy:

1. Go to Vercel Dashboard → **Deployments** tab
2. Find the latest deployment
3. Click the **...** menu button
4. Click **Redeploy**
5. Wait for deployment to complete (usually 1-2 minutes)

---

### **Step 4: Test After Deployment**

1. **Clear browser cache completely:**
   - Press F12 to open DevTools
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"
   - OR test in Incognito/Private mode

2. **Visit debug page:**
   ```
   https://jrtechinc-ecommerce.vercel.app/firebase-debug
   ```
   
   Check that all environment variables show as "✅ Set"

3. **Check console logs:**
   - Go to Login page
   - Open DevTools (F12) → Console tab
   - Look for these logs:
   ```
   Firebase configuration loaded successfully
   Auth Domain: jrtechinc-44a1f.firebaseapp.com
   Current window location: jrtechinc-ecommerce.vercel.app
   ```

4. **Try Google sign-in again**

---

## 🐛 Still Not Working?

### Check Console for These Errors:

**If you see: "Auth Domain: undefined"**
→ Environment variables are NOT set on Vercel. Go back to Step 1.

**If you see: "auth/unauthorized-domain"**
→ Firebase Console doesn't have your domain. Go back to Step 2.

**If popup appears and disappears immediately:**
→ Both Step 1 AND Step 2 need to be done correctly.

**If you see CORS errors:**
→ This is normal, backend CORS is configured. Focus on Firebase auth.

---

## 📝 Checklist

Before asking for help again, verify:

- [ ] ALL 8 environment variables are in Vercel
- [ ] Environment is set to "Production"
- [ ] Vercel project has been redeployed AFTER adding variables
- [ ] `jrtechinc-ecommerce.vercel.app` is in Firebase authorized domains
- [ ] Browser cache has been cleared
- [ ] Tested in Incognito mode
- [ ] Checked `/firebase-debug` page shows all variables as Set

---

## ✅ Expected Result

After completing all steps:
1. No more `auth/unauthorized-domain` errors
2. Google sign-in popup stays open
3. You can select a Google account
4. Login completes successfully
5. Redirects to home page with user logged in

---

## 🆘 Additional Help

If still stuck after completing ALL steps above:

1. Screenshot the `/firebase-debug` page
2. Screenshot the browser console on login page
3. Screenshot Vercel environment variables page
4. Screenshot Firebase authorized domains list

This will show exactly what's misconfigured.