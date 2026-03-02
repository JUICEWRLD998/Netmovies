import { Ionicons } from "@expo/vector-icons";
import { Image, ScrollView, TextInput, View } from "react-native";

export default function HomePage() {
  return (
    <ScrollView className="flex-1 bg-[#0F1528] px-6 pt-16">
      {/* Brand Logo */}
      <View className="items-center mb-8">
        <Image
          source={require("../../assets/images/brand-logo.png")}
          className="w-32 h-32"
          resizeMode="contain"
        />
      </View>

      {/* Search Bar */}
      <View className="bg-[#1A1F3A] rounded-full mt-1 px-3 py-3 flex-row items-center">
        <Ionicons name="search" size={20} color="#6B7280" />
        <TextInput
          placeholder="Search through 300+ movies online"
          placeholderTextColor="#6B7280"
          className="flex-1 text-white text-base ml-2"
        />
      </View>
    </ScrollView>
  );
}
