import { ScrollView, Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { demoPlayers, demoCheckins, calculateRiskScore, getRiskColor } from "@/lib/demo-data";

export default function TeamScreen() {
  const colors = useColors();
  const router = useRouter();

  const statusGroups = {
    active: demoPlayers.filter(p => p.status === "active"),
    injured: demoPlayers.filter(p => p.status === "injured"),
    inactive: demoPlayers.filter(p => (p.status as string) === "inactive"),
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.foreground }]}>ทีมนักกีฬา</Text>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.success + "15" }]}>
            <Text style={[styles.summaryValue, { color: colors.success }]}>{statusGroups.active.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Active</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.error + "15" }]}>
            <Text style={[styles.summaryValue, { color: colors.error }]}>{statusGroups.injured.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>บาดเจ็บ</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.muted + "15" }]}>
            <Text style={[styles.summaryValue, { color: colors.muted }]}>{statusGroups.inactive.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Inactive</Text>
          </View>
        </View>

        {/* Player List */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {demoPlayers.map((player, idx) => {
            const pCheckins = demoCheckins.filter(c => c.playerId === player.id);
            const risk = calculateRiskScore(pCheckins);
            return (
              <TouchableOpacity
                key={player.id}
                style={[styles.playerRow, idx < demoPlayers.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}
                onPress={() => router.push({ pathname: "/player-detail" as any, params: { id: player.id.toString() } })}
                activeOpacity={0.7}
              >
                <View style={[styles.avatar, { backgroundColor: player.status === "injured" ? colors.error + "20" : colors.primary + "20" }]}>
                  <Text style={[styles.avatarText, { color: player.status === "injured" ? colors.error : colors.primary }]}>
                    {player.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={[styles.playerName, { color: colors.foreground }]}>{player.name}</Text>
                  <Text style={[styles.playerMeta, { color: colors.muted }]}>
                    {player.level} · {player.program}
                    {player.status === "injured" && " · 🩹 บาดเจ็บ"}
                  </Text>
                </View>
                <View style={[styles.riskBadge, { backgroundColor: getRiskColor(risk.level) + "20" }]}>
                  <Text style={{ color: getRiskColor(risk.level), fontSize: 11, fontWeight: "600" }}>
                    {risk.score}%
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 16 },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" },
  summaryValue: { fontSize: 24, fontWeight: "700" },
  summaryLabel: { fontSize: 12, marginTop: 2 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  playerRow: { flexDirection: "row", alignItems: "center", padding: 14 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: "700" },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 15, fontWeight: "600" },
  playerMeta: { fontSize: 12, marginTop: 2 },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
});
