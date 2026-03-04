import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh the session whenever the app comes back to the foreground
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

// ─── Auth helpers ────────────────────────────────────────────────────────────

export const auth = {
  /** Sign up with email + password */
  signUp: (email: string, password: string) =>
    supabase.auth.signUp({ email, password }),

  /** Sign in with email + password */
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  /** Sign out the current user */
  signOut: () => supabase.auth.signOut(),

  /** Get the currently authenticated user */
  getUser: () => supabase.auth.getUser(),

  /** Get the current session (includes access token) */
  getSession: () => supabase.auth.getSession(),

  /** Subscribe to auth state changes */
  onAuthStateChange: (
    callback: Parameters<typeof supabase.auth.onAuthStateChange>[0],
  ) => supabase.auth.onAuthStateChange(callback),
};

// ─── Database helpers ────────────────────────────────────────────────────────

/**
 * Typed database client.
 * Usage: db.from("bookmarks").select("*").eq("user_id", userId)
 */
export const db = supabase;
