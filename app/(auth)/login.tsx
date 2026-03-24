import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { friendlyAuthError, useAuth } from "../../context/AuthContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = (): boolean => {
    if (!email.trim()) {
      setErrorMsg("Please enter your email.");
      return false;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setErrorMsg("Please enter a valid email address.");
      return false;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      return false;
    }
    return true;
  };

  // ── Email / Password Sign In ─────────────────────────────────────────────
  const handleSignIn = useCallback(async () => {
    setErrorMsg("");
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) setErrorMsg(friendlyAuthError(error));
    } catch {
      setErrorMsg("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [email, password, signIn]);

  // ── Forgot Password ─────────────────────────────────────────────────────
  const handleForgotPassword = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      setErrorMsg("Enter a valid email above, then tap Forgot Password again.");
      return;
    }
    setErrorMsg("");
    const { error } = await resetPassword(trimmed);
    if (error) {
      setErrorMsg(friendlyAuthError(error));
    }
  }, [email, resetPassword]);

  const isDisabled = loading;

  return (
    <View className="flex-1 bg-[#0F1528]">
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ──────────────────────────────────────────────────── */}
          <View className="pt-14 px-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-[#1A1F3A] items-center justify-center"
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View className="px-8 pt-8 pb-4">
            <Text className="text-white text-2xl font-bold">Welcome Back</Text>
            <Text className="text-gray-400 text-base mt-1">
              Sign in to continue
            </Text>
          </View>

          {/* ── Form ────────────────────────────────────────────────────── */}
          <View className="px-8 pt-4">
            {/* Error message */}
            {errorMsg !== "" && (
              <View className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 mb-4 flex-row items-center">
                <Ionicons
                  name="alert-circle"
                  size={18}
                  color="#F87171"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-red-300 text-sm flex-1">{errorMsg}</Text>
              </View>
            )}

            {/* Email */}
            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2 ml-1">Email</Text>
              <View className="bg-[#1A1F3A] rounded-xl px-4 py-3.5 flex-row items-center">
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <TextInput
                  placeholder="johndoe@gmail.com"
                  placeholderTextColor="#4B5563"
                  className="flex-1 text-white text-base ml-3"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setErrorMsg("");
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  editable={!isDisabled}
                />
              </View>
            </View>

            {/* Password */}
            <View className="mb-3">
              <Text className="text-gray-400 text-sm mb-2 ml-1">Password</Text>
              <View className="bg-[#1A1F3A] rounded-xl px-4 py-3.5 flex-row items-center">
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#6B7280"
                />
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#4B5563"
                  className="flex-1 text-white text-base ml-3"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setErrorMsg("");
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!isDisabled}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot password */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              className="self-end mb-6"
              disabled={isDisabled}
            >
              <Text className="text-[#ffffff] text-sm font-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Sign In button */}
            <TouchableOpacity
              onPress={handleSignIn}
              disabled={isDisabled}
              activeOpacity={0.85}
              className="rounded-xl py-4 items-center mb-6"
              style={{
                backgroundColor: isDisabled ? "#7f1d1d" : "#E50914",
                shadowColor: "#E50914",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 6,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-lg font-bold tracking-wider">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <View className="flex-1 justify-end pb-10 items-center">
            <TouchableOpacity
              onPress={() => router.replace("/(auth)/signup" as Href)}
              disabled={isDisabled}
            >
              <Text className="text-gray-400 text-base">
                Don't have an account?{" "}
                <Text className="text-white font-semibold">Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
