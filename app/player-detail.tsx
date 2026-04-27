import { ScrollView, Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { demoPlayers, demoCheckins, demoEvaluations, demoMatches, demoReports, calculatePerformanceIndex, calculateRiskScore, getRiskColor } from "@/lib/demo-data";

export default function PlayerDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const playerId = parseInt(id || "1", 10);

  const player = demoPlayers.find(p => p.id === playerId) || demoPlayers[0];
  const checkins = demoCheckins.filter(c => c.playerId === playerId);
  const evals = demoEvaluations.filter(e => e.playerId === playerId);
  const matches = demoMatches.filter(m => m.playerId === playerId);
  const reports = demoReports.filter(r => r.playerId === playerId);
  const latestEval = evals[0];
  const risk = calculateRiskScore(checkins);
  const perfIndex = latestEval ? calculatePerformanceIndex(latestEval) : 0;
  const wins = matches.filter(m => m.result === "win").length;
  const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;

  return (
    <ScreenContainer edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Player Header */}
        <View style={styles.header}>
          <View style={[styles.avatarLarge, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{player.name.charAt(0)}</Text>
          </View>
          <Text style={[styles.playerName, { color: colors.foreground }]}>{player.name}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: colors.primary + "15" }]}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>{player.level}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.accent + "15" }]}>
              <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600" }}>{player.program}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: player.status === "injured" ? colors.error + "15" : colors.success + "15" }]}>
              <Text style={{ color: player.status === "injured" ? colors.error : colors.success, fontSize: 12, fontWeight: "600" }}>
                {player.status === "injured" ? "บาดเจ็บ" : "Active"}
              </Text>
            </View>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.primary + "12" }]}>
            <Text style={[styles.metricValue, { color: colors.primary }]}>{perfIndex}</Text>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>Performance</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: getRiskColor(risk.level) + "12" }]}>
            <Text style={[styles.metricValue, { color: getRiskColor(risk.level) }]}>{risk.score}%</Text>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>Risk</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.success + "12" }]}>
            <Text style={[styles.metricValue, { color: colors.success }]}>{winRate}%</Text>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>Win Rate</Text>
          </View>
        </View>

        {/* Latest Evaluation */}
        {latestEval && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>การประเมินล่าสุด</Text>
            <Text style={[styles.evalDate, { color: colors.muted }]}>{latestEval.evalDate}</Text>
            <View style={styles.evalGrid}>
              {[
                { label: "Technique", value: latestEval.technique },
                { label: "Fitness", value: latestEval.fitness },
                { label: "Tactics", value: latestEval.tactics },
                { label: "Mental", value: latestEval.mental },
                { label: "MatchIQ", value: latestEval.matchIQ },
                { label: "Discipline", value: latestEval.discipline },
              ].map((item) => (
                <View key={item.label} style={styles.evalItem}>
                  <Text style={[styles.evalScore, { color: colors.primary }]}>{item.value}</Text>
                  <Text style={[styles.evalLabel, { color: colors.muted }]}>{item.label}</Text>
                </View>
              ))}
            </View>
            {latestEval.strengthNote && (
              <View style={[styles.noteBox, { backgroundColor: colors.success + "08" }]}>
                <Text style={[styles.noteTitle, { color: colors.success }]}>จุดแข็ง</Text>
                <Text style={[styles.noteText, { color: colors.foreground }]}>{latestEval.strengthNote}</Text>
              </View>
            )}
            {latestEval.weaknessNote && (
              <View style={[styles.noteBox, { backgroundColor: colors.error + "08" }]}>
                <Text style={[styles.noteTitle, { color: colors.error }]}>จุดที่ต้องพัฒนา</Text>
                <Text style={[styles.noteText, { color: colors.foreground }]}>{latestEval.weaknessNote}</Text>
              </View>
            )}
          </View>
        )}

        {/* Recent Check-ins */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>เช็คอินล่าสุด ({checkins.length})</Text>
          {checkins.slice(0, 3).map((ci) => (
            <View key={ci.id} style={[styles.checkinRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.checkinDate, { color: colors.foreground }]}>{ci.checkinDate}</Text>
              <View style={styles.checkinMetrics}>
                <Text style={{ color: colors.warning, fontSize: 12 }}>เหนื่อย {ci.fatigue}</Text>
                <Text style={{ color: colors.primary, fontSize: 12 }}>มั่นใจ {ci.confidence}</Text>
                <Text style={{ color: colors.error, fontSize: 12 }}>เครียด {ci.stress}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Match History */}
        {matches.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>ผลแข่งขัน ({wins}W / {matches.length - wins}L)</Text>
            {matches.slice(0, 3).map((m) => (
              <View key={m.id} style={[styles.matchRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.resultDot, { backgroundColor: m.result === "win" ? colors.success : colors.error }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.matchScore, { color: colors.foreground }]}>{m.score}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>vs {m.opponent}</Text>
                </View>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{m.matchDate}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Latest Report */}
        {reports.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>รายงานล่าสุด</Text>
            <Text style={[styles.reportSummary, { color: colors.foreground }]}>{reports[0].summary}</Text>
            {reports[0].actionPlan && (
              <View style={[styles.noteBox, { backgroundColor: colors.primary + "08" }]}>
                <Text style={[styles.noteTitle, { color: colors.primary }]}>แผนพัฒนา</Text>
                <Text style={[styles.noteText, { color: colors.foreground }]}>{reports[0].actionPlan}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 48 },
  header: { alignItems: "center", marginBottom: 20 },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  avatarText: { fontSize: 28, fontWeight: "700" },
  playerName: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  badges: { flexDirection: "row", gap: 8 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  metricsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  metricCard: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" },
  metricValue: { fontSize: 22, fontWeight: "700" },
  metricLabel: { fontSize: 11, marginTop: 2 },
  card: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  evalDate: { fontSize: 12, marginBottom: 12 },
  evalGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 12 },
  evalItem: { alignItems: "center", width: "30%", marginBottom: 10 },
  evalScore: { fontSize: 20, fontWeight: "700" },
  evalLabel: { fontSize: 11, marginTop: 2 },
  noteBox: { padding: 12, borderRadius: 10, marginTop: 8 },
  noteTitle: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  noteText: { fontSize: 13, lineHeight: 20 },
  checkinRow: { paddingVertical: 10, borderBottomWidth: 0.5 },
  checkinDate: { fontSize: 14, fontWeight: "500", marginBottom: 4 },
  checkinMetrics: { flexDirection: "row", gap: 12 },
  matchRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5 },
  resultDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  matchScore: { fontSize: 15, fontWeight: "600" },
  reportSummary: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
});
