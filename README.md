# Net Movies

Net Movies is an Expo + React Native app for browsing and searching movies from TMDB, with authentication, bookmarks, profile editing, and avatar uploads powered by Supabase.

## Features

- Email/password authentication
- Browse and search movies (TMDB)
- Trending and discover flows
- Save and remove bookmarks
- Profile management (username + avatar)
- Avatar upload to Supabase Storage

## Tech Stack

- Expo SDK 54
- React Native 0.81
- Expo Router
- NativeWind (Tailwind for React Native)
- Supabase (Auth, Postgres, Storage)
- TMDB API

## Project Structure

```text
app/
	(auth)/         # login/signup/welcome routes
	(tabs)/         # home/search/bookmark/profile tabs
	movie/[id].tsx  # movie details screen
context/
	AuthContext.tsx
services/
	supabase.ts
	tmdb.ts
supabase/
	schema.sql
```

## Prerequisites

- Node.js 18+
- npm
- Expo Go app on Android/iOS (for local testing)
- Supabase project
- TMDB API access token

## Environment Variables

Create a `.env` file in the project root (or configure the same values in EAS environment variables):

```bash
EXPO_PUBLIC_API_ACCESS_TOKEN=your_tmdb_bearer_token
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Notes:

- The app uses `EXPO_PUBLIC_API_ACCESS_TOKEN` in `services/tmdb.ts`.
- The app uses `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `services/supabase.ts`.

## Supabase Setup

1. Open your Supabase Dashboard.
2. Go to SQL Editor.
3. Run `supabase/schema.sql`.

This creates:

- `bookmarks`, `profiles`, and `searches` tables
- RLS policies
- `avatars` storage bucket and policies
- helper trigger/function for profile creation

## Install and Run

Install dependencies:

```bash
npm install
```

Start Metro:

```bash
npm run start
```

Run on Android:

```bash
npm run android
```

Run on iOS:

```bash
npm run ios
```

Run on web:

```bash
npm run web
```

Lint:

```bash
npm run lint
```

## Build APK with EAS

This repo already includes a preview profile that outputs an APK (`eas.json` -> `build.preview.android.buildType = apk`).

Build command:

```bash
npx eas build -p android --profile preview
```

After the build finishes, download the APK from the Expo build page.

## Avatar Behavior (Important)

- Avatar upload is applied immediately when you choose/change an image.
- The profile save button is for username changes; if username is unchanged it acts like done.
- Avatar URLs use cache busting so newly uploaded images refresh correctly.

## Troubleshooting

### `SafeAreaView has been deprecated`

This is currently a warning from dependency usage and does not block app behavior.

### `[avatar-upload] Base64 conversion failed, falling back to URI read`

This is handled by the app. On some Android devices, base64 conversion can fail, and the code automatically falls back to reading the file URI.

### `Missing Supabase environment variables`

Set these values before running:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Password reset / auth feedback

Recent UX updates remove success alerts in favor of cleaner flow and inline error handling.

## License

No license file has been added yet.
