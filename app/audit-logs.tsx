import { useState } from "react";
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAppContext } from "@/lib/app-context";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  login: { label: "เข้าสู่ระบบ", icon: "login", color: "#2E7D32" },
  logout: { label: "ออกจากระบบ", icon: "logout", color: "#F57F17" },
  create_player: { label: "สร้างนักกีฬา", icon: "person-add", color: "#1565C0" },
  update_player: { label: "แก้ไขนักกีฬา", icon: "edit", color: "#6A1B9A" },
  delete_player: { label: "ลบนักกีฬา", icon: "delete", color: "#C62828" },
  create_evaluation: { label: "ประเมินผล", icon: "rate-review", color: "#00838F" },
  create_checkin: { label: "เช็คอิน", icon: "check-circle", color: "#2E7D32" },
  update_settings: { label: "แก้ไขตั้งค่า", icon: "settings", color: "#455A64" },
  grant_award: { label: "มอบรางวัล", icon: "emoji-events", color: "#FF6F00" },
};

type FilterType = "all" | "login" | "create" | "update" | "delete";

export default function AuditLogsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { role } = useAppContext();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: logs, isLoading } = trpc.auditLogs.all.useQuery({ limit: 200 });

  const filteredLogs = (logs || []).filter((log) => {
    if (filter === "all") return true;
    if (filter === "login") return log.action === "login" || log.action === "logout";
    if (filter === "create") return log.action.startsWith("create");
    if (filter === "update") return log.action.startsWith("update");
    if (filter === "delete") return log.action.startsWith("delete");
    return true;
  });

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "ทั้งหมด" },
    { key: "login", label: "เข้า/ออกระบบ" },
    { key: "create", label: "สร้าง" },
    { key: "update", label: "แก้ไข" },
    { key: "delete", label: "ลบ" },
  ];

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) + " " + d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  };

  if (role !== "admin" && role !== "head_coach") {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <MaterialIcons name="lock" size={48} color={colors.muted} />
          <Text className="text-muted mt-4">ไม่มีสิทธิ์เข้าถึง</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground ml-3">บันทึกการใช้งาน</Text>
        <View className="flex-1" />
        <Text className="text-sm text-muted">{filteredLogs.length} รายการ</Text>
      </View>

      {/* Filters */}
      <View className="flex-row px-4 py-2 gap-2">
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            className="px-3 py-1.5 rounded-full"
            style={{ backgroundColor: filter === f.key ? colors.primary : colors.surface }}
            onPress={() => setFilter(f.key)}
          >
            <Text style={{ color: filter === f.key ? "#fff" : colors.muted, fontSize: 13, fontWeight: "500" }}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          renderItem={({ item }) => {
            const actionInfo = ACTION_LABELS[item.action] || { label: item.action, icon: "info", color: colors.muted };
            return (
              <View className="flex-row items-start py-3 border-b border-border/50">
                <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: actionInfo.color + "20" }}>
                  <MaterialIcons name={actionInfo.icon as any} size={18} color={actionInfo.color} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-sm font-medium text-foreground">{actionInfo.label}</Text>
                    <Text className="text-xs text-muted ml-2">โดย {item.username || "ระบบ"}</Text>
                  </View>
                  {item.details ? <Text className="text-xs text-muted mt-0.5" numberOfLines={2}>{item.details}</Text> : null}
                  <Text className="text-xs text-muted/60 mt-1">{formatDate(item.createdAt)}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-muted">ไม่มีบันทึกการใช้งาน</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
