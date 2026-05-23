import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, Switch, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function IntegrationSettings() {
  const colors = useColors();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const result = await (trpc.integration.settings as any)({ academyId: 1 });
      setSettings(result || {
        googleCalendarEnabled: false,
        lineNotificationsEnabled: false,
        paymentGatewayEnabled: false,
        paymentProvider: "stripe",
      });
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string, value: boolean) => {
    setSaving(true);
    try {
      const updated = { ...settings, [key]: value, academyId: 1 };
      await (trpc.integration.updateSettings as any)(updated);
      setSettings(updated);
    } catch (error) {
      console.error("Error updating settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const renderToggleSetting = (label: string, description: string, key: string, value: boolean) => (
    <View className="bg-surface rounded-lg p-4 border border-border mb-3 flex-row justify-between items-center">
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
        <Text className="text-xs text-muted mt-1">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => handleToggle(key, v)}
        disabled={saving}
        trackColor={{ false: colors.border, true: colors.primary }}
      />
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Integration Settings</Text>
            <Text className="text-sm text-muted">Connect external services and platforms</Text>
          </View>

          {/* Google Calendar */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">📅 Google Calendar</Text>
            {renderToggleSetting(
              "Google Calendar Integration",
              "Sync training schedule and matches with Google Calendar",
              "googleCalendarEnabled",
              settings?.googleCalendarEnabled || false
            )}
            {settings?.googleCalendarEnabled && (
              <TouchableOpacity className="bg-surface border border-border px-4 py-3 rounded-lg">
                <Text className="text-sm text-primary font-semibold">Configure Google Calendar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Line Notifications */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">💬 Line Notifications</Text>
            {renderToggleSetting(
              "Line Notifications",
              "Send training reminders and alerts via Line",
              "lineNotificationsEnabled",
              settings?.lineNotificationsEnabled || false
            )}
            {settings?.lineNotificationsEnabled && (
              <TouchableOpacity className="bg-surface border border-border px-4 py-3 rounded-lg">
                <Text className="text-sm text-primary font-semibold">Configure Line Bot</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Payment Gateway */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">💳 Payment Gateway</Text>
            {renderToggleSetting(
              "Payment Processing",
              "Enable online payment for coach compensation",
              "paymentGatewayEnabled",
              settings?.paymentGatewayEnabled || false
            )}
            {settings?.paymentGatewayEnabled && (
              <View className="gap-2">
                <View className="bg-surface rounded-lg p-4 border border-border">
                  <Text className="text-xs text-muted mb-2">Payment Provider</Text>
                  <View className="flex-row gap-2">
                    {["stripe", "omise", "paypal"].map((provider) => (
                      <TouchableOpacity
                        key={provider}
                        onPress={() => handleToggle("paymentProvider", true)}
                        className={`flex-1 px-3 py-2 rounded ${
                          settings?.paymentProvider === provider
                            ? "bg-primary"
                            : "bg-background border border-border"
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold text-center capitalize ${
                            settings?.paymentProvider === provider
                              ? "text-background"
                              : "text-foreground"
                          }`}
                        >
                          {provider}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <TouchableOpacity className="bg-surface border border-border px-4 py-3 rounded-lg">
                  <Text className="text-sm text-primary font-semibold">Configure Payment Keys</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Status */}
          <View className="gap-2 mt-4">
            <Text className="text-sm font-semibold text-foreground">Integration Status</Text>
            <View className="bg-surface rounded-lg p-4 border border-border gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">Google Calendar</Text>
                <View className={`px-2 py-1 rounded ${settings?.googleCalendarEnabled ? "bg-success" : "bg-border"}`}>
                  <Text className={`text-xs font-semibold ${settings?.googleCalendarEnabled ? "text-background" : "text-muted"}`}>
                    {settings?.googleCalendarEnabled ? "Connected" : "Disabled"}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">Line Notifications</Text>
                <View className={`px-2 py-1 rounded ${settings?.lineNotificationsEnabled ? "bg-success" : "bg-border"}`}>
                  <Text className={`text-xs font-semibold ${settings?.lineNotificationsEnabled ? "text-background" : "text-muted"}`}>
                    {settings?.lineNotificationsEnabled ? "Connected" : "Disabled"}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">Payment Gateway</Text>
                <View className={`px-2 py-1 rounded ${settings?.paymentGatewayEnabled ? "bg-success" : "bg-border"}`}>
                  <Text className={`text-xs font-semibold ${settings?.paymentGatewayEnabled ? "text-background" : "text-muted"}`}>
                    {settings?.paymentGatewayEnabled ? "Enabled" : "Disabled"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Help */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-xs font-semibold text-foreground mb-2">💡 Need Help?</Text>
            <Text className="text-xs text-muted">
              Contact support at support@hanumantennisacademy.com for assistance with integration setup.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
