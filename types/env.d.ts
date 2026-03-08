declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // TMDB
      EXPO_PUBLIC_API_ACCESS_TOKEN: string;
      EXPO_PUBLIC_API_KEY: string;

      // Google Sign-In (Web Client ID from Google Cloud Console / Firebase)
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: string;

      // Supabase (client-side – safe to expose)
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;

      // Supabase (server-side / secret – never expose to client)
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;
      SUPABASE_JWT_SECRET: string;
      SUPABASE_PUBLISHABLE_KEY: string;
      SUPABASE_SECRET_KEY: string;

      // Postgres
      POSTGRES_USER: string;
      POSTGRES_PASSWORD: string;
      POSTGRES_DATABASE: string;
      POSTGRES_HOST: string;
      POSTGRES_URL: string;
      POSTGRES_PRISMA_URL: string;
      POSTGRES_URL_NON_POOLING: string;
    }
  }
}

export { };

