import { ScrollView, Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppContext } from "@/lib/app-context";
import { demoReports, demoPlayers, getRiskColor } from "@/lib/demo-data";

export default function ReportsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { role } = useAppContext();

  const reports = role === "player"
    ? demoReports.filter(r => r.playerId === 1)
    : demoReports;

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.foreground }]}>รายงาน</Text>

        {reports.map((report) => {
          const player = demoPlayers.find(p => p.id === report.playerId);
          return (
            <TouchableOpacity
              key={report.id}
              style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/report-detail" as any, params: { id: report.id.toString() } })}
              activeOpacity={0.7}
            >
              <View style={styles.reportHeader}>
                <View>
                  {role !== "player" && (
                    <Text style={[styles.playerName, { color: colors.foreground }]}>{player?.name}</Text>
                  )}
                  <Text style={[styles.reportType, { color: colors.primary }]}>
                    {report.reportType === "weekly" ? "รายงานประจำสัปดาห์" : report.reportType === "monthly" ? "รายงานประจำเดือน" : "รายงานทัวร์นาเมนต์"}
                  </Text>
                  <Text style={[styles.reportDate, { color: colors.muted }]}>{report.generatedAt}</Text>
                </View>
                {report.riskLevel && (
                  <View style={[styles.riskBadge, { backgroundColor: getRiskColor(report.riskLevel) + "20" }]}>
                    <Text style={{ color: getRiskColor(report.riskLevel), fontSize: 11, fontWeight: "600" }}>
                      Risk: {(report.riskLevel as string) === "high" ? "สูง" : (report.riskLevel as string) === "medium" ? "กลาง" : "ต่ำ"}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.summary, { color: colors.foreground }]} numberOfLines={2}>
                {report.summary}
              </Text>

              <View style={styles.indexRow}>
                <View style={styles.indexItem}>
                  <Text style={[styles.indexValue, { color: colors.primary }]}>{report.performanceIndex}</Text>
                  <Text style={[styles.indexLabel, { color: colors.muted }]}>Performance</Text>
                </View>
                <View style={styles.indexItem}>
                  <Text style={[styles.indexValue, { color: colors.success }]}>{report.readinessIndex}</Text>
                  <Text style={[styles.indexLabel, { color: colors.muted }]}>Readiness</Text>
                </View>
                <View style={styles.indexItem}>
                  <Text style={[styles.indexValue, { color: colors.warning }]}>{report.peakIndex}</Text>
                  <Text style={[styles.indexLabel, { color: colors.muted }]}>Peak Index</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {reports.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>ยังไม่มีรายงาน</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 16 },
  reportCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  reportHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  playerName: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  reportType: { fontSize: 14, fontWeight: "500" },
  reportDate: { fontSize: 12, marginTop: 2 },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  summary: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  indexRow: { flexDirection: "row", justifyContent: "space-around", paddingTop: 12, borderTopWidth: 0.5, borderTopColor: "#E0E0E0" },
  indexItem: { alignItems: "center" },
  indexValue: { fontSize: 20, fontWeight: "700" },
  indexLabel: { fontSize: 11, marginTop: 2 },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyText: { fontSize: 16 },
});
