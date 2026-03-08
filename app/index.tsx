import { Redirect, type Href } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 bg-[#0F1528] items-center justify-center">
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href={"/(auth)/welcome" as Href} />;
}
