import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_PREF_KEY = "hanuman_notification_prefs";

// Configure notification handler for foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPrefs {
  dailyCheckinReminder: boolean;
  checkinReminderHour: number;
  checkinReminderMinute: number;
  riskAlerts: boolean;
  evaluationAlerts: boolean;
  matchReminders: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  dailyCheckinReminder: true,
  checkinReminderHour: 7,
  checkinReminderMinute: 0,
  riskAlerts: true,
  evaluationAlerts: true,
  matchReminders: true,
};

// ============ PERMISSION ============
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("checkin-reminder", {
      name: "เช็คอินรายวัน",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1B5E20",
    });
    await Notifications.setNotificationChannelAsync("risk-alert", {
      name: "แจ้งเตือน Risk Level",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: "#C62828",
    });
    await Notifications.setNotificationChannelAsync("general", {
      name: "ทั่วไป",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === "granted";
}

// ============ PREFERENCES ============
export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_PREF_KEY);
    if (stored) return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_PREFS;
}

export async function saveNotificationPrefs(prefs: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
  const current = await getNotificationPrefs();
  const updated = { ...current, ...prefs };
  await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, JSON.stringify(updated));
  return updated;
}

// ============ DAILY CHECK-IN REMINDER ============
export async function scheduleDailyCheckinReminder(hour = 7, minute = 0) {
  if (Platform.OS === "web") return;

  // Cancel existing reminders first
  await cancelDailyCheckinReminder();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "เช็คอินประจำวัน 🎾",
      body: "อย่าลืมเช็คอินก่อนเริ่มฝึกซ้อมวันนี้!",
      data: { type: "checkin_reminder" },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
      ...(Platform.OS === "android" ? { channelId: "checkin-reminder" } : {}),
    } as any,
    identifier: "daily-checkin-reminder",
  });
}

export async function cancelDailyCheckinReminder() {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync("daily-checkin-reminder");
}

// ============ RISK ALERT (LOCAL) ============
export async function sendRiskAlert(playerName: string, riskLevel: string) {
  if (Platform.OS === "web") return;

  const riskLabels: Record<string, string> = {
    high: "สูง 🔴",
    medium: "ปานกลาง 🟡",
    low: "ต่ำ 🟢",
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `แจ้งเตือน Risk Level: ${riskLabels[riskLevel] || riskLevel}`,
      body: `นักกีฬา ${playerName} มีระดับความเสี่ยง${riskLabels[riskLevel] || riskLevel} กรุณาตรวจสอบ`,
      data: { type: "risk_alert", playerName, riskLevel },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      ...(Platform.OS === "android" ? { channelId: "risk-alert" } : {}),
    } as any,
  });
}

// ============ EVALUATION NOTIFICATION ============
export async function sendEvaluationNotification(playerName: string, coachName: string) {
  if (Platform.OS === "web") return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "มีการประเมินใหม่ 📋",
      body: `โค้ช ${coachName} ได้ประเมิน ${playerName} แล้ว`,
      data: { type: "evaluation", playerName, coachName },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      ...(Platform.OS === "android" ? { channelId: "general" } : {}),
    } as any,
  });
}

// ============ MATCH REMINDER ============
export async function sendMatchReminder(opponent: string, tournament: string, matchDate: string) {
  if (Platform.OS === "web") return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "แข่งขันเร็วๆ นี้ 🏆",
      body: `vs ${opponent} | ${tournament} | ${matchDate}`,
      data: { type: "match_reminder", opponent, tournament, matchDate },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      ...(Platform.OS === "android" ? { channelId: "general" } : {}),
    } as any,
  });
}

// ============ SETUP ON APP LAUNCH ============
export async function setupNotifications() {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const prefs = await getNotificationPrefs();
  if (prefs.dailyCheckinReminder) {
    await scheduleDailyCheckinReminder(prefs.checkinReminderHour, prefs.checkinReminderMinute);
  }
}

// ============ NOTIFICATION LISTENERS ============
export function addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
