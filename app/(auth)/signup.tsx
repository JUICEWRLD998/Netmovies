import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

// ── Password strength rules ────────────────────────────────────────────────

interface PwRule {
  label: string;
  test: (pw: string) => boolean;
}

const PW_RULES: PwRule[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /\d/.test(p) },
];

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Derived: password strength indicators
  const pwChecks = useMemo(
    () => PW_RULES.map((r) => ({ ...r, passed: r.test(password) })),
    [password],
  );
  const allPwRulesPassed = pwChecks.every((r) => r.passed);

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
      setErrorMsg("Please enter a password.");
      return false;
    }
    if (!allPwRulesPassed) {
      setErrorMsg("Please meet all password requirements.");
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return false;
    }
    return true;
  };

  // ── Email / Password Sign Up ─────────────────────────────────────────────
  const handleSignUp = useCallback(async () => {
    setErrorMsg("");
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await signUp(email, password);
      if (error) {
        setErrorMsg(friendlyAuthError(error));
      } else {
        Alert.alert(
          "Check your email",
          "We sent a confirmation link. Please verify your email to continue.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(auth)/login" as Href),
            },
          ],
        );
      }
    } catch {
      setErrorMsg("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [email, password, confirmPassword, signUp, allPwRulesPassed, router]);

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
            <Text
              style={{
                fontSize: 28,
                fontWeight: "900",
                color: "#E50914",
                letterSpacing: 3,
              }}
            >
              NETMOVIES
            </Text>
            <Text className="text-white text-2xl font-bold mt-6">
              Create Account
            </Text>
            <Text className="text-gray-400 text-base mt-1">
              Join the movie community
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
                  placeholder="you@example.com"
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
                  placeholder="Create a strong password"
                  placeholderTextColor="#4B5563"
                  className="flex-1 text-white text-base ml-3"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setErrorMsg("");
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
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

            {/* Password strength checklist */}
            {password.length > 0 && (
              <View className="mb-4 ml-1">
                {pwChecks.map((rule) => (
                  <View
                    key={rule.label}
                    className="flex-row items-center mb-1.5"
                  >
                    <Ionicons
                      name={
                        rule.passed ? "checkmark-circle" : "ellipse-outline"
                      }
                      size={16}
                      color={rule.passed ? "#22C55E" : "#6B7280"}
                    />
                    <Text
                      className="ml-2 text-sm"
                      style={{ color: rule.passed ? "#22C55E" : "#6B7280" }}
                    >
                      {rule.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Confirm Password */}
            <View className="mb-6">
              <Text className="text-gray-400 text-sm mb-2 ml-1">
                Confirm Password
              </Text>
              <View className="bg-[#1A1F3A] rounded-xl px-4 py-3.5 flex-row items-center">
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#6B7280"
                />
                <TextInput
                  placeholder="Re-enter your password"
                  placeholderTextColor="#4B5563"
                  className="flex-1 text-white text-base ml-3"
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    setErrorMsg("");
                  }}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  editable={!isDisabled}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm((v) => !v)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showConfirm ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
              {/* Match indicator */}
              {confirmPassword.length > 0 && (
                <View className="flex-row items-center mt-2 ml-1">
                  <Ionicons
                    name={
                      password === confirmPassword
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={16}
                    color={password === confirmPassword ? "#22C55E" : "#EF4444"}
                  />
                  <Text
                    className="ml-2 text-sm"
                    style={{
                      color:
                        password === confirmPassword ? "#22C55E" : "#EF4444",
                    }}
                  >
                    {password === confirmPassword
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </Text>
                </View>
              )}
            </View>

            {/* Sign Up button */}
            <TouchableOpacity
              onPress={handleSignUp}
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
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <View className="flex-1 justify-end pb-10 items-center">
            <TouchableOpacity
              onPress={() => router.replace("/(auth)/login" as Href)}
              disabled={isDisabled}
            >
              <Text className="text-gray-400 text-base">
                Already have an account?{" "}
                <Text className="text-white font-semibold">Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
