import { ScrollView, Text, View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { demoReports, demoPlayers, getRiskColor } from "@/lib/demo-data";

export default function ReportDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reportId = parseInt(id || "1", 10);
  const report = demoReports.find(r => r.id === reportId) || demoReports[0];
  const player = demoPlayers.find(p => p.id === report.playerId);

  return (
    <ScreenContainer edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.playerName, { color: colors.foreground }]}>{player?.name}</Text>
          <Text style={[styles.reportType, { color: colors.primary }]}>
            {report.reportType === "weekly" ? "รายงานประจำสัปดาห์" : report.reportType === "monthly" ? "รายงานประจำเดือน" : "รายงานทัวร์นาเมนต์"}
          </Text>
          <Text style={[styles.date, { color: colors.muted }]}>{report.generatedAt}</Text>
        </View>

        {/* Indices */}
        <View style={styles.indicesRow}>
          <View style={[styles.indexCard, { backgroundColor: colors.primary + "12" }]}>
            <Text style={[styles.indexValue, { color: colors.primary }]}>{report.performanceIndex}</Text>
            <Text style={[styles.indexLabel, { color: colors.muted }]}>Performance</Text>
          </View>
          <View style={[styles.indexCard, { backgroundColor: colors.success + "12" }]}>
            <Text style={[styles.indexValue, { color: colors.success }]}>{report.readinessIndex}</Text>
            <Text style={[styles.indexLabel, { color: colors.muted }]}>Readiness</Text>
          </View>
          <View style={[styles.indexCard, { backgroundColor: colors.warning + "12" }]}>
            <Text style={[styles.indexValue, { color: colors.warning }]}>{report.peakIndex}</Text>
            <Text style={[styles.indexLabel, { color: colors.muted }]}>Peak Index</Text>
          </View>
        </View>

        {/* Risk */}
        {report.riskLevel && (
          <View style={[styles.riskCard, { backgroundColor: getRiskColor(report.riskLevel) + "12", borderColor: getRiskColor(report.riskLevel) + "30" }]}>
            <Text style={[styles.riskTitle, { color: getRiskColor(report.riskLevel) }]}>
              ระดับความเสี่ยง: {(report.riskLevel as string) === "high" ? "สูง" : (report.riskLevel as string) === "medium" ? "ปานกลาง" : "ต่ำ"}
            </Text>
            {report.riskType && (
              <Text style={[styles.riskType, { color: getRiskColor(report.riskLevel) }]}>
                ประเภท: {report.riskType}
              </Text>
            )}
          </View>
        )}

        {/* Summary */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>สรุปภาพรวม</Text>
          <Text style={[styles.sectionText, { color: colors.foreground }]}>{report.summary}</Text>
        </View>

        {/* Strengths */}
        {report.strengths && (
          <View style={[styles.section, { backgroundColor: colors.success + "08", borderColor: colors.success + "20" }]}>
            <Text style={[styles.sectionTitle, { color: colors.success }]}>จุดแข็ง</Text>
            <Text style={[styles.sectionText, { color: colors.foreground }]}>{report.strengths}</Text>
          </View>
        )}

        {/* Weaknesses */}
        {report.weaknesses && (
          <View style={[styles.section, { backgroundColor: colors.error + "08", borderColor: colors.error + "20" }]}>
            <Text style={[styles.sectionTitle, { color: colors.error }]}>จุดที่ต้องพัฒนา</Text>
            <Text style={[styles.sectionText, { color: colors.foreground }]}>{report.weaknesses}</Text>
          </View>
        )}

        {/* Action Plan */}
        {report.actionPlan && (
          <View style={[styles.section, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "20" }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>แผนพัฒนา</Text>
            <Text style={[styles.sectionText, { color: colors.foreground }]}>{report.actionPlan}</Text>
          </View>
        )}

        {/* Goals */}
        {report.goals && (
          <View style={[styles.section, { backgroundColor: colors.gold + "08", borderColor: colors.gold + "20" }]}>
            <Text style={[styles.sectionTitle, { color: colors.gold }]}>เป้าหมาย</Text>
            <Text style={[styles.sectionText, { color: colors.foreground }]}>{report.goals}</Text>
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
