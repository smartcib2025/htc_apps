import { ScrollView, Text, View, StyleSheet, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppContext } from "@/lib/app-context";
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

function calcPerfIndex(ev: any) {
  if (!ev) return 0;
  const scores = [ev.technique, ev.fitness, ev.tactics, ev.mental, ev.matchIQ].filter(Boolean) as number[];
  return scores.length > 0 ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10 : 0;
}

export default function ProgressScreen() {
  const colors = useColors();
  const { profileId } = useAppContext();
  const playerId = profileId || 1;

  const { data: checkins = [], isLoading: l1 } = trpc.checkins.byPlayer.useQuery({ playerId, limit: 30 });
  const { data: evals = [], isLoading: l2 } = trpc.evaluations.byPlayer.useQuery({ playerId, limit: 20 });
  const { data: matches = [], isLoading: l3 } = trpc.matches.byPlayer.useQuery({ playerId, limit: 20 });

  const wins = useMemo(() => matches.filter((m: any) => m.result === "win").length, [matches]);
  const winRate = useMemo(() => matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0, [wins, matches]);

  if (l1 || l2 || l3) {
    return (
      <ScreenContainer className="flex-1">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, marginTop: 12 }}>กำลังโหลดข้อมูล...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.foreground }]}>ความก้าวหน้า</Text>
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
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>แนวโน้มการประเมิน</Text>
          {evals.length === 0 && <Text style={{ color: colors.muted, fontSize: 14 }}>ยังไม่มีข้อมูลการประเมิน</Text>}
          {evals.map((ev: any, idx: number) => {
            const perf = calcPerfIndex(ev);
            return (
              <View key={ev.id} style={[styles.evalRow, idx < evals.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
                <Text style={[styles.evalDate, { color: colors.muted }]}>{String(ev.evalDate)}</Text>
                <View style={styles.evalBars}>
                  {[
                    { label: "Tech", value: ev.technique, color: colors.primary },
                    { label: "Fit", value: ev.fitness, color: colors.success },
                    { label: "Tac", value: ev.tactics, color: colors.warning },
                    { label: "Men", value: ev.mental, color: colors.primary },
                    { label: "IQ", value: ev.matchIQ, color: colors.warning },
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
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>ประวัติเช็คอิน</Text>
          {checkins.length === 0 && <Text style={{ color: colors.muted, fontSize: 14 }}>ยังไม่มีข้อมูลเช็คอิน</Text>}
          {checkins.map((ci: any, idx: number) => (
            <View key={ci.id} style={[styles.checkinItem, idx < checkins.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
              <View style={styles.checkinHeader}>
                <Text style={[styles.checkinDate, { color: colors.foreground }]}>{String(ci.checkinDate)}</Text>
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
