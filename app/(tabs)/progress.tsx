import { ScrollView, Text, View, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { demoCheckins, demoEvaluations, demoMatches, calculatePerformanceIndex } from "@/lib/demo-data";

export default function ProgressScreen() {
  const colors = useColors();
  const playerId = 1;
  const checkins = demoCheckins.filter(c => c.playerId === playerId);
  const evals = demoEvaluations.filter(e => e.playerId === playerId);
  const matches = demoMatches.filter(m => m.playerId === playerId);
  const wins = matches.filter(m => m.result === "win").length;
  const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.foreground }]}>ความก้าวหน้า</Text>

        {/* Win Rate */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>สถิติการแข่งขัน</Text>
          <View style={styles.winRateRow}>
            <View style={styles.winRateCircle}>
              <Text style={[styles.winRateValue, { color: colors.primary }]}>{winRate}%</Text>
              <Text style={[styles.winRateLabel, { color: colors.muted }]}>Win Rate</Text>
            </View>
            <View style={styles.winStats}>
              <View style={styles.winStatItem}>
                <Text style={[styles.winStatValue, { color: colors.success }]}>{wins}</Text>
                <Text style={[styles.winStatLabel, { color: colors.muted }]}>ชนะ</Text>
              </View>
              <View style={styles.winStatItem}>
                <Text style={[styles.winStatValue, { color: colors.error }]}>{matches.length - wins}</Text>
                <Text style={[styles.winStatLabel, { color: colors.muted }]}>แพ้</Text>
              </View>
              <View style={styles.winStatItem}>
                <Text style={[styles.winStatValue, { color: colors.foreground }]}>{matches.length}</Text>
                <Text style={[styles.winStatLabel, { color: colors.muted }]}>ทั้งหมด</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Performance Trend */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>แนวโน้มการประเมิน</Text>
          {evals.map((ev, idx) => {
            const perf = calculatePerformanceIndex(ev);
            return (
              <View key={ev.id} style={[styles.evalRow, idx < evals.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
                <Text style={[styles.evalDate, { color: colors.muted }]}>{ev.evalDate}</Text>
                <View style={styles.evalBars}>
                  {[
                    { label: "Tech", value: ev.technique, color: colors.primary },
                    { label: "Fit", value: ev.fitness, color: colors.success },
                    { label: "Tac", value: ev.tactics, color: colors.warning },
                    { label: "Men", value: ev.mental, color: colors.accent },
                    { label: "IQ", value: ev.matchIQ, color: colors.gold },
                  ].map((item) => (
                    <View key={item.label} style={styles.barItem}>
                      <View style={[styles.barBg, { backgroundColor: colors.border }]}>
                        <View style={[styles.barFill, { backgroundColor: item.color, height: `${(item.value || 0) * 10}%` }]} />
                      </View>
                      <Text style={[styles.barLabel, { color: colors.muted }]}>{item.label}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.perfScore, { color: colors.primary }]}>{perf}</Text>
              </View>
            );
          })}
        </View>

        {/* Check-in History */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>ประวัติเช็คอิน</Text>
          {checkins.map((ci, idx) => (
            <View key={ci.id} style={[styles.checkinItem, idx < checkins.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
              <View style={styles.checkinHeader}>
                <Text style={[styles.checkinDate, { color: colors.foreground }]}>{ci.checkinDate}</Text>
                <Text style={[styles.checkinHours, { color: colors.primary }]}>{ci.trainingHours}h</Text>
              </View>
              <View style={styles.checkinMetrics}>
                <View style={[styles.metricPill, { backgroundColor: colors.warning + "15" }]}>
                  <Text style={[styles.metricText, { color: colors.warning }]}>เหนื่อย {ci.fatigue}/10</Text>
                </View>
                <View style={[styles.metricPill, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={[styles.metricText, { color: colors.primary }]}>มั่นใจ {ci.confidence}/10</Text>
                </View>
                <View style={[styles.metricPill, { backgroundColor: colors.error + "15" }]}>
                  <Text style={[styles.metricText, { color: colors.error }]}>เครียด {ci.stress}/10</Text>
                </View>
              </View>
              {ci.nextGoal && (
                <Text style={[styles.goalText, { color: colors.muted }]}>เป้าหมาย: {ci.nextGoal}</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 16 },
  card: { padding: 18, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  cardTitle: { fontSize: 17, fontWeight: "600", marginBottom: 12 },
  winRateRow: { flexDirection: "row", alignItems: "center" },
  winRateCircle: { alignItems: "center", marginRight: 24, width: 80 },
  winRateValue: { fontSize: 32, fontWeight: "700" },
  winRateLabel: { fontSize: 12 },
  winStats: { flexDirection: "row", flex: 1, justifyContent: "space-around" },
  winStatItem: { alignItems: "center" },
  winStatValue: { fontSize: 22, fontWeight: "700" },
  winStatLabel: { fontSize: 12, marginTop: 2 },
  evalRow: { paddingVertical: 12 },
  evalDate: { fontSize: 13, marginBottom: 8 },
  evalBars: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  barItem: { alignItems: "center", flex: 1 },
  barBg: { width: 20, height: 60, borderRadius: 4, overflow: "hidden", justifyContent: "flex-end" },
  barFill: { width: "100%", borderRadius: 4 },
  barLabel: { fontSize: 10, marginTop: 4 },
  perfScore: { fontSize: 14, fontWeight: "700", textAlign: "right" },
  checkinItem: { paddingVertical: 12 },
  checkinHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  checkinDate: { fontSize: 14, fontWeight: "600" },
  checkinHours: { fontSize: 14, fontWeight: "600" },
  checkinMetrics: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  metricPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  metricText: { fontSize: 12, fontWeight: "500" },
  goalText: { fontSize: 13, marginTop: 4, fontStyle: "italic" },
});
