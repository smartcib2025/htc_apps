import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function TwoFASetupScreen() {
  const router = useRouter();
  const colors = useColors();
  const [step, setStep] = useState<"init" | "qrcode" | "verify" | "backup">("init");
  const [secret, setSecret] = useState("");
  const [qrCodeUri, setQrCodeUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verifyMutation = trpc.twoFA.verifyAndEnable.useMutation();
  const { data: setupData, isLoading: isInitializing } = trpc.twoFA.initializeSetup.useQuery();

  // Initialize 2FA setup
  useEffect(() => {
    if (setupData) {
      setSecret(setupData.secret);
      setQrCodeUri(setupData.qrCodeUri);
      setBackupCodes(setupData.backupCodes);
      setStep("qrcode");
    }
  }, [setupData]);

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await verifyMutation.mutateAsync({
        totpCode: verificationCode,
      });

      setStep("backup");
    } catch (err: any) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join("\n");
    // In a real app, use Clipboard API
    Alert.alert("Backup Codes", `Save these codes:\n\n${codesText}`);
  };

  const handleComplete = () => {
    Alert.alert("Success", "Two-Factor Authentication has been enabled!", [
      {
        text: "OK",
        onPress: () => router.replace("/(tabs)/profile"),
      },
    ]);
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-foreground mb-2">🔐 Two-Factor Authentication</Text>
          <Text className="text-base text-muted">
            {step === "init" && "Initializing setup..."}
            {step === "qrcode" && "Scan QR code with your authenticator app"}
            {step === "verify" && "Enter the 6-digit code from your authenticator"}
            {step === "backup" && "Save your backup codes"}
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View className="bg-error/10 rounded-lg p-4 mb-6">
            <Text className="text-error text-sm">{error}</Text>
          </View>
        )}

        {/* Step 1: QR Code */}
        {step === "qrcode" && (
          <View className="bg-surface rounded-2xl p-6 border border-border mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">Step 1: Scan QR Code</Text>

            {/* QR Code Placeholder */}
            <View className="w-full aspect-square bg-background rounded-lg border-2 border-border items-center justify-center mb-6">
              <Text className="text-muted text-center">
                {isInitializing ? "Loading QR Code..." : "QR Code\n(Use authenticator app)"}
              </Text>
            </View>

            <Text className="text-sm text-muted mb-4">
              Use an authenticator app like Google Authenticator, Microsoft Authenticator, or Authy to scan this QR code.
            </Text>

            {/* Manual Entry */}
            <View className="bg-background rounded-lg p-4 mb-6">
              <Text className="text-xs text-muted font-medium mb-2">Or enter manually:</Text>
              <Text className="font-mono text-sm text-foreground break-all">{secret}</Text>
            </View>

            <TouchableOpacity
              className="bg-primary rounded-lg py-3 items-center active:opacity-80"
              onPress={() => setStep("verify")}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Next: Verify Code</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Verify Code */}
        {step === "verify" && (
          <View className="bg-surface rounded-2xl p-6 border border-border mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">Step 2: Verify Code</Text>

            <Text className="text-sm text-muted mb-4">
              Enter the 6-digit code from your authenticator app to verify the setup.
            </Text>

            <TextInput
              className="bg-background border border-border rounded-lg px-4 py-3 text-foreground text-center text-2xl font-mono mb-6"
              placeholder="000000"
              placeholderTextColor={colors.muted}
              value={verificationCode}
              onChangeText={setVerificationCode}
              maxLength={6}
              keyboardType="number-pad"
              editable={!loading}
            />

            <TouchableOpacity
              className="bg-primary rounded-lg py-3 items-center active:opacity-80 mb-3"
              onPress={handleVerifyCode}
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Verify & Enable 2FA</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-surface border border-border rounded-lg py-3 items-center active:opacity-80"
              onPress={() => setStep("qrcode")}
              disabled={loading}
            >
              <Text className="text-foreground font-semibold">Back to QR Code</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Backup Codes */}
        {step === "backup" && (
          <View className="bg-surface rounded-2xl p-6 border border-border mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">Step 3: Save Backup Codes</Text>

            <Text className="text-sm text-muted mb-4">
              Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
            </Text>

            {/* Backup Codes */}
            <View className="bg-background rounded-lg p-4 mb-6">
              {backupCodes.map((code, index) => (
                <Text key={index} className="font-mono text-sm text-foreground mb-2">
                  {index + 1}. {code}
                </Text>
              ))}
            </View>

            <Text className="text-xs text-warning bg-warning/10 rounded-lg p-3 mb-6">
              ⚠️ Each backup code can only be used once. Keep them safe and don't share them with anyone.
            </Text>

            <TouchableOpacity
              className="bg-surface border border-border rounded-lg py-3 items-center active:opacity-80 mb-3"
              onPress={handleCopyBackupCodes}
            >
              <Text className="text-foreground font-semibold">📋 Copy Codes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-primary rounded-lg py-3 items-center active:opacity-80"
              onPress={handleComplete}
            >
              <Text className="text-white font-semibold">✓ Complete Setup</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading State */}
        {loading && step === "init" && (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-muted mt-4">Initializing 2FA setup...</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
