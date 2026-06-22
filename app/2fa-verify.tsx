import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";


export default function TwoFAVerifyScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams();

  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);

  const verifyMutation = trpc.twoFA.verifyCode.useMutation();

  const accountId = params.accountId ? parseInt(params.accountId as string) : undefined;
  const email = params.email as string | undefined;

  if (!accountId || !email) {
    return (
      <ScreenContainer className="p-6 items-center justify-center">
        <Text className="text-error">Invalid verification session</Text>
        <TouchableOpacity
          className="mt-4 bg-primary rounded-lg px-6 py-3"
          onPress={() => router.replace("/login")}
        >
          <Text className="text-white font-semibold">Back to Login</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      setError(useBackupCode ? "Please enter a backup code" : "Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyMutation.mutateAsync({
        accountId,
        email,
        code: verificationCode,
      });

      if (result.success) {
        // 2FA verified successfully - redirect to home
        Alert.alert("Success", "Two-Factor Authentication verified!", [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)"),
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 justify-center px-6">
            {/* Header */}
            <View className="items-center mb-10">
              <View className="w-20 h-20 rounded-2xl items-center justify-center mb-4" style={{ backgroundColor: colors.primary }}>
                <Text className="text-4xl">🔐</Text>
              </View>
              <Text className="text-3xl font-bold text-foreground">Two-Factor Authentication</Text>
              <Text className="text-base text-muted mt-2 text-center">
                {useBackupCode ? "Enter a backup code" : "Enter the code from your authenticator app"}
              </Text>
            </View>

            {/* Verification Form */}
            <View className="bg-surface rounded-2xl p-6 border border-border mb-6">
              {error && (
                <View className="bg-error/10 rounded-lg p-3 mb-4">
                  <Text className="text-error text-sm">{error}</Text>
                </View>
              )}

              <Text className="text-sm text-muted mb-2">
                {useBackupCode ? "Backup Code" : "Verification Code"}
              </Text>

              <TextInput
                className="bg-background border border-border rounded-lg px-4 py-3 text-foreground text-center text-2xl font-mono mb-6"
                placeholder={useBackupCode ? "XXXXXXXX" : "000000"}
                placeholderTextColor={colors.muted}
                value={verificationCode}
                onChangeText={setVerificationCode}
                maxLength={useBackupCode ? 8 : 6}
                keyboardType={useBackupCode ? "default" : "number-pad"}
                autoCapitalize={useBackupCode ? "characters" : "none"}
                editable={!loading}
              />

              <TouchableOpacity
                className="bg-primary rounded-lg py-3 items-center active:opacity-80 mb-3"
                onPress={handleVerify}
                disabled={loading || verificationCode.length < (useBackupCode ? 8 : 6)}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Verify</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="items-center py-2"
                onPress={() => {
                  setUseBackupCode(!useBackupCode);
                  setVerificationCode("");
                  setError("");
                }}
              >
                <Text className="text-primary text-sm">
                  {useBackupCode ? "Use authenticator code instead" : "Use backup code instead"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Help Text */}
            <View className="bg-surface/50 rounded-xl p-4 border border-border">
              <Text className="text-xs text-muted font-medium mb-2">💡 Tips:</Text>
              <Text className="text-xs text-muted">
                • Enter the 6-digit code from your authenticator app{"\n"}
                • Codes refresh every 30 seconds{"\n"}
                • If you lost your device, use a backup code
              </Text>
            </View>

            {/* Back to Login */}
            <TouchableOpacity
              className="mt-6 items-center active:opacity-60"
              onPress={() => router.replace("/login")}
            >
              <Text className="text-muted text-sm">Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
