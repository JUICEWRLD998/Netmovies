import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import { Image, StatusBar, Text, TouchableOpacity, View } from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();

  const goToSignUp = useCallback(
    () => router.push("/(auth)/signup" as Href),
    [router],
  );
  const goToLogin = useCallback(
    () => router.push("/(auth)/login" as Href),
    [router],
  );

  return (
    <View className="flex-1 bg-[#0F1528] px-8">
      <StatusBar barStyle="light-content" />

      {/* Center content */}
      <View className="flex-1 items-center justify-center">
        <Image
          source={require("../../assets/images/netmovies-logo.png")}
          style={{ width: 110, height: 110 }}
          resizeMode="contain"
        />
        <Text
          style={{
            fontSize: 38,
            fontWeight: "900",
            color: "#E50914",
            letterSpacing: 2,
            marginTop: 20,
          }}
        >
          NETMOVIES
        </Text>
        <Text className="text-gray-400 text-base mt-2">
          Your movies, all in one place.
        </Text>
      </View>

      {/* Buttons pinned to bottom */}
      <View className="pb-14">
        <TouchableOpacity
          onPress={goToSignUp}
          activeOpacity={0.65}
          className="bg-[#E50914] rounded-xl py-4 items-center mb-4"
        >
          <Text className="text-white text-base font-bold tracking-wider">
            Get Started
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToLogin}
          activeOpacity={0.7}
          className="py-3 items-center"
        >
          <Text className="text-gray-400 text-base">
            Already have an account?{" "}
            <Text className="text-white font-semibold">Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
