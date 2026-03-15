import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import {
  db,
  removeAvatarFile,
  uploadAvatarFile,
} from "../../services/supabase";

type ProfileRecord = {
  username: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

const EMPTY_PROFILE: ProfileRecord = {
  username: null,
  avatar_url: null,
  updated_at: null,
};

const USERNAME_RE = /^[A-Za-z0-9_]+$/;

function friendlyProfileError(error: unknown): string {
  if (typeof error !== "object" || error === null || !("message" in error)) {
    return "Something went wrong. Please try again.";
  }

  const message = String(error.message ?? "");
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("duplicate key value") &&
    lowerMessage.includes("username")
  ) {
    return "That username is already taken. Try another one.";
  }

  if (
    lowerMessage.includes("schema cache") &&
    lowerMessage.includes("public.profiles")
  ) {
    return "Profiles table is missing in Supabase. Run supabase/schema.sql in SQL Editor for the same project.";
  }

  if (lowerMessage.includes('relation "public.profiles" does not exist')) {
    return "Profiles table is missing in Supabase. Run supabase/schema.sql in SQL Editor for the same project.";
  }

  if (
    lowerMessage.includes(
      "json object requested, multiple (or no) rows returned",
    )
  ) {
    return "Your profile record is missing. Run the latest Supabase schema and try again.";
  }

  return message || "Something went wrong. Please try again.";
}

function formatMemberSince(createdAt?: string) {
  if (!createdAt) return "Recently joined";

  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime())) return "Recently joined";

  return `Member since ${parsedDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  })}`;
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  const [profile, setProfile] = useState<ProfileRecord>(EMPTY_PROFILE);
  const [draftUsername, setDraftUsername] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const displayName = profile.username?.trim() || "User";
  const memberSince = formatMemberSince(user?.created_at);
  const isBusy = savingProfile || updatingAvatar || signingOut;

  const createMissingProfile = useCallback(async (): Promise<ProfileRecord> => {
    if (!user?.id) return EMPTY_PROFILE;

    const { data, error } = await db
      .from("profiles")
      .upsert(
        {
          id: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      )
      .select("username, avatar_url, updated_at")
      .maybeSingle();

    if (error) throw error;
    return data ?? EMPTY_PROFILE;
  }, [user?.id]);

  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(EMPTY_PROFILE);
      setDraftUsername("");
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    setErrorMsg("");

    try {
      const { data, error } = await db
        .from("profiles")
        .select("username, avatar_url, updated_at")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const createdProfile = await createMissingProfile();
        setProfile(createdProfile);
        setDraftUsername(createdProfile.username ?? "");
        return;
      }

      const nextProfile = data;
      setProfile(nextProfile);
      setDraftUsername(nextProfile.username ?? "");
    } catch (error) {
      setErrorMsg(friendlyProfileError(error));
      setProfile(EMPTY_PROFILE);
      setDraftUsername("");
    } finally {
      setLoadingProfile(false);
    }
  }, [createMissingProfile, user?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleStartEditing = useCallback(() => {
    setDraftUsername(profile.username ?? "");
    setSuccessMsg("");
    setErrorMsg("");
    setEditing(true);
  }, [profile.username]);

  const handleCancelEditing = useCallback(() => {
    setDraftUsername(profile.username ?? "");
    setSuccessMsg("");
    setErrorMsg("");
    setEditing(false);
  }, [profile.username]);

  const validateUsername = useCallback(() => {
    const trimmedUsername = draftUsername.trim();

    if (!trimmedUsername) {
      setErrorMsg("Please enter a username.");
      return null;
    }

    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      setErrorMsg("Username must be between 3 and 20 characters.");
      return null;
    }

    if (!USERNAME_RE.test(trimmedUsername)) {
      setErrorMsg(
        "Username can only include letters, numbers, and underscores.",
      );
      return null;
    }

    return trimmedUsername;
  }, [draftUsername]);

  const saveProfileChanges = useCallback(
    async (updates: Partial<ProfileRecord>) => {
      if (!user?.id) {
        throw new Error("You need to be signed in to update your profile.");
      }

      const { data, error } = await db
        .from("profiles")
        .upsert(
          {
            id: user.id,
            ...updates,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        .select("username, avatar_url, updated_at")
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error(
          "Your profile record is missing. Run the latest Supabase schema and try again.",
        );
      }

      setProfile(data);
      setDraftUsername(data.username ?? "");
      return data;
    },
    [user?.id],
  );

  const handleSaveProfile = useCallback(async () => {
    const trimmedUsername = validateUsername();
    if (!trimmedUsername) return;

    setSavingProfile(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await saveProfileChanges({ username: trimmedUsername });
      setEditing(false);
      setSuccessMsg("Profile updated successfully.");
    } catch (error) {
      setErrorMsg(friendlyProfileError(error));
    } finally {
      setSavingProfile(false);
    }
  }, [saveProfileChanges, validateUsername]);

  const handlePickAvatar = useCallback(async () => {
    if (!user?.id) {
      setErrorMsg("You need to be signed in to update your avatar.");
      return;
    }

    setUpdatingAvatar(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setErrorMsg("Allow photo library access to choose an avatar.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const avatarUrl = await uploadAvatarFile({
        userId: user.id,
        fileUri: asset.uri,
        contentType: asset.mimeType,
      });

      await saveProfileChanges({ avatar_url: avatarUrl });
      setSuccessMsg("Avatar updated successfully.");
    } catch (error) {
      setErrorMsg(friendlyProfileError(error));
    } finally {
      setUpdatingAvatar(false);
    }
  }, [saveProfileChanges, user?.id]);

  const handleRemoveAvatar = useCallback(async () => {
    if (!user?.id) {
      setErrorMsg("You need to be signed in to remove your avatar.");
      return;
    }

    setUpdatingAvatar(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await removeAvatarFile(user.id);
      await saveProfileChanges({ avatar_url: null });
      setSuccessMsg("Avatar removed.");
    } catch (error) {
      setErrorMsg(friendlyProfileError(error));
    } finally {
      setUpdatingAvatar(false);
    }
  }, [saveProfileChanges, user?.id]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await signOut();
      if (error) setErrorMsg(friendlyAuthError(error));
    } catch {
      setErrorMsg("Network error. Please check your connection.");
    } finally {
      setSigningOut(false);
    }
  }, [signOut]);

  const canSave =
    !savingProfile &&
    draftUsername.trim() !== "" &&
    draftUsername.trim() !== (profile.username ?? "").trim();

  return (
    <View className="flex-1 bg-[#0F1528]">
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 pt-16">
            <Text className="text-white text-3xl font-bold mt-6">Profile</Text>
            <Text className="text-gray-400 text-base mt-2">
              Manage your account details and stay ready for the next watchlist.
            </Text>
          </View>

          <View className="px-6 pt-6">
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

            {successMsg !== "" && (
              <View className="bg-emerald-900/30 border border-emerald-700 rounded-xl px-4 py-3 mb-4 flex-row items-center">
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#6EE7B7"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-emerald-200 text-sm flex-1">
                  {successMsg}
                </Text>
              </View>
            )}
          </View>

          {loadingProfile ? (
            <View className="px-6 pt-10 items-center justify-center">
              <ActivityIndicator size="large" color="#E50914" />
              <Text className="text-gray-400 text-base mt-4">
                Loading your profile...
              </Text>
            </View>
          ) : (
            <>
              <View
                className="mx-6 mt-2 rounded-[28px] px-6 pt-8 pb-7"
                style={{
                  backgroundColor: "#131A33",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.22,
                  shadowRadius: 24,
                  elevation: 8,
                }}
              >
                <View className="items-center">
                  <View className="w-32 h-32 rounded-full bg-[#1A1F3A] border border-[#2A3358] items-center justify-center overflow-hidden">
                    {profile.avatar_url ? (
                      <Image
                        source={{ uri: profile.avatar_url }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons
                        name="person-circle-outline"
                        size={86}
                        color="#9CA3AF"
                      />
                    )}
                  </View>

                  <Text className="text-white text-2xl font-bold mt-5">
                    {displayName}
                  </Text>
                  <Text className="text-gray-400 text-base mt-2 text-center">
                    {user?.email ?? "No email available"}
                  </Text>
                  <View className="mt-4 px-4 py-2 rounded-full bg-[#1A1F3A] border border-[#2A3358]">
                    <Text className="text-gray-300 text-sm">{memberSince}</Text>
                  </View>
                </View>

                <View className="mt-7 bg-[#0F1528] rounded-2xl px-4 py-4 border border-[#20294B]">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-white text-lg font-semibold">
                      Profile Details
                    </Text>
                    {!editing && (
                      <TouchableOpacity
                        onPress={handleStartEditing}
                        disabled={isBusy}
                        className="px-4 py-2 rounded-full bg-[#1A1F3A]"
                      >
                        <Text className="text-white text-sm font-semibold">
                          Edit Profile
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {editing ? (
                    <>
                      <View className="mb-4">
                        <Text className="text-gray-400 text-sm mb-2 ml-1">
                          Username
                        </Text>
                        <View className="bg-[#1A1F3A] rounded-xl px-4 py-3.5 flex-row items-center">
                          <Ionicons
                            name="at-outline"
                            size={20}
                            color="#6B7280"
                          />
                          <TextInput
                            placeholder="Choose a username"
                            placeholderTextColor="#4B5563"
                            className="flex-1 text-white text-base ml-3"
                            value={draftUsername}
                            onChangeText={(value) => {
                              setDraftUsername(value);
                              setErrorMsg("");
                              setSuccessMsg("");
                            }}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!savingProfile}
                            maxLength={20}
                          />
                        </View>
                        <Text className="text-gray-500 text-sm mt-2 ml-1">
                          Use 3-20 characters with letters, numbers, or
                          underscores.
                        </Text>
                      </View>

                      <View className="mb-5">
                        <Text className="text-gray-400 text-sm mb-2 ml-1">
                          Avatar
                        </Text>
                        <View className="flex-row gap-3">
                          <TouchableOpacity
                            onPress={handlePickAvatar}
                            disabled={isBusy}
                            className="flex-1 rounded-xl py-3.5 px-4 bg-[#1A1F3A] flex-row items-center justify-center"
                          >
                            {updatingAvatar ? (
                              <ActivityIndicator color="#fff" />
                            ) : (
                              <>
                                <Ionicons
                                  name="image-outline"
                                  size={18}
                                  color="#fff"
                                  style={{ marginRight: 8 }}
                                />
                                <Text className="text-white text-sm font-semibold">
                                  {profile.avatar_url
                                    ? "Change Avatar"
                                    : "Upload Avatar"}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>

                          {profile.avatar_url && !updatingAvatar && (
                            <TouchableOpacity
                              onPress={handleRemoveAvatar}
                              disabled={isBusy}
                              className="rounded-xl py-3.5 px-4 bg-[#24121C] border border-[#5B2132] items-center justify-center"
                            >
                              <Text className="text-[#FCA5A5] text-sm font-semibold">
                                Remove
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text className="text-gray-500 text-sm mt-2 ml-1">
                          Choose a square photo for the cleanest result.
                        </Text>
                      </View>

                      <View className="flex-row gap-3">
                        <TouchableOpacity
                          onPress={handleCancelEditing}
                          disabled={isBusy}
                          className="flex-1 rounded-xl py-4 items-center bg-[#1A1F3A]"
                        >
                          <Text className="text-white text-base font-semibold">
                            Cancel
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={handleSaveProfile}
                          disabled={!canSave}
                          activeOpacity={0.85}
                          className="flex-1 rounded-xl py-4 items-center"
                          style={{
                            backgroundColor: canSave ? "#E50914" : "#7f1d1d",
                            shadowColor: "#E50914",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35,
                            shadowRadius: 10,
                            elevation: 6,
                          }}
                        >
                          {savingProfile ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text className="text-white text-base font-bold tracking-wide">
                              Save Changes
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <View className="gap-3">
                      <View className="bg-[#1A1F3A] rounded-xl px-4 py-4 flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1 pr-3">
                          <Ionicons
                            name="person-outline"
                            size={20}
                            color="#9CA3AF"
                          />
                          <View className="ml-3 flex-1">
                            <Text className="text-gray-400 text-sm">
                              Username
                            </Text>
                            <Text className="text-white text-base font-medium mt-1">
                              {displayName}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View className="bg-[#1A1F3A] rounded-xl px-4 py-4 flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1 pr-3">
                          <Ionicons
                            name="mail-outline"
                            size={20}
                            color="#9CA3AF"
                          />
                          <View className="ml-3 flex-1">
                            <Text className="text-gray-400 text-sm">Email</Text>
                            <Text className="text-white text-base font-medium mt-1">
                              {user?.email ?? "No email available"}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View className="bg-[#1A1F3A] rounded-xl px-4 py-4 flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1 pr-3">
                          <Ionicons
                            name="refresh-circle-outline"
                            size={20}
                            color="#9CA3AF"
                          />
                          <View className="ml-3 flex-1">
                            <Text className="text-gray-400 text-sm">
                              Last updated
                            </Text>
                            <Text className="text-white text-base font-medium mt-1">
                              {profile.updated_at
                                ? new Date(
                                    profile.updated_at,
                                  ).toLocaleDateString()
                                : "No changes yet"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              <View className="px-6 pt-6">
                <TouchableOpacity
                  onPress={handleSignOut}
                  disabled={isBusy}
                  activeOpacity={0.85}
                  className="rounded-xl py-4 items-center mb-6"
                  style={{
                    backgroundColor: isBusy ? "#341826" : "#24121C",
                    borderWidth: 1,
                    borderColor: "#5B2132",
                  }}
                >
                  {signingOut ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <Ionicons
                        name="log-out-outline"
                        size={20}
                        color="#FCA5A5"
                      />
                      <Text className="text-[#FCA5A5] text-base font-semibold">
                        Sign Out
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
