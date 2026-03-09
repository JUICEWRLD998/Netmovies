import { MovieError, TMDBResponse } from "../types/movie";

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const API_ACCESS_TOKEN = process.env.EXPO_PUBLIC_API_ACCESS_TOKEN;

export const TMDB = {
  /**
   * Get the base URL for TMDB images
   * @param size - Image size (w185, w342, w500, w780, original)
   * @returns Full image URL path
   */
  getImageUrl: (path: string | null, size: string = "w500"): string | null => {
    if (!path) return null;
    return `${IMAGE_BASE_URL}/${size}${path}`;
  },

  /**
   * Fetch popular movies from TMDB
   * @param page - Page number for pagination
   * @returns Promise with movie data or throws error
   */
  discoverMovies: async (page: number = 1): Promise<TMDBResponse> => {
    try {
      const response = await fetch(
        `${BASE_URL}/discover/movie?page=${page}&sort_by=popularity.desc&include_adult=false&language=en-US`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${API_ACCESS_TOKEN}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.status_message || "Failed to fetch movies",
          status_code: response.status,
        } as MovieError;
      }

      const data: TMDBResponse = await response.json();
      return data;
    } catch (error: any) {
      if (error.message && error.status_code) {
        throw error;
      }
      throw {
        message: "Network error. Please check your connection.",
        status_code: 0,
      } as MovieError;
    }
  },

  /**
   * Fetch trending movies (week window)
   * @returns Promise with the top 5 trending movies
   */
  getTrending: async (): Promise<TMDBResponse> => {
    try {
      const response = await fetch(
        `${BASE_URL}/trending/movie/week?language=en-US`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${API_ACCESS_TOKEN}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.status_message || "Failed to fetch trending",
          status_code: response.status,
        } as MovieError;
      }

      const data: TMDBResponse = await response.json();
      return data;
    } catch (error: any) {
      if (error.message && error.status_code) throw error;
      throw {
        message: "Network error. Please check your connection.",
        status_code: 0,
      } as MovieError;
    }
  },

  /**
   * Discover movies filtered by genre
   * @param genreId - TMDB genre ID
   * @param page - Page number for pagination
   * @returns Promise with movie data or throws error
   */
  discoverByGenre: async (
    genreId: number,
    page: number = 1,
  ): Promise<TMDBResponse> => {
    try {
      const response = await fetch(
        `${BASE_URL}/discover/movie?page=${page}&with_genres=${genreId}&sort_by=popularity.desc&include_adult=false&language=en-US`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${API_ACCESS_TOKEN}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.status_message || "Failed to fetch movies",
          status_code: response.status,
        } as MovieError;
      }

      const data: TMDBResponse = await response.json();
      return data;
    } catch (error: any) {
      if (error.message && error.status_code) throw error;
      throw {
        message: "Network error. Please check your connection.",
        status_code: 0,
      } as MovieError;
    }
  },

  /**
   * Search for movies by query
   * @param query - Search query string
   * @param page - Page number for pagination
   * @returns Promise with movie data or throws error
   */
  searchMovies: async (
    query: string,
    page: number = 1,
  ): Promise<TMDBResponse> => {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `${BASE_URL}/search/movie?query=${encodedQuery}&page=${page}&include_adult=false&language=en-US`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${API_ACCESS_TOKEN}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.status_message || "Failed to search movies",
          status_code: response.status,
        } as MovieError;
      }

      const data: TMDBResponse = await response.json();
      return data;
    } catch (error: any) {
      if (error.message && error.status_code) {
        throw error;
      }
      throw {
        message: "Network error. Please check your connection.",
        status_code: 0,
      } as MovieError;
    }
  },
};
