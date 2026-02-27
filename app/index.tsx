import { Redirect } from "expo-router"; // this imports the redirect component from the expo-router

export default function Index() {
  return <Redirect href="/(tabs)/home" />; // this line redirects the user to the home page when they access the root URL of the app. The href prop specifies the path to redirect to, which in this case is "/(tabs)/home". This means that when the user opens the app, they will be automatically taken to the home page of the tab navigation.
}
