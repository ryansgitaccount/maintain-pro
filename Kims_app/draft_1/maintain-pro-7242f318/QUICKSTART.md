# 🚀 QUICK START - Supabase Migration

## What You Need to Do

### Step 1: Create Supabase Project (2 min)
```
1. Go to https://supabase.com
2. Click "New Project"
3. Fill in project name and password
4. Copy URL and Anon Key
```

### Step 2: Update Environment (1 min)
```
# Edit .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3: Create Database (2 min)
```
1. Go to Supabase Dashboard > SQL Editor
2. Click "New Query"
3. Paste entire contents of SUPABASE_SETUP.sql
4. Click "Run"
5. Wait for completion
```

### Step 4: Install & Run (2 min)
```bash
npm install
npm run dev
```

### Step 5: Test (1 min)
```
1. Visit http://localhost:5173/signup
2. Create account (test@example.com / password)
3. Should redirect to /Checklists
4. Click "Logout" button in sidebar
5. Should redirect to /login
```

---

## ✨ What's New

| Feature | Before | After |
|---------|--------|-------|
| Auth | ❌ None | ✅ Email/Password |
| Database | Base44 | Supabase |
| Data | Mock | ✅ Real |
| PWA | ❌ No | ✅ Yes |
| Offline | ❌ No | ✅ Yes |

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `.env.local` | Your Supabase credentials |
| `.env.example` | Template for credentials |
| `SUPABASE_SETUP.sql` | Database schema |
| `MIGRATION_GUIDE.md` | Full setup guide |
| `CHANGES_SUMMARY.md` | What changed |

---

## 🔧 Key Changes

**API calls stay the same:**
```javascript
// This still works exactly the same way:
const machines = await Machine.list();
const issue = await MaintenanceIssue.get(id);
await MaintenanceRecord.create(data);
```

**But now protected:**
```
/login → Signup/Login page
/signup → Create new account
All other routes → Protected (redirect to login)
```

**And installable:**
```
Mobile: "Add to Home Screen" → Install as app
Desktop: Click install button → Install as app
Offline: Works without internet
```

---

## ❓ Common Issues

**"Missing Supabase environment variables"**
- Check `.env.local` exists
- Verify VITE_SUPABASE_URL is set
- Verify VITE_SUPABASE_ANON_KEY is set
- Restart dev server

**"Cannot find tables"**
- Run SUPABASE_SETUP.sql in Supabase SQL Editor
- Check for error messages
- Verify queries ran successfully

**"Login not working"**
- Verify email auth enabled in Supabase
- Try creating new account at /signup
- Check browser console for errors

---

## 📞 Need Help?

1. Read `MIGRATION_GUIDE.md` for detailed setup
2. Check `CHANGES_SUMMARY.md` for what changed
3. Review Supabase dashboard error logs
4. Check browser console (F12) for JavaScript errors

---

**That's it! You're ready to go! 🎉**

Questions? See MIGRATION_GUIDE.md for complete documentation.
