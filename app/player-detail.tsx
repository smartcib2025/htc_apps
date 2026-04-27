import { ScrollView, Text, View, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

function calcPerfIndex(ev: any) {
  if (!ev) return 0;
  const scores = [ev.technique, ev.fitness, ev.tactics, ev.mental, ev.matchIQ].filter(Boolean) as number[];
  return scores.length > 0 ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10 : 0;
}

export default function PlayerDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const playerId = parseInt(id || "1", 10);

  const { data: allPlayers = [], isLoading: lp } = trpc.players.all.useQuery();
  const { data: checkins = [], isLoading: lc } = trpc.checkins.byPlayer.useQuery({ playerId, limit: 10 });
  const { data: evals = [], isLoading: le } = trpc.evaluations.byPlayer.useQuery({ playerId, limit: 5 });
  const { data: matches = [], isLoading: lm } = trpc.matches.byPlayer.useQuery({ playerId, limit: 10 });
  const { data: reports = [], isLoading: lr } = trpc.reports.byPlayer.useQuery({ playerId, limit: 3 });

  const player = useMemo(() => allPlayers.find((p: any) => p.id === playerId) || { name: "...", level: "", program: "", status: "active" }, [allPlayers, playerId]);
  const latestEval = evals[0] as any;
  const perfIndex = latestEval ? calcPerfIndex(latestEval) : 0;
  const wins = useMemo(() => matches.filter((m: any) => m.result === "win").length, [matches]);
  const winRate = useMemo(() => matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0, [wins, matches]);

  if (lp || lc || le || lm || lr) {
    return (
      <ScreenContainer edges={["left", "right"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, marginTop: 12 }}>กำลังโหลดข้อมูล...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={[styles.avatarLarge, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{(player as any).name?.charAt(0) || "?"}</Text>
          </View>
          <Text style={[styles.playerName, { color: colors.foreground }]}>{(player as any).name}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: colors.primary + "15" }]}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>{(player as any).level}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.warning + "15" }]}>
              <Text style={{ color: colors.warning, fontSize: 12, fontWeight: "600" }}>{(player as any).program}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: (player as any).status === "injured" ? colors.error + "15" : colors.success + "15" }]}>
              <Text style={{ color: (player as any).status === "injured" ? colors.error : colors.success, fontSize: 12, fontWeight: "600" }}>
                {(player as any).status === "injured" ? "บาดเจ็บ" : "Active"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.primary + "12" }]}>
            <Text style={[styles.metricValue, { color: colors.primary }]}>{perfIndex}</Text>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>Performance</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.success + "12" }]}>
            <Text style={[styles.metricValue, { color: colors.success }]}>{winRate}%</Text>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>Win Rate</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.warning + "12" }]}>
            <Text style={[styles.metricValue, { color: colors.warning }]}>{checkins.length}</Text>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>Check-ins</Text>
          </View>
        </View>

        {latestEval && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>การประเมินล่าสุด</Text>
            <Text style={[styles.evalDate, { color: colors.muted }]}>{String(latestEval.evalDate)}</Text>
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

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>เช็คอินล่าสุด ({checkins.length})</Text>
          {checkins.slice(0, 3).map((ci: any) => (
            <View key={ci.id} style={[styles.checkinRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.checkinDate, { color: colors.foreground }]}>{String(ci.checkinDate)}</Text>
              <View style={styles.checkinMetrics}>
                <Text style={{ color: colors.warning, fontSize: 12 }}>เหนื่อย {ci.fatigue}</Text>
                <Text style={{ color: colors.primary, fontSize: 12 }}>มั่นใจ {ci.confidence}</Text>
                <Text style={{ color: colors.error, fontSize: 12 }}>เครียด {ci.stress}</Text>
              </View>
            </View>
          ))}
          {checkins.length === 0 && <Text style={{ color: colors.muted, fontSize: 13 }}>ยังไม่มีข้อมูลเช็คอิน</Text>}
        </View>

        {matches.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>ผลแข่งขัน ({wins}W / {matches.length - wins}L)</Text>
            {matches.slice(0, 3).map((m: any) => (
              <View key={m.id} style={[styles.matchRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.resultDot, { backgroundColor: m.result === "win" ? colors.success : colors.error }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.matchScoreText, { color: colors.foreground }]}>{m.score}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>vs {m.opponent}</Text>
                </View>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{String(m.matchDate)}</Text>
              </View>
            ))}
          </View>
        )}

        {reports.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>รายงานล่าสุด</Text>
            <Text style={[styles.reportSummary, { color: colors.foreground }]}>{(reports[0] as any).summary}</Text>
            {(reports[0] as any).actionPlan && (
              <View style={[styles.noteBox, { backgroundColor: colors.primary + "08" }]}>
                <Text style={[styles.noteTitle, { color: colors.primary }]}>แผนพัฒนา</Text>
                <Text style={[styles.noteText, { color: colors.foreground }]}>{(reports[0] as any).actionPlan}</Text>
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
  matchScoreText: { fontSize: 15, fontWeight: "600" },
  reportSummary: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
});
