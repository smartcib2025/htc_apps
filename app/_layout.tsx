import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { AppProvider } from "@/lib/app-context";
import { setupNotifications, addNotificationResponseListener } from "@/lib/notifications";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  // Setup push notifications on app launch
  useEffect(() => {
    setupNotifications();
    const sub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      console.log("Notification tapped:", data);
    });
    return () => sub.remove();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {/* Default to hiding native headers so raw route segments don't appear (e.g. "(tabs)", "products/[id]"). */}
          {/* If a screen needs the native header, explicitly enable it and set a human title via Stack.Screen options. */}
          {/* in order for ios apps tab switching to work properly, use presentation: "fullScreenModal" for login page, whenever you decide to use presentation: "modal*/}
          <AppProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="setup" options={{ presentation: "fullScreenModal" }} />
              <Stack.Screen name="checkin" options={{ presentation: "modal", headerShown: true, headerTitle: "เช็คอิน" }} />
              <Stack.Screen name="evaluate" options={{ presentation: "modal", headerShown: true, headerTitle: "ประเมินนักกีฬา" }} />
              <Stack.Screen name="player-detail" options={{ headerShown: true, headerTitle: "รายละเอียดนักกีฬา" }} />
              <Stack.Screen name="add-match" options={{ presentation: "modal", headerShown: true, headerTitle: "บันทึกผลแข่งขัน" }} />
              <Stack.Screen name="add-note" options={{ presentation: "modal", headerShown: true, headerTitle: "บันทึกโน้ต" }} />
              <Stack.Screen name="report-detail" options={{ headerShown: true, headerTitle: "รายงาน" }} />
              <Stack.Screen name="admin-users" options={{ headerShown: true, headerTitle: "จัดการผู้ใช้" }} />
              <Stack.Screen name="admin-settings" options={{ headerShown: true, headerTitle: "ตั้งค่าสถาบัน" }} />
              <Stack.Screen name="notification-settings" options={{ headerShown: true, headerTitle: "การแจ้งเตือน" }} />
              <Stack.Screen name="login" options={{ presentation: "fullScreenModal" }} />
              <Stack.Screen name="audit-logs" options={{ headerShown: false }} />
              <Stack.Screen name="export-report" options={{ headerShown: false }} />
              <Stack.Screen name="calendar-view" options={{ headerShown: false }} />
              <Stack.Screen name="awards" options={{ headerShown: false }} />
              <Stack.Screen name="coaching-sessions" options={{ headerShown: false }} />
              <Stack.Screen name="advanced-search" options={{ headerShown: true, headerTitle: "ค้นหาขั้นสูง" }} />
              <Stack.Screen name="notifications-dashboard" options={{ headerShown: true, headerTitle: "การแจ้งเตือน" }} />
              <Stack.Screen name="oauth/callback" />
            </Stack>
          </AppProvider>
          <StatusBar style="auto" />
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}
