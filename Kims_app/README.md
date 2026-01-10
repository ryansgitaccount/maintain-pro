# Maintenance Hub - Supabase Edition

A modern React + Vite maintenance management application powered by Supabase.

## Features

- 🔐 **Authentication**: Email/password signup and login with Supabase Auth
- 📊 **Maintenance Tracking**: Record and monitor maintenance issues across machines
- 🏭 **Equipment Management**: Manage machines, inventory, and service records
- 📱 **Responsive Design**: Mobile-friendly UI built with Radix UI + TailwindCSS
- 💾 **Offline Support**: PWA-enabled with service worker for offline capability
- ⚡ **Real-time Data**: Supabase integration for live data synchronization

## Prerequisites

- Node.js 20+ and npm
- Supabase account with project created
- `.env.local` file with Supabase credentials

## Setup

### 1. Local Development

```bash
# Install dependencies
npm install

# Create .env.local file with your Supabase credentials
# Copy from .env.example and fill in your values:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Start dev server
npm run dev
```

The app will run at `http://localhost:5173`.

### 2. Build for Production

```bash
npm run build
```

This generates optimized files in the `dist/` folder.

### 3. Test Production Build Locally

```bash
npm run preview
```

## Deployment

### Netlify

1. Push your code to GitHub
2. Connect your GitHub repo to Netlify
3. Set build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Add environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy

The `netlify.toml` file in the project root handles path configuration automatically.

## Troubleshooting

### "Missing Supabase environment variables" error
- Ensure `.env.local` exists with both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- For Netlify: add these variables in **Site Settings → Environment Variables**

### Build fails on Netlify
- Check Netlify build logs for specific errors
- Verify Node version is 20+ in Netlify dashboard
- Ensure `package-lock.json` is committed to GitHub

### App loads but shows blank page
- Check browser console for errors
- Verify Supabase credentials are correct
- Ensure Supabase database tables are set up (see `SUPABASE_SETUP.sql`)

## Project Structure

```
src/
├── api/
│   ├── supabaseClient.js      # Supabase initialization
│   ├── entities.js            # Database CRUD operations
│   └── integrations.js        # File storage and integrations
├── components/
│   ├── auth/                  # Authentication components
│   ├── machines/              # Equipment management
│   ├── maintenance/           # Maintenance features
│   └── ui/                    # Radix UI components
├── context/
│   └── AuthContext.jsx        # Global auth state
├── pages/
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── MaintenanceHub.jsx     # Main dashboard
│   └── ...other pages
├── App.jsx                    # Root component
└── main.jsx                   # Entry point
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## Tech Stack

- **Frontend**: React 18, Vite 5, React Router 7
- **Database & Auth**: Supabase
- **UI Components**: Radix UI
- **Styling**: TailwindCSS
- **Forms**: React Hook Form
- **Charts**: Recharts
- **PWA**: Vite PWA Plugin

## Notes

- `.env.local` is in `.gitignore` and should never be committed
- Database schema is defined in `SUPABASE_SETUP.sql`
- See `MIGRATION_GUIDE.md` for detailed setup instructions
- All data is stored in Supabase PostgreSQL database