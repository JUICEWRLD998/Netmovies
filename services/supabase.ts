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

// ─── Storage helpers ─────────────────────────────────────────────────────────

export const AVATAR_BUCKET = "avatars";

export const getAvatarPublicUrl = (filePath: string) =>
  supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath).data.publicUrl;

export const uploadAvatarFile = async ({
  userId,
  fileUri,
  contentType,
}: {
  userId: string;
  fileUri: string;
  contentType?: string | null;
}) => {
  const filePath = `${userId}/avatar`;
  const response = await fetch(fileUri);

  if (!response.ok) {
    throw new Error("Unable to read the selected image.");
  }

  const arrayBuffer = await response.arrayBuffer();
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, arrayBuffer, {
      contentType: contentType ?? "image/jpeg",
      upsert: true,
    });

  if (error) throw error;

  return getAvatarPublicUrl(filePath);
};

export const removeAvatarFile = async (userId: string) => {
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove([`${userId}/avatar`]);

  if (error) throw error;
};

// ─── Search tracking ─────────────────────────────────────────────────────────

/** Persist a search query to the database (upserts with count increment). */
export const trackSearch = async (query: string): Promise<void> => {
  const trimmed = query.trim();
  if (!trimmed) return;
  await supabase.rpc("upsert_search", { search_query: trimmed });
};

/** Fetch the most-searched queries, ordered by count descending. */
export const getTrendingSearches = async (limit = 10) => {
  return supabase
    .from("searches")
    .select("query, count")
    .order("count", { ascending: false })
    .limit(limit);
};
