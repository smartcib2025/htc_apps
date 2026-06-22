import React, { useState, useCallback, useMemo } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type ViewMode = "list" | "detail" | "logs" | "stats";

function showMsg(title: string, msg: string) {
  Platform.OS === "web" ? alert(msg) : Alert.alert(title, msg);
}

export default function Admin2FADashboard() {
  const colors = useColors();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchText, setSearchText] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetReason, setResetReason] = useState("");

  const utils = trpc.useUtils();
  const { data: users = [], isLoading: loadingUsers } = trpc.admin2FA.listUsersWithStatus.useQuery({
    limit: 100,
    offset: 0,
  });
  const { data: userCount = { total: 0 } } = trpc.admin2FA.getUserCount.useQuery();
  const { data: stats = null } = trpc.admin2FA.getStatistics.useQuery();
  const { data: userDetail = null } = trpc.admin2FA.getUserStatus.useQuery(
    { userId: selectedUser?.id || 0 },
    { enabled: !!selectedUser && viewMode === "detail" }
  );
  const { data: logs = [] } = trpc.admin2FA.getActivityLogs.useQuery(
    { limit: 50, offset: 0 },
    { enabled: viewMode === "logs" }
  );

  const resetUserTwoFA = trpc.admin2FA.resetUserTwoFA.useMutation({
    onSuccess: () => {
      utils.admin2FA.listUsersWithStatus.invalidate();
      utils.admin2FA.getUserStatus.invalidate();
      setShowResetModal(false);
      setResetReason("");
      showMsg("สำเร็จ", "รีเซ็ต 2FA สำเร็จ!");
    },
    onError: (err: any) => {
      showMsg("ผิดพลาด", err.message || "เกิดข้อผิดพลาด");
    },
  });

  const regenerateBackupCodes = trpc.admin2FA.regenerateBackupCodes.useMutation({
    onSuccess: (data: any) => {
      utils.admin2FA.getUserStatus.invalidate();
      showMsg("สำเร็จ", `สร้างรหัสสำรองใหม่สำเร็จ!\n\n${data.backupCodes.join("\n")}`);
    },
    onError: (err: any) => {
      showMsg("ผิดพลาด", err.message || "เกิดข้อผิดพลาด");
    },
  });

  const filteredUsers = useMemo(() => {
    if (!searchText) return users;
    return users.filter(
      (user: any) =>
        user.username.toLowerCase().includes(searchText.toLowerCase()) ||
        user.role.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [users, searchText]);

  const handleResetTwoFA = useCallback(() => {
    if (!selectedUser) return;
    resetUserTwoFA.mutate({
      userId: selectedUser.id,
      reason: resetReason,
    });
  }, [selectedUser, resetReason, resetUserTwoFA]);

  const renderUserItem = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        style={[styles.userItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => {
          setSelectedUser(item);
          setViewMode("detail");
        }}
      >
        <View style={[styles.avatar, { backgroundColor: item.twoFAEnabled ? colors.success + "20" : colors.muted + "20" }]}>
          <MaterialIcons
            name={item.twoFAEnabled ? "verified-user" : "person"}
            size={24}
            color={item.twoFAEnabled ? colors.success : colors.muted}
          />
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: colors.foreground }]}>{item.username}</Text>
          <Text style={[styles.userRole, { color: colors.muted }]}>
            {item.role} • 2FA: {item.twoFAEnabled ? "✓ Enabled" : "✗ Disabled"}
          </Text>
          {item.twoFAEnabled && (
            <Text style={[styles.userMeta, { color: colors.muted, fontSize: 12 }]}>
              Backup Codes: {item.backupCodesCount}
            </Text>
          )}
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
      </TouchableOpacity>
    ),
    [colors]
  );

  const renderStatCard = (title: string, value: string | number, icon: string) => (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <MaterialIcons name={icon as any} size={32} color={colors.primary} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.muted }]}>{title}</Text>
    </View>
  );

  const renderLogItem = useCallback(
    ({ item }: { item: any }) => (
      <View style={[styles.logItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.logHeader}>
          <Text style={[styles.logUser, { color: colors.foreground }]}>{item.username}</Text>
          <Text style={[styles.logAction, { color: colors.muted, fontSize: 12 }]}>
            {item.action.replace(/_/g, " ").toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.logStatus, { color: item.status === "success" ? colors.success : colors.error, fontSize: 12 }]}>
          {item.status === "success" ? "✓ Success" : "✗ Failed"}
        </Text>
        <Text style={[styles.logTime, { color: colors.muted, fontSize: 11 }]}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    ),
    [colors]
  );

  if (loadingUsers) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.foreground }]}>Loading 2FA Dashboard...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {(["list", "detail", "logs", "stats"] as ViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.tab,
              viewMode === mode && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setViewMode(mode)}
          >
            <Text
              style={[
                styles.tabText,
                { color: viewMode === mode ? colors.primary : colors.muted },
              ]}
            >
              {mode === "list" && "Users"}
              {mode === "detail" && "Detail"}
              {mode === "logs" && "Logs"}
              {mode === "stats" && "Stats"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Users List View */}
        {viewMode === "list" && (
          <View>
            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.foreground }]}
              placeholder="Search users..."
              placeholderTextColor={colors.muted}
              value={searchText}
              onChangeText={setSearchText}
            />
            <FlatList
              data={filteredUsers}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
          </View>
        )}

        {/* User Detail View */}
        {viewMode === "detail" && userDetail && (
          <View>
            <View style={[styles.detailCard, { backgroundColor: colors.surface }]}>
              <View style={styles.detailHeader}>
                <Text style={[styles.detailTitle, { color: colors.foreground }]}>User Information</Text>
              </View>
              <View style={styles.detailContent}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>Username:</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{userDetail.user.username}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>Role:</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{userDetail.user.role}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>Created:</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>
                    {new Date(userDetail.user.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>Last Login:</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>
                    {userDetail.user.lastLoginAt ? new Date(userDetail.user.lastLoginAt).toLocaleString() : "Never"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.detailCard, { backgroundColor: colors.surface }]}>
              <View style={styles.detailHeader}>
                <Text style={[styles.detailTitle, { color: colors.foreground }]}>2FA Status</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: userDetail.twoFA.isEnabled ? colors.success + "20" : colors.error + "20" },
                  ]}
                >
                  <Text
                    style={{
                      color: userDetail.twoFA.isEnabled ? colors.success : colors.error,
                      fontWeight: "600",
                      fontSize: 12,
                    }}
                  >
                    {userDetail.twoFA.isEnabled ? "ENABLED" : "DISABLED"}
                  </Text>
                </View>
              </View>
              <View style={styles.detailContent}>
                {userDetail.twoFA.isEnabled && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.muted }]}>Enabled At:</Text>
                      <Text style={[styles.detailValue, { color: colors.foreground }]}>
                        {userDetail.twoFA.enabledAt ? new Date(userDetail.twoFA.enabledAt).toLocaleString() : "N/A"}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.muted }]}>Last Verified:</Text>
                      <Text style={[styles.detailValue, { color: colors.foreground }]}>
                        {userDetail.twoFA.lastVerifiedAt
                          ? new Date(userDetail.twoFA.lastVerifiedAt).toLocaleString()
                          : "Never"}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.muted }]}>Backup Codes:</Text>
                      <Text style={[styles.detailValue, { color: colors.foreground }]}>
                        {userDetail.twoFA.backupCodesCount} remaining
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {userDetail.twoFA.isEnabled && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.warning + "20" }]}
                  onPress={() => {
                    regenerateBackupCodes.mutate({ userId: selectedUser.id });
                  }}
                  disabled={regenerateBackupCodes.isPending}
                >
                  <MaterialIcons name="refresh" size={20} color={colors.warning} />
                  <Text style={{ color: colors.warning, fontWeight: "600", marginLeft: 8 }}>
                    {regenerateBackupCodes.isPending ? "Regenerating..." : "Regenerate Codes"}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.error + "20" }]}
                onPress={() => setShowResetModal(true)}
                disabled={resetUserTwoFA.isPending}
              >
                <MaterialIcons name="delete" size={20} color={colors.error} />
                <Text style={{ color: colors.error, fontWeight: "600", marginLeft: 8 }}>
                  {resetUserTwoFA.isPending ? "Resetting..." : "Reset 2FA"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Activity Logs View */}
        {viewMode === "logs" && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent 2FA Activity</Text>
            <FlatList
              data={logs}
              renderItem={renderLogItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
          </View>
        )}

        {/* Statistics View */}
        {viewMode === "stats" && stats && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>2FA Statistics</Text>
            <View style={styles.statsGrid}>
              {renderStatCard("Total Users", stats.totalUsers, "people")}
              {renderStatCard("2FA Enabled", stats.twoFAEnabledCount, "verified-user")}
              {renderStatCard("Adoption Rate", `${stats.twoFAEnabledPercentage}%`, "trending-up")}
              {renderStatCard("Successful Verifications", stats.successfulVerifications, "check-circle")}
              {renderStatCard("Failed Attempts", stats.failedAttempts, "error")}
              {renderStatCard("Total Logs", stats.totalLogs, "history")}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Reset 2FA Modal */}
      <Modal visible={showResetModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Reset 2FA for {selectedUser?.username}?</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.foreground }]}
              placeholder="Reason for reset (optional)"
              placeholderTextColor={colors.muted}
              value={resetReason}
              onChangeText={setResetReason}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.muted + "20" }]}
                onPress={() => {
                  setShowResetModal(false);
                  setResetReason("");
                }}
              >
                <Text style={{ color: colors.muted, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.error + "20" }]}
                onPress={handleResetTwoFA}
                disabled={resetUserTwoFA.isPending}
              >
                <Text style={{ color: colors.error, fontWeight: "600" }}>
                  {resetUserTwoFA.isPending ? "Resetting..." : "Confirm Reset"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  searchInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 14,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  userRole: {
    fontSize: 13,
    marginBottom: 4,
  },
  userMeta: {
    fontSize: 12,
  },
  statCard: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },
  statTitle: {
    fontSize: 12,
    marginTop: 4,
  },
  logItem: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  logUser: {
    fontSize: 14,
    fontWeight: "600",
  },
  logAction: {
    fontSize: 12,
  },
  logStatus: {
    fontSize: 12,
    marginBottom: 4,
  },
  logTime: {
    fontSize: 11,
  },
  detailCard: {
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  detailContent: {
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
  },
  actionButtons: {
    gap: 8,
    marginBottom: 20,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  modalInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});
