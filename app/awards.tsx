import { useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAppContext } from "@/lib/app-context";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const CATEGORY_INFO: Record<string, { label: string; icon: string; color: string }> = {
  training: { label: "ฝึกซ้อม", icon: "fitness-center", color: "#1B5E20" },
  match: { label: "แข่งขัน", icon: "emoji-events", color: "#E65100" },
  discipline: { label: "วินัย", icon: "verified", color: "#1565C0" },
  improvement: { label: "พัฒนาการ", icon: "trending-up", color: "#6A1B9A" },
  special: { label: "พิเศษ", icon: "star", color: "#FF6F00" },
};

type TabType = "awards" | "leaderboard" | "grant";

export default function AwardsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { role, profileId } = useAppContext();
  const [tab, setTab] = useState<TabType>("awards");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedAwardId, setSelectedAwardId] = useState<number | null>(null);
  const [grantNote, setGrantNote] = useState("");

  const { data: awards, isLoading: awardsLoading, refetch: refetchAwards } = trpc.awards.all.useQuery();
  const { data: allPlayerAwards, refetch: refetchPA } = trpc.awards.allPlayerAwards.useQuery();
  const { data: players } = trpc.players.all.useQuery();
  const grantMutation = trpc.awards.grant.useMutation({
    onSuccess: () => {
      refetchPA();
      Alert.alert("สำเร็จ", "มอบรางวัลเรียบร้อย");
      setSelectedPlayerId(null);
      setSelectedAwardId(null);
      setGrantNote("");
      setTab("leaderboard");
    },
  });

  const isAdmin = role === "admin" || role === "head_coach" || role === "coach";

  // Leaderboard: count awards per player
  const leaderboard = (() => {
    if (!allPlayerAwards || !players) return [];
    const counts: Record<number, { name: string; count: number; awards: any[] }> = {};
    (players || []).forEach((p) => { counts[p.id] = { name: p.name, count: 0, awards: [] }; });
    (allPlayerAwards || []).forEach((pa: any) => {
      if (counts[pa.playerId]) {
        counts[pa.playerId].count++;
        counts[pa.playerId].awards.push(pa);
      }
    });
    return Object.entries(counts)
      .map(([id, data]) => ({ playerId: Number(id), ...data }))
      .sort((a, b) => b.count - a.count);
  })();

  const handleGrant = () => {
    if (!selectedPlayerId || !selectedAwardId) { Alert.alert("กรุณาเลือกนักกีฬาและรางวัล"); return; }
    grantMutation.mutate({
      playerId: selectedPlayerId,
      awardId: selectedAwardId,
      awardedBy: profileId ?? undefined,
      awardedDate: new Date().toISOString().split("T")[0],
      note: grantNote || undefined,
    });
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: "awards", label: "รางวัลทั้งหมด", icon: "emoji-events" },
    { key: "leaderboard", label: "อันดับ", icon: "leaderboard" },
    ...(isAdmin ? [{ key: "grant" as TabType, label: "มอบรางวัล", icon: "card-giftcard" }] : []),
  ];

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground ml-3">รางวัลและเกียรติยศ</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 py-2 gap-2 border-b border-border">
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            className="flex-row items-center px-3 py-2 rounded-full"
            style={{ backgroundColor: tab === t.key ? colors.primary : colors.surface }}
            onPress={() => setTab(t.key)}
          >
            <MaterialIcons name={t.icon as any} size={16} color={tab === t.key ? "#fff" : colors.muted} />
            <Text className="ml-1.5" style={{ color: tab === t.key ? "#fff" : colors.muted, fontSize: 13, fontWeight: "500" }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {tab === "awards" && (
        <FlatList
          data={awards || []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const catInfo = CATEGORY_INFO[item.category] || CATEGORY_INFO.special;
            const awardCount = (allPlayerAwards || []).filter((pa: any) => pa.awardId === item.id).length;
            return (
              <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: (item.badgeColor || catInfo.color) + "20" }}>
                    <MaterialIcons name={catInfo.icon as any} size={24} color={item.badgeColor || catInfo.color} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-foreground">{item.name}</Text>
                    <Text className="text-xs text-muted mt-0.5">{item.description || catInfo.label}</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-lg font-bold" style={{ color: catInfo.color }}>{awardCount}</Text>
                    <Text className="text-xs text-muted">ครั้ง</Text>
                  </View>
                </View>
                {item.criteria && (
                  <View className="mt-2 bg-background rounded-lg px-3 py-2">
                    <Text className="text-xs text-muted">เกณฑ์: {item.criteria}</Text>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            awardsLoading ? <ActivityIndicator color={colors.primary} /> : <View className="items-center py-12"><Text className="text-muted">ยังไม่มีรางวัล</Text></View>
          }
        />
      )}

      {tab === "leaderboard" && (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => String(item.playerId)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item, index }) => {
            const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;
            return (
              <View className="flex-row items-center bg-surface rounded-xl p-3 mb-2 border border-border">
                <View className="w-8 items-center">
                  {medal ? <Text className="text-lg">{medal}</Text> : <Text className="text-sm text-muted font-medium">{index + 1}</Text>}
                </View>
                <View className="flex-1 ml-2">
                  <Text className="font-medium text-foreground">{item.name}</Text>
                  <View className="flex-row flex-wrap gap-1 mt-1">
                    {item.awards.slice(0, 5).map((a: any, i: number) => {
                      const aw = (awards || []).find((aw2) => aw2.id === a.awardId);
                      const cat = CATEGORY_INFO[aw?.category || "special"];
                      return (
                        <View key={i} className="w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: (cat?.color || "#999") + "30" }}>
                          <MaterialIcons name={cat?.icon as any || "star"} size={12} color={cat?.color || "#999"} />
                        </View>
                      );
                    })}
                    {item.awards.length > 5 && <Text className="text-xs text-muted ml-1">+{item.awards.length - 5}</Text>}
                  </View>
                </View>
                <View className="items-center bg-primary/10 rounded-lg px-3 py-1">
                  <Text className="text-lg font-bold text-primary">{item.count}</Text>
                  <Text className="text-xs text-muted">รางวัล</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<View className="items-center py-12"><Text className="text-muted">ยังไม่มีข้อมูล</Text></View>}
        />
      )}

      {tab === "grant" && isAdmin && (
        <ScrollView className="flex-1 px-4 py-4">
          <Text className="text-sm font-medium text-muted mb-2">เลือกนักกีฬา</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {(players || []).map((p) => (
              <TouchableOpacity
                key={p.id}
                className="px-3 py-2 rounded-lg border"
                style={{ backgroundColor: selectedPlayerId === p.id ? colors.primary + "15" : colors.surface, borderColor: selectedPlayerId === p.id ? colors.primary : colors.border }}
                onPress={() => setSelectedPlayerId(p.id)}
              >
                <Text style={{ color: selectedPlayerId === p.id ? colors.primary : colors.foreground, fontSize: 13 }}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-sm font-medium text-muted mb-2">เลือกรางวัล</Text>
          <View className="gap-2 mb-4">
            {(awards || []).map((a) => {
              const catInfo = CATEGORY_INFO[a.category] || CATEGORY_INFO.special;
              return (
                <TouchableOpacity
                  key={a.id}
                  className="flex-row items-center p-3 rounded-xl border"
                  style={{ backgroundColor: selectedAwardId === a.id ? colors.primary + "15" : colors.surface, borderColor: selectedAwardId === a.id ? colors.primary : colors.border }}
                  onPress={() => setSelectedAwardId(a.id)}
                >
                  <MaterialIcons name={catInfo.icon as any} size={20} color={catInfo.color} />
                  <Text className="ml-2 flex-1 font-medium" style={{ color: selectedAwardId === a.id ? colors.primary : colors.foreground }}>{a.name}</Text>
                  {selectedAwardId === a.id && <MaterialIcons name="check-circle" size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text className="text-sm font-medium text-muted mb-2">หมายเหตุ (ไม่บังคับ)</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
            placeholder="เหตุผลในการมอบรางวัล..."
            placeholderTextColor={colors.muted}
            value={grantNote}
            onChangeText={setGrantNote}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            className="rounded-xl py-3.5 items-center active:opacity-80"
            style={{ backgroundColor: colors.primary }}
            onPress={handleGrant}
            disabled={grantMutation.isPending}
          >
            {grantMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View className="flex-row items-center">
                <MaterialIcons name="card-giftcard" size={20} color="#fff" />
                <Text className="text-white font-semibold ml-2">มอบรางวัล</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
