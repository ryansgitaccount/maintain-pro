# Maintenance Hub - Supabase Migration Guide

This document outlines the complete migration from Base44 backend to Supabase.

## What's Changed

### 1. **Authentication**
- **Before**: Base44 authentication
- **After**: Supabase Auth (email/password)
- **Files**: `src/context/AuthContext.jsx`, `src/pages/Login.jsx`, `src/pages/Signup.jsx`

### 2. **Data Layer**
- **Before**: Base44 SDK entities
- **After**: Supabase `from().select()`, `insert()`, `update()`, `delete()`
- **Files**: 
  - `src/api/entities.js` - Complete rewrite with Supabase queries
  - `src/api/supabaseClient.js` - New Supabase client initialization

### 3. **Integrations** 
- **Before**: Base44 integrations (LLM, Email, Image Generation)
- **After**: Supabase Storage + placeholders for Edge Functions
- **Files**: `src/api/integrations.js`

### 4. **Route Protection**
- **Before**: No authentication
- **After**: All routes protected except `/login` and `/signup`
- **Files**: 
  - `src/components/auth/ProtectedRoute.jsx`
  - `src/pages/index.jsx` - Updated with protected routes
  - `src/pages/Layout.jsx` - Added logout button

### 5. **PWA Support**
- **New**: App can be installed on mobile/desktop
- **New**: Works offline with service worker
- **Files**:
  - `vite.config.js` - Added VitePWA plugin
  - `index.html` - Added PWA meta tags
  - `src/main.jsx` - Service worker registration

### 6. **Environment Variables**
- **Files**: `.env.local`, `.env.example`
- **Required**:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key-here
  ```

## Setup Instructions

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Enter project name and database password
4. Wait for project to initialize
5. Copy your URL and Anon Key

### Step 2: Update Environment Variables
```bash
# Open .env.local and update:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Create Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `SUPABASE_SETUP.sql`
4. Click **Run**
5. Wait for all tables to be created

### Step 4: Install Dependencies
```bash
npm install
```

### Step 5: Run the Application
```bash
npm run dev
```

### Step 6: Test Authentication
1. Visit `http://localhost:5173/signup`
2. Create a test account (e.g., `test@example.com`)
3. Login with your credentials
4. You should be redirected to the Checklists page

## Database Tables Created

| Table | Purpose |
|-------|---------|
| `machines` | Equipment/machinery inventory |
| `maintenance_records` | Historical maintenance logs |
| `maintenance_issues` | Active issues/problems |
| `maintenance_checklists` | Reusable maintenance checklists |
| `messages` | Team communication |
| `take5_records` | Take-5 safety briefings |
| `workshop_job_cards` | Workshop job tracking |
| `workshop_inventory` | Parts and supplies inventory |
| `service_cards` | Service scheduling records |
| `notifications` | System notifications |

## Files Modified/Created

### New Files
- `src/api/supabaseClient.js` - Supabase initialization
- `src/context/AuthContext.jsx` - Authentication context
- `src/pages/Login.jsx` - Login page
- `src/pages/Signup.jsx` - Signup page
- `src/components/auth/ProtectedRoute.jsx` - Route protection
- `.env.example` - Environment variable template
- `SUPABASE_SETUP.sql` - Database schema
- `MIGRATION_GUIDE.md` - This file

### Modified Files
- `src/api/entities.js` - Replaced Base44 with Supabase
- `src/api/integrations.js` - Replaced Base44 with Supabase Storage
- `src/api/base44Client.js` - Marked as deprecated
- `src/App.jsx` - Added AuthProvider
- `src/pages/index.jsx` - Added protected routes
- `src/pages/Layout.jsx` - Added logout button
- `vite.config.js` - Added PWA plugin
- `index.html` - Added PWA meta tags
- `src/main.jsx` - Added PWA service worker
- `package.json` - Added @supabase/supabase-js and vite-plugin-pwa

## API Compatibility

All existing API calls remain the same. For example:

```javascript
// Before (Base44)
const machines = await Machine.list();

// After (Supabase) - IDENTICAL USAGE
const machines = await Machine.list();
```

The implementation has changed internally, but the interface remains the same.

## Features Retained

✅ All UI components unchanged  
✅ All pages and routes unchanged  
✅ All styling (Tailwind + UI library) unchanged  
✅ Same API method signatures  
✅ Same data structures  
✅ Same filtering/sorting logic  

## New Features Added

✨ User authentication (Supabase Auth)  
✨ Protected routes (auto-redirect to login)  
✨ Logout functionality  
✨ PWA support (installable app)  
✨ Offline support (service worker)  
✨ Row-level security (RLS) in database  

## Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` exists
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart dev server after updating .env

### Tables don't exist
- Run `SUPABASE_SETUP.sql` in Supabase SQL Editor
- Check for error messages in the SQL output

### Authentication not working
- Verify Email auth is enabled in Supabase (Authentication > Settings)
- Check that user confirmation is not required
- Try creating a new user account

### PWA not installing
- Ensure HTTPS is used in production
- Check browser console for service worker errors
- Some browsers require app to be added to home screen first

## Next Steps

1. **Populate sample data**: Add machines, maintenance records, etc.
2. **Configure email**: Set up email templates in Supabase for confirmations
3. **Set up storage**: Create file storage buckets in Supabase
4. **Configure RLS**: Customize row-level security policies as needed
5. **Set production domain**: Update PWA manifest and Supabase CORS

## Support

For issues:
1. Check Supabase dashboard for error logs
2. Check browser console for JavaScript errors
3. Review `.env.local` configuration
4. Ensure database schema was created properly
