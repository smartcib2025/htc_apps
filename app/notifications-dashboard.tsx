import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAppContext } from "@/lib/app-context";
import { trpc } from "@/lib/trpc";

type NotificationPriority = "low" | "medium" | "high" | "critical";
type NotificationType =
  | "high_risk_player"
  | "upcoming_match"
  | "coach_compensation"
  | "evaluation_due"
  | "checkin_reminder"
  | "award_received"
  | "system_alert";

interface Notification {
  id: number;
  userId: number;
  recipientRole: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority | null;
  isRead: boolean | null;
  createdAt: Date;
  readAt?: Date | null;
  relatedPlayerId?: number | null;
  relatedCoachId?: number | null;
  relatedMatchId?: number | null;
}

export default function NotificationsDashboardScreen() {
  const router = useRouter();
  const { accountId, role } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<NotificationPriority | "all">("all");

  // Get notifications
  const { data: notifications = [], isLoading, refetch } = trpc.notifications.list.useQuery(
    { userId: accountId || 0, limit: 50 },
    { enabled: !!accountId }
  );

  // Get unread count
  const { data: unreadNotifications = [] } = trpc.notifications.unread.useQuery(
    { userId: accountId || 0 },
    { enabled: !!accountId }
  );

  // Mark as read mutation
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Get role-specific alerts
  const { data: highRiskAlerts = [] } = trpc.notifications.highRiskAlerts.useQuery(
    { academyId: 1 }, // TODO: Get actual academy ID from context
    { enabled: role === "head_coach" || role === "admin" }
  );

  const { data: upcomingMatches = [] } = trpc.notifications.upcomingMatches.useQuery(
    { coachId: accountId || 0 },
    { enabled: role === "coach" || role === "head_coach" }
  );

  const { data: compensationAlerts = [] } = trpc.notifications.compensationAlerts.useQuery(
    { headCoachId: accountId || 0 },
    { enabled: role === "head_coach" || role === "admin" }
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: number) => {
    await markAsReadMutation.mutateAsync({ notificationId });
  };

  const getPriorityColor = (priority: NotificationPriority | null): string => {
    switch (priority) {
      case "critical":
        return "bg-red-600";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
      case "high_risk_player":
        return "⚠️";
      case "upcoming_match":
        return "🎾";
      case "coach_compensation":
        return "💰";
      case "evaluation_due":
        return "📋";
      case "checkin_reminder":
        return "✅";
      case "award_received":
        return "🏆";
      case "system_alert":
        return "🔔";
      default:
        return "📢";
    }
  };

  const filteredNotifications = notifications.filter((notif: Notification) => {
    if (selectedFilter === "all") return true;
    return notif.priority === selectedFilter;
  });

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <Pressable
      onPress={() => handleMarkAsRead(item.id)}
      className={`mb-3 p-4 rounded-lg border ${
        item.isRead ? "bg-surface border-border opacity-60" : "bg-primary/10 border-primary"
      }`}
    >
      <View className="flex-row items-start gap-3">
        {/* Priority indicator */}
        <View className={`w-1 h-12 rounded-full ${getPriorityColor(item.priority || "low")}`} />

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-lg">{getNotificationIcon(item.notificationType)}</Text>
            <Text className="text-sm font-semibold text-foreground flex-1">{item.title}</Text>
            {!item.isRead && <View className="w-2 h-2 rounded-full bg-primary" />}
          </View>
          <Text className="text-sm text-muted leading-relaxed">{item.message}</Text>
          <Text className="text-xs text-muted mt-2">
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>
    </Pressable>
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
          <Text className="text-2xl font-bold text-foreground mb-2">Notifications</Text>
          <Text className="text-sm text-muted">
            You have {unreadNotifications.length} unread notifications
          </Text>
        </View>

        {/* Priority Filter */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Filter by Priority</Text>
          <View className="flex-row gap-2 flex-wrap">
            {(["all", "critical", "high", "medium", "low"] as const).map((priority) => (
              <Pressable
                key={priority}
                onPress={() => setSelectedFilter(priority)}
                className={`px-3 py-2 rounded-full ${
                  selectedFilter === priority
                    ? "bg-primary"
                    : "bg-surface border border-border"
                }`}
              >
                <Text
                  className={
                    selectedFilter === priority
                      ? "text-background font-semibold text-xs"
                      : "text-foreground text-xs"
                  }
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Notifications List */}
        {isLoading ? (
          <View className="items-center justify-center py-8">
            <Text className="text-muted">Loading notifications...</Text>
          </View>
        ) : filteredNotifications.length > 0 ? (
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            renderItem={renderNotificationItem}
          />
        ) : (
          <View className="items-center justify-center py-8">
            <Text className="text-2xl mb-2">🎉</Text>
            <Text className="text-foreground font-semibold mb-1">All caught up!</Text>
            <Text className="text-muted text-center">No notifications in this category</Text>
          </View>
        )}

        {/* Role-specific alerts section */}
        {(highRiskAlerts.length > 0 ||
          upcomingMatches.length > 0 ||
          compensationAlerts.length > 0) && (
          <View className="mt-6 pt-4 border-t border-border">
            <Text className="text-lg font-semibold text-foreground mb-3">Quick Alerts</Text>

            {/* High Risk Players */}
            {highRiskAlerts.length > 0 && (
              <View className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  ⚠️ High Risk Players ({highRiskAlerts.length})
                </Text>
                <Text className="text-xs text-muted">
                  {highRiskAlerts.length} player(s) need immediate attention
                </Text>
              </View>
            )}

            {/* Upcoming Matches */}
            {upcomingMatches.length > 0 && (
              <View className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  🎾 Upcoming Matches ({upcomingMatches.length})
                </Text>
                <Text className="text-xs text-muted">
                  {upcomingMatches.length} match(es) coming up
                </Text>
              </View>
            )}

            {/* Compensation Alerts */}
            {compensationAlerts.length > 0 && (
              <View className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  💰 Compensation Approvals ({compensationAlerts.length})
                </Text>
                <Text className="text-xs text-muted">
                  {compensationAlerts.length} pending approval(s)
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
