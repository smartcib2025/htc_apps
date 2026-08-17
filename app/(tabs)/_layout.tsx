import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useRef } from "react";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useAppContext } from "@/lib/app-context";
import { useLanguage } from "@/lib/i18n";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { role, isSetup } = useAppContext();
  const { t } = useLanguage();
  const router = useRouter();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!isSetup && !hasNavigated.current) {
      hasNavigated.current = true;
      // Defer navigation to after mount
      const timer = setTimeout(() => {
        router.replace("/setup");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isSetup]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      {/* Home tab - visible for all roles */}
      <Tabs.Screen
        name="index"
        options={{
          title: role === "head_coach" || role === "admin" ? t("dashboard") : t("home"),
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name={role === "head_coach" || role === "admin" ? "grid.fill" : "house.fill"}
              color={color}
            />
          ),
        }}
      />

      {/* Progress tab - for players */}
      <Tabs.Screen
        name="progress"
        options={{
          title: t("progress"),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
          href: role === "player" ? "/progress" : null,
        }}
      />

      {/* Team tab - for coaches */}
      <Tabs.Screen
        name="team"
        options={{
          title: t("team"),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
          href: role === "coach" || role === "head_coach" || role === "admin" ? "/team" : null,
        }}
      />

      {/* Matches tab - for players */}
      <Tabs.Screen
        name="matches"
        options={{
          title: t("matches"),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="trophy.fill" color={color} />,
          href: role === "player" ? "/matches" : null,
        }}
      />

      {/* Reports tab */}
      <Tabs.Screen
        name="reports"
        options={{
          title: t("reports"),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="doc.text.fill" color={color} />,
        }}
      />

      {/* Profile / Settings tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile"),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
