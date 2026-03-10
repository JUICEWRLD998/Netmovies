import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { TMDB } from "../../services/tmdb";
import { MovieDetail } from "../../types/movie";
import { useAuth } from "../../context/AuthContext";
import {
  addBookmark,
  isBookmarked,
  removeBookmark,
} from "../../services/supabase";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BACKDROP_HEIGHT = SCREEN_WIDTH * 0.65;

function formatMoney(n: number): string {
  if (!n) return "N/A";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function formatRuntime(mins: number | null): string {
  if (!mins) return "N/A";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getCertification(movie: MovieDetail): string {
  const usEntry = movie.release_dates?.results?.find(
    (r) => r.iso_3166_1 === "US",
  );
  const cert = usEntry?.release_dates?.find(
    (d) => d.certification,
  )?.certification;
  return cert || "NR";
}

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    TMDB.getMovieDetails(Number(id))
      .then((data) => setMovie(data))
      .catch((err) => setError(err.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !movie) return;
    isBookmarked(user.id, movie.id)
      .then(setBookmarked)
      .catch(() => {});
  }, [user, movie]);

  const handleBookmarkToggle = async () => {
    if (!user) {
      router.push("/(auth)/login" as any);
      return;
    }
    if (!movie || bookmarkLoading) return;
    setBookmarkLoading(true);
    try {
      if (bookmarked) {
        await removeBookmark(user.id, movie.id);
        setBookmarked(false);
      } else {
        await addBookmark(user.id, {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average,
          release_date: movie.release_date ?? "",
        });
        setBookmarked(true);
      }
    } catch {
      // silently ignore
    } finally {
      setBookmarkLoading(false);
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0F1528",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  if (error || !movie) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0F1528",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Ionicons name="alert-circle-outline" size={56} color="#E50914" />
        <Text
          style={{
            color: "#fff",
            fontSize: 16,
            marginTop: 16,
            textAlign: "center",
          }}
        >
          {error ?? "Movie not found"}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 24,
            backgroundColor: "#E50914",
            paddingHorizontal: 28,
            paddingVertical: 12,
            borderRadius: 24,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const backdropUrl = TMDB.getImageUrl(movie.backdrop_path, "w780");
  const posterUrl = TMDB.getImageUrl(movie.poster_path, "w342");
  const year = movie.release_date?.split("-")[0] ?? "—";
  const rating = (movie.vote_average / 2).toFixed(1);
  const certification = getCertification(movie);
  const countries =
    movie.production_countries?.map((c) => c.name).join(" • ") || "N/A";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#0F1528" }}
      contentContainerStyle={{ paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Backdrop ── */}
      <View style={{ width: SCREEN_WIDTH, height: BACKDROP_HEIGHT }}>
        {backdropUrl ? (
          <Image
            source={{ uri: backdropUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#1A1F3A",
            }}
          />
        )}
        {/* gradient overlay */}
        <LinearGradient
          colors={["rgba(15,21,40,0.1)", "rgba(15,21,40,0.6)", "#0F1528"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: BACKDROP_HEIGHT * 0.6,
          }}
        />
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            position: "absolute",
            top: 52,
            left: 16,
            backgroundColor: "rgba(0,0,0,0.55)",
            borderRadius: 20,
            padding: 8,
          }}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        {/* Bookmark button */}
        <TouchableOpacity
          onPress={handleBookmarkToggle}
          style={{
            position: "absolute",
            top: 52,
            right: 16,
            backgroundColor: "rgba(0,0,0,0.55)",
            borderRadius: 20,
            padding: 8,
          }}
        >
          {bookmarkLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name={bookmarked ? "bookmark" : "bookmark-outline"}
              size={22}
              color={bookmarked ? "#E50914" : "#fff"}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Body ── */}
      <View style={{ paddingHorizontal: 20, marginTop: -8 }}>
        {/* Poster + basic info row */}
        <View
          style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}
        >
          {/* Poster */}
          {posterUrl && (
            <View
              style={{
                borderRadius: 10,
                overflow: "hidden",
                elevation: 12,
                shadowColor: "#000",
                shadowOpacity: 0.6,
                shadowRadius: 8,
              }}
            >
              <Image
                source={{ uri: posterUrl }}
                style={{ width: 100, height: 150 }}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Title + meta */}
          <View style={{ flex: 1, paddingTop: 4 }}>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 22,
                fontWeight: "800",
                lineHeight: 28,
                marginBottom: 8,
              }}
            >
              {movie.title}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              <Text style={{ color: "#9CA3AF", fontSize: 13 }}>{year}</Text>
              <Text style={{ color: "#4B5563", fontSize: 13 }}>•</Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#4B5563",
                  borderRadius: 4,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                }}
              >
                <Text style={{ color: "#9CA3AF", fontSize: 11 }}>
                  {certification}
                </Text>
              </View>
              <Text style={{ color: "#4B5563", fontSize: 13 }}>•</Text>
              <Text style={{ color: "#9CA3AF", fontSize: 13 }}>
                {formatRuntime(movie.runtime)}
              </Text>
            </View>

            {/* Star rating */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 10,
                gap: 6,
              }}
            >
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text
                style={{ color: "#FFD700", fontWeight: "700", fontSize: 15 }}
              >
                {rating}
              </Text>
              <Text style={{ color: "#6B7280", fontSize: 12 }}>
                /10 ({movie.vote_count.toLocaleString()})
              </Text>
            </View>
          </View>
        </View>

        {/* ── Overview ── */}
        {movie.overview ? (
          <View style={{ marginTop: 20 }}>
            <Text
              style={{
                color: "#9CA3AF",
                fontSize: 12,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              Overview
            </Text>
            <Text style={{ color: "#D1D5DB", fontSize: 14, lineHeight: 22 }}>
              {movie.overview}
            </Text>
          </View>
        ) : null}

        {/* ── Release Date | Status ── */}
        <View style={{ flexDirection: "row", marginTop: 22, gap: 12 }}>
          <InfoBox
            label="Release Date"
            value={
              movie.release_date
                ? new Date(movie.release_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Unknown"
            }
          />
          <InfoBox
            label="Status"
            value={movie.status ?? "Unknown"}
            highlight={movie.status === "Released"}
          />
        </View>

        {/* ── Genres ── */}
        {movie.genres?.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={sectionLabel}>Genres</Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 8,
              }}
            >
              {movie.genres.map((g) => (
                <View key={g.id} style={chip}>
                  <Text style={chipText}>{g.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Countries ── */}
        {movie.production_countries?.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={sectionLabel}>Countries</Text>
            <Text
              style={{
                color: "#D1D5DB",
                fontSize: 14,
                marginTop: 6,
                lineHeight: 22,
              }}
            >
              {countries}
            </Text>
          </View>
        )}

        {/* ── Budget | Revenue ── */}
        {(movie.budget > 0 || movie.revenue > 0) && (
          <View style={{ flexDirection: "row", marginTop: 22, gap: 12 }}>
            <InfoBox label="Budget" value={formatMoney(movie.budget)} />
            <InfoBox label="Revenue" value={formatMoney(movie.revenue)} />
          </View>
        )}

        {/* ── Tagline ── */}
        {!!movie.tagline && (
          <View
            style={{
              marginTop: 22,
              borderLeftWidth: 3,
              borderLeftColor: "#E50914",
              paddingLeft: 12,
            }}
          >
            <Text
              style={{
                color: "#9CA3AF",
                fontSize: 14,
                fontStyle: "italic",
                lineHeight: 22,
              }}
            >
              "{movie.tagline}"
            </Text>
          </View>
        )}

        {/* ── Production Companies ── */}
        {movie.production_companies?.length > 0 && (
          <View style={{ marginTop: 22 }}>
            <Text style={sectionLabel}>Production Companies</Text>
            <View style={{ marginTop: 8, gap: 4 }}>
              {movie.production_companies.map((c) => (
                <Text key={c.id} style={{ color: "#D1D5DB", fontSize: 14 }}>
                  {c.name}
                </Text>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function InfoBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#1A1F3A",
        borderRadius: 10,
        padding: 12,
      }}
    >
      <Text
        style={{
          color: "#6B7280",
          fontSize: 11,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: highlight ? "#4ADE80" : "#F9FAFB",
          fontSize: 14,
          fontWeight: "600",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const sectionLabel = {
  color: "#6B7280",
  fontSize: 11,
  fontWeight: "700" as const,
  textTransform: "uppercase" as const,
  letterSpacing: 0.8,
};

const chip = {
  backgroundColor: "#1A1F3A",
  borderRadius: 16,
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderWidth: 1,
  borderColor: "#2A3050",
};

const chipText = {
  color: "#D1D5DB",
  fontSize: 12,
  fontWeight: "600" as const,
};
