import { useState } from "react";
import { ScrollView, Text, View, TextInput, TouchableOpacity, StyleSheet, Switch, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useAppContext } from "@/lib/app-context";

function SliderRow({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  const colors = useColors();
  return (
    <View style={sliderStyles.row}>
      <View style={sliderStyles.labelRow}>
        <Text style={[sliderStyles.label, { color: colors.foreground }]}>{label}</Text>
        <Text style={[sliderStyles.value, { color }]}>{value}/10</Text>
      </View>
      <View style={sliderStyles.dots}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <TouchableOpacity
            key={n}
            style={[
              sliderStyles.dot,
              { backgroundColor: n <= value ? color : colors.border },
            ]}
            onPress={() => onChange(n)}
          />
        ))}
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  row: { marginBottom: 20 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  label: { fontSize: 15, fontWeight: "500" },
  value: { fontSize: 15, fontWeight: "700" },
  dots: { flexDirection: "row", justifyContent: "space-between" },
  dot: { width: 28, height: 28, borderRadius: 14 },
});

export default function CheckinScreen() {
  const colors = useColors();
  const router = useRouter();
  const { userName } = useAppContext();

  const [trainingHours, setTrainingHours] = useState("2");
  const [fatigue, setFatigue] = useState(5);
  const [confidence, setConfidence] = useState(5);
  const [stress, setStress] = useState(5);
  const [injuryStatus, setInjuryStatus] = useState(false);
  const [injuryDesc, setInjuryDesc] = useState("");
  const [strength, setStrength] = useState("");
  const [weakness, setWeakness] = useState("");
  const [nextGoal, setNextGoal] = useState("");

  const handleSubmit = () => {
    const msg = "บันทึกเช็คอินสำเร็จ!";
    if (Platform.OS === "web") {
      alert(msg);
    } else {
      Alert.alert("สำเร็จ", msg);
    }
    router.back();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.dateText, { color: colors.muted }]}>
        {new Date().toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </Text>

      {/* Training Hours */}
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>ชั่วโมงฝึกซ้อม</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
          value={trainingHours}
          onChangeText={setTrainingHours}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.muted}
          returnKeyType="done"
        />
      </View>

      {/* Fatigue */}
      <SliderRow label="ระดับความเหนื่อย" value={fatigue} onChange={setFatigue} color={colors.warning} />

      {/* Confidence */}
      <SliderRow label="ระดับความมั่นใจ" value={confidence} onChange={setConfidence} color={colors.primary} />

      {/* Stress */}
      <SliderRow label="ระดับความเครียด" value={stress} onChange={setStress} color={colors.error} />

      {/* Injury */}
      <View style={styles.switchRow}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>มีอาการบาดเจ็บ</Text>
        <Switch value={injuryStatus} onValueChange={setInjuryStatus} trackColor={{ true: colors.error }} />
      </View>
      {injuryStatus && (
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
          value={injuryDesc}
          onChangeText={setInjuryDesc}
          placeholder="อธิบายอาการบาดเจ็บ"
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={3}
        />
      )}

      {/* Strength */}
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>จุดแข็งวันนี้</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
          value={strength}
          onChangeText={setStrength}
          placeholder="สิ่งที่ทำได้ดีวันนี้..."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Weakness */}
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>จุดที่ต้องพัฒนา</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
          value={weakness}
          onChangeText={setWeakness}
          placeholder="สิ่งที่ต้องปรับปรุง..."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Next Goal */}
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>เป้าหมายถัดไป</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
          value={nextGoal}
          onChangeText={setNextGoal}
          placeholder="เป้าหมายสำหรับการฝึกครั้งต่อไป"
          placeholderTextColor={colors.muted}
          returnKeyType="done"
        />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: colors.primary }]}
        onPress={handleSubmit}
        activeOpacity={0.8}
      >
        <Text style={styles.submitText}>บันทึกเช็คอิน</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  dateText: { fontSize: 14, marginBottom: 20, textAlign: "center" },
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, minHeight: 60, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  submitBtn: { padding: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
