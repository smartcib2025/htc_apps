import { useState, useMemo } from "react";
import { Text, View, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAppContext } from "@/lib/app-context";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const MONTHS_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

const EVENT_COLORS: Record<string, string> = {
  training: "#1B5E20",
  match: "#E65100",
  tournament: "#B71C1C",
  meeting: "#1565C0",
  rest: "#6A1B9A",
  other: "#455A64",
};

type EventType = "training" | "match" | "tournament" | "meeting" | "rest" | "other";

export default function CalendarViewScreen() {
  const router = useRouter();
  const colors = useColors();
  const { role, profileId } = useAppContext();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Add event form
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<EventType>("training");
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("11:00");
  const [newLocation, setNewLocation] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const { data: events, isLoading, refetch } = trpc.calendar.byMonth.useQuery({ year, month });
  const createMutation = trpc.calendar.create.useMutation({ onSuccess: () => { refetch(); setShowAdd(false); resetForm(); } });
  const deleteMutation = trpc.calendar.delete.useMutation({ onSuccess: () => refetch() });

  const resetForm = () => { setNewTitle(""); setNewType("training"); setNewStartTime("09:00"); setNewEndTime("11:00"); setNewLocation(""); setNewDesc(""); };

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    (events || []).forEach((e) => {
      const dateStr = String(e.eventDate).split("T")[0];
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(e);
    });
    return map;
  }, [events]);

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

  const handlePrevMonth = () => { if (month === 1) { setMonth(12); setYear(year - 1); } else { setMonth(month - 1); } setSelectedDate(null); };
  const handleNextMonth = () => { if (month === 12) { setMonth(1); setYear(year + 1); } else { setMonth(month + 1); } setSelectedDate(null); };

  const handleAddEvent = () => {
    if (!newTitle.trim() || !selectedDate) { Alert.alert("กรุณากรอกชื่อกิจกรรม"); return; }
    createMutation.mutate({
      title: newTitle.trim(),
      eventType: newType,
      eventDate: selectedDate,
      startTime: newStartTime,
      endTime: newEndTime,
      location: newLocation || undefined,
      description: newDesc || undefined,
      isAllPlayers: true,
      coachId: (role === "coach" || role === "head_coach") ? (profileId ?? undefined) : undefined,
    });
  };

  const handleDeleteEvent = (id: number) => {
    Alert.alert("ยืนยัน", "ต้องการลบกิจกรรมนี้?", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ลบ", style: "destructive", onPress: () => deleteMutation.mutate({ id }) },
    ]);
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground ml-3">ปฏิทิน</Text>
        <View className="flex-1" />
        {(role === "coach" || role === "head_coach" || role === "admin") && selectedDate && (
          <TouchableOpacity onPress={() => setShowAdd(!showAdd)} style={{ padding: 4 }}>
            <MaterialIcons name={showAdd ? "close" : "add"} size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1">
        {/* Month Navigation */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 8 }}>
            <MaterialIcons name="chevron-left" size={28} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground">{MONTHS_TH[month - 1]} {year + 543}</Text>
          <TouchableOpacity onPress={handleNextMonth} style={{ padding: 8 }}>
            <MaterialIcons name="chevron-right" size={28} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Day Headers */}
        <View className="flex-row px-2">
          {DAYS.map((d) => (
            <View key={d} className="flex-1 items-center py-1">
              <Text className="text-xs text-muted font-medium">{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        {isLoading ? (
          <View className="items-center py-12"><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <View className="flex-row flex-wrap px-2">
            {calendarDays.map((day, idx) => {
              if (day === null) return <View key={`empty-${idx}`} style={{ width: "14.28%", height: 52 }} />;
              const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayEvents = eventsByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              return (
                <TouchableOpacity
                  key={dateStr}
                  style={{ width: "14.28%", height: 52, alignItems: "center", paddingTop: 4 }}
                  onPress={() => setSelectedDate(dateStr)}
                >
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: isSelected ? colors.primary : isToday ? colors.primary + "20" : "transparent",
                    }}
                  >
                    <Text style={{ color: isSelected ? "#fff" : isToday ? colors.primary : colors.foreground, fontSize: 14, fontWeight: isToday ? "700" : "400" }}>{day}</Text>
                  </View>
                  {dayEvents.length > 0 && (
                    <View className="flex-row gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((e, i) => (
                        <View key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: EVENT_COLORS[e.eventType] || colors.muted }} />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Selected Date Events */}
        {selectedDate && (
          <View className="px-4 mt-4">
            <Text className="text-sm font-medium text-muted mb-2">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" })}
            </Text>

            {/* Add Event Form */}
            {showAdd && (
              <View className="bg-surface rounded-xl p-4 border border-border mb-3">
                <Text className="font-medium text-foreground mb-3">เพิ่มกิจกรรม</Text>
                <TextInput
                  className="bg-background border border-border rounded-lg px-3 py-2 text-foreground mb-2"
                  placeholder="ชื่อกิจกรรม"
                  placeholderTextColor={colors.muted}
                  value={newTitle}
                  onChangeText={setNewTitle}
                />
                <View className="flex-row flex-wrap gap-1.5 mb-2">
                  {(["training", "match", "tournament", "meeting", "rest", "other"] as EventType[]).map((t) => (
                    <TouchableOpacity
                      key={t}
                      className="px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: newType === t ? EVENT_COLORS[t] : colors.background }}
                      onPress={() => setNewType(t)}
                    >
                      <Text style={{ color: newType === t ? "#fff" : colors.muted, fontSize: 12 }}>
                        {t === "training" ? "ฝึกซ้อม" : t === "match" ? "แข่งขัน" : t === "tournament" ? "ทัวร์นาเมนต์" : t === "meeting" ? "ประชุม" : t === "rest" ? "พัก" : "อื่นๆ"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View className="flex-row gap-2 mb-2">
                  <TextInput
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                    placeholder="เริ่ม (09:00)"
                    placeholderTextColor={colors.muted}
                    value={newStartTime}
                    onChangeText={setNewStartTime}
                  />
                  <TextInput
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                    placeholder="สิ้นสุด (11:00)"
                    placeholderTextColor={colors.muted}
                    value={newEndTime}
                    onChangeText={setNewEndTime}
                  />
                </View>
                <TextInput
                  className="bg-background border border-border rounded-lg px-3 py-2 text-foreground mb-2"
                  placeholder="สถานที่ (ไม่บังคับ)"
                  placeholderTextColor={colors.muted}
                  value={newLocation}
                  onChangeText={setNewLocation}
                />
                <TouchableOpacity
                  className="rounded-lg py-2.5 items-center active:opacity-80"
                  style={{ backgroundColor: colors.primary }}
                  onPress={handleAddEvent}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-medium">บันทึก</Text>}
                </TouchableOpacity>
              </View>
            )}

            {/* Event List */}
            {selectedEvents.length === 0 ? (
              <View className="items-center py-6">
                <Text className="text-muted text-sm">ไม่มีกิจกรรมในวันนี้</Text>
              </View>
            ) : (
              selectedEvents.map((event) => (
                <View key={event.id} className="flex-row items-start bg-surface rounded-xl p-3 mb-2 border border-border">
                  <View className="w-1 rounded-full mr-3 self-stretch" style={{ backgroundColor: EVENT_COLORS[event.eventType] || colors.muted }} />
                  <View className="flex-1">
                    <Text className="font-medium text-foreground">{event.title}</Text>
                    <View className="flex-row items-center mt-1">
                      <MaterialIcons name="schedule" size={12} color={colors.muted} />
                      <Text className="text-xs text-muted ml-1">{event.startTime || "ทั้งวัน"}{event.endTime ? ` - ${event.endTime}` : ""}</Text>
                    </View>
                    {event.location && (
                      <View className="flex-row items-center mt-0.5">
                        <MaterialIcons name="place" size={12} color={colors.muted} />
                        <Text className="text-xs text-muted ml-1">{event.location}</Text>
                      </View>
                    )}
                    {event.description && <Text className="text-xs text-muted mt-1">{event.description}</Text>}
                  </View>
                  {(role === "admin" || role === "head_coach") && (
                    <TouchableOpacity onPress={() => handleDeleteEvent(event.id)} style={{ padding: 4 }}>
                      <MaterialIcons name="delete-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* Legend */}
        <View className="px-4 mt-4 mb-8">
          <View className="flex-row flex-wrap gap-3">
            {Object.entries(EVENT_COLORS).map(([type, color]) => (
              <View key={type} className="flex-row items-center">
                <View className="w-2.5 h-2.5 rounded-full mr-1" style={{ backgroundColor: color }} />
                <Text className="text-xs text-muted">
                  {type === "training" ? "ฝึกซ้อม" : type === "match" ? "แข่งขัน" : type === "tournament" ? "ทัวร์นาเมนต์" : type === "meeting" ? "ประชุม" : type === "rest" ? "พัก" : "อื่นๆ"}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
