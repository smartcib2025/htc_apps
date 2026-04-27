import { ScrollView, Text, View, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function TeamScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data: allPlayers = [], isLoading } = trpc.players.all.useQuery();

  const statusGroups = {
    active: allPlayers.filter((p: any) => p.status === "active"),
    injured: allPlayers.filter((p: any) => p.status === "injured"),
    inactive: allPlayers.filter((p: any) => p.status === "inactive"),
  };

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
        <Text style={[styles.title, { color: colors.foreground }]}>ทีมนักกีฬา</Text>
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
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {allPlayers.map((player: any, idx: number) => (
            <TouchableOpacity
              key={player.id}
              style={[styles.playerRow, idx < allPlayers.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}
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
                  {player.status === "injured" && " · บาดเจ็บ"}
                </Text>
              </View>
              <View style={[styles.riskBadge, { backgroundColor: (player.status === "injured" ? colors.error : player.status === "inactive" ? colors.warning : colors.success) + "20" }]}>
                <Text style={{ color: player.status === "injured" ? colors.error : player.status === "inactive" ? colors.warning : colors.success, fontSize: 11, fontWeight: "600" }}>
                  {player.status === "injured" ? "บาดเจ็บ" : player.status === "inactive" ? "หยุด" : "ปกติ"}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
