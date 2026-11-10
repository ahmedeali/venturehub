# VentureHub — Idea sharing community

A responsive HTML/CSS/JavaScript MVP for sharing business plans and discussing them.

## 1. Run locally

- Download/unzip this project.
- Open `index.html` in a browser, or use VS Code's **Live Server** extension.
- Demo mode works immediately. It stores demo accounts, ideas, and comments in that browser's `localStorage`; it is not shared with other visitors.

## 2. Enable real multi-user accounts and shared data (Supabase)

GitHub Pages serves static files only. Supabase supplies the hosted authentication and PostgreSQL database.

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** in your Supabase project and run all of `supabase-schema.sql`.
3. Open **Project Settings → API** (or **Connect**) and copy the Project URL and `anon` / publishable key.
4. Paste both into `config.js`:
   ```js
   window.VENTUREHUB_CONFIG = {
     supabaseUrl: "https://YOUR-PROJECT.supabase.co",
     supabaseAnonKey: "YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY"
   };
   ```
5. In Supabase **Authentication → URL Configuration**, add your GitHub Pages URL to Site URL and Redirect URLs, e.g. `https://YOUR-USERNAME.github.io/venturehub/`.
6. Sign up with your email. Supabase may require email confirmation depending on your Auth settings.
7. To assign an administrator, find your user's UUID in **Authentication → Users**, then run the admin promotion SQL at the bottom of `supabase-schema.sql`.

The browser uses only the public anon/publishable key. Never put a Supabase `service_role` key in frontend code.

## 3. Publish with GitHub Pages

1. Sign in to [GitHub](https://github.com) and click **New repository**.
2. Name it `venturehub` (or another name). For a public portfolio/demo, choose Public.
3. On the repository page choose **Add file → Upload files**.
4. Upload the contents of this folder (the files themselves, not the ZIP). `index.html` must be in the repository root.
5. Click **Commit changes**.
6. Open **Settings → Pages**.
7. Under **Build and deployment**, select **Deploy from a branch**.
8. Select branch `main`, folder `/ (root)`, then **Save**.
9. Wait for GitHub Pages to publish. Your site URL will look like:
   `https://YOUR-USERNAME.github.io/venturehub/`
10. Add that exact URL to Supabase Authentication URL configuration if using Supabase.

### Updating the website
Edit the files locally, then upload/commit the changed files to the same GitHub repository. GitHub Pages republishes automatically after the commit.

## Included files

- `index.html` — page structure and modals
- `styles.css` — responsive visual design
- `app.js` — rendering, demo interactions, Supabase integration
- `config.js` — public Supabase project configuration
- `supabase-schema.sql` — PostgreSQL tables, indexes, trigger, and Row Level Security policies

## MVP scope and production notes

- Demo mode is browser-local and is intended for preview only.
- Supabase mode enables shared ideas, real authentication, comments, and database persistence.
- The database schema includes member/admin roles and RLS policies. The UI currently includes a basic admin delete action, but a complete admin console (user suspension, moderation queue, audit trail, reports) is a next milestone.
- Financial figures are text fields in this first version to allow different currencies and estimates. A later release should add currency selection, structured numeric amounts, forecast periods, and scenario assumptions.
- Public business plans can reveal valuable intellectual property. Warn members not to post trade secrets, personal data, bank details, or confidential customer information. Consider private/draft ideas and moderation/reporting before a public launch.
- For production, add email verification, password reset UI, rate limits/anti-spam, server-side validation, audit logging, backups, and a clear privacy/terms process.
