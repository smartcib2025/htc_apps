import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, StyleSheet, Switch, Alert, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getNotificationPrefs,
  saveNotificationPrefs,
  scheduleDailyCheckinReminder,
  cancelDailyCheckinReminder,
  requestNotificationPermission,
  type NotificationPrefs,
} from "@/lib/notifications";

function showMsg(title: string, msg: string) {
  Platform.OS === "web" ? alert(msg) : Alert.alert(title, msg);
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function NotificationSettingsScreen() {
  const colors = useColors();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [permGranted, setPermGranted] = useState(false);

  useEffect(() => {
    loadPrefs();
    checkPermission();
  }, []);

  const loadPrefs = async () => {
    const p = await getNotificationPrefs();
    setPrefs(p);
  };

  const checkPermission = async () => {
    if (Platform.OS === "web") return;
    const granted = await requestNotificationPermission();
    setPermGranted(granted);
  };

  const updatePref = async (key: keyof NotificationPrefs, value: any) => {
    if (!prefs) return;
    const updated = await saveNotificationPrefs({ [key]: value });
    setPrefs(updated);

    // Handle daily reminder toggle
    if (key === "dailyCheckinReminder") {
      if (value) {
        await scheduleDailyCheckinReminder(updated.checkinReminderHour, updated.checkinReminderMinute);
        showMsg("สำเร็จ", "เปิดการแจ้งเตือนเช็คอินรายวันแล้ว");
      } else {
        await cancelDailyCheckinReminder();
        showMsg("สำเร็จ", "ปิดการแจ้งเตือนเช็คอินรายวันแล้ว");
      }
    }

    // Handle time change
    if ((key === "checkinReminderHour" || key === "checkinReminderMinute") && updated.dailyCheckinReminder) {
      await scheduleDailyCheckinReminder(updated.checkinReminderHour, updated.checkinReminderMinute);
    }
  };

  if (!prefs) return null;

  return (
    <ScreenContainer edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Permission Status */}
        {Platform.OS !== "web" && !permGranted && (
          <View style={[styles.warningCard, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "30" }]}>
            <Text style={[styles.warningText, { color: colors.warning }]}>
              การแจ้งเตือนยังไม่ได้รับอนุญาต กรุณาเปิดในการตั้งค่าอุปกรณ์
            </Text>
            <TouchableOpacity
              style={[styles.permBtn, { backgroundColor: colors.warning }]}
              onPress={checkPermission}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>ขออนุญาตอีกครั้ง</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Daily Check-in Reminder */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>เช็คอินรายวัน</Text>
          <Text style={[styles.sectionDesc, { color: colors.muted }]}>
            แจ้งเตือนนักกีฬาให้เช็คอินก่อนเริ่มฝึกซ้อมทุกวัน
          </Text>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.foreground }]}>เปิดการแจ้งเตือน</Text>
            <Switch
              value={prefs.dailyCheckinReminder}
              onValueChange={(v) => updatePref("dailyCheckinReminder", v)}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={prefs.dailyCheckinReminder ? colors.primary : colors.muted}
            />
          </View>

          {prefs.dailyCheckinReminder && (
            <View style={styles.timeSelector}>
              <Text style={[styles.timeLabel, { color: colors.foreground }]}>เวลาแจ้งเตือน</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                {HOURS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.timeChip,
                      {
                        backgroundColor: prefs.checkinReminderHour === h ? colors.primary : colors.background,
                        borderColor: prefs.checkinReminderHour === h ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => updatePref("checkinReminderHour", h)}
                  >
                    <Text style={{ color: prefs.checkinReminderHour === h ? "#fff" : colors.foreground, fontSize: 13, fontWeight: "500" }}>
                      {String(h).padStart(2, "0")}:00
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Risk Alerts */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>แจ้งเตือน Risk Level</Text>
          <Text style={[styles.sectionDesc, { color: colors.muted }]}>
            แจ้งเตือนโค้ชเมื่อนักกีฬามี Risk Level สูง (บาดเจ็บ ความเหนื่อยล้า ความเครียด)
          </Text>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.foreground }]}>เปิดการแจ้งเตือน</Text>
            <Switch
              value={prefs.riskAlerts}
              onValueChange={(v) => updatePref("riskAlerts", v)}
              trackColor={{ false: colors.border, true: colors.error + "60" }}
              thumbColor={prefs.riskAlerts ? colors.error : colors.muted}
            />
          </View>
        </View>

        {/* Evaluation Alerts */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>แจ้งเตือนการประเมิน</Text>
          <Text style={[styles.sectionDesc, { color: colors.muted }]}>
            แจ้งเตือนเมื่อมีการประเมินนักกีฬาใหม่
          </Text>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.foreground }]}>เปิดการแจ้งเตือน</Text>
            <Switch
              value={prefs.evaluationAlerts}
              onValueChange={(v) => updatePref("evaluationAlerts", v)}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={prefs.evaluationAlerts ? colors.primary : colors.muted}
            />
          </View>
        </View>

        {/* Match Reminders */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>แจ้งเตือนการแข่งขัน</Text>
          <Text style={[styles.sectionDesc, { color: colors.muted }]}>
            แจ้งเตือนก่อนมีการแข่งขัน
          </Text>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.foreground }]}>เปิดการแจ้งเตือน</Text>
            <Switch
              value={prefs.matchReminders}
              onValueChange={(v) => updatePref("matchReminders", v)}
              trackColor={{ false: colors.border, true: colors.success + "60" }}
              thumbColor={prefs.matchReminders ? colors.success : colors.muted}
            />
          </View>
        </View>

        {Platform.OS === "web" && (
          <View style={[styles.infoCard, { backgroundColor: colors.primary + "08" }]}>
            <Text style={[styles.infoText, { color: colors.muted }]}>
              Push Notifications ใช้งานได้บนอุปกรณ์จริง (iOS/Android) เท่านั้น ไม่รองรับบน Web
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  warningCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  warningText: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
  permBtn: { padding: 10, borderRadius: 8, alignItems: "center" },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  sectionDesc: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  switchLabel: { fontSize: 15 },
  timeSelector: { marginTop: 12 },
  timeLabel: { fontSize: 14, fontWeight: "500", marginBottom: 8 },
  timeScroll: { marginBottom: 4 },
  timeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, marginRight: 8 },
  infoCard: { padding: 16, borderRadius: 14, marginTop: 8 },
  infoText: { fontSize: 13, lineHeight: 20, textAlign: "center" },
});
