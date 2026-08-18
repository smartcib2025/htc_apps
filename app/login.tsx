import { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useLanguage } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { ScreenContainer } from "@/components/screen-container";
import { useAppContext } from "@/lib/app-context";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { loginWithAccount } = useAppContext();
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = trpc.accounts.login.useMutation();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await loginMutation.mutateAsync({ username: username.trim(), password });
      if (result.success && result.account) {
        await loginWithAccount({ ...result.account, sessionToken: result.sessionToken });
        router.replace("/(tabs)");
      } else {
        setError(result.error || "เข้าสู่ระบบไม่สำเร็จ");
      }
    } catch (e: any) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    router.replace("/setup");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 justify-center px-6">
            {/* Logo & Title */}
            <View className="items-center mb-10">
              <Image
                source={require("@/assets/images/icon.png")}
                className="w-24 h-24 rounded-2xl mb-4"
                style={{ width: 96, height: 96, borderRadius: 20 }}
                resizeMode="contain"
              />
              <Text className="text-3xl font-bold text-foreground">{t("appName")}</Text>
              <Text className="text-base text-muted mt-1">{t("academyManagement")}</Text>
              <View className="mt-4">
                <LanguageSelector compact />
              </View>
            </View>

            {/* Login Form */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-4">{t("login")}</Text>

              {error ? (
                <View className="bg-error/10 rounded-lg p-3 mb-4">
                  <Text className="text-error text-sm">{error}</Text>
                </View>
              ) : null}

              <Text className="text-sm text-muted mb-1">ชื่อผู้ใช้</Text>
              <TextInput
                className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-4"
                placeholder={t("username")}
                placeholderTextColor={colors.muted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />

              <Text className="text-sm text-muted mb-1">รหัสผ่าน</Text>
              <TextInput
                className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-6"
                placeholder="กรอกรหัสผ่าน"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <TouchableOpacity
                className="rounded-lg py-3.5 items-center active:opacity-80"
                style={{ backgroundColor: colors.primary }}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">เข้าสู่ระบบ</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Email Login & Demo Mode */}
            <View className="mt-6 gap-3">
              <TouchableOpacity 
                className="items-center active:opacity-60 py-2" 
                onPress={() => router.push("/email-login")}
              >
                <Text className="text-muted text-sm">หรือ</Text>
                <Text className="text-primary font-medium mt-1">📧 เข้าสู่ระบบด้วย Email</Text>
              </TouchableOpacity>
              
              <TouchableOpacity className="items-center active:opacity-60 py-2" onPress={handleDemoMode}>
                <Text className="text-muted text-sm">หรือ</Text>
                <Text className="text-primary font-medium mt-1">ใช้งานแบบทดลอง (Demo Mode)</Text>
              </TouchableOpacity>
            </View>

            {/* Demo Accounts Info */}
            <View className="mt-6 bg-surface/50 rounded-xl p-4 border border-border">
              <Text className="text-xs text-muted font-medium mb-2">บัญชีทดสอบ:</Text>
              <Text className="text-xs text-muted">Admin: admin / admin123</Text>
              <Text className="text-xs text-muted">Head Coach: headcoach / coach123</Text>
              <Text className="text-xs text-muted">Coach: coach1 / coach123</Text>
              <Text className="text-xs text-muted">Player: player1 / player123</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
