import { useState } from "react";
import { ScrollView, Text, View, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

function ScoreSelector({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  const colors = useColors();
  return (
    <View style={scoreStyles.row}>
      <Text style={[scoreStyles.label, { color: colors.foreground }]}>{label}</Text>
      <View style={scoreStyles.scores}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <TouchableOpacity
            key={n}
            style={[scoreStyles.scoreBtn, { backgroundColor: n <= value ? color : colors.border }]}
            onPress={() => onChange(n)}
          >
            <Text style={[scoreStyles.scoreText, { color: n <= value ? "#fff" : colors.muted }]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  row: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  scores: { flexDirection: "row", justifyContent: "space-between" },
  scoreBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  scoreText: { fontSize: 12, fontWeight: "600" },
});

export default function EvaluateScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [technique, setTechnique] = useState(5);
  const [fitness, setFitness] = useState(5);
  const [tactics, setTactics] = useState(5);
  const [mental, setMental] = useState(5);
  const [discipline, setDiscipline] = useState(5);
  const [matchIQ, setMatchIQ] = useState(5);
  const [strengthNote, setStrengthNote] = useState("");
  const [weaknessNote, setWeaknessNote] = useState("");
  const [coachComment, setCoachComment] = useState("");

  const { data: players = [], isLoading } = trpc.players.all.useQuery();
  const createEval = trpc.evaluations.create.useMutation({
    onSuccess: () => {
      const msg = "บันทึกการประเมินสำเร็จ!";
      Platform.OS === "web" ? alert(msg) : Alert.alert("สำเร็จ", msg);
      router.back();
    },
    onError: (err: any) => {
      const msg = "เกิดข้อผิดพลาด: " + (err.message || "ไม่ทราบสาเหตุ");
      Platform.OS === "web" ? alert(msg) : Alert.alert("ผิดพลาด", msg);
    },
  });

  const handleSubmit = () => {
    if (!selectedPlayer) {
      const msg = "กรุณาเลือกนักกีฬา";
      Platform.OS === "web" ? alert(msg) : Alert.alert("แจ้งเตือน", msg);
      return;
    }
    createEval.mutate({
      playerId: selectedPlayer,
      coachId: 1,
      evalDate: new Date().toISOString().split("T")[0],
      technique,
      fitness,
      tactics,
      mental,
      discipline,
      matchIQ,
      strengthNote,
      weaknessNote,
      coachComment,
    });
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>เลือกนักกีฬา</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerScroll}>
        {players.map((player: any) => (
          <TouchableOpacity
            key={player.id}
            style={[
              styles.playerChip,
              { backgroundColor: selectedPlayer === player.id ? colors.primary : colors.surface, borderColor: selectedPlayer === player.id ? colors.primary : colors.border },
            ]}
            onPress={() => setSelectedPlayer(player.id)}
            activeOpacity={0.7}
          >
            <Text style={{ color: selectedPlayer === player.id ? "#fff" : colors.foreground, fontSize: 14, fontWeight: "500" }}>
              {player.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>คะแนนประเมิน</Text>
        <ScoreSelector label="Technique (เทคนิค)" value={technique} onChange={setTechnique} color={colors.primary} />
        <ScoreSelector label="Fitness (สมรรถภาพ)" value={fitness} onChange={setFitness} color={colors.success} />
        <ScoreSelector label="Tactics (ยุทธวิธี)" value={tactics} onChange={setTactics} color={colors.warning} />
        <ScoreSelector label="Mental (จิตใจ)" value={mental} onChange={setMental} color={colors.primary} />
        <ScoreSelector label="Discipline (วินัย)" value={discipline} onChange={setDiscipline} color={colors.warning} />
        <ScoreSelector label="Match IQ" value={matchIQ} onChange={setMatchIQ} color={colors.primary} />
      </View>

      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>จุดแข็ง</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
          value={strengthNote}
          onChangeText={setStrengthNote}
          placeholder="จุดแข็งของนักกีฬา..."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>จุดที่ต้องพัฒนา</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
          value={weaknessNote}
          onChangeText={setWeaknessNote}
          placeholder="จุดที่ต้องพัฒนา..."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>ความเห็นโค้ช</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
          value={coachComment}
          onChangeText={setCoachComment}
          placeholder="ความเห็นเพิ่มเติม..."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: createEval.isPending ? 0.6 : 1 }]}
        onPress={handleSubmit}
        activeOpacity={0.8}
        disabled={createEval.isPending}
      >
        <Text style={styles.submitText}>{createEval.isPending ? "กำลังบันทึก..." : "บันทึกการประเมิน"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  fieldLabel: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  playerScroll: { marginBottom: 20 },
  playerChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginRight: 8 },
  card: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  cardTitle: { fontSize: 17, fontWeight: "600", marginBottom: 16 },
  field: { marginBottom: 20 },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, minHeight: 70, textAlignVertical: "top" },
  submitBtn: { padding: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
