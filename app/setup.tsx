import { useState } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAppContext, AppRole } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";

const roles: { key: AppRole; label: string; icon: string; desc: string }[] = [
  { key: "player", label: "นักกีฬา", icon: "🎾", desc: "บันทึกการฝึกซ้อม เช็คอิน ดูความก้าวหน้า" },
  { key: "coach", label: "โค้ช", icon: "📋", desc: "ประเมินนักกีฬา บันทึกโน้ต ดูทีม" },
  { key: "head_coach", label: "Head Coach", icon: "📊", desc: "Dashboard ภาพรวม วิเคราะห์ทีม" },
  { key: "admin", label: "ผู้ดูแลระบบ", icon: "⚙️", desc: "จัดการผู้ใช้ ตั้งค่าระบบ" },
];

export default function SetupScreen() {
  const [selectedRole, setSelectedRole] = useState<AppRole>("player");
  const [name, setName] = useState("");
  const { completeSetup } = useAppContext();
  const router = useRouter();
  const colors = useColors();

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await completeSetup(selectedRole, name.trim());
    router.replace("/(tabs)");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
          />
          <Text style={[styles.title, { color: colors.foreground }]}>Hanuman Tennis Academy</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            ระบบติดตามการฝึกซ้อมเทนนิส
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>ชื่อของคุณ</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
            placeholder="กรอกชื่อ-นามสกุล"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            returnKeyType="done"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>เลือกบทบาท</Text>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.key}
              style={[
                styles.roleCard,
                { backgroundColor: colors.surface, borderColor: selectedRole === role.key ? colors.primary : colors.border },
                selectedRole === role.key && { borderWidth: 2 },
              ]}
              onPress={() => setSelectedRole(role.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.roleIcon}>{role.icon}</Text>
              <View style={styles.roleInfo}>
                <Text style={[styles.roleLabel, { color: colors.foreground }]}>{role.label}</Text>
                <Text style={[styles.roleDesc, { color: colors.muted }]}>{role.desc}</Text>
              </View>
              {selectedRole === role.key && (
                <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: name.trim() ? colors.primary : colors.border }]}
          onPress={handleSubmit}
          disabled={!name.trim()}
          activeOpacity={0.8}
        >
          <Text style={[styles.submitText, { color: name.trim() ? "#fff" : colors.muted }]}>
            เริ่มใช้งาน
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 24, paddingBottom: 48 },
  header: { alignItems: "center", marginBottom: 32 },
  logo: { width: 80, height: 80, borderRadius: 16, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  roleIcon: { fontSize: 28, marginRight: 14 },
  roleInfo: { flex: 1 },
  roleLabel: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  roleDesc: { fontSize: 13 },
  checkmark: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  checkmarkText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  submitBtn: { padding: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
  submitText: { fontSize: 16, fontWeight: "700" },
});
