# HackRice Auth App

A React + Vite application with Supabase authentication - now properly organized in the root directory!

## Quick Setup

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Configure Supabase**:
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Get your project URL and anon key from Settings > API
   - Update the values in your `.env` file:
     ```
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key-here
     ```
   - Restart the development server

3. **Run the development server**:
   ```bash
   npm run dev
   ```

## Features

- ✅ React + Vite setup (properly in root directory)
- ✅ User authentication (sign up, sign in, sign out)
- ✅ Protected routes
- ✅ Modern UI with glassmorphism design
- ✅ Responsive design
- ✅ Supabase integration ready

## File Structure

```
src/
├── App.jsx          # Main app with routing and auth
├── main.jsx         # React entry point
├── App.css          # Main styles
├── index.css        # Global styles
└── components/
    ├── Login.jsx    # Login/signup form
    └── Dashboard.jsx # Protected dashboard
```

## Next Steps

1. Set up your Supabase project and update the credentials
2. Customize the dashboard with your app features
3. Add more authentication options (Google, GitHub, etc.)
4. Style the app to match your design preferences

## Supabase Setup

1. Create a new Supabase project
2. Go to Authentication > Settings
3. Configure your site URL (http://localhost:5173 for development)
4. Enable email auth or add social providers
5. Copy your project URL and anon key to `.env`

## Fixed Issues

- ✅ Everything is now in the root directory (not in hackrice-app subfolder)
- ✅ Clean project structure
- ✅ All dependencies properly installed