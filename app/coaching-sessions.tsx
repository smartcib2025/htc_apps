import { useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAppContext } from "@/lib/app-context";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const SESSION_TYPES: Record<string, string> = {
  private: "สอนส่วนตัว",
  group: "สอนกลุ่ม",
  camp: "แคมป์",
  match_coaching: "โค้ชแข่งขัน",
  other: "อื่นๆ",
};

export default function CoachingSessionsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { role, profileId } = useAppContext();
  const [showAdd, setShowAdd] = useState(false);

  // Form state
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [hours, setHours] = useState("2");
  const [sessionType, setSessionType] = useState<string>("private");
  const [content, setContent] = useState("");
  const [ratePerHour, setRatePerHour] = useState("500");
  const [notes, setNotes] = useState("");

  const coachId = profileId ?? 1;
  const { data: sessions, isLoading, refetch } = trpc.coachingSessions.byCoach.useQuery({ coachId, limit: 50 });
  const createMutation = trpc.coachingSessions.create.useMutation({
    onSuccess: () => { refetch(); setShowAdd(false); resetForm(); Alert.alert("สำเร็จ", "บันทึกการสอนเรียบร้อย"); },
  });
  const deleteMutation = trpc.coachingSessions.delete.useMutation({ onSuccess: () => refetch() });

  const resetForm = () => { setStartTime("09:00"); setEndTime("11:00"); setHours("2"); setSessionType("private"); setContent(""); setNotes(""); };

  const handleAdd = () => {
    const h = parseFloat(hours);
    const rate = parseFloat(ratePerHour);
    if (!h || h <= 0) { Alert.alert("กรุณากรอกจำนวนชั่วโมง"); return; }
    createMutation.mutate({
      coachId,
      sessionDate,
      startTime,
      endTime,
      hours: h,
      sessionType: sessionType as any,
      content: content || undefined,
      ratePerHour: rate || undefined,
      totalAmount: h * (rate || 0),
      notes: notes || undefined,
    });
  };

  const handleDelete = (id: number) => {
    Alert.alert("ยืนยัน", "ต้องการลบรายการนี้?", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ลบ", style: "destructive", onPress: () => deleteMutation.mutate({ id }) },
    ]);
  };

  const totalHours = (sessions || []).reduce((sum, s) => sum + (s.hours || 0), 0);
  const totalAmount = (sessions || []).reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const formatDate = (d: string | Date) => new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short" });

  const statusColors: Record<string, string> = { pending: "#F57F17", approved: "#1565C0", paid: "#2E7D32" };
  const statusLabels: Record<string, string> = { pending: "รอตรวจสอบ", approved: "อนุมัติ", paid: "จ่ายแล้ว" };

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground ml-3">บันทึกการสอน</Text>
        <View className="flex-1" />
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)} style={{ padding: 4 }}>
          <MaterialIcons name={showAdd ? "close" : "add"} size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View className="flex-row px-4 py-3 gap-3">
        <View className="flex-1 bg-surface rounded-xl p-3 border border-border items-center">
          <Text className="text-2xl font-bold text-primary">{totalHours.toFixed(1)}</Text>
          <Text className="text-xs text-muted">ชั่วโมงรวม</Text>
        </View>
        <View className="flex-1 bg-surface rounded-xl p-3 border border-border items-center">
          <Text className="text-2xl font-bold text-success">{totalAmount.toLocaleString()}</Text>
          <Text className="text-xs text-muted">ค่าตอบแทนรวม (฿)</Text>
        </View>
        <View className="flex-1 bg-surface rounded-xl p-3 border border-border items-center">
          <Text className="text-2xl font-bold text-foreground">{(sessions || []).length}</Text>
          <Text className="text-xs text-muted">จำนวนครั้ง</Text>
        </View>
      </View>

      {/* Add Form */}
      {showAdd && (
        <ScrollView className="max-h-80 px-4 py-3">
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="font-medium text-foreground mb-3">เพิ่มบันทึกการสอน</Text>

            <Text className="text-xs text-muted mb-1">วันที่</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground mb-2"
              value={sessionDate}
              onChangeText={setSessionDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
            />

            <View className="flex-row gap-2 mb-2">
              <View className="flex-1">
                <Text className="text-xs text-muted mb-1">เริ่ม</Text>
                <TextInput className="bg-background border border-border rounded-lg px-3 py-2 text-foreground" value={startTime} onChangeText={setStartTime} placeholderTextColor={colors.muted} />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted mb-1">สิ้นสุด</Text>
                <TextInput className="bg-background border border-border rounded-lg px-3 py-2 text-foreground" value={endTime} onChangeText={setEndTime} placeholderTextColor={colors.muted} />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted mb-1">ชั่วโมง</Text>
                <TextInput className="bg-background border border-border rounded-lg px-3 py-2 text-foreground" value={hours} onChangeText={setHours} keyboardType="numeric" placeholderTextColor={colors.muted} />
              </View>
            </View>

            <Text className="text-xs text-muted mb-1">ประเภท</Text>
            <View className="flex-row flex-wrap gap-1.5 mb-2">
              {Object.entries(SESSION_TYPES).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  className="px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: sessionType === key ? colors.primary : colors.background }}
                  onPress={() => setSessionType(key)}
                >
                  <Text style={{ color: sessionType === key ? "#fff" : colors.muted, fontSize: 12 }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-xs text-muted mb-1">เนื้อหาที่สอน</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground mb-2"
              value={content}
              onChangeText={setContent}
              placeholder="เช่น Forehand drill, Serve practice..."
              placeholderTextColor={colors.muted}
              multiline
            />

            <View className="flex-row gap-2 mb-3">
              <View className="flex-1">
                <Text className="text-xs text-muted mb-1">อัตรา/ชม. (฿)</Text>
                <TextInput className="bg-background border border-border rounded-lg px-3 py-2 text-foreground" value={ratePerHour} onChangeText={setRatePerHour} keyboardType="numeric" placeholderTextColor={colors.muted} />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted mb-1">รวม (฿)</Text>
                <View className="bg-background border border-border rounded-lg px-3 py-2.5">
                  <Text className="text-foreground">{((parseFloat(hours) || 0) * (parseFloat(ratePerHour) || 0)).toLocaleString()}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              className="rounded-lg py-2.5 items-center active:opacity-80"
              style={{ backgroundColor: colors.primary }}
              onPress={handleAdd}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-medium">บันทึก</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Sessions List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <FlatList
          data={sessions || []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View className="bg-surface rounded-xl p-3 mb-2 border border-border">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Text className="text-sm font-medium text-foreground">{formatDate(item.sessionDate)}</Text>
                  <View className="mx-2 w-1 h-1 rounded-full bg-muted" />
                  <Text className="text-xs text-muted">{item.startTime} - {item.endTime}</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="px-2 py-0.5 rounded-full mr-2" style={{ backgroundColor: (statusColors[item.status || "pending"] || "#999") + "20" }}>
                    <Text style={{ color: statusColors[item.status || "pending"], fontSize: 10, fontWeight: "600" }}>{statusLabels[item.status || "pending"]}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 2 }}>
                    <MaterialIcons name="delete-outline" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row items-center mt-1.5">
                <View className="px-2 py-0.5 rounded bg-primary/10 mr-2">
                  <Text className="text-xs text-primary font-medium">{SESSION_TYPES[item.sessionType || "other"]}</Text>
                </View>
                <Text className="text-xs text-muted">{item.hours} ชม. × ฿{(item.ratePerHour || 0).toLocaleString()} = </Text>
                <Text className="text-xs font-semibold text-success">฿{(item.totalAmount || 0).toLocaleString()}</Text>
              </View>
              {item.content && <Text className="text-xs text-muted mt-1">{item.content}</Text>}
            </View>
          )}
          ListEmptyComponent={<View className="items-center py-12"><Text className="text-muted">ยังไม่มีบันทึกการสอน</Text></View>}
        />
      )}

      {/* Navigate to Compensation Report */}
      <View className="px-4 pb-4">
        <TouchableOpacity
          className="rounded-xl py-3 items-center flex-row justify-center active:opacity-80 border border-primary"
          onPress={() => router.push("/coach-compensation")}
        >
          <MaterialIcons name="receipt-long" size={18} color={colors.primary} />
          <Text className="text-primary font-medium ml-2">ดูรายงานค่าตอบแทนรายเดือน</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
