import { useState } from "react";
import { ScrollView, Text, View, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function AddMatchScreen() {
  const colors = useColors();
  const router = useRouter();
  const [opponent, setOpponent] = useState("");
  const [tournament, setTournament] = useState("");
  const [score, setScore] = useState("");
  const [result, setResult] = useState<"win" | "loss">("win");
  const [servePercent, setServePercent] = useState("");
  const [winners, setWinners] = useState("");
  const [ue, setUe] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    const msg = "บันทึกผลแข่งขันสำเร็จ!";
    Platform.OS === "web" ? alert(msg) : Alert.alert("สำเร็จ", msg);
    router.back();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      {/* Result */}
      <View style={styles.resultRow}>
        <TouchableOpacity
          style={[styles.resultBtn, { backgroundColor: result === "win" ? colors.success : colors.surface, borderColor: colors.success }]}
          onPress={() => setResult("win")}
        >
          <Text style={{ color: result === "win" ? "#fff" : colors.success, fontWeight: "700", fontSize: 16 }}>ชนะ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.resultBtn, { backgroundColor: result === "loss" ? colors.error : colors.surface, borderColor: colors.error }]}
          onPress={() => setResult("loss")}
        >
          <Text style={{ color: result === "loss" ? "#fff" : colors.error, fontWeight: "700", fontSize: 16 }}>แพ้</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>คู่แข่ง</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} value={opponent} onChangeText={setOpponent} placeholder="ชื่อคู่แข่ง" placeholderTextColor={colors.muted} returnKeyType="done" />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>ทัวร์นาเมนต์</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} value={tournament} onChangeText={setTournament} placeholder="ชื่อทัวร์นาเมนต์" placeholderTextColor={colors.muted} returnKeyType="done" />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>สกอร์</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} value={score} onChangeText={setScore} placeholder="เช่น 6-4, 7-5" placeholderTextColor={colors.muted} returnKeyType="done" />
      </View>

      <View style={styles.statsFields}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={[styles.label, { color: colors.foreground }]}>Serve %</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} value={servePercent} onChangeText={setServePercent} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.muted} returnKeyType="done" />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={[styles.label, { color: colors.foreground }]}>Winners</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} value={winners} onChangeText={setWinners} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.muted} returnKeyType="done" />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={[styles.label, { color: colors.foreground }]}>UE</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} value={ue} onChangeText={setUe} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.muted} returnKeyType="done" />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>หมายเหตุ</Text>
        <TextInput style={[styles.textArea, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} value={notes} onChangeText={setNotes} placeholder="หมายเหตุเพิ่มเติม..." placeholderTextColor={colors.muted} multiline numberOfLines={3} />
      </View>

      <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleSubmit} activeOpacity={0.8}>
        <Text style={styles.submitText}>บันทึกผลแข่งขัน</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  resultRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  resultBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, alignItems: "center" },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, minHeight: 70, textAlignVertical: "top" },
  statsFields: { flexDirection: "row", gap: 10 },
  submitBtn: { padding: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
