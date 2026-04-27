import { ScrollView, Text, View, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

function getRiskColor(level: string) {
  if (level === "high") return "#EF4444";
  if (level === "medium") return "#F59E0B";
  return "#22C55E";
}

export default function ReportDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reportId = parseInt(id || "1", 10);

  const { data: allPlayers = [] } = trpc.players.all.useQuery();

  // We need to find the report - query all players' reports to find it
  // A simpler approach: get all reports and find by id
  const { data: report, isLoading } = trpc.reports.byId.useQuery({ id: reportId });

  if (isLoading || !report) {
    return (
      <ScreenContainer edges={["left", "right"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, marginTop: 12 }}>กำลังโหลดรายงาน...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const player = allPlayers.find((p: any) => p.id === (report as any).playerId);

  return (
    <ScreenContainer edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.playerName, { color: colors.foreground }]}>{(player as any)?.name || "นักกีฬา"}</Text>
          <Text style={[styles.reportType, { color: colors.primary }]}>
            {(report as any).reportType === "weekly" ? "รายงานประจำสัปดาห์" : (report as any).reportType === "monthly" ? "รายงานประจำเดือน" : "รายงานทัวร์นาเมนต์"}
          </Text>
          <Text style={[styles.date, { color: colors.muted }]}>{String((report as any).generatedAt)}</Text>
        </View>

        <View style={styles.indicesRow}>
          <View style={[styles.indexCard, { backgroundColor: colors.primary + "12" }]}>
            <Text style={[styles.indexValue, { color: colors.primary }]}>{(report as any).performanceIndex}</Text>
            <Text style={[styles.indexLabel, { color: colors.muted }]}>Performance</Text>
          </View>
          <View style={[styles.indexCard, { backgroundColor: colors.success + "12" }]}>
            <Text style={[styles.indexValue, { color: colors.success }]}>{(report as any).readinessIndex}</Text>
            <Text style={[styles.indexLabel, { color: colors.muted }]}>Readiness</Text>
          </View>
          <View style={[styles.indexCard, { backgroundColor: colors.warning + "12" }]}>
            <Text style={[styles.indexValue, { color: colors.warning }]}>{(report as any).peakIndex}</Text>
            <Text style={[styles.indexLabel, { color: colors.muted }]}>Peak Index</Text>
          </View>
        </View>

        {(report as any).riskLevel && (
          <View style={[styles.riskCard, { backgroundColor: getRiskColor(String((report as any).riskLevel)) + "12", borderColor: getRiskColor(String((report as any).riskLevel)) + "30" }]}>
            <Text style={[styles.riskTitle, { color: getRiskColor(String((report as any).riskLevel)) }]}>
              ระดับความเสี่ยง: {String((report as any).riskLevel) === "high" ? "สูง" : String((report as any).riskLevel) === "medium" ? "ปานกลาง" : "ต่ำ"}
            </Text>
            {(report as any).riskType && (
              <Text style={[styles.riskType, { color: getRiskColor(String((report as any).riskLevel)) }]}>
                ประเภท: {(report as any).riskType}
              </Text>
            )}
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>สรุปภาพรวม</Text>
          <Text style={[styles.sectionText, { color: colors.foreground }]}>{(report as any).summary}</Text>
        </View>

        {(report as any).strengths && (
          <View style={[styles.section, { backgroundColor: colors.success + "08", borderColor: colors.success + "20" }]}>
            <Text style={[styles.sectionTitle, { color: colors.success }]}>จุดแข็ง</Text>
            <Text style={[styles.sectionText, { color: colors.foreground }]}>{(report as any).strengths}</Text>
          </View>
        )}

        {(report as any).weaknesses && (
          <View style={[styles.section, { backgroundColor: colors.error + "08", borderColor: colors.error + "20" }]}>
            <Text style={[styles.sectionTitle, { color: colors.error }]}>จุดที่ต้องพัฒนา</Text>
            <Text style={[styles.sectionText, { color: colors.foreground }]}>{(report as any).weaknesses}</Text>
          </View>
        )}

        {(report as any).actionPlan && (
          <View style={[styles.section, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "20" }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>แผนพัฒนา</Text>
            <Text style={[styles.sectionText, { color: colors.foreground }]}>{(report as any).actionPlan}</Text>
          </View>
        )}

        {(report as any).goals && (
          <View style={[styles.section, { backgroundColor: colors.warning + "08", borderColor: colors.warning + "20" }]}>
            <Text style={[styles.sectionTitle, { color: colors.warning }]}>เป้าหมาย</Text>
            <Text style={[styles.sectionText, { color: colors.foreground }]}>{(report as any).goals}</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 48 },
  header: { alignItems: "center", marginBottom: 20 },
  playerName: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  reportType: { fontSize: 15, fontWeight: "500", marginBottom: 2 },
  date: { fontSize: 13 },
  indicesRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  indexCard: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" },
  indexValue: { fontSize: 24, fontWeight: "700" },
  indexLabel: { fontSize: 11, marginTop: 2 },
  riskCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  riskTitle: { fontSize: 16, fontWeight: "600" },
  riskType: { fontSize: 14, marginTop: 4 },
  section: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  sectionText: { fontSize: 14, lineHeight: 22 },
});
