# Testing Instructions

## 🧪 How to Test the Integration

### Prerequisites Check
Before testing, make sure you have:
- ✅ Supabase project created
- ✅ Google OAuth enabled in Supabase
- ✅ Database tables created (ran supabase-schema.sql)
- ✅ config.js updated with your credentials

### Test Plan

#### 1. Test Authentication (Login)
```bash
# Start local server
python3 -m http.server 8080
```

**Steps:**
1. Open http://localhost:8080/login.html
2. Click "Continue with Google"
3. ✅ Should redirect to Google consent screen
4. Authorize the app
5. ✅ Should redirect back to /index.html (Plan page)
6. ✅ Should see your email in navbar
7. ✅ Should see "Logout" button

**Expected Behavior:**
- Login page should NOT be accessible after login
- Trying to visit /login.html should redirect to /index.html

#### 2. Test Data Persistence (Cloud Storage)
**Steps:**
1. Select today's date on calendar
2. Add an activity: "Morning workout"
3. ✅ Activity should appear immediately
4. Refresh the page (Cmd/Ctrl + R)
5. ✅ Activity should still be there (loaded from Supabase)
6. Open DevTools → Network tab
7. ✅ Should see POST requests to Supabase

**Expected Behavior:**
- All data saved to Supabase automatically
- No localStorage usage (check Application tab in DevTools)

#### 3. Test Multi-Device Sync
**Steps:**
1. Add activities on Device 1 (or Browser 1)
2. Open same account on Device 2 (or Browser 2)
3. ✅ Should see same activities on both devices
4. Add activity on Device 2
5. Refresh Device 1
6. ✅ Should see new activity from Device 2

**Expected Behavior:**
- Data syncs across all devices
- Each user sees only their own data

#### 4. Test Logout
**Steps:**
1. Click "Logout" button in navbar
2. ✅ Should redirect to /login.html
3. Try to visit /index.html directly
4. ✅ Should redirect back to /login.html
5. ✅ Session should be cleared

**Expected Behavior:**
- Complete logout with redirect
- Protected pages inaccessible after logout

#### 5. Test Planning Rules
**Steps:**
1. Login and select today's date
2. ✅ Should see "Planning Open" badge
3. Add 3 activities
4. Select tomorrow's date
5. ✅ Should see "Planning Open" badge
6. Add 2 activities
7. Select yesterday's date
8. ✅ Should see "Locked" badge (no planning input)

**Expected Behavior:**
- Can plan for today and future dates
- Cannot plan for past dates
- Input should be disabled for past dates

#### 6. Test Completion Rules
**Steps:**
1. Select today's date (with activities)
2. ✅ Should see "Check Open" badge in Check section
3. Check 2 out of 3 activities
4. ✅ Completion should save automatically
5. Select yesterday's date
6. ✅ Should see "Check Open" badge
7. Check activities if any
8. Select 2 days ago
9. ✅ Should see "Locked" badge (checkboxes disabled)

**Expected Behavior:**
- Can complete for today and yesterday only
- Past dates (older than yesterday) are locked
- Completion persists in Supabase

#### 7. Test Dashboard Heatmap
**Steps:**
1. Create plans for multiple dates (Jan 1-17, 2026)
2. Complete some activities (varying percentages)
3. Navigate to Dashboard
4. ✅ Should see stats cards with real numbers
5. ✅ Should see heatmap starting Jan 1, 2026
6. Hover over tiles
7. ✅ Should see tooltip with date, %, completion count
8. Click a tile
9. ✅ Should open modal with activity list
10. Check/uncheck activities in modal (if today/yesterday)
11. ✅ Should update heatmap color immediately

**Expected Behavior:**
- Heatmap reflects real completion data
- GitHub-style weekly columns
- 5-level red heat scale
- Interactive tooltips and modal

#### 8. Test Error Handling
**Steps:**
1. Turn off internet connection
2. Try to add an activity
3. ✅ Should see console error (check DevTools)
4. Turn on internet
5. Try again
6. ✅ Should work normally

**Test wrong credentials:**
1. Edit config.js with wrong anon key
2. Try to login
3. ✅ Should see error message
4. Fix credentials
5. ✅ Should work again

### 📊 Checklist

Use this checklist to verify everything works:

- [ ] Login redirects to Google OAuth
- [ ] Successful login redirects to /index.html
- [ ] User email displays in navbar
- [ ] Logout button works
- [ ] Activities save to Supabase (check Network tab)
- [ ] Data persists after page refresh
- [ ] Can plan for today and future dates
- [ ] Cannot plan for past dates
- [ ] Can complete for today and yesterday
- [ ] Cannot complete for older dates
- [ ] Dashboard stats show correct numbers
- [ ] Heatmap displays from Jan 1, 2026
- [ ] Heatmap tooltips work
- [ ] Modal opens and shows activities
- [ ] Modal checkboxes update completion
- [ ] Multi-device sync works (optional)
- [ ] Logout clears session
- [ ] Protected pages redirect to login when logged out

### 🐛 Common Test Issues

**"Network error" when logging in**
→ Check Supabase project URL in config.js

**"RLS policy violation" errors**
→ Make sure you ran supabase-schema.sql

**Data not syncing across devices**
→ Check both devices are logged in to same Google account

**Heatmap shows no data**
→ Add plans and complete some activities first

**Modal doesn't update heatmap**
→ Check browser console for errors

### 🎯 Success Criteria

Your integration is working correctly if:
1. ✅ Google OAuth login works smoothly
2. ✅ All data saves to Supabase (visible in Supabase dashboard)
3. ✅ Data persists after logout/login
4. ✅ Multi-device sync works
5. ✅ Dashboard shows real-time updates
6. ✅ No localStorage usage
7. ✅ Row Level Security prevents cross-user data access

### 📝 Testing Notes

**Supabase Dashboard Check:**
1. Go to Supabase dashboard
2. Click "Table Editor"
3. Select `activity_catalog`, `plans`, `completions` tables
4. ✅ Should see your data there
5. ✅ user_id should match your Google user ID

**Browser DevTools Check:**
1. Open DevTools (F12)
2. Go to Application → Storage → Local Storage
3. ✅ Should see Supabase session tokens
4. ✅ Should NOT see old localStorage data (activityCatalog, plansByDate, etc.)

## 🚀 Ready for Production?

Once all tests pass:
1. Deploy to Netlify/Vercel
2. Update Google OAuth redirect URIs for production domain
3. Add production URL to Supabase allowed origins
4. Test again on production URL

## Need Help?

- Check browser console for errors
- Check Supabase logs in dashboard
- Review README-SUPABASE.md for detailed docs
- Verify all setup steps in SETUP.md
