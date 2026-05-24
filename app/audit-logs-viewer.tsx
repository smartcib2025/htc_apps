import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, FlatList, RefreshControl, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAppContext } from "@/lib/app-context";
import { trpc } from "@/lib/trpc";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type AccessLogAction =
  | "login_success"
  | "login_failed"
  | "logout"
  | "login_attempt_failed"
  | "account_locked"
  | "password_reset_requested"
  | "password_reset_completed"
  | "email_verified"
  | "account_created";

interface AccessLog {
  id: number;
  accountId?: number | null;
  email?: string | null;
  username?: string | null;
  role?: string | null;
  loginMethod: string;
  action: AccessLogAction;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceInfo?: string | null;
  status: "success" | "failed";
  failureReason?: string | null;
  sessionId?: string | null;
  duration?: number | null;
  createdAt: Date;
}

export default function AuditLogsViewerScreen() {
  const router = useRouter();
  const { role, accountId } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "success" | "failed">("all");
  const [searchEmail, setSearchEmail] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "email">("all");

  // Check if user is admin
  if (role !== "admin") {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-lg text-error font-semibold">Access Denied</Text>
        <Text className="text-sm text-muted mt-2">Only administrators can view audit logs</Text>
      </ScreenContainer>
    );
  }

  // Get all access logs
  const { data: allLogs = [], isLoading: allLogsLoading, refetch: refetchAllLogs } = trpc.emailAuth.getAllAccessLogs.useQuery(
    { limit: 100 },
    { enabled: viewMode === "all" }
  );

  // Get access logs by email
  const { data: emailLogs = [], isLoading: emailLogsLoading, refetch: refetchEmailLogs } = trpc.emailAuth.getAccessLogsByEmail.useQuery(
    { email: searchEmail, limit: 50 },
    { enabled: viewMode === "email" && searchEmail.length > 0 }
  );

  // Get failed login attempts
  const { data: failedAttempts = [], isLoading: failedLoading } = trpc.emailAuth.getFailedLoginAttempts.useQuery(
    { limit: 50 },
    { enabled: selectedFilter === "failed" }
  );

  // Get locked accounts
  const { data: lockedAccounts = [] } = trpc.emailAuth.getLockedAccounts.useQuery();

  // Unlock account mutation
  const unlockMutation = trpc.emailAuth.unlockAccount.useMutation({
    onSuccess: () => {
      refetchAllLogs();
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    if (viewMode === "all") {
      await refetchAllLogs();
    } else {
      await refetchEmailLogs();
    }
    setRefreshing(false);
  };

  const getActionIcon = (action: AccessLogAction): string => {
    switch (action) {
      case "login_success":
        return "✅";
      case "login_failed":
        return "❌";
      case "logout":
        return "🚪";
      case "login_attempt_failed":
        return "⚠️";
      case "account_locked":
        return "🔒";
      case "password_reset_requested":
        return "🔑";
      case "password_reset_completed":
        return "✓";
      case "email_verified":
        return "📧";
      case "account_created":
        return "➕";
      default:
        return "📋";
    }
  };

  const getActionLabel = (action: AccessLogAction): string => {
    const labels: Record<AccessLogAction, string> = {
      login_success: "Login Success",
      login_failed: "Login Failed",
      logout: "Logout",
      login_attempt_failed: "Failed Attempt",
      account_locked: "Account Locked",
      password_reset_requested: "Reset Requested",
      password_reset_completed: "Password Reset",
      email_verified: "Email Verified",
      account_created: "Account Created",
    };
    return labels[action] || action;
  };

  const getStatusColor = (status: "success" | "failed"): string => {
    return status === "success" ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30";
  };

  const filteredLogs = (() => {
    let logs: AccessLog[] = [];
    if (viewMode === "all") {
      logs = allLogs;
    } else {
      logs = emailLogs;
    }

    if (selectedFilter === "all") return logs;
    return logs.filter((log) => log.status === selectedFilter);
  })();

  const renderLogItem = ({ item }: { item: AccessLog }) => (
    <View className={`mb-3 p-3 rounded-lg border ${getStatusColor(item.status)}`}>
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-row items-center gap-2 flex-1">
          <Text className="text-lg">{getActionIcon(item.action)}</Text>
          <View className="flex-1">
            <Text className="font-semibold text-foreground text-sm">{getActionLabel(item.action)}</Text>
            <Text className="text-xs text-muted">
              {item.email || item.username || "Unknown"}
            </Text>
          </View>
        </View>
        <Text className={`text-xs font-semibold ${item.status === "success" ? "text-green-600" : "text-red-600"}`}>
          {item.status.toUpperCase()}
        </Text>
      </View>

      {item.failureReason && (
        <Text className="text-xs text-muted mb-2 bg-black/10 p-2 rounded">
          Reason: {item.failureReason}
        </Text>
      )}

      <View className="flex-row gap-2 mb-2 flex-wrap">
        {item.ipAddress && (
          <View className="bg-black/5 px-2 py-1 rounded">
            <Text className="text-xs text-muted">IP: {item.ipAddress}</Text>
          </View>
        )}
        {item.loginMethod && (
          <View className="bg-black/5 px-2 py-1 rounded">
            <Text className="text-xs text-muted">{item.loginMethod}</Text>
          </View>
        )}
        {item.duration && (
          <View className="bg-black/5 px-2 py-1 rounded">
            <Text className="text-xs text-muted">{Math.round(item.duration / 60)}m</Text>
          </View>
        )}
      </View>

      <Text className="text-xs text-muted">
        {new Date(item.createdAt).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">Audit Logs</Text>
          <Text className="text-sm text-muted">Track all user access and authentication events</Text>
        </View>

        {/* View Mode Tabs */}
        <View className="mb-4 flex-row gap-2">
          <Pressable
            onPress={() => setViewMode("all")}
            className={`flex-1 py-2 px-3 rounded-lg ${viewMode === "all" ? "bg-primary" : "bg-surface border border-border"}`}
          >
            <Text
              className={`text-center text-sm font-semibold ${viewMode === "all" ? "text-background" : "text-foreground"}`}
            >
              All Logs
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode("email")}
            className={`flex-1 py-2 px-3 rounded-lg ${viewMode === "email" ? "bg-primary" : "bg-surface border border-border"}`}
          >
            <Text
              className={`text-center text-sm font-semibold ${viewMode === "email" ? "text-background" : "text-foreground"}`}
            >
              By Email
            </Text>
          </Pressable>
        </View>

        {/* Search by Email */}
        {viewMode === "email" && (
          <View className="mb-4">
            <TextInput
              placeholder="Search by email..."
              value={searchEmail}
              onChangeText={setSearchEmail}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
              placeholderTextColor="#999"
            />
          </View>
        )}

        {/* Status Filter */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Filter by Status</Text>
          <View className="flex-row gap-2">
            {(["all", "success", "failed"] as const).map((status) => (
              <Pressable
                key={status}
                onPress={() => setSelectedFilter(status)}
                className={`px-3 py-2 rounded-full ${
                  selectedFilter === status
                    ? status === "success"
                      ? "bg-green-500"
                      : status === "failed"
                        ? "bg-red-500"
                        : "bg-primary"
                    : "bg-surface border border-border"
                }`}
              >
                <Text
                  className={
                    selectedFilter === status
                      ? "text-background font-semibold text-xs"
                      : "text-foreground text-xs"
                  }
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Locked Accounts Alert */}
        {lockedAccounts.length > 0 && (
          <View className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <View className="flex-row items-center gap-2 mb-2">
              <Text className="text-lg">🔒</Text>
              <Text className="font-semibold text-foreground text-sm">
                {lockedAccounts.length} Locked Account(s)
              </Text>
            </View>
            <FlatList
              data={lockedAccounts}
              keyExtractor={(item) => item.email}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View className="flex-row items-center justify-between mb-2 p-2 bg-black/5 rounded">
                  <Text className="text-xs text-muted flex-1">{item.email}</Text>
                  <Pressable
                    onPress={() => unlockMutation.mutate({ email: item.email })}
                    className="bg-primary px-2 py-1 rounded"
                  >
                    <Text className="text-xs text-background font-semibold">Unlock</Text>
                  </Pressable>
                </View>
              )}
            />
          </View>
        )}

        {/* Logs List */}
        {allLogsLoading || emailLogsLoading || failedLoading ? (
          <View className="items-center justify-center py-8">
            <Text className="text-muted">Loading logs...</Text>
          </View>
        ) : filteredLogs.length > 0 ? (
          <FlatList
            data={filteredLogs}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            renderItem={renderLogItem}
          />
        ) : (
          <View className="items-center justify-center py-8">
            <Text className="text-2xl mb-2">📋</Text>
            <Text className="text-foreground font-semibold mb-1">No logs found</Text>
            <Text className="text-muted text-center">
              {viewMode === "email" && searchEmail.length === 0
                ? "Enter an email to search"
                : "No access logs in this category"}
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
