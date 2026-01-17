# Good Day Planner - Supabase Integration Setup

## Overview

Good Day Planner is now integrated with Supabase for authentication (Google OAuth only) and cloud data storage. Users can plan activities for future dates, track completion, and visualize progress with a GitHub-style heatmap.

## Prerequisites

- A Supabase project (create one at [supabase.com](https://supabase.com))
- Google OAuth configured in Supabase
- Modern web browser with JavaScript enabled

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon/public key

### 2. Configure Google OAuth

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
     - `http://localhost:8080/` (for local development)
4. Copy Client ID and Client Secret to Supabase

### 3. Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql`
3. Run the SQL script to create tables and policies

This will create:
- `activity_catalog` - User's activity names
- `plans` - Daily plans with activities (JSONB)
- `completions` - Activity completion tracking (JSONB)
- Row Level Security (RLS) policies for data isolation
- Helper functions for statistics

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

**For quick testing without build tools:**
Edit `config.js` directly and replace the placeholder values:
```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key'
};
```

## Local Development

### Option 1: Simple HTTP Server (No Build Required)

If you're not using a bundler, you can serve the files directly:

```bash
# Using Python 3
python3 -m http.server 8080

# Using Node.js (install globally first: npm install -g http-server)
http-server -p 8080

# Using PHP
php -S localhost:8080
```

Then open `http://localhost:8080/login.html`

**Note:** Make sure to update `config.js` with your actual Supabase credentials since environment variables won't work without a build tool.

### Option 2: Using Vite (Recommended for Production)

1. Install dependencies:
   ```bash
   npm install vite
   ```

2. Create `vite.config.js`:
   ```javascript
   import { defineConfig } from 'vite';
   
   export default defineConfig({
     server: {
       port: 8080
     }
   });
   ```

3. Update `package.json`:
   ```json
   {
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview"
     },
     "devDependencies": {
       "vite": "^4.0.0"
     }
   }
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

## File Structure

```
Website/
├── index.html          # Main app (Plan & Dashboard pages)
├── login.html          # Login page with Google OAuth button
├── app.js              # Main application logic with Supabase integration
├── auth.js             # Login page authentication logic
├── config.js           # Supabase configuration
├── styles.css          # All styles including login page
├── supabase-schema.sql # Database schema and RLS policies
├── .env.example        # Environment variable template
├── .env                # Your actual credentials (DO NOT COMMIT)
├── .gitignore          # Git ignore file
└── README.md           # This file
```

## Authentication Flow

### Login Flow
1. User visits app → redirected to `/login.html`
2. Clicks "Continue with Google" button
3. Supabase redirects to Google OAuth consent screen
4. User authorizes app
5. Google redirects back to Supabase
6. Supabase redirects to `/index.html` with session
7. App loads user data from Supabase

### Protected Pages
- `/index.html` (Plan & Dashboard) - Requires authentication
- `/login.html` - Public, redirects to app if already logged in

### Logout
- Click "Logout" button in navbar
- Supabase clears session
- Redirect to `/login.html`

## Data Model

### Activity Catalog
Each user has a unique list of activity names.

### Plans
```json
{
  "date": "2026-01-17",
  "activities": [
    {"id": "uuid-1", "name": "Morning workout"},
    {"id": "uuid-2", "name": "Review code"}
  ]
}
```

### Completions
```json
{
  "date": "2026-01-17",
  "completion_data": {
    "uuid-1": true,
    "uuid-2": false
  }
}
```

## Features

### Planning Rules
- Can plan activities for **today and any future date**
- Cannot plan for past dates
- Activities stored in Supabase per user

### Completion Rules
- Can check/complete activities for:
  - **Today (D)**
  - **Yesterday (D-1)**
- All other dates are locked for completion
- Status badges show: "Planning Open", "Check Open", or "Locked"

### Dashboard
- **Stats Cards**: 30-day average, best day, total completed
- **GitHub-Style Heatmap**: 
  - Starts from January 1, 2026
  - 5-level red heat scale (0%, 1-25%, 26-50%, 51-75%, 76-100%)
  - Weekly columns (Sun-Sat)
  - Hover tooltip with date and completion %
  - Click to open modal with activity details
  - Future dates shown as disabled/neutral

### Data Sync
- All changes automatically saved to Supabase
- Real-time data persistence across devices
- Row Level Security ensures data isolation

## Security

### Row Level Security (RLS)
All tables have RLS policies that ensure:
- Users can only see their own data
- Users can only modify their own data
- Authenticated users only (via `auth.uid()`)

### Authentication
- Google OAuth only (no passwords stored)
- Session management handled by Supabase
- Automatic session refresh
- Secure token storage

## Troubleshooting

### "Failed to sign in"
- Check Google OAuth is enabled in Supabase
- Verify redirect URIs match exactly
- Check browser console for errors

### "Cannot read properties of undefined"
- Ensure `config.js` has correct Supabase credentials
- Check Supabase project is active
- Verify network requests in browser DevTools

### Data not saving
- Check browser console for Supabase errors
- Verify RLS policies are created (run schema.sql)
- Ensure user is authenticated (check session)

### CORS errors
- Use a proper development server (not `file://`)
- Check Supabase project settings for allowed origins

## Production Deployment

### Option 1: Static Hosting (Netlify, Vercel, GitHub Pages)

1. Update `config.js` to use environment variables
2. Build with Vite:
   ```bash
   npm run build
   ```
3. Deploy `dist` folder
4. Set environment variables in hosting platform
5. Update Google OAuth redirect URIs

### Option 2: Simple Hosting

1. Update `config.js` with production Supabase credentials
2. Upload all files to web server
3. Ensure `index.html` is served for `/` and `/plan`, `/dashboard`
4. Set up redirect from `/` to `/login.html` if not authenticated

### Required Redirects
Add these to your hosting configuration:

```
/plan → /index.html (if authenticated)
/dashboard → /index.html (if authenticated)
/ → /login.html (if not authenticated)
```

## Support

For issues related to:
- **Supabase**: Check [Supabase Docs](https://supabase.com/docs)
- **Google OAuth**: Check [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)
- **App Issues**: Check browser console for errors

## License

MIT License - Feel free to use and modify!
