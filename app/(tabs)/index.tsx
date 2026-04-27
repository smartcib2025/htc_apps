import { ScrollView, Text, View, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppContext } from "@/lib/app-context";
import { demoPlayers, demoCheckins, demoEvaluations, demoReports, demoCoaches, calculatePerformanceIndex, calculateRiskScore, getRiskColor } from "@/lib/demo-data";

function PlayerHome() {
  const colors = useColors();
  const router = useRouter();
  const { userName } = useAppContext();
  const player = demoPlayers[0];
  const recentCheckins = demoCheckins.filter(c => c.playerId === player.id);
  const latestEval = demoEvaluations.find(e => e.playerId === player.id);
  const risk = calculateRiskScore(recentCheckins);
  const perfIndex = latestEval ? calculatePerformanceIndex(latestEval) : 0;
  const todayCheckin = recentCheckins.find(c => c.checkinDate === new Date().toISOString().split("T")[0]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.welcomeSection}>
        <Text style={[styles.greeting, { color: colors.muted }]}>สวัสดี</Text>
        <Text style={[styles.userName, { color: colors.foreground }]}>{userName || player.name}</Text>
        <Text style={[styles.levelBadge, { backgroundColor: colors.primary + "20", color: colors.primary }]}>
          {player.level} · {player.program}
        </Text>
      </View>

      {/* Quick Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{perfIndex}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Performance</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.success + "15" }]}>
          <Text style={[styles.statValue, { color: colors.success }]}>{recentCheckins.length}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>เช็คอินสัปดาห์นี้</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: getRiskColor(risk.level) + "15" }]}>
          <Text style={[styles.statValue, { color: getRiskColor(risk.level) }]}>{risk.score}%</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Risk Score</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.warning + "15" }]}>
          <Text style={[styles.statValue, { color: colors.warning }]}>
            {recentCheckins.reduce((s, c) => s + (c.trainingHours || 0), 0)}h
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>ชั่วโมงฝึกซ้อม</Text>
        </View>
      </ScrollView>

      {/* Today's Check-in */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>เช็คอินวันนี้</Text>
          {todayCheckin ? (
            <View style={[styles.badge, { backgroundColor: colors.success + "20" }]}>
              <Text style={{ color: colors.success, fontSize: 12, fontWeight: "600" }}>เช็คอินแล้ว</Text>
            </View>
          ) : (
            <View style={[styles.badge, { backgroundColor: colors.warning + "20" }]}>
              <Text style={{ color: colors.warning, fontSize: 12, fontWeight: "600" }}>ยังไม่เช็คอิน</Text>
            </View>
          )}
        </View>
        {!todayCheckin && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/checkin")}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>เช็คอินเลย</Text>
          </TouchableOpacity>
        )}
        {todayCheckin && (
          <View style={styles.checkinSummary}>
            <View style={styles.checkinRow}>
              <Text style={[styles.checkinLabel, { color: colors.muted }]}>ชั่วโมงฝึก</Text>
              <Text style={[styles.checkinValue, { color: colors.foreground }]}>{todayCheckin.trainingHours}h</Text>
            </View>
            <View style={styles.checkinRow}>
              <Text style={[styles.checkinLabel, { color: colors.muted }]}>ความเหนื่อย</Text>
              <Text style={[styles.checkinValue, { color: colors.foreground }]}>{todayCheckin.fatigue}/10</Text>
            </View>
            <View style={styles.checkinRow}>
              <Text style={[styles.checkinLabel, { color: colors.muted }]}>ความมั่นใจ</Text>
              <Text style={[styles.checkinValue, { color: colors.foreground }]}>{todayCheckin.confidence}/10</Text>
            </View>
          </View>
        )}
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
            ].map((item) => (
              <View key={item.label} style={styles.evalItem}>
                <Text style={[styles.evalScore, { color: colors.primary }]}>{item.value}</Text>
                <Text style={[styles.evalLabel, { color: colors.muted }]}>{item.label}</Text>
              </View>
            ))}
          </View>
          {latestEval.coachComment && (
            <View style={[styles.commentBox, { backgroundColor: colors.primary + "08" }]}>
              <Text style={[styles.commentText, { color: colors.foreground }]}>
                "{latestEval.coachComment}"
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function CoachHome() {
  const colors = useColors();
  const router = useRouter();
  const { userName } = useAppContext();
  const myPlayers = demoPlayers.filter(p => p.coachId === 1);
  const todayStr = new Date().toISOString().split("T")[0];
  const todayCheckins = demoCheckins.filter(c => c.checkinDate === todayStr);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.welcomeSection}>
        <Text style={[styles.greeting, { color: colors.muted }]}>สวัสดี</Text>
        <Text style={[styles.userName, { color: colors.foreground }]}>{userName}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{myPlayers.length}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>นักกีฬาในทีม</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.success + "15" }]}>
          <Text style={[styles.statValue, { color: colors.success }]}>{todayCheckins.length}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>เช็คอินวันนี้</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.warning + "15" }]}>
          <Text style={[styles.statValue, { color: colors.warning }]}>
            {myPlayers.filter(p => p.status === "injured").length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>บาดเจ็บ</Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.bigActionBtn, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/evaluate")}
        activeOpacity={0.8}
      >
        <Text style={styles.bigActionText}>ประเมินนักกีฬา</Text>
      </TouchableOpacity>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>นักกีฬาในทีม</Text>
        {myPlayers.map((player) => {
          const pCheckins = demoCheckins.filter(c => c.playerId === player.id);
          const risk = calculateRiskScore(pCheckins);
          return (
            <TouchableOpacity
              key={player.id}
              style={[styles.playerRow, { borderBottomColor: colors.border }]}
              onPress={() => router.push({ pathname: "/player-detail", params: { id: player.id.toString() } })}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {player.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { color: colors.foreground }]}>{player.name}</Text>
                <Text style={[styles.playerLevel, { color: colors.muted }]}>{player.level} · {player.program}</Text>
              </View>
              <View style={[styles.riskBadge, { backgroundColor: getRiskColor(risk.level) + "20" }]}>
                <Text style={{ color: getRiskColor(risk.level), fontSize: 11, fontWeight: "600" }}>
                  {risk.level === "high" ? "สูง" : risk.level === "medium" ? "กลาง" : "ต่ำ"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

function HeadCoachDashboard() {
  const colors = useColors();
  const { userName } = useAppContext();
  const router = useRouter();
  const totalPlayers = demoPlayers.length;
  const activePlayers = demoPlayers.filter(p => p.status === "active").length;
  const injuredPlayers = demoPlayers.filter(p => p.status === "injured").length;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayCheckins = demoCheckins.filter(c => c.checkinDate === todayStr);

  const highRiskPlayers = demoPlayers.filter(p => {
    const pCheckins = demoCheckins.filter(c => c.playerId === p.id);
    const risk = calculateRiskScore(pCheckins);
    return risk.level === "high" || risk.level === "medium";
  });

  const avgPerf = demoEvaluations.length > 0
    ? Math.round(demoEvaluations.reduce((s, e) => s + calculatePerformanceIndex(e), 0) / demoEvaluations.length * 10) / 10
    : 0;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.welcomeSection}>
        <Text style={[styles.greeting, { color: colors.muted }]}>Dashboard</Text>
        <Text style={[styles.userName, { color: colors.foreground }]}>{userName}</Text>
      </View>

      {/* Command Center Stats */}
      <View style={styles.dashGrid}>
        <View style={[styles.dashCard, { backgroundColor: colors.primary + "12" }]}>
          <Text style={[styles.dashValue, { color: colors.primary }]}>{totalPlayers}</Text>
          <Text style={[styles.dashLabel, { color: colors.muted }]}>นักกีฬาทั้งหมด</Text>
        </View>
        <View style={[styles.dashCard, { backgroundColor: colors.success + "12" }]}>
          <Text style={[styles.dashValue, { color: colors.success }]}>{activePlayers}</Text>
          <Text style={[styles.dashLabel, { color: colors.muted }]}>Active</Text>
        </View>
        <View style={[styles.dashCard, { backgroundColor: colors.error + "12" }]}>
          <Text style={[styles.dashValue, { color: colors.error }]}>{injuredPlayers}</Text>
          <Text style={[styles.dashLabel, { color: colors.muted }]}>บาดเจ็บ</Text>
        </View>
        <View style={[styles.dashCard, { backgroundColor: colors.warning + "12" }]}>
          <Text style={[styles.dashValue, { color: colors.warning }]}>{avgPerf}</Text>
          <Text style={[styles.dashLabel, { color: colors.muted }]}>Avg Performance</Text>
        </View>
      </View>

      {/* Today's Activity */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>กิจกรรมวันนี้</Text>
        <View style={styles.activityRow}>
          <Text style={[styles.activityLabel, { color: colors.muted }]}>เช็คอินแล้ว</Text>
          <Text style={[styles.activityValue, { color: colors.primary }]}>
            {todayCheckins.length}/{totalPlayers}
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${(todayCheckins.length / totalPlayers) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Risk Alerts */}
      {highRiskPlayers.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.error + "08", borderColor: colors.error + "30" }]}>
          <Text style={[styles.cardTitle, { color: colors.error }]}>
            แจ้งเตือนความเสี่ยง ({highRiskPlayers.length})
          </Text>
          {highRiskPlayers.map((player) => {
            const pCheckins = demoCheckins.filter(c => c.playerId === player.id);
            const risk = calculateRiskScore(pCheckins);
            return (
              <TouchableOpacity
                key={player.id}
                style={[styles.playerRow, { borderBottomColor: colors.border }]}
                onPress={() => router.push({ pathname: "/player-detail", params: { id: player.id.toString() } })}
                activeOpacity={0.7}
              >
                <View style={[styles.avatar, { backgroundColor: getRiskColor(risk.level) + "20" }]}>
                  <Text style={[styles.avatarText, { color: getRiskColor(risk.level) }]}>
                    {player.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={[styles.playerName, { color: colors.foreground }]}>{player.name}</Text>
                  <Text style={[styles.playerLevel, { color: colors.muted }]}>Risk: {risk.score}%</Text>
                </View>
                <View style={[styles.riskBadge, { backgroundColor: getRiskColor(risk.level) + "20" }]}>
                  <Text style={{ color: getRiskColor(risk.level), fontSize: 11, fontWeight: "600" }}>
                    {risk.level === "high" ? "สูง" : "กลาง"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Coaches Overview */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>โค้ชในสถาบัน</Text>
        {demoCoaches.map((coach) => {
          const coachPlayers = demoPlayers.filter(p => p.coachId === coach.id);
          return (
            <View key={coach.id} style={[styles.playerRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.avatar, { backgroundColor: colors.accent + "20" }]}>
                <Text style={[styles.avatarText, { color: colors.accent }]}>
                  {coach.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { color: colors.foreground }]}>{coach.name}</Text>
                <Text style={[styles.playerLevel, { color: colors.muted }]}>
                  {coach.specialty} · {coachPlayers.length} นักกีฬา
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

export default function HomeScreen() {
  const { role } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <ScreenContainer className="flex-1">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {role === "player" && <PlayerHome />}
        {role === "coach" && <CoachHome />}
        {(role === "head_coach" || role === "admin") && <HeadCoachDashboard />}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 24 },
  welcomeSection: { padding: 20, paddingBottom: 8 },
  greeting: { fontSize: 14, marginBottom: 2 },
  userName: { fontSize: 26, fontWeight: "700", marginBottom: 6 },
  levelBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, fontSize: 13, fontWeight: "600", overflow: "hidden" },
  statsRow: { paddingHorizontal: 16, marginBottom: 16 },
  statCard: { padding: 16, borderRadius: 14, marginRight: 10, minWidth: 120, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "700" },
  statLabel: { fontSize: 12, marginTop: 4 },
  card: { marginHorizontal: 16, marginBottom: 14, padding: 18, borderRadius: 14, borderWidth: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 17, fontWeight: "600", marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  actionBtn: { padding: 14, borderRadius: 10, alignItems: "center" },
  actionBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  bigActionBtn: { marginHorizontal: 16, marginBottom: 14, padding: 16, borderRadius: 14, alignItems: "center" },
  bigActionText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  checkinSummary: { gap: 8 },
  checkinRow: { flexDirection: "row", justifyContent: "space-between" },
  checkinLabel: { fontSize: 14 },
  checkinValue: { fontSize: 14, fontWeight: "600" },
  evalDate: { fontSize: 13, marginBottom: 12 },
  evalGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  evalItem: { alignItems: "center", flex: 1 },
  evalScore: { fontSize: 22, fontWeight: "700" },
  evalLabel: { fontSize: 11, marginTop: 2 },
  commentBox: { padding: 12, borderRadius: 10, marginTop: 4 },
  commentText: { fontSize: 13, fontStyle: "italic", lineHeight: 20 },
  playerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.5 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: "700" },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 15, fontWeight: "600" },
  playerLevel: { fontSize: 12, marginTop: 2 },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  dashGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, marginBottom: 8 },
  dashCard: { width: "46%", margin: "2%", padding: 16, borderRadius: 14, alignItems: "center" },
  dashValue: { fontSize: 28, fontWeight: "700" },
  dashLabel: { fontSize: 12, marginTop: 4, textAlign: "center" },
  activityRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  activityLabel: { fontSize: 14 },
  activityValue: { fontSize: 14, fontWeight: "600" },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
});
