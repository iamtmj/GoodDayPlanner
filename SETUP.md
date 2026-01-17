# Quick Setup Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Click "Start your project"
3. Create new project
4. **Save these values:**
   - Project URL: `https://xxxxx.supabase.co`
   - Anon/Public Key: `eyJxxx...`

### Step 2: Enable Google OAuth
1. In Supabase dashboard → **Authentication** → **Providers**
2. Toggle **Google** to ON
3. Get Google OAuth credentials:
   - Go to https://console.cloud.google.com
   - Create project → APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Add redirect URI: `https://xxxxx.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase

### Step 3: Setup Database
1. In Supabase → **SQL Editor**
2. Click "New Query"
3. Copy all contents from `supabase-schema.sql`
4. Click "Run"
5. ✅ You should see "Success. No rows returned"

### Step 4: Configure App
Edit `config.js` and replace:
```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co', // ← Your project URL
    anonKey: 'your-anon-key'                  // ← Your anon key
};
```

### Step 5: Run Locally
```bash
# Option 1: Python (easiest)
python3 -m http.server 8080

# Option 2: Node.js
npx http-server -p 8080

# Option 3: PHP
php -S localhost:8080
```

### Step 6: Test
1. Open http://localhost:8080/login.html
2. Click "Continue with Google"
3. Authorize app
4. You should see the Plan page! 🎉

## ⚠️ Common Issues

**"Supabase client initialization failed"**
→ Check `config.js` has correct URL and key

**"Failed to sign in with Google"**
→ Verify redirect URI in Google Console matches exactly

**"Cannot read properties of undefined"**
→ Make sure you ran `supabase-schema.sql` in Step 3

**CORS errors**
→ Use a development server (Step 5), not `file://` protocol

## 📝 Next Steps

- Read full docs in `README-SUPABASE.md`
- Customize styles in `styles.css`
- Deploy to Netlify/Vercel for production

## 🆘 Need Help?

Check browser console (F12) for detailed error messages!
