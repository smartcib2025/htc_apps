import { ScrollView, Text, View, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppContext, AppRole } from "@/lib/app-context";

const roleLabels: Record<AppRole, string> = {
  player: "นักกีฬา",
  coach: "โค้ช",
  head_coach: "Head Coach",
  admin: "ผู้ดูแลระบบ",
};

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { userName, role, logout } = useAppContext();

  const handleLogout = () => {
    if (Platform.OS === "web") {
      logout().then(() => router.replace("/setup"));
    } else {
      Alert.alert("ออกจากระบบ", "คุณต้องการออกจากระบบหรือไม่?", [
        { text: "ยกเลิก", style: "cancel" },
        { text: "ออกจากระบบ", style: "destructive", onPress: () => logout().then(() => router.replace("/setup")) },
      ]);
    }
  };

  const handleSwitchRole = () => {
    router.push("/setup");
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatarLarge, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.avatarLargeText, { color: colors.primary }]}>
              {userName ? userName.charAt(0) : "?"}
            </Text>
          </View>
          <Text style={[styles.profileName, { color: colors.foreground }]}>{userName}</Text>
          <View style={[styles.rolePill, { backgroundColor: colors.primary + "15" }]}>
            <Text style={[styles.roleText, { color: colors.primary }]}>{roleLabels[role]}</Text>
          </View>
        </View>

        {/* Settings Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>การตั้งค่า</Text>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} activeOpacity={0.7}>
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>แก้ไขโปรไฟล์</Text>
            <Text style={[styles.menuArrow, { color: colors.muted }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} activeOpacity={0.7}>
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>การแจ้งเตือน</Text>
            <Text style={[styles.menuArrow, { color: colors.muted }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} activeOpacity={0.7}>
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>ภาษา</Text>
            <Text style={[styles.menuValue, { color: colors.muted }]}>ไทย</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={handleSwitchRole}
            activeOpacity={0.7}
          >
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>เปลี่ยนบทบาท</Text>
            <Text style={[styles.menuValue, { color: colors.primary }]}>{roleLabels[role]}</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>เกี่ยวกับ</Text>

          <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>เวอร์ชัน</Text>
            <Text style={[styles.menuValue, { color: colors.muted }]}>1.0.0</Text>
          </View>

          <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>Hanuman Tennis Academy</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.error + "12" }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 48 },
  profileHeader: { alignItems: "center", paddingVertical: 24 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarLargeText: { fontSize: 32, fontWeight: "700" },
  profileName: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  rolePill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 14 },
  roleText: { fontSize: 14, fontWeight: "600" },
  section: { borderRadius: 14, borderWidth: 1, marginBottom: 16, overflow: "hidden" },
  sectionTitle: { fontSize: 13, fontWeight: "600", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, textTransform: "uppercase" },
  menuItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  menuLabel: { fontSize: 15 },
  menuValue: { fontSize: 14 },
  menuArrow: { fontSize: 20 },
  logoutBtn: { padding: 16, borderRadius: 14, alignItems: "center", marginTop: 8 },
  logoutText: { fontSize: 16, fontWeight: "600" },
});
