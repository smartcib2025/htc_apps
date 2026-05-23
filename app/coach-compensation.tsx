import { useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAppContext } from "@/lib/app-context";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const SESSION_TYPES: Record<string, string> = { private: "ส่วนตัว", group: "กลุ่ม", camp: "แคมป์", match_coaching: "โค้ชแข่ง", other: "อื่นๆ" };
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "รอตรวจสอบ", color: "#F57F17" },
  approved: { label: "อนุมัติ", color: "#1565C0" },
  paid: { label: "จ่ายแล้ว", color: "#2E7D32" },
};

export default function CoachCompensationScreen() {
  const router = useRouter();
  const colors = useColors();
  const { role, profileId } = useAppContext();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const isHeadOrAdmin = role === "admin" || role === "head_coach";
  const coachId = profileId ?? 1;

  const { data: compensation, isLoading } = trpc.coachingSessions.compensation.useQuery({ coachId, year, month });
  const { data: allCoaches } = trpc.coaches.all.useQuery(undefined, { enabled: isHeadOrAdmin });
  const [viewCoachId, setViewCoachId] = useState<number | null>(null);

  const activeCoachId = viewCoachId || coachId;
  const { data: viewCompensation, isLoading: viewLoading } = trpc.coachingSessions.compensation.useQuery(
    { coachId: activeCoachId, year, month },
    { enabled: viewCoachId !== null }
  );

  const displayData = viewCoachId ? viewCompensation : compensation;
  const displayLoading = viewCoachId ? viewLoading : isLoading;

  const updateMutation = trpc.coachingSessions.update.useMutation();

  const handleApprove = async (sessionId: number) => {
    await updateMutation.mutateAsync({ id: sessionId, status: "approved", approvedBy: profileId ?? undefined });
  };

  const handleMarkPaid = async (sessionId: number) => {
    await updateMutation.mutateAsync({ id: sessionId, status: "paid" });
  };

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground ml-3">ค่าตอบแทนโค้ช</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Month Selector */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity onPress={() => { if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1); }} style={{ padding: 8 }}>
            <MaterialIcons name="chevron-left" size={28} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground">{MONTHS_TH[month - 1]} {year + 543}</Text>
          <TouchableOpacity onPress={() => { if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1); }} style={{ padding: 8 }}>
            <MaterialIcons name="chevron-right" size={28} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Coach Selector (for Head Coach / Admin) */}
        {isHeadOrAdmin && allCoaches && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-3">
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="px-3 py-1.5 rounded-full"
                style={{ backgroundColor: !viewCoachId ? colors.primary : colors.surface }}
                onPress={() => setViewCoachId(null)}
              >
                <Text style={{ color: !viewCoachId ? "#fff" : colors.muted, fontSize: 13 }}>ของฉัน</Text>
              </TouchableOpacity>
              {allCoaches.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  className="px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: viewCoachId === c.id ? colors.primary : colors.surface }}
                  onPress={() => setViewCoachId(c.id)}
                >
                  <Text style={{ color: viewCoachId === c.id ? "#fff" : colors.muted, fontSize: 13 }}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {displayLoading ? (
          <View className="items-center py-12"><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <>
            {/* Summary Cards */}
            <View className="flex-row px-4 gap-3 mb-4">
              <View className="flex-1 bg-surface rounded-xl p-4 border border-border items-center">
                <MaterialIcons name="schedule" size={24} color={colors.primary} />
                <Text className="text-2xl font-bold text-primary mt-1">{(displayData?.totalHours || 0).toFixed(1)}</Text>
                <Text className="text-xs text-muted">ชั่วโมงรวม</Text>
              </View>
              <View className="flex-1 bg-surface rounded-xl p-4 border border-border items-center">
                <MaterialIcons name="payments" size={24} color={colors.success} />
                <Text className="text-2xl font-bold text-success mt-1">฿{(displayData?.totalAmount || 0).toLocaleString()}</Text>
                <Text className="text-xs text-muted">ค่าตอบแทนรวม</Text>
              </View>
            </View>

            {/* Coach Info */}
            {displayData?.coach && (
              <View className="mx-4 bg-surface rounded-xl p-4 border border-border mb-4">
                <Text className="font-semibold text-foreground">{displayData.coach.name}</Text>
                <Text className="text-xs text-muted mt-0.5">{displayData.coach.specialty || "โค้ชเทนนิส"}</Text>
              </View>
            )}

            {/* Sessions Detail */}
            <Text className="px-4 text-sm font-medium text-muted mb-2">รายละเอียดการสอน</Text>
            {(displayData?.sessions || []).length === 0 ? (
              <View className="items-center py-8">
                <Text className="text-muted">ไม่มีข้อมูลการสอนในเดือนนี้</Text>
              </View>
            ) : (
              (displayData?.sessions || []).map((s: any) => {
                const st = STATUS_LABELS[s.status || "pending"];
                return (
                  <View key={s.id} className="mx-4 bg-surface rounded-xl p-3 mb-2 border border-border">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-medium text-foreground">
                        {new Date(s.sessionDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: st.color + "20" }}>
                          <Text style={{ color: st.color, fontSize: 10, fontWeight: "600" }}>{st.label}</Text>
                        </View>
                        {isHeadOrAdmin && s.status === "pending" && (
                          <TouchableOpacity onPress={() => handleApprove(s.id)} className="px-2 py-0.5 rounded-full bg-primary/10">
                            <Text className="text-xs text-primary font-medium">อนุมัติ</Text>
                          </TouchableOpacity>
                        )}
                        {isHeadOrAdmin && s.status === "approved" && (
                          <TouchableOpacity onPress={() => handleMarkPaid(s.id)} className="px-2 py-0.5 rounded-full bg-success/10">
                            <Text className="text-xs text-success font-medium">จ่ายแล้ว</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    <View className="flex-row items-center mt-1">
                      <Text className="text-xs text-muted">{s.startTime} - {s.endTime}</Text>
                      <View className="mx-2 w-1 h-1 rounded-full bg-muted" />
                      <Text className="text-xs text-muted">{SESSION_TYPES[s.sessionType || "other"]}</Text>
                      <View className="mx-2 w-1 h-1 rounded-full bg-muted" />
                      <Text className="text-xs text-muted">{s.hours} ชม.</Text>
                    </View>
                    {s.content && <Text className="text-xs text-muted mt-1">{s.content}</Text>}
                    <Text className="text-xs font-semibold text-success mt-1">฿{(s.totalAmount || 0).toLocaleString()}</Text>
                  </View>
                );
              })
            )}

            {/* Summary Table */}
            {(displayData?.sessions || []).length > 0 && (
              <View className="mx-4 mt-4 mb-8 bg-primary/5 rounded-xl p-4 border border-primary/20">
                <Text className="font-semibold text-foreground mb-2">สรุปค่าตอบแทน {MONTHS_TH[month - 1]} {year + 543}</Text>
                <View className="flex-row justify-between py-1">
                  <Text className="text-sm text-muted">จำนวนครั้งที่สอน</Text>
                  <Text className="text-sm font-medium text-foreground">{(displayData?.sessions || []).length} ครั้ง</Text>
                </View>
                <View className="flex-row justify-between py-1">
                  <Text className="text-sm text-muted">ชั่วโมงรวม</Text>
                  <Text className="text-sm font-medium text-foreground">{(displayData?.totalHours || 0).toFixed(1)} ชม.</Text>
                </View>
                <View className="h-px bg-border my-2" />
                <View className="flex-row justify-between py-1">
                  <Text className="text-sm font-semibold text-foreground">ค่าตอบแทนรวม</Text>
                  <Text className="text-lg font-bold text-success">฿{(displayData?.totalAmount || 0).toLocaleString()}</Text>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
