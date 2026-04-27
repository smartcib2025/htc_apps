import { useState, useEffect } from "react";
import { ScrollView, Text, View, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

function showMsg(title: string, msg: string) {
  Platform.OS === "web" ? alert(msg) : Alert.alert(title, msg);
}

const SETTING_KEYS = [
  { key: "academy_name", label: "ชื่อสถาบัน", placeholder: "Hanuman Tennis Academy" },
  { key: "academy_address", label: "ที่อยู่", placeholder: "กรุณากรอกที่อยู่" },
  { key: "academy_phone", label: "เบอร์โทร", placeholder: "02-xxx-xxxx" },
  { key: "academy_email", label: "อีเมล", placeholder: "info@example.com" },
  { key: "academy_website", label: "เว็บไซต์", placeholder: "https://example.com" },
  { key: "training_start_time", label: "เวลาเริ่มฝึกซ้อม", placeholder: "06:00" },
  { key: "training_end_time", label: "เวลาสิ้นสุดฝึกซ้อม", placeholder: "20:00" },
  { key: "checkin_reminder_time", label: "เวลาแจ้งเตือนเช็คอิน", placeholder: "07:00" },
  { key: "max_players_per_coach", label: "จำนวนนักกีฬาต่อโค้ช (สูงสุด)", placeholder: "10" },
  { key: "programs", label: "โปรแกรมฝึกซ้อม (คั่นด้วย ,)", placeholder: "Intensive, Weekend, Junior, Pro" },
  { key: "levels", label: "ระดับนักกีฬา (คั่นด้วย ,)", placeholder: "Beginner, Junior, Intermediate, Advanced, Pro" },
];

export default function AdminSettingsScreen() {
  const colors = useColors();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: settings = [], isLoading } = trpc.settings.all.useQuery();
  const setSetting = trpc.settings.set.useMutation();

  useEffect(() => {
    if (settings.length > 0) {
      const map: Record<string, string> = {};
      settings.forEach((s: any) => { map[s.settingKey] = s.settingValue || ""; });
      setValues(map);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = SETTING_KEYS.map(({ key }) => {
        const val = values[key];
        if (val !== undefined) {
          return setSetting.mutateAsync({ key, value: val });
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
      showMsg("สำเร็จ", "บันทึกการตั้งค่าสำเร็จ!");
    } catch (err: any) {
      showMsg("ผิดพลาด", "เกิดข้อผิดพลาด: " + (err.message || "ไม่ทราบสาเหตุ"));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer edges={["left", "right"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, marginTop: 12 }}>กำลังโหลดการตั้งค่า...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.headerCard, { backgroundColor: colors.primary + "10" }]}>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>ตั้งค่าสถาบัน</Text>
          <Text style={[styles.headerDesc, { color: colors.muted }]}>
            กำหนดข้อมูลพื้นฐานของสถาบัน เวลาฝึกซ้อม และโปรแกรมต่างๆ
          </Text>
        </View>

        {SETTING_KEYS.map(({ key, label, placeholder }) => (
          <View key={key} style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
              value={values[key] || ""}
              onChangeText={(text) => setValues((prev) => ({ ...prev, [key]: text }))}
              placeholder={placeholder}
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              multiline={key === "academy_address" || key === "programs" || key === "levels"}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  headerCard: { padding: 16, borderRadius: 14, marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  headerDesc: { fontSize: 13, lineHeight: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  saveBtn: { padding: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
