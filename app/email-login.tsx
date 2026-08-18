import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useLanguage } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { ScreenContainer } from "@/components/screen-container";
import { useAppContext } from "@/lib/app-context";
import { trpc } from "@/lib/trpc";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type AuthMode = "login" | "register" | "forgot_password" | "reset_password";

export default function EmailLoginScreen() {
  const router = useRouter();
  const { loginWithAccount } = useAppContext();
  const { t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // tRPC mutations
  const loginMutation = trpc.emailAuth.loginWithEmail.useMutation();
  const registerMutation = trpc.emailAuth.registerWithEmail.useMutation();
  const forgotPasswordMutation = trpc.emailAuth.requestPasswordReset.useMutation();
  const resetPasswordMutation = trpc.emailAuth.resetPassword.useMutation();
  const verifyEmailMutation = trpc.emailAuth.verifyEmail.useMutation();

  const handleLogin = async () => {
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const result = await loginMutation.mutateAsync({
        email,
        password,
      });

      if (result.success) {
        // Check if 2FA is enabled
        if ((result as any).requires2FA && result.accountId) {
          // Redirect to 2FA verification
          router.replace({
            pathname: "/2fa-verify",
            params: {
              accountId: result.accountId.toString(),
              email: email,
            },
          });
        } else {
          if (result.account && result.sessionToken) {
            await loginWithAccount({ ...result.account, sessionToken: result.sessionToken });
          }
          setSuccess("Login successful!");
          // Navigate to home
          setTimeout(() => {
            router.replace("/(tabs)");
          }, 500);
        }
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError("");
    setSuccess("");

    if (!email || !password || !confirmPassword || !username) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await registerMutation.mutateAsync({
        email,
        password,
        confirmPassword,
        username,
        displayName: displayName || username,
        role: "player",
      });

      if (result.success) {
        setSuccess("Account created! Please check your email to verify.");
        setTimeout(() => {
          setMode("login");
          setEmail("");
          setPassword("");
          setConfirmPassword("");
          setUsername("");
          setDisplayName("");
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const result = await forgotPasswordMutation.mutateAsync({ email });

      if (result.success) {
        setSuccess("Reset link sent to your email!");
        setMode("reset_password");
      }
    } catch (err: any) {
      setError(err.message || "Failed to request password reset");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setSuccess("");

    if (!email || !resetToken || !newPassword || !confirmNewPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await resetPasswordMutation.mutateAsync({
        email,
        resetToken,
        newPassword,
        confirmPassword: confirmNewPassword,
      });

      if (result.success) {
        setSuccess("Password reset successful! Logging you in...");
        setTimeout(() => {
          setMode("login");
          setEmail("");
          setPassword("");
          setResetToken("");
          setNewPassword("");
          setConfirmNewPassword("");
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        {/* Header */}
        <View className="items-center mb-6 mt-2">
          <Image
            source={require("@/assets/images/icon.png")}
            style={{ width: 84, height: 84, borderRadius: 18, marginBottom: 12 }}
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-foreground mb-1">{t("emailLogin")}</Text>
          <Text className="text-sm text-muted text-center">{t("appName")}</Text>
          <View className="mt-4">
            <LanguageSelector compact />
          </View>
        </View>

        {/* Mode Tabs */}
        <View className="flex-row gap-2 mb-6">
          <Pressable
            onPress={() => {
              setMode("login");
              setError("");
              setSuccess("");
            }}
            className={`flex-1 py-3 px-4 rounded-lg ${mode === "login" ? "bg-primary" : "bg-surface border border-border"}`}
          >
            <Text
              className={`text-center font-semibold ${mode === "login" ? "text-background" : "text-foreground"}`}
            >
              {t("login")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setMode("register");
              setError("");
              setSuccess("");
            }}
            className={`flex-1 py-3 px-4 rounded-lg ${mode === "register" ? "bg-primary" : "bg-surface border border-border"}`}
          >
            <Text
              className={`text-center font-semibold ${mode === "register" ? "text-background" : "text-foreground"}`}
            >
              {t("register")}
            </Text>
          </Pressable>
        </View>

        {/* Error Message */}
        {error && (
          <View className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <Text className="text-red-600 text-sm font-semibold">{error}</Text>
          </View>
        )}

        {/* Success Message */}
        {success && (
          <View className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <Text className="text-green-600 text-sm font-semibold">{success}</Text>
          </View>
        )}

        {/* Login Form */}
        {mode === "login" && (
          <View>
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Email</Text>
              <TextInput
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholderTextColor="#999"
                editable={!loading}
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">Password</Text>
              <View className="flex-row items-center bg-surface border border-border rounded-lg px-4 py-3">
                <TextInput
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  className="flex-1 text-foreground"
                  placeholderTextColor="#999"
                  editable={!loading}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <MaterialIcons
                    name={showPassword ? "visibility" : "visibility-off"}
                    size={20}
                    color="#999"
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              className={`py-3 px-4 rounded-lg items-center justify-center ${
                loading ? "bg-primary/50" : "bg-primary"
              } mb-4`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-background font-semibold">Login</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setMode("forgot_password");
                setError("");
                setSuccess("");
              }}
              className="py-2"
            >
              <Text className="text-primary text-sm text-center font-semibold">Forgot Password?</Text>
            </Pressable>
          </View>
        )}

        {/* Register Form */}
        {mode === "register" && (
          <View>
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Email</Text>
              <TextInput
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholderTextColor="#999"
                editable={!loading}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Username</Text>
              <TextInput
                placeholder="username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholderTextColor="#999"
                editable={!loading}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Display Name (Optional)</Text>
              <TextInput
                placeholder="Your Name"
                value={displayName}
                onChangeText={setDisplayName}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholderTextColor="#999"
                editable={!loading}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Password</Text>
              <View className="flex-row items-center bg-surface border border-border rounded-lg px-4 py-3">
                <TextInput
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  className="flex-1 text-foreground"
                  placeholderTextColor="#999"
                  editable={!loading}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <MaterialIcons
                    name={showPassword ? "visibility" : "visibility-off"}
                    size={20}
                    color="#999"
                  />
                </Pressable>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">Confirm Password</Text>
              <TextInput
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholderTextColor="#999"
                editable={!loading}
              />
            </View>

            <Pressable
              onPress={handleRegister}
              disabled={loading}
              className={`py-3 px-4 rounded-lg items-center justify-center ${
                loading ? "bg-primary/50" : "bg-primary"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-background font-semibold">Create Account</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* Forgot Password Form */}
        {mode === "forgot_password" && (
          <View>
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Email</Text>
              <TextInput
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholderTextColor="#999"
                editable={!loading}
              />
            </View>

            <Pressable
              onPress={handleForgotPassword}
              disabled={loading}
              className={`py-3 px-4 rounded-lg items-center justify-center ${
                loading ? "bg-primary/50" : "bg-primary"
              } mb-4`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-background font-semibold">Send Reset Link</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
              className="py-2"
            >
              <Text className="text-primary text-sm text-center font-semibold">Back to Login</Text>
            </Pressable>
          </View>
        )}

        {/* Reset Password Form */}
        {mode === "reset_password" && (
          <View>
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Email</Text>
              <TextInput
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholderTextColor="#999"
                editable={!loading}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Reset Token</Text>
              <TextInput
                placeholder="Token from email"
                value={resetToken}
                onChangeText={setResetToken}
                autoCapitalize="none"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholderTextColor="#999"
                editable={!loading}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">New Password</Text>
              <TextInput
                placeholder="••••••••"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholderTextColor="#999"
                editable={!loading}
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">Confirm Password</Text>
              <TextInput
                placeholder="••••••••"
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry={!showPassword}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholderTextColor="#999"
                editable={!loading}
              />
            </View>

            <Pressable
              onPress={handleResetPassword}
              disabled={loading}
              className={`py-3 px-4 rounded-lg items-center justify-center ${
                loading ? "bg-primary/50" : "bg-primary"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-background font-semibold">Reset Password</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* Back Button */}
        <Pressable
          onPress={() => router.back()}
          className="mt-8 py-3 items-center"
        >
          <Text className="text-primary text-sm font-semibold">← Back</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
