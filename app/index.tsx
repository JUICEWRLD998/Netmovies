import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 bg-blue-500 items-center justify-center">
  <Text className="text-white text-2xl font-bold">Hello NativeWind!</Text>
</View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#E50914",
  },
});
