import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { trackSearch } from "../../services/supabase";
import { TMDB } from "../../services/tmdb";
import { Movie } from "../../types/movie";

const GENRES = [
  { id: 28, label: "Action" },
  { id: 35, label: "Comedy" },
  { id: 27, label: "Horror" },
  { id: 10749, label: "Romance" },
  { id: 878, label: "Sci-Fi" },
  { id: 53, label: "Thriller" },
  { id: 18, label: "Drama" },
  { id: 16, label: "Animation" },
  { id: 12, label: "Adventure" },
  { id: 80, label: "Crime" },
  { id: 14, label: "Fantasy" },
  { id: 10751, label: "Family" },
];

export default function SearchPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [activeGenre, setActiveGenre] = useState<number | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Fetch by genre
  const fetchByGenre = async (
    genreId: number,
    append = false,
    nextPage = 1,
  ) => {
    try {
      setError(null);
      const data = await TMDB.discoverByGenre(genreId, nextPage);
      setTotalPages(data.total_pages);
      setTotalResults(data.total_results);
      setMovies((prev) => (append ? [...prev, ...data.results] : data.results));
    } catch (err: any) {
      setError(err.message || "Failed to fetch movies");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch trending movies on initial load
  const fetchTrending = async (append = false, nextPage = 1) => {
    try {
      setError(null);
      const data = await TMDB.discoverMovies(nextPage);
      setTotalPages(data.total_pages);
      setTotalResults(data.total_results);
      setMovies((prev) => (append ? [...prev, ...data.results] : data.results));
    } catch (err: any) {
      setError(err.message || "Failed to fetch movies");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Search movies
  const fetchSearch = async (query: string, append = false, nextPage = 1) => {
    try {
      setError(null);
      const data = await TMDB.searchMovies(query, nextPage);
      setTotalPages(data.total_pages);
      setTotalResults(data.total_results);
      setMovies((prev) => (append ? [...prev, ...data.results] : data.results));
      // Persist the search query on the first page (fire-and-forget)
      if (!append && nextPage === 1) trackSearch(query);
    } catch (err: any) {
      setError(err.message || "Failed to search movies");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTrending(false, 1);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      if (searchQuery.trim()) {
        setActiveGenre(null);
        setLoading(true);
        setIsSearching(true);
        fetchSearch(searchQuery, false, 1);
      } else {
        setIsSearching(false);
        setLoading(true);
        if (activeGenre !== null) {
          fetchByGenre(activeGenre, false, 1);
        } else {
          fetchTrending(false, 1);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleGenrePress = (genreId: number) => {
    const next = activeGenre === genreId ? null : genreId;
    setActiveGenre(next);
    setPage(1);
    setLoading(true);
    setSearchQuery("");
    setIsSearching(false);
    if (next !== null) {
      fetchByGenre(next, false, 1);
    } else {
      fetchTrending(false, 1);
    }
  };

  // Infinite scroll — load next page
  const loadMore = () => {
    if (loadingMore || loading || page >= totalPages) return;
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    if (isSearching && searchQuery.trim()) {
      fetchSearch(searchQuery, true, nextPage);
    } else if (activeGenre !== null) {
      fetchByGenre(activeGenre, true, nextPage);
    } else {
      fetchTrending(true, nextPage);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setPage(1);
    setLoading(true);
    if (activeGenre !== null) {
      fetchByGenre(activeGenre, false, 1);
    } else {
      fetchTrending(false, 1);
    }
  };

  const retry = () => {
    setLoading(true);
    setError(null);
    if (isSearching && searchQuery.trim()) {
      fetchSearch(searchQuery, false, 1);
    } else {
      fetchTrending(false, 1);
    }
  };

  const renderMovieCard = ({ item }: { item: Movie }) => {
    const posterUrl = TMDB.getImageUrl(item.poster_path, "w342");

    return (
      <TouchableOpacity
        className="w-[48%] mb-4"
        onPress={() => router.push(`/movie/${item.id}` as any)}
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
            <View className="flex-row items-center mt-2">
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text className="text-gray-400 text-xs ml-1">
                {(item.vote_average / 2).toFixed(1)}
              </Text>
              <Text className="text-gray-500 text-xs ml-2">
                {item.release_date?.split("-")[0]}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = (
    <View className="pt-16 mb-6">
      {/* Search Bar */}
      <View className="bg-[#1A1F3A] rounded-full px-5 py-3 flex-row items-center mb-6">
        <Ionicons name="search" size={20} color="#6B7280" />
        <TextInput
          ref={inputRef}
          placeholder="Search movies..."
          placeholderTextColor="#6B7280"
          className="flex-1 text-white text-base ml-2"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Genre filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
      >
        {GENRES.map((g) => {
          const active = activeGenre === g.id;
          return (
            <TouchableOpacity
              key={g.id}
              onPress={() => handleGenrePress(g.id)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: active ? "#E50914" : "#1A1F3A",
                borderWidth: 1,
                borderColor: active ? "#E50914" : "#2A3050",
              }}
            >
              <Text
                style={{
                  color: active ? "#FFFFFF" : "#9CA3AF",
                  fontSize: 13,
                  fontWeight: active ? "700" : "500",
                }}
              >
                {g.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Section title */}
      {!loading && !error && (
        <View className="flex-row items-center justify-between mb-4">
          {isSearching ? (
            <>
              <Text className="text-white text-xl font-bold" numberOfLines={1}>
                Results for "{searchQuery}"
              </Text>
              <Text className="text-gray-400 text-sm ml-2">
                {totalResults.toLocaleString()}
              </Text>
            </>
          ) : activeGenre !== null ? (
            <>
              <Text className="text-white text-xl font-bold">
                {GENRES.find((g) => g.id === activeGenre)?.label}
              </Text>
              <Text className="text-gray-400 text-sm">
                {totalResults.toLocaleString()} films
              </Text>
            </>
          ) : (
            <>
              <Text className="text-white text-xl font-bold">Trending</Text>
              <Ionicons name="flame" size={24} color="#E50914" />
            </>
          )}
        </View>
      )}
    </View>
  );

  const ListFooter = loadingMore ? (
    <View className="py-6 items-center">
      <ActivityIndicator size="small" color="#E50914" />
    </View>
  ) : null;

  const ListEmpty = loading ? (
    <View className="flex-1 justify-center items-center py-24">
      <ActivityIndicator size="large" color="#E50914" />
    </View>
  ) : error ? (
    <View className="flex-1 justify-center items-center py-24 px-8">
      <Ionicons name="wifi-outline" size={52} color="#6B7280" />
      <Text className="text-gray-400 text-center mt-4 text-base">{error}</Text>
      <TouchableOpacity
        onPress={retry}
        className="mt-6 bg-[#E50914] rounded-full px-8 py-3"
      >
        <Text className="text-white font-semibold">Retry</Text>
      </TouchableOpacity>
    </View>
  ) : isSearching ? (
    <View className="flex-1 justify-center items-center py-24 px-8">
      <Ionicons name="search-outline" size={52} color="#6B7280" />
      <Text className="text-gray-400 text-center mt-4 text-base">
        No results found for "{searchQuery}"
      </Text>
    </View>
  ) : null;

  return (
    <View className="flex-1 bg-[#0F1528]">
      <FlatList
        data={movies}
        renderItem={renderMovieCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </View>
  );
}
