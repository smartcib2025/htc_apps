import { ScrollView, Text, View, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useState, useCallback, useMemo } from "react";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppContext } from "@/lib/app-context";
import { trpc } from "@/lib/trpc";

function getRiskColor(level: string) {
  if (level === "high") return "#EF4444";
  if (level === "medium") return "#F59E0B";
  return "#22C55E";
}

function calcRiskFromCheckins(checkins: any[]) {
  if (!checkins || checkins.length === 0) return { score: 0, level: "low" };
  const avgFatigue = checkins.reduce((s: number, c: any) => s + (c.fatigue || 0), 0) / checkins.length;
  const avgStress = checkins.reduce((s: number, c: any) => s + (c.stress || 0), 0) / checkins.length;
  const score = Math.round(((avgFatigue + avgStress) / 2) * 10);
  const level = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  return { score, level };
}

function calcPerfIndex(ev: any) {
  if (!ev) return 0;
  const scores = [ev.technique, ev.fitness, ev.tactics, ev.mental, ev.matchIQ].filter(Boolean) as number[];
  return scores.length > 0 ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10 : 0;
}

function PlayerHome() {
  const colors = useColors();
  const router = useRouter();
  const { userName, profileId } = useAppContext();
  const playerId = profileId || 1;

  const { data: player } = trpc.players.byId.useQuery({ id: playerId });
  const { data: recentCheckins = [] } = trpc.checkins.byPlayer.useQuery({ playerId, limit: 7 });
  const { data: latestEval } = trpc.evaluations.latest.useQuery({ playerId });
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: todayCheckin } = trpc.checkins.byDate.useQuery({ playerId, date: todayStr });

  const risk = useMemo(() => calcRiskFromCheckins(recentCheckins), [recentCheckins]);
  const perfIndex = useMemo(() => calcPerfIndex(latestEval), [latestEval]);
  const totalHours = useMemo(() => recentCheckins.reduce((s: number, c: any) => s + (c.trainingHours || 0), 0), [recentCheckins]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={[styles.welcomeSection, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.muted }]}>สวัสดี</Text>
          <Text style={[styles.userName, { color: colors.foreground }]}>{userName || player?.name || "นักกีฬา"}</Text>
          {player && (
            <Text style={[styles.levelBadge, { backgroundColor: colors.primary + "20", color: colors.primary }]}>
              {player.level} · {player.program}
            </Text>
          )}
        </View>
        <Image
          source={require("@/assets/images/icon.png")}
          style={{ width: 56, height: 56, borderRadius: 14 }}
          resizeMode="contain"
        />
      </View>
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
          <Text style={[styles.statValue, { color: colors.warning }]}>{totalHours}h</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>ชั่วโมงฝึกซ้อม</Text>
        </View>
      </ScrollView>
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
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/checkin")} activeOpacity={0.8}>
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
      {/* Quick Links */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>เมนูลัด</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity style={[styles.quickLink, { backgroundColor: "#1565C0" + "12" }]} onPress={() => router.push("/calendar-view")} activeOpacity={0.7}>
            <MaterialIcons name="calendar-today" size={22} color="#1565C0" />
            <Text style={{ color: "#1565C0", fontSize: 12, marginTop: 4, fontWeight: "500" }}>ปฏิทิน</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickLink, { backgroundColor: "#FF6F00" + "12" }]} onPress={() => router.push("/awards")} activeOpacity={0.7}>
            <MaterialIcons name="emoji-events" size={22} color="#FF6F00" />
            <Text style={{ color: "#FF6F00", fontSize: 12, marginTop: 4, fontWeight: "500" }}>รางวัล</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickLink, { backgroundColor: colors.primary + "12" }]} onPress={() => router.push("/add-match")} activeOpacity={0.7}>
            <MaterialIcons name="sports-tennis" size={22} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 12, marginTop: 4, fontWeight: "500" }}>บันทึกแข่ง</Text>
          </TouchableOpacity>
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
            ].map((item) => (
              <View key={item.label} style={styles.evalItem}>
                <Text style={[styles.evalScore, { color: colors.primary }]}>{item.value || "-"}</Text>
                <Text style={[styles.evalLabel, { color: colors.muted }]}>{item.label}</Text>
              </View>
            ))}
          </View>
          {latestEval.coachComment && (
            <View style={[styles.commentBox, { backgroundColor: colors.primary + "08" }]}>
              <Text style={[styles.commentText, { color: colors.foreground }]}>"{latestEval.coachComment}"</Text>
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
  const { userName, profileId } = useAppContext();
  const coachId = profileId || 1;

  const { data: myPlayers = [] } = trpc.players.byCoach.useQuery({ coachId });
  const { data: allCheckins = [] } = trpc.checkins.today.useQuery({ date: new Date().toISOString().split("T")[0] });

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={[styles.welcomeSection, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.muted }]}>สวัสดี โค้ช</Text>
          <Text style={[styles.userName, { color: colors.foreground }]}>{userName}</Text>
        </View>
        <Image
          source={require("@/assets/images/icon.png")}
          style={{ width: 56, height: 56, borderRadius: 14 }}
          resizeMode="contain"
        />
      </View>
      <TouchableOpacity style={[styles.bigActionBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/evaluate")} activeOpacity={0.8}>
        <Text style={styles.bigActionText}>ประเมินนักกีฬา</Text>
      </TouchableOpacity>
      {/* Coach Quick Links */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 14, gap: 10 }}>
        <TouchableOpacity style={[styles.quickLink, { flex: 1, backgroundColor: "#1565C0" + "12" }]} onPress={() => router.push("/calendar-view")} activeOpacity={0.7}>
          <MaterialIcons name="calendar-today" size={20} color="#1565C0" />
          <Text style={{ color: "#1565C0", fontSize: 12, marginTop: 4, fontWeight: "500" }}>ปฏิทิน</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickLink, { flex: 1, backgroundColor: "#2E7D32" + "12" }]} onPress={() => router.push("/coaching-sessions")} activeOpacity={0.7}>
          <MaterialIcons name="schedule" size={20} color="#2E7D32" />
          <Text style={{ color: "#2E7D32", fontSize: 12, marginTop: 4, fontWeight: "500" }}>บันทึกสอน</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickLink, { flex: 1, backgroundColor: "#FF6F00" + "12" }]} onPress={() => router.push("/awards")} activeOpacity={0.7}>
          <MaterialIcons name="emoji-events" size={20} color="#FF6F00" />
          <Text style={{ color: "#FF6F00", fontSize: 12, marginTop: 4, fontWeight: "500" }}>รางวัล</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>นักกีฬาในทีม ({myPlayers.length})</Text>
        {myPlayers.map((player: any) => (
          <TouchableOpacity
            key={player.id}
            style={[styles.playerRow, { borderBottomColor: colors.border }]}
            onPress={() => router.push({ pathname: "/player-detail", params: { id: player.id.toString() } })}
            activeOpacity={0.7}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{player.name.charAt(0)}</Text>
            </View>
            <View style={styles.playerInfo}>
              <Text style={[styles.playerName, { color: colors.foreground }]}>{player.name}</Text>
              <Text style={[styles.playerLevel, { color: colors.muted }]}>{player.level} · {player.program}</Text>
            </View>
            <View style={[styles.riskBadge, { backgroundColor: (player.status === "injured" ? colors.error : colors.success) + "20" }]}>
              <Text style={{ color: player.status === "injured" ? colors.error : colors.success, fontSize: 11, fontWeight: "600" }}>
                {player.status === "injured" ? "บาดเจ็บ" : "ปกติ"}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function HeadCoachDashboard() {
  const colors = useColors();
  const { userName } = useAppContext();
  const router = useRouter();

  const { data: dashStats } = trpc.dashboard.stats.useQuery();
  const { data: allPlayers = [] } = trpc.players.all.useQuery();
  const { data: allCoaches = [] } = trpc.coaches.all.useQuery();

  const totalPlayers = dashStats?.totalPlayers ?? allPlayers.length;
  const activeToday = dashStats?.activeToday ?? 0;
  const highRiskCount = dashStats?.highRiskCount ?? 0;
  const injuredPlayers = allPlayers.filter((p: any) => p.status === "injured").length;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={[styles.welcomeSection, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.muted }]}>Dashboard</Text>
          <Text style={[styles.userName, { color: colors.foreground }]}>{userName}</Text>
        </View>
        <Image
          source={require("@/assets/images/icon.png")}
          style={{ width: 56, height: 56, borderRadius: 14 }}
          resizeMode="contain"
        />
      </View>
      {/* Head Coach Quick Links */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 14, gap: 10 }}>
        <TouchableOpacity style={[styles.quickLink, { flex: 1, backgroundColor: "#1565C0" + "12" }]} onPress={() => router.push("/calendar-view")} activeOpacity={0.7}>
          <MaterialIcons name="calendar-today" size={20} color="#1565C0" />
          <Text style={{ color: "#1565C0", fontSize: 11, marginTop: 3, fontWeight: "500" }}>ปฏิทิน</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickLink, { flex: 1, backgroundColor: "#FF6F00" + "12" }]} onPress={() => router.push("/awards")} activeOpacity={0.7}>
          <MaterialIcons name="emoji-events" size={20} color="#FF6F00" />
          <Text style={{ color: "#FF6F00", fontSize: 11, marginTop: 3, fontWeight: "500" }}>รางวัล</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickLink, { flex: 1, backgroundColor: "#6A1B9A" + "12" }]} onPress={() => router.push("/export-report")} activeOpacity={0.7}>
          <MaterialIcons name="file-download" size={20} color="#6A1B9A" />
          <Text style={{ color: "#6A1B9A", fontSize: 11, marginTop: 3, fontWeight: "500" }}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickLink, { flex: 1, backgroundColor: "#2E7D32" + "12" }]} onPress={() => router.push("/coach-compensation")} activeOpacity={0.7}>
          <MaterialIcons name="payments" size={20} color="#2E7D32" />
          <Text style={{ color: "#2E7D32", fontSize: 11, marginTop: 3, fontWeight: "500" }}>ค่าตอบแทน</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.dashGrid}>
        <View style={[styles.dashCard, { backgroundColor: colors.primary + "12" }]}>
          <Text style={[styles.dashValue, { color: colors.primary }]}>{totalPlayers}</Text>
          <Text style={[styles.dashLabel, { color: colors.muted }]}>นักกีฬาทั้งหมด</Text>
        </View>
        <View style={[styles.dashCard, { backgroundColor: colors.success + "12" }]}>
          <Text style={[styles.dashValue, { color: colors.success }]}>{activeToday}</Text>
          <Text style={[styles.dashLabel, { color: colors.muted }]}>เช็คอินวันนี้</Text>
        </View>
        <View style={[styles.dashCard, { backgroundColor: colors.error + "12" }]}>
          <Text style={[styles.dashValue, { color: colors.error }]}>{injuredPlayers}</Text>
          <Text style={[styles.dashLabel, { color: colors.muted }]}>บาดเจ็บ</Text>
        </View>
        <View style={[styles.dashCard, { backgroundColor: colors.warning + "12" }]}>
          <Text style={[styles.dashValue, { color: colors.warning }]}>{highRiskCount}</Text>
          <Text style={[styles.dashLabel, { color: colors.muted }]}>High Risk</Text>
        </View>
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>กิจกรรมวันนี้</Text>
        <View style={styles.activityRow}>
          <Text style={[styles.activityLabel, { color: colors.muted }]}>เช็คอินแล้ว</Text>
          <Text style={[styles.activityValue, { color: colors.primary }]}>{activeToday}/{totalPlayers}</Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: totalPlayers > 0 ? `${(activeToday / totalPlayers) * 100}%` : "0%" }]} />
        </View>
      </View>
      {allPlayers.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>นักกีฬาทั้งหมด</Text>
          {allPlayers.map((player: any) => (
            <TouchableOpacity
              key={player.id}
              style={[styles.playerRow, { borderBottomColor: colors.border }]}
              onPress={() => router.push({ pathname: "/player-detail", params: { id: player.id.toString() } })}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>{player.name.charAt(0)}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { color: colors.foreground }]}>{player.name}</Text>
                <Text style={[styles.playerLevel, { color: colors.muted }]}>{player.level} · {player.program}</Text>
              </View>
              <View style={[styles.riskBadge, { backgroundColor: (player.status === "injured" ? colors.error : player.status === "inactive" ? colors.warning : colors.success) + "20" }]}>
                <Text style={{ color: player.status === "injured" ? colors.error : player.status === "inactive" ? colors.warning : colors.success, fontSize: 11, fontWeight: "600" }}>
                  {player.status === "injured" ? "บาดเจ็บ" : player.status === "inactive" ? "ไม่ใช้งาน" : "ปกติ"}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>โค้ชในสถาบัน</Text>
        {allCoaches.map((coach: any) => {
          const coachPlayers = allPlayers.filter((p: any) => p.coachId === coach.id);
          return (
            <View key={coach.id} style={[styles.playerRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>{coach.name.charAt(0)}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { color: colors.foreground }]}>{coach.name}</Text>
                <Text style={[styles.playerLevel, { color: colors.muted }]}>{coach.specialty || coach.coachRole} · {coachPlayers.length} นักกีฬา</Text>
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
  const utils = trpc.useUtils();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    utils.invalidate().then(() => setRefreshing(false)).catch(() => setRefreshing(false));
  }, [utils]);

  return (
    <ScreenContainer className="flex-1">
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ flexGrow: 1 }}>
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
  quickLink: { alignItems: "center", padding: 14, borderRadius: 14 },
});
