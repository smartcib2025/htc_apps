import { useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAppContext } from "@/lib/app-context";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

type ReportType = "player_summary" | "attendance" | "coach_compensation";

const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export default function ExportReportScreen() {
  const router = useRouter();
  const colors = useColors();
  const { role } = useAppContext();
  const [reportType, setReportType] = useState<ReportType>("attendance");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data: playersList } = trpc.players.all.useQuery();
  const { data: coachesList } = trpc.coaches.all.useQuery();

  const reportTypes: { key: ReportType; label: string; icon: string; desc: string }[] = [
    { key: "attendance", label: "รายงานการเข้าฝึกซ้อม", icon: "event-available", desc: "สรุปการเช็คอินรายเดือน" },
    { key: "player_summary", label: "สรุปผลนักกีฬา", icon: "person", desc: "ข้อมูลครบถ้วนของนักกีฬา" },
    { key: "coach_compensation", label: "ค่าตอบแทนโค้ช", icon: "payments", desc: "สรุปชั่วโมงสอนและค่าตอบแทน" },
  ];

  const generateCSV = (headers: string[], rows: string[][]): string => {
    const bom = "\uFEFF";
    const headerLine = headers.join(",");
    const dataLines = rows.map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(","));
    return bom + [headerLine, ...dataLines].join("\n");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      let csvContent = "";
      let fileName = "";

      if (reportType === "attendance") {
        const data = await attendanceRefetch();
        if (!data) throw new Error("ไม่สามารถดึงข้อมูลได้");
        const headers = ["ชื่อนักกีฬา", "ระดับ", "โปรแกรม", "จำนวนวันเช็คอิน", "ชั่วโมงฝึกซ้อมรวม", "ค่าเฉลี่ยความเหนื่อย", "ค่าเฉลี่ยความมั่นใจ"];
        const rows = (data.players || []).map((p: any) => {
          const pCheckins = (data.checkins || []).filter((c: any) => c.playerId === p.id);
          const totalHours = pCheckins.reduce((sum: number, c: any) => sum + (c.trainingHours || 0), 0);
          const avgFatigue = pCheckins.length > 0 ? (pCheckins.reduce((sum: number, c: any) => sum + (c.fatigue || 0), 0) / pCheckins.length).toFixed(1) : "-";
          const avgConfidence = pCheckins.length > 0 ? (pCheckins.reduce((sum: number, c: any) => sum + (c.confidence || 0), 0) / pCheckins.length).toFixed(1) : "-";
          return [p.name, p.level || "-", p.program || "-", String(pCheckins.length), totalHours.toFixed(1), String(avgFatigue), String(avgConfidence)];
        });
        csvContent = generateCSV(headers, rows);
        fileName = `attendance_${selectedYear}_${String(selectedMonth).padStart(2, "0")}.csv`;
      } else if (reportType === "player_summary" && selectedPlayerId) {
        const data = await playerSummaryRefetch();
        if (!data || !data.player) throw new Error("ไม่สามารถดึงข้อมูลได้");
        const headers = ["วันที่", "ชั่วโมงฝึก", "ความเหนื่อย", "ความมั่นใจ", "ความเครียด", "บาดเจ็บ", "เป้าหมาย"];
        const rows = (data.checkins || []).map((c: any) => [
          String(c.checkinDate), String(c.trainingHours || 0), String(c.fatigue || "-"), String(c.confidence || "-"), String(c.stress || "-"),
          c.injuryStatus ? "ใช่" : "ไม่", c.nextGoal || "-"
        ]);
        csvContent = generateCSV(headers, rows);
        fileName = `player_${data.player.name}_summary.csv`;
      } else if (reportType === "coach_compensation" && selectedCoachId) {
        const data = await compensationRefetch();
        if (!data || !data.coach) throw new Error("ไม่สามารถดึงข้อมูลได้");
        const headers = ["วันที่", "เวลาเริ่ม", "เวลาสิ้นสุด", "ชั่วโมง", "ประเภท", "เนื้อหา", "อัตรา/ชม.", "รวม", "สถานะ"];
        const rows = (data.sessions || []).map((s: any) => [
          String(s.sessionDate), s.startTime, s.endTime, String(s.hours), s.sessionType,
          s.content || "-", String(s.ratePerHour || 0), String(s.totalAmount || 0), s.status
        ]);
        rows.push(["", "", "", String(data.totalHours), "", "รวมทั้งหมด", "", String(data.totalAmount), ""]);
        csvContent = generateCSV(headers, rows);
        fileName = `coach_${data.coach.name}_compensation_${selectedYear}_${String(selectedMonth).padStart(2, "0")}.csv`;
      } else {
        Alert.alert("กรุณาเลือกข้อมูลให้ครบถ้วน");
        setExporting(false);
        return;
      }

      if (Platform.OS === "web") {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert("สำเร็จ", "ดาวน์โหลดไฟล์เรียบร้อย");
      } else {
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { mimeType: "text/csv", dialogTitle: "Export Report" });
        } else {
          Alert.alert("สำเร็จ", `บันทึกไฟล์ที่ ${fileName}`);
        }
      }
    } catch (e: any) {
      Alert.alert("ข้อผิดพลาด", e.message || "ไม่สามารถ export ได้");
    } finally {
      setExporting(false);
    }
  };

  // Lazy queries for export data
  const utils = trpc.useUtils();
  const attendanceRefetch = async () => {
    return utils.export.attendance.fetch({ year: selectedYear, month: selectedMonth });
  };
  const playerSummaryRefetch = async () => {
    if (!selectedPlayerId) return null;
    return utils.export.playerSummary.fetch({ playerId: selectedPlayerId });
  };
  const compensationRefetch = async () => {
    if (!selectedCoachId) return null;
    return utils.export.coachCompensation.fetch({ coachId: selectedCoachId, year: selectedYear, month: selectedMonth });
  };

  if (role !== "admin" && role !== "head_coach") {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <MaterialIcons name="lock" size={48} color={colors.muted} />
          <Text className="text-muted mt-4">เฉพาะ Head Coach และ Admin เท่านั้น</Text>
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
        <Text className="text-xl font-bold text-foreground ml-3">ส่งออกรายงาน</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Report Type Selection */}
        <Text className="text-sm font-medium text-muted mb-2">เลือกประเภทรายงาน</Text>
        {reportTypes.map((rt) => (
          <TouchableOpacity
            key={rt.key}
            className="flex-row items-center p-4 rounded-xl mb-2 border"
            style={{ backgroundColor: reportType === rt.key ? colors.primary + "10" : colors.surface, borderColor: reportType === rt.key ? colors.primary : colors.border }}
            onPress={() => setReportType(rt.key)}
          >
            <MaterialIcons name={rt.icon as any} size={24} color={reportType === rt.key ? colors.primary : colors.muted} />
            <View className="ml-3 flex-1">
              <Text className="font-medium" style={{ color: reportType === rt.key ? colors.primary : colors.foreground }}>{rt.label}</Text>
              <Text className="text-xs text-muted">{rt.desc}</Text>
            </View>
            {reportType === rt.key && <MaterialIcons name="check-circle" size={20} color={colors.primary} />}
          </TouchableOpacity>
        ))}

        {/* Month/Year Selection */}
        {(reportType === "attendance" || reportType === "coach_compensation") && (
          <View className="mt-4">
            <Text className="text-sm font-medium text-muted mb-2">เลือกเดือน/ปี</Text>
            <View className="flex-row items-center gap-2 mb-3">
              <TouchableOpacity onPress={() => setSelectedYear((y) => y - 1)} style={{ padding: 8 }}>
                <MaterialIcons name="chevron-left" size={24} color={colors.foreground} />
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-foreground">{selectedYear + 543}</Text>
              <TouchableOpacity onPress={() => setSelectedYear((y) => y + 1)} style={{ padding: 8 }}>
                <MaterialIcons name="chevron-right" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={i}
                  className="px-3 py-2 rounded-lg"
                  style={{ backgroundColor: selectedMonth === i + 1 ? colors.primary : colors.surface }}
                  onPress={() => setSelectedMonth(i + 1)}
                >
                  <Text style={{ color: selectedMonth === i + 1 ? "#fff" : colors.foreground, fontSize: 13 }}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Player Selection */}
        {reportType === "player_summary" && (
          <View className="mt-4">
            <Text className="text-sm font-medium text-muted mb-2">เลือกนักกีฬา</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {(playersList || []).map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    className="px-4 py-2 rounded-lg"
                    style={{ backgroundColor: selectedPlayerId === p.id ? colors.primary : colors.surface }}
                    onPress={() => setSelectedPlayerId(p.id)}
                  >
                    <Text style={{ color: selectedPlayerId === p.id ? "#fff" : colors.foreground, fontSize: 13 }}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Coach Selection */}
        {reportType === "coach_compensation" && (
          <View className="mt-4">
            <Text className="text-sm font-medium text-muted mb-2">เลือกโค้ช</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {(coachesList || []).map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    className="px-4 py-2 rounded-lg"
                    style={{ backgroundColor: selectedCoachId === c.id ? colors.primary : colors.surface }}
                    onPress={() => setSelectedCoachId(c.id)}
                  >
                    <Text style={{ color: selectedCoachId === c.id ? "#fff" : colors.foreground, fontSize: 13 }}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Export Button */}
        <TouchableOpacity
          className="mt-8 rounded-xl py-4 items-center active:opacity-80"
          style={{ backgroundColor: colors.primary }}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View className="flex-row items-center">
              <MaterialIcons name="file-download" size={20} color="#fff" />
              <Text className="text-white font-semibold text-base ml-2">ส่งออกไฟล์ CSV</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text className="text-xs text-muted text-center mt-3 mb-8">ไฟล์ CSV สามารถเปิดด้วย Excel, Google Sheets หรือโปรแกรมตารางคำนวณอื่นๆ</Text>
      </ScrollView>
    </ScreenContainer>
  );
}
