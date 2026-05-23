import { ScrollView, Text, View, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppContext, AppRole } from "@/lib/app-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

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

  const isAdmin = role === "admin" || role === "head_coach";
  const isCoach = role === "coach" || role === "head_coach";

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
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

        {/* Quick Actions Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>เครื่องมือ</Text>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push("/calendar-view")}
            activeOpacity={0.7}
          >
            <View style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: "#1565C0" + "15" }]}>
                <MaterialIcons name="calendar-today" size={18} color="#1565C0" />
              </View>
              <View>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>ปฏิทิน</Text>
                <Text style={[styles.menuDesc, { color: colors.muted }]}>ตารางฝึกซ้อมและการแข่งขัน</Text>
              </View>
            </View>
            <Text style={[styles.menuArrow, { color: colors.muted }]}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push("/awards")}
            activeOpacity={0.7}
          >
            <View style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: "#FF6F00" + "15" }]}>
                <MaterialIcons name="emoji-events" size={18} color="#FF6F00" />
              </View>
              <View>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>รางวัลและเกียรติยศ</Text>
                <Text style={[styles.menuDesc, { color: colors.muted }]}>ดูรางวัลและอันดับนักกีฬา</Text>
              </View>
            </View>
            <Text style={[styles.menuArrow, { color: colors.muted }]}>›</Text>
          </TouchableOpacity>
          {isCoach && (
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => router.push("/coaching-sessions")}
              activeOpacity={0.7}
            >
              <View style={styles.menuRow}>
                <View style={[styles.menuIcon, { backgroundColor: "#2E7D32" + "15" }]}>
                  <MaterialIcons name="schedule" size={18} color="#2E7D32" />
                </View>
                <View>
                  <Text style={[styles.menuLabel, { color: colors.foreground }]}>บันทึกการสอน</Text>
                  <Text style={[styles.menuDesc, { color: colors.muted }]}>บันทึกชั่วโมงและค่าตอบแทน</Text>
                </View>
              </View>
              <Text style={[styles.menuArrow, { color: colors.muted }]}>›</Text>
            </TouchableOpacity>
          )}
          {isAdmin && (
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomWidth: 0 }]}
              onPress={() => router.push("/export-report")}
              activeOpacity={0.7}
            >
              <View style={styles.menuRow}>
                <View style={[styles.menuIcon, { backgroundColor: "#6A1B9A" + "15" }]}>
                  <MaterialIcons name="file-download" size={18} color="#6A1B9A" />
                </View>
                <View>
                  <Text style={[styles.menuLabel, { color: colors.foreground }]}>ส่งออกรายงาน</Text>
                  <Text style={[styles.menuDesc, { color: colors.muted }]}>Export ข้อมูลเป็น CSV/Excel</Text>
                </View>
              </View>
              <Text style={[styles.menuArrow, { color: colors.muted }]}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Admin Management Section */}
        {isAdmin && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>การจัดการ (Admin)</Text>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => router.push("/admin-users")}
              activeOpacity={0.7}
            >
              <View style={styles.menuRow}>
                <View style={[styles.menuIcon, { backgroundColor: colors.primary + "15" }]}>
                  <MaterialIcons name="people" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.menuLabel, { color: colors.foreground }]}>จัดการผู้ใช้</Text>
                  <Text style={[styles.menuDesc, { color: colors.muted }]}>เพิ่ม แก้ไข ลบ นักกีฬาและโค้ช</Text>
                </View>
              </View>
              <Text style={[styles.menuArrow, { color: colors.muted }]}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => router.push("/admin-settings")}
              activeOpacity={0.7}
            >
              <View style={styles.menuRow}>
                <View style={[styles.menuIcon, { backgroundColor: colors.warning + "15" }]}>
                  <MaterialIcons name="settings" size={18} color={colors.warning} />
                </View>
                <View>
                  <Text style={[styles.menuLabel, { color: colors.foreground }]}>ตั้งค่าสถาบัน</Text>
                  <Text style={[styles.menuDesc, { color: colors.muted }]}>ข้อมูลสถาบัน เวลาฝึก โปรแกรม</Text>
                </View>
              </View>
              <Text style={[styles.menuArrow, { color: colors.muted }]}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => router.push("/audit-logs")}
              activeOpacity={0.7}
            >
              <View style={styles.menuRow}>
                <View style={[styles.menuIcon, { backgroundColor: colors.error + "15" }]}>
                  <MaterialIcons name="history" size={18} color={colors.error} />
                </View>
                <View>
                  <Text style={[styles.menuLabel, { color: colors.foreground }]}>Audit Logs</Text>
                  <Text style={[styles.menuDesc, { color: colors.muted }]}>ประวัติการใช้งานระบบ</Text>
                </View>
              </View>
              <Text style={[styles.menuArrow, { color: colors.muted }]}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomWidth: 0 }]}
              onPress={() => router.push("/coach-compensation")}
              activeOpacity={0.7}
            >
              <View style={styles.menuRow}>
                <View style={[styles.menuIcon, { backgroundColor: "#2E7D32" + "15" }]}>
                  <MaterialIcons name="payments" size={18} color="#2E7D32" />
                </View>
                <View>
                  <Text style={[styles.menuLabel, { color: colors.foreground }]}>ค่าตอบแทนโค้ช</Text>
                  <Text style={[styles.menuDesc, { color: colors.muted }]}>ตรวจสอบและอนุมัติค่าตอบแทน</Text>
                </View>
              </View>
              <Text style={[styles.menuArrow, { color: colors.muted }]}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Settings Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>การตั้งค่า</Text>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} activeOpacity={0.7}>
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>แก้ไขโปรไฟล์</Text>
            <Text style={[styles.menuArrow, { color: colors.muted }]}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            activeOpacity={0.7}
            onPress={() => router.push("/notification-settings")}
          >
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
  menuRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
  menuLabel: { fontSize: 15 },
  menuDesc: { fontSize: 12, marginTop: 2 },
  menuValue: { fontSize: 14 },
  menuArrow: { fontSize: 20 },
  logoutBtn: { padding: 16, borderRadius: 14, alignItems: "center", marginTop: 8 },
  logoutText: { fontSize: 16, fontWeight: "600" },
});
