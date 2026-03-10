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

// ─── Bookmark helpers ─────────────────────────────────────────────────────────

/** Add a movie to the user's bookmarks. */
export const addBookmark = async (
  userId: string,
  movie: {
    id: number;
    title: string;
    poster_path: string | null;
    vote_average: number;
    release_date: string;
  },
): Promise<void> => {
  const { error } = await supabase.from("bookmarks").insert({
    user_id: userId,
    movie_id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    vote_average: movie.vote_average,
    release_date: movie.release_date,
  });
  if (error) throw error;
};

/** Remove a movie from the user's bookmarks. */
export const removeBookmark = async (
  userId: string,
  movieId: number,
): Promise<void> => {
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", userId)
    .eq("movie_id", movieId);
  if (error) throw error;
};

/** Check whether a movie is bookmarked by the user. */
export const isBookmarked = async (
  userId: string,
  movieId: number,
): Promise<boolean> => {
  const { count, error } = await supabase
    .from("bookmarks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("movie_id", movieId);
  if (error) throw error;
  return (count ?? 0) > 0;
};

/** Fetch all bookmarks for a user, newest first. */
export const getUserBookmarks = async (userId: string) => {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
};
