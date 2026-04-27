import { useState, useCallback } from "react";
import { Text, View, TouchableOpacity, StyleSheet, TextInput, Alert, Platform, FlatList, ActivityIndicator, Modal } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type EditTarget = { type: "player" | "coach"; data: any } | null;

function showMsg(title: string, msg: string) {
  Platform.OS === "web" ? alert(msg) : Alert.alert(title, msg);
}

export default function AdminUsersScreen() {
  const colors = useColors();
  const [tab, setTab] = useState<"players" | "coaches">("players");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget>(null);

  const utils = trpc.useUtils();
  const { data: players = [], isLoading: lp } = trpc.players.all.useQuery();
  const { data: coaches = [], isLoading: lc } = trpc.coaches.all.useQuery();

  const createPlayer = trpc.players.create.useMutation({ onSuccess: () => { utils.players.all.invalidate(); setShowAddModal(false); } });
  const updatePlayer = trpc.players.update.useMutation({ onSuccess: () => { utils.players.all.invalidate(); setEditTarget(null); } });
  const deletePlayer = trpc.players.delete.useMutation({ onSuccess: () => utils.players.all.invalidate() });

  const createCoach = trpc.coaches.create.useMutation({ onSuccess: () => { utils.coaches.all.invalidate(); setShowAddModal(false); } });
  const updateCoach = trpc.coaches.update.useMutation({ onSuccess: () => { utils.coaches.all.invalidate(); setEditTarget(null); } });
  const deleteCoach = trpc.coaches.delete.useMutation({ onSuccess: () => utils.coaches.all.invalidate() });

  const handleDelete = useCallback((type: "player" | "coach", id: number, name: string) => {
    const doDelete = () => {
      if (type === "player") deletePlayer.mutate({ id });
      else deleteCoach.mutate({ id });
    };
    if (Platform.OS === "web") {
      if (confirm(`ลบ ${name} ออกจากระบบ?`)) doDelete();
    } else {
      Alert.alert("ยืนยันการลบ", `ลบ ${name} ออกจากระบบ?`, [
        { text: "ยกเลิก", style: "cancel" },
        { text: "ลบ", style: "destructive", onPress: doDelete },
      ]);
    }
  }, [deletePlayer, deleteCoach]);

  const renderPlayerItem = useCallback(({ item }: { item: any }) => (
    <View style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
        <Text style={[styles.avatarText, { color: colors.primary }]}>{item.name?.charAt(0) || "?"}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
        <Text style={[styles.itemMeta, { color: colors.muted }]}>
          {item.level || "N/A"} | {item.program || "N/A"} | {item.status || "active"}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary + "15" }]}
          onPress={() => setEditTarget({ type: "player", data: item })}
        >
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>แก้ไข</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.error + "15" }]}
          onPress={() => handleDelete("player", item.id, item.name)}
        >
          <Text style={{ color: colors.error, fontSize: 12, fontWeight: "600" }}>ลบ</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [colors, handleDelete]);

  const renderCoachItem = useCallback(({ item }: { item: any }) => (
    <View style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.avatar, { backgroundColor: colors.warning + "20" }]}>
        <Text style={[styles.avatarText, { color: colors.warning }]}>{item.name?.charAt(0) || "?"}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
        <Text style={[styles.itemMeta, { color: colors.muted }]}>
          {item.coachRole || "coach"} | {item.specialty || "N/A"} | {item.status || "active"}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary + "15" }]}
          onPress={() => setEditTarget({ type: "coach", data: item })}
        >
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>แก้ไข</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.error + "15" }]}
          onPress={() => handleDelete("coach", item.id, item.name)}
        >
          <Text style={{ color: colors.error, fontSize: 12, fontWeight: "600" }}>ลบ</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [colors, handleDelete]);

  return (
    <ScreenContainer edges={["left", "right"]}>
      {/* Tab Selector */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "players" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab("players")}
        >
          <Text style={{ color: tab === "players" ? colors.primary : colors.muted, fontSize: 15, fontWeight: "600" }}>
            นักกีฬา ({players.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "coaches" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab("coaches")}
        >
          <Text style={{ color: tab === "coaches" ? colors.primary : colors.muted, fontSize: 15, fontWeight: "600" }}>
            โค้ช ({coaches.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Button */}
      <View style={styles.addRow}>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addBtnText}>+ เพิ่ม{tab === "players" ? "นักกีฬา" : "โค้ช"}</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {(tab === "players" ? lp : lc) ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={tab === "players" ? players : coaches}
          renderItem={tab === "players" ? renderPlayerItem : renderCoachItem}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.muted }]}>ยังไม่มีข้อมูล</Text>
          }
        />
      )}

      {/* Add Modal */}
      <AddModal
        visible={showAddModal}
        type={tab}
        colors={colors}
        onClose={() => setShowAddModal(false)}
        onSubmit={(data: any) => {
          if (tab === "players") createPlayer.mutate(data);
          else createCoach.mutate(data);
        }}
        isPending={tab === "players" ? createPlayer.isPending : createCoach.isPending}
      />

      {/* Edit Modal */}
      {editTarget && (
        <EditModal
          visible={!!editTarget}
          type={editTarget.type}
          data={editTarget.data}
          colors={colors}
          onClose={() => setEditTarget(null)}
          onSubmit={(data: any) => {
            if (editTarget.type === "player") updatePlayer.mutate({ id: editTarget.data.id, ...data });
            else updateCoach.mutate({ id: editTarget.data.id, ...data });
          }}
          isPending={editTarget.type === "player" ? updatePlayer.isPending : updateCoach.isPending}
        />
      )}
    </ScreenContainer>
  );
}

function AddModal({ visible, type, colors, onClose, onSubmit, isPending }: any) {
  const [name, setName] = useState("");
  const [field1, setField1] = useState("");
  const [field2, setField2] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) { showMsg("แจ้งเตือน", "กรุณากรอกชื่อ"); return; }
    if (type === "players") {
      onSubmit({ name: name.trim(), level: field1.trim() || undefined, program: field2.trim() || undefined, phone: phone.trim() || undefined } as any);
    } else {
      onSubmit({ name: name.trim(), specialty: field1.trim() || undefined, coachRole: field2.trim() || "coach", phone: phone.trim() || undefined } as any);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            เพิ่ม{type === "players" ? "นักกีฬา" : "โค้ช"}ใหม่
          </Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} value={name} onChangeText={setName} placeholder="ชื่อ-นามสกุล" placeholderTextColor={colors.muted} returnKeyType="done" />
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} value={field1} onChangeText={setField1} placeholder={type === "players" ? "ระดับ (เช่น Junior, Pro)" : "ความเชี่ยวชาญ"} placeholderTextColor={colors.muted} returnKeyType="done" />
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} value={field2} onChangeText={setField2} placeholder={type === "players" ? "โปรแกรม (เช่น Intensive, Weekend)" : "บทบาท (coach, head_coach, admin)"} placeholderTextColor={colors.muted} returnKeyType="done" />
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} value={phone} onChangeText={setPhone} placeholder="เบอร์โทร" placeholderTextColor={colors.muted} keyboardType="phone-pad" returnKeyType="done" />
          <View style={styles.modalBtns}>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.border }]} onPress={onClose}>
              <Text style={{ color: colors.foreground, fontWeight: "600" }}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary, opacity: isPending ? 0.6 : 1 }]} onPress={handleSubmit} disabled={isPending}>
              <Text style={{ color: "#fff", fontWeight: "600" }}>{isPending ? "กำลังบันทึก..." : "บันทึก"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EditModal({ visible, type, data, colors, onClose, onSubmit, isPending }: any) {
  const [name, setName] = useState(data?.name || "");
  const [field1, setField1] = useState(type === "player" ? (data?.level || "") : (data?.specialty || ""));
  const [field2, setField2] = useState(type === "player" ? (data?.program || "") : (data?.coachRole || "coach"));
  const [phone, setPhone] = useState(data?.phone || "");
  const [status, setStatus] = useState(data?.status || "active");

  const handleSubmit = () => {
    if (!name.trim()) { showMsg("แจ้งเตือน", "กรุณากรอกชื่อ"); return; }
    if (type === "player") {
      onSubmit({ name: name.trim(), level: field1.trim() || undefined, program: field2.trim() || undefined, phone: phone.trim() || undefined, status } as any);
    } else {
      onSubmit({ name: name.trim(), specialty: field1.trim() || undefined, coachRole: field2.trim() || "coach", phone: phone.trim() || undefined, status } as any);
    }
  };

  const statusOptions = type === "player" ? ["active", "inactive", "injured"] : ["active", "inactive"];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            แก้ไข{type === "player" ? "นักกีฬา" : "โค้ช"}
          </Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} value={name} onChangeText={setName} placeholder="ชื่อ-นามสกุล" placeholderTextColor={colors.muted} returnKeyType="done" />
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} value={field1} onChangeText={setField1} placeholder={type === "player" ? "ระดับ" : "ความเชี่ยวชาญ"} placeholderTextColor={colors.muted} returnKeyType="done" />
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} value={field2} onChangeText={setField2} placeholder={type === "player" ? "โปรแกรม" : "บทบาท"} placeholderTextColor={colors.muted} returnKeyType="done" />
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} value={phone} onChangeText={setPhone} placeholder="เบอร์โทร" placeholderTextColor={colors.muted} keyboardType="phone-pad" returnKeyType="done" />
          
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>สถานะ</Text>
          <View style={styles.statusRow}>
            {statusOptions.map((s: string) => (
              <TouchableOpacity
                key={s}
                style={[styles.statusChip, { backgroundColor: status === s ? colors.primary : colors.surface, borderColor: status === s ? colors.primary : colors.border }]}
                onPress={() => setStatus(s)}
              >
                <Text style={{ color: status === s ? "#fff" : colors.foreground, fontSize: 13 }}>
                  {s === "active" ? "Active" : s === "inactive" ? "Inactive" : "บาดเจ็บ"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalBtns}>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.border }]} onPress={onClose}>
              <Text style={{ color: colors.foreground, fontWeight: "600" }}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary, opacity: isPending ? 0.6 : 1 }]} onPress={handleSubmit} disabled={isPending}>
              <Text style={{ color: "#fff", fontWeight: "600" }}>{isPending ? "กำลังบันทึก..." : "บันทึก"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 16 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  addRow: { paddingHorizontal: 16, paddingVertical: 12 },
  addBtn: { padding: 12, borderRadius: 10, alignItems: "center" },
  addBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16, paddingBottom: 32 },
  listItem: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: "700" },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  itemMeta: { fontSize: 12 },
  itemActions: { flexDirection: "row", gap: 6 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  emptyText: { textAlign: "center", fontSize: 14, marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12 },
  fieldLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  statusRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statusChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 8 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: "center" },
});
