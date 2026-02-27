import { Stack } from "expo-router"; // this imports the Stack component from the expo-router library, which is used to create a stack-based navigation structure for the app. The Stack component allows you to define different screens and navigate between them in a way that mimics the behavior of a stack of pages, where you can push new screens onto the stack and pop them off to go back to previous screens.
import "../global.css"; // this is the global styling

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#000" },
      }}
    />
  );
}
