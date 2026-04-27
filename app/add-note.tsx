import { useState } from "react";
import { ScrollView, Text, View, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function AddNoteScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: players = [], isLoading } = trpc.players.all.useQuery();
  const createNote = trpc.notes.create.useMutation({
    onSuccess: () => {
      const msg = "บันทึกโน้ตสำเร็จ!";
      Platform.OS === "web" ? alert(msg) : Alert.alert("สำเร็จ", msg);
      router.back();
    },
    onError: (err: any) => {
      const msg = "เกิดข้อผิดพลาด: " + (err.message || "ไม่ทราบสาเหตุ");
      Platform.OS === "web" ? alert(msg) : Alert.alert("ผิดพลาด", msg);
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      const msg = "กรุณากรอกหัวข้อ";
      Platform.OS === "web" ? alert(msg) : Alert.alert("แจ้งเตือน", msg);
      return;
    }
    createNote.mutate({
      coachId: 1,
      playerId: selectedPlayer ?? undefined,
      title: title.trim(),
      content: content.trim(),
      noteDate: new Date().toISOString().split("T")[0],
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
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>เลือกนักกีฬา (ไม่บังคับ)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: selectedPlayer === null ? colors.primary : colors.surface, borderColor: selectedPlayer === null ? colors.primary : colors.border }]}
            onPress={() => setSelectedPlayer(null)}
          >
            <Text style={{ color: selectedPlayer === null ? "#fff" : colors.foreground, fontSize: 13 }}>ทั่วไป</Text>
          </TouchableOpacity>
          {players.map((p: any) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.chip, { backgroundColor: selectedPlayer === p.id ? colors.primary : colors.surface, borderColor: selectedPlayer === p.id ? colors.primary : colors.border }]}
              onPress={() => setSelectedPlayer(p.id)}
            >
              <Text style={{ color: selectedPlayer === p.id ? "#fff" : colors.foreground, fontSize: 13 }}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>หัวข้อ</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
          value={title}
          onChangeText={setTitle}
          placeholder="หัวข้อโน้ต"
          placeholderTextColor={colors.muted}
          returnKeyType="done"
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>เนื้อหา</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
          value={content}
          onChangeText={setContent}
          placeholder="รายละเอียดโน้ต..."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={8}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: createNote.isPending ? 0.6 : 1 }]}
        onPress={handleSubmit}
        activeOpacity={0.8}
        disabled={createNote.isPending}
      >
        <Text style={styles.submitText}>{createNote.isPending ? "กำลังบันทึก..." : "บันทึกโน้ต"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  field: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginRight: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, minHeight: 160, textAlignVertical: "top" },
  submitBtn: { padding: 16, borderRadius: 12, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
