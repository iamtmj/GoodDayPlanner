# Supabase Dashboard Setup Checklist

Use this checklist while setting up your Supabase project.

## ☑️ Project Creation
- [ ] Go to https://supabase.com
- [ ] Sign in with GitHub/Google
- [ ] Click "New Project"
- [ ] Choose organization or create new one
- [ ] Fill in project details:
  - [ ] Name: "good-day-planner" (or your choice)
  - [ ] Database Password: (save this securely!)
  - [ ] Region: (choose closest to you)
- [ ] Click "Create new project"
- [ ] Wait for project to finish setting up (~2 minutes)

## ☑️ Get Credentials
- [ ] Go to Project Settings (gear icon)
- [ ] Click "API" in sidebar
- [ ] Copy these values:
  - [ ] **Project URL**: `https://xxxxx.supabase.co`
  - [ ] **anon/public key**: `eyJhbGc...` (long string)
- [ ] Save these in `config.js`:
  ```javascript
  const SUPABASE_CONFIG = {
      url: 'YOUR_PROJECT_URL_HERE',
      anonKey: 'YOUR_ANON_KEY_HERE'
  };
  ```

## ☑️ Google OAuth Setup

### Part 1: Google Cloud Console
- [ ] Go to https://console.cloud.google.com
- [ ] Create new project or select existing
- [ ] Enable APIs:
  - [ ] Click "APIs & Services" → "Library"
  - [ ] Search for "Google+ API"
  - [ ] Click "Enable"
- [ ] Create OAuth credentials:
  - [ ] Go to "Credentials" tab
  - [ ] Click "Create Credentials" → "OAuth client ID"
  - [ ] Choose "Web application"
  - [ ] Name it: "Good Day Planner"
  - [ ] Add Authorized redirect URIs:
    - [ ] `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
    - [ ] `http://localhost:8080/` (for local testing)
  - [ ] Click "Create"
  - [ ] **Copy Client ID and Client Secret**

### Part 2: Supabase Dashboard
- [ ] In Supabase, go to **Authentication**
- [ ] Click **Providers** tab
- [ ] Find **Google** in the list
- [ ] Toggle it **ON**
- [ ] Paste credentials:
  - [ ] Client ID: (from Google Console)
  - [ ] Client Secret: (from Google Console)
- [ ] Click **Save**

## ☑️ Database Setup
- [ ] In Supabase, go to **SQL Editor**
- [ ] Click **New Query**
- [ ] Open `supabase-schema.sql` file
- [ ] Copy ALL contents
- [ ] Paste into SQL Editor
- [ ] Click **Run** (or Cmd/Ctrl + Enter)
- [ ] Verify success: Should see "Success. No rows returned"
- [ ] Check tables were created:
  - [ ] Go to **Table Editor**
  - [ ] Should see 3 tables:
    - [ ] `activity_catalog`
    - [ ] `plans`
    - [ ] `completions`

## ☑️ Verify RLS Policies
- [ ] In **Table Editor**, select `activity_catalog`
- [ ] Click the lock icon or "Policies" tab
- [ ] Should see 4 policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] Repeat for `plans` table (should have 4 policies)
- [ ] Repeat for `completions` table (should have 4 policies)
- [ ] Total: **12 policies** across 3 tables

## ☑️ Optional: Configure Auth Settings
- [ ] Go to **Authentication** → **Settings**
- [ ] Site URL: `http://localhost:8080` (for development)
- [ ] Redirect URLs: Add if needed
  - [ ] `http://localhost:8080/*`
- [ ] Disable Email Confirmations (for testing):
  - [ ] Uncheck "Enable email confirmations"
  - [ ] (Re-enable for production!)

## ☑️ Test Connection
- [ ] Update `config.js` with your credentials
- [ ] Start local server: `python3 -m http.server 8080`
- [ ] Open browser console (F12)
- [ ] Visit `http://localhost:8080/login.html`
- [ ] Check console for errors
- [ ] Click "Continue with Google"
- [ ] Should redirect to Google login
- [ ] ✅ If you see Google consent screen: **SUCCESS!**

## ☑️ Verify Data Storage
After successful login:
- [ ] Add an activity in the app
- [ ] Go to Supabase **Table Editor**
- [ ] Click `activity_catalog` table
- [ ] Should see your activity listed!
- [ ] Click `plans` table
- [ ] Should see your plan data
- [ ] Verify `user_id` column matches your auth user

## ☑️ Security Check
- [ ] Try accessing another user's data:
  - [ ] Open SQL Editor
  - [ ] Run: `SELECT * FROM plans WHERE user_id != auth.uid();`
  - [ ] Should return: **0 rows** (RLS working!)
- [ ] Try inserting with wrong user_id:
  - [ ] Should fail with "RLS policy violation"
  - [ ] ✅ This means RLS is working correctly!

## 📝 Troubleshooting Checklist

If something doesn't work:

### Login Issues
- [ ] Google OAuth enabled in Supabase?
- [ ] Client ID and Secret correct?
- [ ] Redirect URI matches exactly?
  - [ ] Check for trailing slashes
  - [ ] HTTP vs HTTPS matters!
- [ ] Using proper dev server (not file://)?

### Database Issues
- [ ] Ran complete SQL script?
- [ ] All 3 tables exist?
- [ ] All 12 RLS policies exist?
- [ ] Used correct Supabase project?

### Config Issues
- [ ] Project URL correct in config.js?
- [ ] Anon key correct in config.js?
- [ ] No extra spaces or quotes?

### CORS Issues
- [ ] Using HTTP server (not file://)?
- [ ] Check Site URL in Auth settings
- [ ] Try adding localhost to redirect URLs

## ✅ Final Checklist

Before testing the app:
- [ ] ✅ Supabase project created
- [ ] ✅ Google OAuth configured (both sides)
- [ ] ✅ Database tables created (3 tables)
- [ ] ✅ RLS policies active (12 policies)
- [ ] ✅ config.js updated with credentials
- [ ] ✅ Local dev server running
- [ ] ✅ Browser console open (for debugging)

## 🎯 You're Ready!

If all items are checked:
1. Visit http://localhost:8080/login.html
2. Click "Continue with Google"
3. Authorize the app
4. Start planning your day!

## 🆘 Still Having Issues?

1. Check browser console for specific errors
2. Check Supabase logs: Dashboard → Logs
3. Verify all credentials are correct
4. Try the test plan in TESTING.md
5. Review full docs in README-SUPABASE.md

Good luck! 🚀
