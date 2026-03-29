import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
  type Href,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, StatusBar, Text, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import "../global.css";
import { SUPABASE_ENV_ERROR } from "../services/supabase";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if splash is already prevented/hidden.
});
SplashScreen.setOptions({
  duration: 300,
  fade: true,
});

/** Redirects users between (auth) and (tabs) based on session state. */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Wait until the router is mounted and auth state is resolved
    if (!navigationState?.key || loading) return;

    SplashScreen.hideAsync().catch(() => {
      // Ignore hide race conditions.
    });

    const inAuthGroup = (segments[0] as string) === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/welcome" as Href);
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)/home");
    }
  }, [session, loading, segments, navigationState?.key]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#0F1528] items-center justify-center">
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    if (!SUPABASE_ENV_ERROR) return;

    SplashScreen.hideAsync().catch(() => {
      // Ensure splash does not block configuration error screen.
    });
  }, []);

  if (SUPABASE_ENV_ERROR) {
    return (
      <View className="flex-1 bg-[#0F1528] items-center justify-center px-6">
        <StatusBar hidden={true} />
        <Text className="text-white text-xl font-bold text-center mb-3">
          App Configuration Error
        </Text>
        <Text className="text-gray-300 text-center leading-6">
          {SUPABASE_ENV_ERROR}
        </Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <AuthGate>
        <StatusBar hidden={true} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#0F1528" },
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="index" />
          <Stack.Screen name="movie/[id]" />
        </Stack>
      </AuthGate>
    </AuthProvider>
  );
}
