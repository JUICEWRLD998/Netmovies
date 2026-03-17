import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
    listUserBookmarks,
    removeMovieBookmark,
} from "../../services/supabase";
import { TMDB } from "../../services/tmdb";
import { Bookmark } from "../../types/movie";

function friendlyBookmarkError(error: unknown): string {
  if (typeof error !== "object" || error === null || !("message" in error)) {
    return "Unable to load bookmarks. Please try again.";
  }

  const message = String(error.message ?? "");
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("signed in to manage bookmarks")) {
    return "Sign in to manage your bookmarks.";
  }

  if (lowerMessage.includes('relation "public.bookmarks" does not exist')) {
    return "Bookmarks table is missing in Supabase. Run supabase/schema.sql in SQL Editor for the same project.";
  }

  if (lowerMessage.includes("row-level security policy")) {
    return "Bookmark action was blocked by security policy. Sign in again and retry.";
  }

  return message || "Unable to load bookmarks. Please try again.";
}

export default function BookmarkPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [removingMovieId, setRemovingMovieId] = useState<number | null>(null);

  const loadBookmarks = useCallback(
    async (showLoading: boolean) => {
      if (!user?.id) {
        setBookmarks([]);
        setErrorMsg("");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showLoading) {
        setLoading(true);
      }
      setErrorMsg("");

      try {
        const data = await listUserBookmarks(user.id);
        setBookmarks(data);
      } catch (error) {
        setErrorMsg(friendlyBookmarkError(error));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id],
  );

  useFocusEffect(
    useCallback(() => {
      loadBookmarks(true);
    }, [loadBookmarks]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookmarks(false);
  }, [loadBookmarks]);

  const handleRemoveBookmark = useCallback(
    async (movieId: number) => {
      if (!user?.id) {
        setErrorMsg("Sign in to manage your bookmarks.");
        return;
      }

      setRemovingMovieId(movieId);
      setErrorMsg("");

      try {
        await removeMovieBookmark(user.id, movieId);
        setBookmarks((prevBookmarks) =>
          prevBookmarks.filter((bookmark) => bookmark.movie_id !== movieId),
        );
      } catch (error) {
        setErrorMsg(friendlyBookmarkError(error));
      } finally {
        setRemovingMovieId(null);
      }
    },
    [user?.id],
  );

  const renderBookmarkCard = ({ item }: { item: Bookmark }) => {
    const posterUrl = TMDB.getImageUrl(item.poster_path, "w342");
    const releaseYear = item.release_date?.split("-")[0] ?? "—";
    const rating =
      typeof item.vote_average === "number"
        ? (item.vote_average / 2).toFixed(1)
        : "N/A";
    const isRemoving = removingMovieId === item.movie_id;

    return (
      <TouchableOpacity
        className="w-[48%] mb-4"
        activeOpacity={0.9}
        onPress={() => router.push(`/movie/${item.movie_id}` as any)}
      >
        <View className="bg-[#1A1F3A] rounded-lg overflow-hidden h-80">
          {posterUrl ? (
            <Image
              source={{ uri: posterUrl }}
              className="w-full h-60"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-60 bg-[#2A2F4A] justify-center items-center">
              <Ionicons name="film-outline" size={48} color="#6B7280" />
            </View>
          )}

          <View className="p-3 flex-1 justify-between">
            <Text
              className="text-white font-semibold text-sm"
              numberOfLines={2}
            >
              {item.title}
            </Text>

            <View className="flex-row items-center justify-between mt-2">
              <View className="flex-row items-center">
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text className="text-gray-400 text-xs ml-1">{rating}</Text>
                <Text className="text-gray-500 text-xs ml-2">
                  {releaseYear}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleRemoveBookmark(item.movie_id)}
                disabled={isRemoving}
                className="rounded-md px-2 py-1 bg-[#24121C] border border-[#5B2132]"
              >
                {isRemoving ? (
                  <ActivityIndicator color="#FCA5A5" size="small" />
                ) : (
                  <Ionicons name="trash-outline" size={14} color="#FCA5A5" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const listEmpty = () => {
    if (loading) {
      return (
        <View className="items-center py-20">
          <ActivityIndicator size="large" color="#E50914" />
          <Text className="text-gray-400 mt-4 text-base">
            Loading bookmarks...
          </Text>
        </View>
      );
    }

    if (!user?.id) {
      return (
        <View className="items-center px-6 py-20">
          <Ionicons name="bookmark-outline" size={64} color="#6B7280" />
          <Text className="text-white text-lg font-semibold mt-4">
            Sign In to View Bookmarks
          </Text>
          <Text className="text-gray-400 text-center mt-2 text-sm">
            Save your favorite movies after signing in and they will appear
            here.
          </Text>
        </View>
      );
    }

    if (errorMsg) {
      return (
        <View className="items-center px-6 py-20">
          <Ionicons name="alert-circle" size={64} color="#E50914" />
          <Text className="text-white text-lg font-semibold mt-4">
            Failed to Load Bookmarks
          </Text>
          <Text className="text-gray-400 text-center mt-2 text-sm">
            {errorMsg}
          </Text>
          <TouchableOpacity
            onPress={() => loadBookmarks(true)}
            className="bg-[#E50914] px-6 py-3 rounded-full mt-6"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View className="items-center py-20 px-6">
        <Ionicons name="bookmark-outline" size={64} color="#6B7280" />
        <Text className="text-white text-lg font-semibold mt-4">
          No Bookmarks Yet
        </Text>
        <Text className="text-gray-400 text-center mt-2 text-sm">
          Add movies from the details page and they will show up here.
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#0F1528]">
      <FlatList
        data={bookmarks}
        renderItem={renderBookmarkCard}
        keyExtractor={(item) => item.movie_id.toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <View className="pt-16 mb-6">
            <Text className="text-white text-3xl font-bold mt-6">
              Bookmarks
            </Text>
            <Text className="text-gray-400 text-base mt-2">
              Your saved favorites in one place.
            </Text>

            {errorMsg !== "" && (
              <View className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 mt-4 flex-row items-center">
                <Ionicons
                  name="alert-circle"
                  size={18}
                  color="#F87171"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-red-300 text-sm flex-1">{errorMsg}</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={listEmpty}
      />
    </View>
  );
}
