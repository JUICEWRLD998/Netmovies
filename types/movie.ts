export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  genre_ids: number[];
  original_language: string;
  original_title: string;
  video: boolean;
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface MovieDetail extends Omit<Movie, "genre_ids"> {
  runtime: number | null;
  genres: Genre[];
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  budget: number;
  revenue: number;
  tagline: string | null;
  status: string;
  release_dates?: {
    results: Array<{
      iso_3166_1: string;
      release_dates: Array<{ certification: string; type: number }>;
    }>;
  };
}

export interface Bookmark {
  id: string;
  user_id: string;
  movie_id: number;
  title: string;
  poster_path: string | null;
  vote_average: number | null;
  release_date: string | null;
  created_at: string;
}

export interface TMDBResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export interface MovieError {
  message: string;
  status_code?: number;
}
