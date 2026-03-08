import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BRAND = "NETMOVIES";
const TYPING_SPEED = 130; // ms per character
const CURSOR_BLINK = 530; // ms

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();

  // ── Typing animation state ───────────────────────────────────────────────
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [typingDone, setTypingDone] = useState(false);

  // ── Animated values for stagger reveal ───────────────────────────────────
  const accentLineWidth = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslate = useRef(new Animated.Value(24)).current;
  const chevronOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslate = useRef(new Animated.Value(40)).current;

  // Glow decorative circles
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // ── Typewriter effect ────────────────────────────────────────────────────
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedText(BRAND.slice(0, i));
      if (i >= BRAND.length) {
        clearInterval(interval);
        setTypingDone(true);
      }
    }, TYPING_SPEED);
    return () => clearInterval(interval);
  }, []);

  // ── Cursor blink ────────────────────────────────────────────────────────
  useEffect(() => {
    const blink = setInterval(() => setShowCursor((v) => !v), CURSOR_BLINK);
    // Stop blinking 2 s after typing finishes
    let timeout: ReturnType<typeof setTimeout>;
    if (typingDone) {
      timeout = setTimeout(() => {
        clearInterval(blink);
        setShowCursor(false);
      }, 2000);
    }
    return () => {
      clearInterval(blink);
      if (timeout) clearTimeout(timeout);
    };
  }, [typingDone]);

  // ── Stagger animations after typing ──────────────────────────────────────
  useEffect(() => {
    if (!typingDone) return;

    Animated.sequence([
      // Red accent line sweeps in
      Animated.timing(accentLineWidth, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }),
      // Decorative glow
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Tagline fades up
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslate, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Chevron
      Animated.timing(chevronOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Buttons slide up
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsTranslate, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [typingDone]);

  // ── Pulsing chevron loop ─────────────────────────────────────────────────
  const chevronTranslate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!typingDone) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(chevronTranslate, {
          toValue: 10,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(chevronTranslate, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [typingDone]);

  // ── Navigation ───────────────────────────────────────────────────────────
  const goToSignUp = useCallback(
    () => router.push("/(auth)/signup" as Href),
    [router],
  );
  const goToLogin = useCallback(
    () => router.push("/(auth)/login" as Href),
    [router],
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-[#0F1528]">
      <StatusBar barStyle="light-content" />

      {/* Decorative background glow */}
      <Animated.View
        style={{ opacity: glowOpacity }}
        className="absolute top-[15%] -left-20 w-72 h-72 rounded-full bg-[#E50914] opacity-[0.06]"
      />
      <Animated.View
        style={{ opacity: glowOpacity }}
        className="absolute top-[10%] -right-16 w-56 h-56 rounded-full bg-[#E50914] opacity-[0.04]"
      />

      {/* ── Top Spacer ─────────────────────────────────────────────────── */}
      <View className="flex-[3] justify-end items-center pb-2">
        {/* Brand text with typing effect */}
        <View className="flex-row items-center">
          <Text
            style={{
              fontSize: 46,
              fontWeight: "900",
              color: "#E50914",
              letterSpacing: 5,
            }}
          >
            {displayedText}
          </Text>
          {showCursor && (
            <Text
              style={{
                fontSize: 46,
                fontWeight: "300",
                color: "#E50914",
                marginLeft: 2,
              }}
            >
              |
            </Text>
          )}
        </View>

        {/* Red accent underline */}
        <Animated.View
          style={{
            width: accentLineWidth.interpolate({
              inputRange: [0, 1],
              outputRange: [0, SCREEN_WIDTH * 0.5],
            }),
            height: 3,
            backgroundColor: "#E50914",
            borderRadius: 2,
            marginTop: 8,
          }}
        />
      </View>

      {/* ── Tagline ────────────────────────────────────────────────────── */}
      <Animated.View
        className="flex-[2] items-center pt-8 px-10"
        style={{
          opacity: taglineOpacity,
          transform: [{ translateY: taglineTranslate }],
        }}
      >
        <Text className="text-white text-center text-xl font-light leading-8 tracking-wide">
          Dive into a world of{"\n"}
          <Text className="font-bold text-[#E50914]">
            endless entertainment
          </Text>
        </Text>
        <Text className="text-gray-400 text-center text-sm mt-3">
          Thousands of movies — one tap away.
        </Text>

        {/* Pulsing chevron */}
        <Animated.View
          style={{
            opacity: chevronOpacity,
            transform: [{ translateY: chevronTranslate }],
            marginTop: 20,
          }}
        >
          <Ionicons name="chevron-down" size={28} color="#E50914" />
        </Animated.View>
      </Animated.View>

      {/* ── CTA Buttons ────────────────────────────────────────────────── */}
      <Animated.View
        className="flex-[2] px-8 pt-4"
        style={{
          opacity: buttonsOpacity,
          transform: [{ translateY: buttonsTranslate }],
        }}
      >
        {/* Get Started → Sign Up */}
        <TouchableOpacity
          onPress={goToSignUp}
          activeOpacity={0.85}
          className="bg-[#E50914] rounded-full py-4 items-center mb-4"
          style={{
            shadowColor: "#E50914",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <View className="flex-row items-center">
            <Text className="text-white text-lg font-bold tracking-wider mr-2">
              Get Started
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Already have an account? */}
        <TouchableOpacity
          onPress={goToLogin}
          activeOpacity={0.7}
          className="py-3 items-center"
        >
          <Text className="text-gray-400 text-base">
            Already have an account?{" "}
            <Text className="text-white font-semibold underline">Sign In</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom safe area spacer */}
      <View className="h-10" />
    </View>
  );
}
