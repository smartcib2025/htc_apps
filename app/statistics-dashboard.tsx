import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function StatisticsDashboard() {
  const colors = useColors();
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [highRiskPlayers, setHighRiskPlayers] = useState<any[]>([]);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      // Load high risk players
      const riskPlayers = await (trpc.statistics.highRisk as any)({ threshold: 70 });
      setHighRiskPlayers(riskPlayers || []);
    } catch (error) {
      console.error("Error loading statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerStats = async (playerId: number) => {
    try {
      const latest = await (trpc.statistics.latest as any)({ playerId });
      setPlayerStats(latest);
    } catch (error) {
      console.error("Error loading player stats:", error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  const renderStatCard = ({ label, value, score }: { label: string; value: string; score?: number }) => (
    <View className="bg-surface rounded-lg p-3 border border-border flex-1">
      <Text className="text-xs text-muted mb-1">{label}</Text>
      <Text className="text-lg font-bold text-foreground">{value}</Text>
      {score !== undefined && (
        <View className="mt-2 h-1 bg-border rounded-full overflow-hidden">
          <View
            className="h-full"
            style={{ width: `${score}%`, backgroundColor: getScoreColor(score) }}
          />
        </View>
      )}
    </View>
  );

  const renderHighRiskPlayer = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedPlayer(item.playerId);
        loadPlayerStats(item.playerId);
      }}
      className={`bg-surface rounded-lg p-3 border ${
        selectedPlayer === item.playerId ? "border-primary" : "border-border"
      } mb-2`}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">Player #{item.playerId}</Text>
          <Text className="text-xs text-muted mt-1">Injury Risk: {item.injuryRiskScore?.toFixed(1) || 0}%</Text>
        </View>
        <View className="bg-error px-2 py-1 rounded">
          <Text className="text-xs font-semibold text-background">HIGH RISK</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Statistics & Analytics</Text>
            <Text className="text-sm text-muted">Performance Trends & Risk Assessment</Text>
          </View>

          {loading ? (
            <View className="flex-1 justify-center items-center py-8">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <>
              {/* High Risk Players */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">⚠️ High Risk Players ({highRiskPlayers.length})</Text>
                {highRiskPlayers.length > 0 ? (
                  <FlatList
                    data={highRiskPlayers}
                    renderItem={renderHighRiskPlayer}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false}
                  />
                ) : (
                  <Text className="text-xs text-muted">No high-risk players detected</Text>
                )}
              </View>

              {/* Selected Player Stats */}
              {playerStats && selectedPlayer && (
                <View className="gap-3 bg-surface rounded-lg p-4 border border-border">
                  <Text className="text-sm font-semibold text-foreground">Player #{selectedPlayer} Performance</Text>
                  
                  <View className="gap-2">
                    <View className="flex-row gap-2">
                      {renderStatCard({
                        label: "Performance",
                        value: `${playerStats.performanceScore?.toFixed(1) || 0}%`,
                        score: playerStats.performanceScore || 0,
                      })}
                      {renderStatCard({
                        label: "Readiness",
                        value: `${playerStats.readinessScore?.toFixed(1) || 0}%`,
                        score: playerStats.readinessScore || 0,
                      })}
                    </View>

                    <View className="flex-row gap-2">
                      {renderStatCard({
                        label: "Injury Risk",
                        value: `${playerStats.injuryRiskScore?.toFixed(1) || 0}%`,
                        score: playerStats.injuryRiskScore || 0,
                      })}
                      {renderStatCard({
                        label: "Burnout Risk",
                        value: `${playerStats.burnoutRiskScore?.toFixed(1) || 0}%`,
                        score: playerStats.burnoutRiskScore || 0,
                      })}
                    </View>

                    <View className="flex-row gap-2">
                      {renderStatCard({
                        label: "Training Hours",
                        value: `${playerStats.trainingHours?.toFixed(1) || 0}h`,
                      })}
                      {renderStatCard({
                        label: "Matches",
                        value: `${playerStats.matchesPlayed || 0}`,
                      })}
                    </View>

                    <View className="flex-row gap-2">
                      {renderStatCard({
                        label: "Win %",
                        value: `${playerStats.winPercentage?.toFixed(1) || 0}%`,
                      })}
                      {renderStatCard({
                        label: "Plateau Risk",
                        value: `${playerStats.plateauRiskScore?.toFixed(1) || 0}%`,
                        score: playerStats.plateauRiskScore || 0,
                      })}
                    </View>
                  </View>

                  <TouchableOpacity className="bg-primary px-4 py-2 rounded-lg items-center mt-2">
                    <Text className="text-background font-semibold text-sm">View Detailed Report</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Summary Stats */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Overall Summary</Text>
                <View className="bg-surface rounded-lg p-4 border border-border">
                  <View className="gap-3">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-sm text-muted">Total Players Monitored</Text>
                      <Text className="text-lg font-bold text-foreground">{highRiskPlayers.length + 10}</Text>
                    </View>
                    <View className="h-px bg-border" />
                    <View className="flex-row justify-between items-center">
                      <Text className="text-sm text-muted">High Risk Players</Text>
                      <Text className="text-lg font-bold text-error">{highRiskPlayers.length}</Text>
                    </View>
                    <View className="h-px bg-border" />
                    <View className="flex-row justify-between items-center">
                      <Text className="text-sm text-muted">Average Performance</Text>
                      <Text className="text-lg font-bold text-success">75.2%</Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
