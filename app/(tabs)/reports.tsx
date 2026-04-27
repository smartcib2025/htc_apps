import { ScrollView, Text, View, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppContext } from "@/lib/app-context";
import { trpc } from "@/lib/trpc";

function getRiskColor(level: string) {
  if (level === "high") return "#EF4444";
  if (level === "medium") return "#F59E0B";
  return "#22C55E";
}

export default function ReportsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { role, profileId } = useAppContext();
  const playerId = profileId || 1;

  // For players: show only their reports. For coaches/admin: show all players' reports
  const { data: playerReports = [], isLoading: l1 } = trpc.reports.byPlayer.useQuery({ playerId, limit: 20 }, { enabled: role === "player" });
  const { data: allPlayers = [], isLoading: l2 } = trpc.players.all.useQuery(undefined, { enabled: role !== "player" });

  const isLoading = role === "player" ? l1 : l2;
  const reports = role === "player" ? playerReports : [];

  // For non-player roles, we'll show a combined view
  if (isLoading) {
    return (
      <ScreenContainer className="flex-1">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.foreground }]}>รายงาน</Text>

        {role === "player" ? (
          <>
            {reports.map((report: any) => (
              <TouchableOpacity
                key={report.id}
                style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: "/report-detail" as any, params: { id: report.id.toString() } })}
                activeOpacity={0.7}
              >
                <View style={styles.reportHeader}>
                  <View>
                    <Text style={[styles.reportType, { color: colors.primary }]}>
                      {report.reportType === "weekly" ? "รายงานประจำสัปดาห์" : report.reportType === "monthly" ? "รายงานประจำเดือน" : "รายงานทัวร์นาเมนต์"}
                    </Text>
                    <Text style={[styles.reportDate, { color: colors.muted }]}>{String(report.generatedAt)}</Text>
                  </View>
                  {report.riskLevel && (
                    <View style={[styles.riskBadge, { backgroundColor: getRiskColor(String(report.riskLevel)) + "20" }]}>
                      <Text style={{ color: getRiskColor(String(report.riskLevel)), fontSize: 11, fontWeight: "600" }}>
                        Risk: {String(report.riskLevel) === "high" ? "สูง" : String(report.riskLevel) === "medium" ? "กลาง" : "ต่ำ"}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.summary, { color: colors.foreground }]} numberOfLines={2}>{report.summary}</Text>
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
            ))}
            {reports.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.muted }]}>ยังไม่มีรายงาน</Text>
              </View>
            )}
          </>
        ) : (
          <>
            {allPlayers.map((player: any) => (
              <PlayerReportCard key={player.id} player={player} colors={colors} router={router} />
            ))}
            {allPlayers.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.muted }]}>ยังไม่มีนักกีฬา</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function PlayerReportCard({ player, colors, router }: { player: any; colors: any; router: any }) {
  const { data: reports = [] } = trpc.reports.byPlayer.useQuery({ playerId: player.id, limit: 3 });
  const latestReport = reports[0];

  return (
    <View style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.playerName, { color: colors.foreground }]}>{player.name}</Text>
      {latestReport ? (
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/report-detail" as any, params: { id: latestReport.id.toString() } })}
          activeOpacity={0.7}
        >
          <View style={styles.reportHeader}>
            <View>
              <Text style={[styles.reportType, { color: colors.primary }]}>
                {latestReport.reportType === "weekly" ? "รายงานประจำสัปดาห์" : latestReport.reportType === "monthly" ? "รายงานประจำเดือน" : "รายงานทัวร์นาเมนต์"}
              </Text>
              <Text style={[styles.reportDate, { color: colors.muted }]}>{String(latestReport.generatedAt)}</Text>
            </View>
            {latestReport.riskLevel && (
              <View style={[styles.riskBadge, { backgroundColor: getRiskColor(String(latestReport.riskLevel)) + "20" }]}>
                <Text style={{ color: getRiskColor(String(latestReport.riskLevel)), fontSize: 11, fontWeight: "600" }}>
                  Risk: {String(latestReport.riskLevel) === "high" ? "สูง" : String(latestReport.riskLevel) === "medium" ? "กลาง" : "ต่ำ"}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.summary, { color: colors.foreground }]} numberOfLines={2}>{latestReport.summary}</Text>
          <View style={styles.indexRow}>
            <View style={styles.indexItem}>
              <Text style={[styles.indexValue, { color: colors.primary }]}>{latestReport.performanceIndex}</Text>
              <Text style={[styles.indexLabel, { color: colors.muted }]}>Performance</Text>
            </View>
            <View style={styles.indexItem}>
              <Text style={[styles.indexValue, { color: colors.success }]}>{latestReport.readinessIndex}</Text>
              <Text style={[styles.indexLabel, { color: colors.muted }]}>Readiness</Text>
            </View>
            <View style={styles.indexItem}>
              <Text style={[styles.indexValue, { color: colors.warning }]}>{latestReport.peakIndex}</Text>
              <Text style={[styles.indexLabel, { color: colors.muted }]}>Peak Index</Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>ยังไม่มีรายงาน</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 16 },
  reportCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  reportHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  playerName: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
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
