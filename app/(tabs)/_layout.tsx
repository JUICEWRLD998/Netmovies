//Imported Ionicons for the icons in the tab bar and Tabs from expo-router to create the tab navigation. The TabLayout component defines the structure of the tab navigation, including the styling for active and inactive tabs, as well as the header. Each tab screen is defined with a name, title, and an icon that changes color based on whether it is active or not.
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#E50914",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          backgroundColor: "#000",
          borderTopColor: "#000",
          borderRadius: 24,
          marginHorizontal: 16,
          marginBottom: 8,
          position: "absolute",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmark"
        options={{
          title: "Bookmark",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
