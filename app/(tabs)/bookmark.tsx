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
import { getUserBookmarks, removeBookmark } from "../../services/supabase";
import { TMDB } from "../../services/tmdb";

type Bookmark = {
  id: string;
  movie_id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  created_at: string;
};

export default function BookmarkPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      getUserBookmarks(user.id)
        .then((data) => setBookmarks(data as Bookmark[]))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [user]),
  );

  // ── Unauthenticated ──────────────────────────────────────────────────────
  if (!user) {
    return (
      <View className="flex-1 bg-[#0F1528] justify-center items-center px-8">
        <Ionicons name="bookmark-outline" size={72} color="#E50914" />
        <Text className="text-white text-2xl font-bold mt-6 text-center">
          Save your favourites
        </Text>
        <Text className="text-gray-400 text-base mt-3 text-center leading-6">
          Sign in to bookmark movies and find them here any time.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login" as any)}
          className="bg-[#E50914] px-8 py-4 rounded-full mt-8"
        >
          <Text className="text-white font-bold text-base">Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 bg-[#0F1528] justify-center items-center">
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  const handleLongPress = async (movieId: number) => {
    setBookmarks((prev) => prev.filter((b) => b.movie_id !== movieId));
    try {
      await removeBookmark(user.id, movieId);
    } catch {
      getUserBookmarks(user.id)
        .then((data) => setBookmarks(data as Bookmark[]))
        .catch(() => {});
    }
  };

  const renderCard = ({ item }: { item: Bookmark }) => {
    const posterUrl = TMDB.getImageUrl(item.poster_path, "w342");
    const year = item.release_date?.split("-")[0] ?? "—";
    const rating = ((item.vote_average ?? 0) / 2).toFixed(1);

    return (
      <TouchableOpacity
        className="w-[48%] mb-4"
        onPress={() => router.push(`/movie/${item.movie_id}` as any)}
        onLongPress={() => handleLongPress(item.movie_id)}
        delayLongPress={400}
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
            <Text className="text-white font-semibold text-sm" numberOfLines={2}>
              {item.title}
            </Text>
            <View className="flex-row items-center mt-2">
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text className="text-gray-400 text-xs ml-1">{rating}</Text>
              <Text className="text-gray-500 text-xs ml-2">{year}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-[#0F1528]">
      <FlatList
        data={bookmarks}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <View className="pt-16 mb-6">
            <Text className="text-white text-2xl font-bold">My Bookmarks</Text>
            <Text className="text-gray-400 text-sm mt-1">
              {bookmarks.length}{" "}
              {bookmarks.length === 1 ? "movie" : "movies"} saved
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-24">
            <Ionicons name="bookmark-outline" size={64} color="#6B7280" />
            <Text className="text-gray-400 mt-4 text-base text-center">
              No bookmarks yet.{"\n"}Start adding some!
            </Text>
          </View>
        }
      />
    </View>
  );
}
