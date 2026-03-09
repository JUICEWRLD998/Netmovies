import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
  type Href,
} from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StatusBar, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import "../global.css";

/** Redirects users between (auth) and (tabs) based on session state. */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Wait until the router is mounted and auth state is resolved
    if (!navigationState?.key || loading) return;

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
