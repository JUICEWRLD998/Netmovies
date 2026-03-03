import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { TMDB } from "../../services/tmdb";
import { Movie } from "../../types/movie";

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Fetch movies from TMDB API
  const fetchMovies = async (query: string = "") => {
    try {
      setError(null);
      setIsSearching(query.length > 0);

      if (query.trim()) {
        const data = await TMDB.searchMovies(query);
        setMovies(data.results.slice(0, 30));
      } else {
        // Fetch 2 pages for 30 movies
        const [page1, page2] = await Promise.all([
          TMDB.discoverMovies(1),
          TMDB.discoverMovies(2),
        ]);
        const allMovies = [...page1.results, ...page2.results].slice(0, 30);
        setMovies(allMovies);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch movies");
      console.error("Error fetching movies:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        setLoading(true);
        fetchMovies(searchQuery);
      } else if (searchQuery === "") {
        setLoading(true);
        fetchMovies();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setSearchQuery("");
    fetchMovies();
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setLoading(true);
    fetchMovies();
  };

  const renderMovieCard = ({ item }: { item: Movie }) => {
    const posterUrl = TMDB.getImageUrl(item.poster_path, "w342");

    return (
      <TouchableOpacity className="w-[48%] mb-4">
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
                {item.release_date.split("-")[0]}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-[#0F1528]">
      <FlatList
        data={movies}
        renderItem={renderMovieCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <View className="pt-16 mb-6">
            {/* Brand Logo */}
            <View className="items-center mb-8">
              <Image
                source={require("../../assets/images/brand-logo.png")}
                className="w-32 h-32"
                resizeMode="contain"
              />
            </View>

            {/* Search Bar */}
            <View className="bg-[#1A1F3A] rounded-full px-5 py-3 flex-row items-center mb-6">
              <Ionicons name="search" size={20} color="#6B7280" />
              <TextInput
                placeholder="Search through 300+ movies online"
                placeholderTextColor="#6B7280"
                className="flex-1 text-white text-base ml-2"
                value={searchQuery}
                onChangeText={handleSearchChange}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch}>
                  <Ionicons name="close-circle" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>

            {/* Section Title */}
            {!loading && !error && (
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-xl font-bold">
                  {isSearching ? `Search Results` : "Popular Movies"}
                </Text>
                <Ionicons
                  name={isSearching ? "search" : "flame"}
                  size={24}
                  color="#E50914"
                />
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            {loading ? (
              <View className="items-center">
                <ActivityIndicator size="large" color="#E50914" />
                <Text className="text-gray-400 mt-4 text-base">
                  {isSearching ? "Searching..." : "Loading movies..."}
                </Text>
              </View>
            ) : error ? (
              <View className="items-center px-6">
                <Ionicons name="alert-circle" size={64} color="#E50914" />
                <Text className="text-white text-lg font-semibold mt-4">
                  Failed to Fetch Movies
                </Text>
                <Text className="text-gray-400 text-center mt-2 text-sm">
                  {error}
                </Text>
                <TouchableOpacity
                  onPress={() => fetchMovies(searchQuery)}
                  className="bg-[#E50914] px-6 py-3 rounded-full mt-6"
                >
                  <Text className="text-white font-semibold">Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="items-center">
                <Ionicons name="film-outline" size={64} color="#6B7280" />
                <Text className="text-gray-400 mt-4">
                  {isSearching ? "No movies found" : "No movies available"}
                </Text>
              </View>
            )}
          </View>
        }
      />
    </View>
  );
}
