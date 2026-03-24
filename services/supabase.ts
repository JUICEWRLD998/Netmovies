import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";
import type { Bookmark, Movie } from "../types/movie";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const SUPABASE_ENV_ERROR =
  !supabaseUrl || !supabaseAnonKey
    ? "Missing Supabase environment variables. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in EAS environment variables or your local .env file."
    : null;

const resolvedSupabaseUrl = supabaseUrl || "https://placeholder.invalid";
const resolvedSupabaseAnonKey = supabaseAnonKey || "placeholder-anon-key";

export const supabase = createClient(
  resolvedSupabaseUrl,
  resolvedSupabaseAnonKey,
  {
    auth:
      Platform.OS === "web"
        ? {
            // During static rendering, window/localStorage are unavailable.
            autoRefreshToken: typeof window !== "undefined",
            persistSession: typeof window !== "undefined",
            detectSessionInUrl: true,
          }
        : {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
  },
);

// Refresh the session whenever the app comes back to the foreground
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

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

type BookmarkMovieInput = Pick<
  Movie,
  "id" | "title" | "poster_path" | "vote_average" | "release_date"
>;

const BOOKMARK_SELECT_FIELDS =
  "id, user_id, movie_id, title, poster_path, vote_average, release_date, created_at";
const bookmarkSignInMessage = "You need to be signed in to manage bookmarks.";
const bookmarkAlreadySavedMessage = "This movie is already in your bookmarks.";

const ensureBookmarkUserId = (userId: string) => {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    throw new Error(bookmarkSignInMessage);
  }

  return normalizedUserId;
};

const isBookmarkDuplicateError = (error: { code?: string; message?: string }) =>
  error.code === "23505" ||
  (error.message ?? "").toLowerCase().includes("bookmarks_user_movie_idx") ||
  (error.message ?? "").toLowerCase().includes("duplicate key value");

export const listUserBookmarks = async (
  userId: string,
): Promise<Bookmark[]> => {
  const normalizedUserId = ensureBookmarkUserId(userId);
  const { data, error } = await db
    .from("bookmarks")
    .select(BOOKMARK_SELECT_FIELDS)
    .eq("user_id", normalizedUserId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Bookmark[];
};

export const addMovieBookmark = async (
  userId: string,
  movie: BookmarkMovieInput,
): Promise<Bookmark> => {
  const normalizedUserId = ensureBookmarkUserId(userId);
  const { data, error } = await db
    .from("bookmarks")
    .insert({
      user_id: normalizedUserId,
      movie_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
    })
    .select(BOOKMARK_SELECT_FIELDS)
    .single();

  if (error) {
    if (isBookmarkDuplicateError(error)) {
      throw new Error(bookmarkAlreadySavedMessage);
    }
    throw error;
  }

  return data as Bookmark;
};

export const removeMovieBookmark = async (
  userId: string,
  movieId: number,
): Promise<void> => {
  const normalizedUserId = ensureBookmarkUserId(userId);
  const { error } = await db
    .from("bookmarks")
    .delete()
    .eq("user_id", normalizedUserId)
    .eq("movie_id", movieId);

  if (error) throw error;
};

export const isMovieBookmarked = async (
  userId: string,
  movieId: number,
): Promise<boolean> => {
  const normalizedUserId = ensureBookmarkUserId(userId);
  const { data, error } = await db
    .from("bookmarks")
    .select("id")
    .eq("user_id", normalizedUserId)
    .eq("movie_id", movieId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.id);
};

// ─── Storage helpers ─────────────────────────────────────────────────────────

export const AVATAR_BUCKET = "avatars";
export const MAX_AVATAR_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_AVATAR_UPLOAD_MB = 5;

const avatarSizeLimitMessage = `Avatar image is too large. Please choose an image smaller than ${MAX_AVATAR_UPLOAD_MB} MB.`;

const getBase64ByteSize = (base64: string) => {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
};

const getResolvedAvatarSize = ({
  fileSize,
  fileBase64,
}: {
  fileSize?: number | null;
  fileBase64?: string | null;
}) => {
  if (
    typeof fileSize === "number" &&
    Number.isFinite(fileSize) &&
    fileSize > 0
  ) {
    return fileSize;
  }

  if (fileBase64) {
    return getBase64ByteSize(fileBase64);
  }

  return null;
};

const ensureAvatarWithinSizeLimit = ({
  fileSize,
  fileBase64,
}: {
  fileSize?: number | null;
  fileBase64?: string | null;
}) => {
  const resolvedSize = getResolvedAvatarSize({ fileSize, fileBase64 });

  if (resolvedSize && resolvedSize > MAX_AVATAR_UPLOAD_BYTES) {
    throw new Error(avatarSizeLimitMessage);
  }
};

const IMAGE_CONTENT_TYPES: Record<string, string> = {
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const getFileExtension = (path: string) => {
  const [pathWithoutQuery] = path.split("?");
  const extensionStart = pathWithoutQuery.lastIndexOf(".");

  if (extensionStart === -1) return "";
  return pathWithoutQuery.slice(extensionStart + 1).toLowerCase();
};

const resolveAvatarContentType = ({
  contentType,
  fileName,
  fileUri,
}: {
  contentType?: string | null;
  fileName?: string | null;
  fileUri: string;
}) => {
  if (contentType && contentType.trim() !== "") {
    return contentType;
  }

  const fileNameExtension = fileName ? getFileExtension(fileName) : "";
  if (fileNameExtension && IMAGE_CONTENT_TYPES[fileNameExtension]) {
    return IMAGE_CONTENT_TYPES[fileNameExtension];
  }

  const uriExtension = getFileExtension(fileUri);
  return IMAGE_CONTENT_TYPES[uriExtension] ?? "image/jpeg";
};

const readArrayBufferFromBase64 = async ({
  base64,
  contentType,
}: {
  base64: string;
  contentType: string;
}) => {
  const dataUrl = `data:${contentType};base64,${base64}`;
  const response = await fetch(dataUrl);

  if (!response.ok) {
    throw new Error("Unable to read the selected image.");
  }

  return response.arrayBuffer();
};

const readArrayBufferFromUri = async (fileUri: string) => {
  const response = await fetch(fileUri);

  if (!response.ok) {
    throw new Error("Unable to read the selected image.");
  }

  return response.arrayBuffer();
};

export const getAvatarPublicUrl = (filePath: string) =>
  supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath).data.publicUrl;

const withCacheBuster = (url: string) => {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${Date.now()}`;
};

export const uploadAvatarFile = async ({
  userId,
  fileUri,
  fileName,
  fileBase64,
  fileSize,
  contentType,
}: {
  userId: string;
  fileUri: string;
  fileName?: string | null;
  fileBase64?: string | null;
  fileSize?: number | null;
  contentType?: string | null;
}) => {
  ensureAvatarWithinSizeLimit({ fileSize, fileBase64 });

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  if (!sessionData.session) {
    throw new Error("You need to be signed in to update your avatar.");
  }

  const sessionUserId = sessionData.session.user.id;

  const filePath = `${userId}/avatar`;
  const resolvedContentType = resolveAvatarContentType({
    contentType,
    fileName,
    fileUri,
  });

  if (__DEV__) {
    const uriScheme = fileUri.includes(":") ? fileUri.split(":")[0] : "unknown";
    console.log("[avatar-upload] Starting upload", {
      fileSize,
      hasBase64: Boolean(fileBase64),
      maxAvatarSizeMb: MAX_AVATAR_UPLOAD_MB,
      resolvedContentType,
      uriScheme,
    });
  }

  let arrayBuffer: ArrayBuffer | null = null;

  if (fileBase64) {
    try {
      arrayBuffer = await readArrayBufferFromBase64({
        base64: fileBase64,
        contentType: resolvedContentType,
      });
    } catch (error) {
      if (__DEV__) {
        console.warn(
          "[avatar-upload] Base64 conversion failed, falling back to URI read",
          error,
        );
      }
    }
  }

  if (!arrayBuffer) {
    try {
      arrayBuffer = await readArrayBufferFromUri(fileUri);
    } catch (error) {
      if (__DEV__) {
        console.warn("[avatar-upload] URI read failed", {
          fileUri,
          message: error instanceof Error ? error.message : String(error),
        });
      }
      throw new Error("Unable to read the selected image.");
    }
  }

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, arrayBuffer, {
      contentType: resolvedContentType,
      upsert: true,
    });

  if (error) {
    if (__DEV__) {
      console.warn("[avatar-upload] Supabase storage upload failed", {
        filePath,
        message: error.message,
        sessionUserId,
        uploadUserId: userId,
      });
    }
    throw error;
  }

  return withCacheBuster(getAvatarPublicUrl(filePath));
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
