import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  eventType: "training" | "match" | "tournament" | "meeting" | "rest" | "other";
  eventDate: Date;
  startTime?: string;
  endTime?: string;
  location?: string;
  color?: string;
  createdBy?: number;
}

const EVENT_COLORS = {
  training: "#3B82F6",
  match: "#EF4444",
  tournament: "#F59E0B",
  meeting: "#8B5CF6",
  rest: "#10B981",
  other: "#6B7280",
};

const EVENT_LABELS = {
  training: "ฝึกซ้อม",
  match: "แข่งขัน",
  tournament: "ทัวร์นาเมนต์",
  meeting: "ประชุม",
  rest: "วันหยุด",
  other: "อื่น ๆ",
};

export default function CalendarScreen() {
  const colors = useColors();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    eventType: "training" as const,
    location: "",
    startTime: "",
    endTime: "",
  });

  const calendarQuery = trpc.calendar.byMonth.useQuery({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
  });

  const createEventMutation = trpc.calendar.create.useMutation({
    onSuccess: () => {
      calendarQuery.refetch();
      setShowAddModal(false);
      setNewEvent({ title: "", eventType: "training", location: "", startTime: "", endTime: "" });
    },
  });

  useEffect(() => {
    if (calendarQuery.data) {
      const allEvents: CalendarEvent[] = [];
      Object.entries(calendarQuery.data).forEach(([date, dateEvents]: any) => {
        dateEvents.forEach((event: any) => {
          allEvents.push({
            ...event,
            eventDate: new Date(date),
          });
        });
      });
      setEvents(allEvents);
    }
  }, [calendarQuery.data]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.eventDate.toISOString().split("T")[0] === dateStr);
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !selectedDate) return;

    createEventMutation.mutate({
      title: newEvent.title,
      eventType: newEvent.eventType as any,
      eventDate: selectedDate,
      location: newEvent.location,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      isAllPlayers: false,
    });
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthName = currentDate.toLocaleDateString("th-TH", { month: "long", year: "numeric" });

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">ปฏิทิน</Text>
          <Text className="text-muted">จัดการกิจกรรมและเหตุการณ์</Text>
        </View>

        {/* Month Navigation */}
        <View className="flex-row items-center justify-between mb-6 bg-surface rounded-lg p-4">
          <TouchableOpacity onPress={handlePrevMonth} className="p-2">
            <Text className="text-2xl text-primary">{"<"}</Text>
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-foreground">{monthName}</Text>
          <TouchableOpacity onPress={handleNextMonth} className="p-2">
            <Text className="text-2xl text-primary">{">"}</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View className="bg-surface rounded-lg p-4 mb-6">
          {/* Day headers */}
          <View className="flex-row mb-4">
            {["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"].map((day, index) => (
              <View key={index} className="flex-1 items-center">
                <Text className="text-sm font-semibold text-muted">{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar days */}
          {Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIndex) => (
            <View key={weekIndex} className="flex-row mb-2">
              {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => {
                const dateStr = day
                  ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                  : null;
                const dayEvents = day ? getEventsForDate(day) : [];

                return (
                  <TouchableOpacity
                    key={dayIndex}
                    onPress={() => {
                      if (dateStr) {
                        setSelectedDate(dateStr);
                        setShowAddModal(true);
                      }
                    }}
                    className={cn(
                      "flex-1 aspect-square rounded-lg p-2 mr-1 mb-1 border",
                      day ? "bg-background border-border" : "bg-transparent border-transparent",
                      selectedDate === dateStr ? "bg-primary/10 border-primary" : ""
                    )}
                  >
                    {day && (
                      <View className="flex-1">
                        <Text className={cn("text-xs font-semibold", day ? "text-foreground" : "text-muted")}>
                          {day}
                        </Text>
                        {dayEvents.length > 0 && (
                          <View className="mt-1">
                            {dayEvents.slice(0, 2).map((event, idx) => (
                              <View
                                key={idx}
                                className="rounded px-1 py-0.5 mb-0.5"
                                style={{ backgroundColor: event.color || EVENT_COLORS[event.eventType] }}
                              >
                                <Text className="text-xs text-white font-semibold truncate">{event.title}</Text>
                              </View>
                            ))}
                            {dayEvents.length > 2 && (
                              <Text className="text-xs text-muted">+{dayEvents.length - 2}</Text>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Event List */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-foreground">กิจกรรมที่กำลังจะมา</Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedDate(new Date().toISOString().split("T")[0]);
                setShowAddModal(true);
              }}
              className="bg-primary rounded-full px-4 py-2"
            >
              <Text className="text-white font-semibold text-sm">+ เพิ่ม</Text>
            </TouchableOpacity>
          </View>

          {events.length > 0 ? (
            <FlatList
              data={events.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setShowEventModal(true)}
                  className="bg-surface rounded-lg p-4 mb-3 border-l-4"
                  style={{ borderLeftColor: item.color || EVENT_COLORS[item.eventType] }}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">{item.title}</Text>
                      <Text className="text-sm text-muted mt-1">
                        {item.eventDate.toLocaleDateString("th-TH")} {item.startTime && `${item.startTime}`}
                      </Text>
                      {item.location && <Text className="text-sm text-muted mt-1">📍 {item.location}</Text>}
                      <View className="mt-2">
                        <Text className="text-xs font-semibold text-primary">
                          {EVENT_LABELS[item.eventType]}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id.toString()}
            />
          ) : (
            <View className="bg-surface rounded-lg p-6 items-center">
              <Text className="text-muted text-center">ไม่มีกิจกรรมในเดือนนี้</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Event Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6 pb-10">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-foreground">เพิ่มกิจกรรม</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text className="text-2xl text-muted">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text className="text-sm font-semibold text-muted mb-2">ชื่อกิจกรรม</Text>
              <TextInput
                placeholder="เช่น ฝึกซ้อม, แข่งขัน"
                value={newEvent.title}
                onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
                className="bg-surface rounded-lg p-3 mb-4 text-foreground border border-border"
                placeholderTextColor={colors.muted}
              />

              <Text className="text-sm font-semibold text-muted mb-2">ประเภท</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {(Object.keys(EVENT_LABELS) as Array<any>).map((type: any) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setNewEvent({ ...newEvent, eventType: type })}
                    className={cn(
                      "rounded-full px-4 py-2",
                      newEvent.eventType === type ? "bg-primary" : "bg-surface border border-border"
                    )}
                  >
                    <Text
                      className={cn(
                        "text-sm font-semibold",
                        newEvent.eventType === type ? "text-white" : "text-foreground"
                      )}
                    >
                      {EVENT_LABELS[type as keyof typeof EVENT_LABELS]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-sm font-semibold text-muted mb-2">เวลาเริ่มต้น</Text>
              <TextInput
                placeholder="HH:MM"
                value={newEvent.startTime}
                onChangeText={(text) => setNewEvent({ ...newEvent, startTime: text })}
                className="bg-surface rounded-lg p-3 mb-4 text-foreground border border-border"
                placeholderTextColor={colors.muted}
              />

              <Text className="text-sm font-semibold text-muted mb-2">เวลาสิ้นสุด</Text>
              <TextInput
                placeholder="HH:MM"
                value={newEvent.endTime}
                onChangeText={(text) => setNewEvent({ ...newEvent, endTime: text })}
                className="bg-surface rounded-lg p-3 mb-4 text-foreground border border-border"
                placeholderTextColor={colors.muted}
              />

              <Text className="text-sm font-semibold text-muted mb-2">สถานที่</Text>
              <TextInput
                placeholder="เช่น สนามเทนนิส, ห้องประชุม"
                value={newEvent.location}
                onChangeText={(text) => setNewEvent({ ...newEvent, location: text })}
                className="bg-surface rounded-lg p-3 mb-6 text-foreground border border-border"
                placeholderTextColor={colors.muted}
              />

              <TouchableOpacity
                onPress={handleAddEvent}
                disabled={!newEvent.title}
                className={cn("rounded-lg p-4 items-center", !newEvent.title ? "bg-muted/50" : "bg-primary")}
              >
                <Text className={cn("font-semibold text-base", !newEvent.title ? "text-muted" : "text-white")}>
                  บันทึกกิจกรรม
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
