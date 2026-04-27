import { ScrollView, Text, View, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppContext } from "@/lib/app-context";
import { trpc } from "@/lib/trpc";

export default function MatchesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { profileId } = useAppContext();
  const playerId = profileId || 1;
  const { data: matches = [], isLoading } = trpc.matches.byPlayer.useQuery({ playerId, limit: 20 });

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
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>ผลการแข่งขัน</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/add-match" as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ บันทึก</Text>
          </TouchableOpacity>
        </View>

        {matches.map((match: any) => (
          <View
            key={match.id}
            style={[
              styles.matchCard,
              {
                backgroundColor: colors.surface,
                borderColor: match.result === "win" ? colors.success + "40" : colors.error + "40",
                borderLeftWidth: 4,
              },
            ]}
          >
            <View style={styles.matchHeader}>
              <View style={[styles.resultBadge, { backgroundColor: match.result === "win" ? colors.success + "20" : colors.error + "20" }]}>
                <Text style={{ color: match.result === "win" ? colors.success : colors.error, fontWeight: "700", fontSize: 13 }}>
                  {match.result === "win" ? "ชนะ" : "แพ้"}
                </Text>
              </View>
              <Text style={[styles.matchDate, { color: colors.muted }]}>{String(match.matchDate)}</Text>
            </View>

            <Text style={[styles.matchScore, { color: colors.foreground }]}>{match.score}</Text>
            <Text style={[styles.matchOpponent, { color: colors.muted }]}>vs {match.opponent}</Text>
            {match.tournament && (
              <Text style={[styles.matchTournament, { color: colors.primary }]}>{match.tournament}</Text>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.foreground }]}>{match.servePercent}%</Text>
                <Text style={[styles.statLbl, { color: colors.muted }]}>Serve %</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.success }]}>{match.winners}</Text>
                <Text style={[styles.statLbl, { color: colors.muted }]}>Winners</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.error }]}>{match.unforcedErrors}</Text>
                <Text style={[styles.statLbl, { color: colors.muted }]}>UE</Text>
              </View>
            </View>
          </View>
        ))}

        {matches.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>ยังไม่มีผลการแข่งขัน</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "700" },
  addBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  matchCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  matchHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  resultBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  matchDate: { fontSize: 13 },
  matchScore: { fontSize: 28, fontWeight: "700", marginBottom: 4 },
  matchOpponent: { fontSize: 14, marginBottom: 2 },
  matchTournament: { fontSize: 13, fontWeight: "500", marginBottom: 12 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", paddingTop: 12, borderTopWidth: 0.5, borderTopColor: "#E0E0E0" },
  statItem: { alignItems: "center" },
  statNum: { fontSize: 18, fontWeight: "700" },
  statLbl: { fontSize: 11, marginTop: 2 },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyText: { fontSize: 16 },
});
