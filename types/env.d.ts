declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_ACCESS_TOKEN: string;
      EXPO_PUBLIC_API_KEY: string;
    }
  }
}

export { };

