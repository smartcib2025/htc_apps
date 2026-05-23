import { useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAppContext } from "@/lib/app-context";
import { trpc } from "@/lib/trpc";

export default function AdvancedSearchScreen() {
  const router = useRouter();
  const { accountId } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const levels = ["Beginner", "Intermediate", "Advanced", "Professional"];
  const statuses = ["active", "inactive", "injured"];
  const programs = ["Group Training", "Private Coaching", "Tournament Prep"];

  // Get search history
  const { data: searchHistory = [] } = trpc.search.history.useQuery(
    { userId: accountId || 0, limit: 5 },
    { enabled: !!accountId }
  );

  // Search and add to history mutations
  const searchPlayersQuery = trpc.search.players.useQuery(
    {
      query: searchQuery,
      filters: {
        level: selectedLevel || undefined,
        status: (selectedStatus as any) || undefined,
        program: selectedProgram || undefined,
      },
    },
    { enabled: false }
  );

  const addToHistoryMutation = trpc.search.addToHistory.useMutation({
    onError: (error) => {
      console.error("Failed to save search history:", error);
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim() && !selectedLevel && !selectedStatus && !selectedProgram) {
      return;
    }

    try {
      const results = await searchPlayersQuery.refetch();
      if (results.data) {
        setSearchResults(results.data);
        // Add to search history
        if (accountId) {
          await addToHistoryMutation.mutateAsync({
            userId: accountId,
            searchQuery,
            searchType: "player",
            filters: JSON.stringify({
              level: selectedLevel,
              status: selectedStatus,
              program: selectedProgram,
            }),
            resultsCount: results.data.length,
          });
        }
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    setSearchResults([]);
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <Text className="text-2xl font-bold text-foreground mb-4">Advanced Search</Text>

        {/* Search Input */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Player Name</Text>
          <TextInput
            placeholder="Search by name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="border border-border rounded-lg p-3 text-foreground bg-surface"
            placeholderTextColor="#999"
          />
        </View>

        {/* Level Filter */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Level</Text>
          <View className="flex-row flex-wrap gap-2">
            {levels.map((level) => (
              <Pressable
                key={level}
                onPress={() => setSelectedLevel(selectedLevel === level ? null : level)}
                className={`px-4 py-2 rounded-full ${
                  selectedLevel === level ? "bg-primary" : "bg-surface border border-border"
                }`}
              >
                <Text className={selectedLevel === level ? "text-background font-semibold" : "text-foreground"}>
                  {level}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Status Filter */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Status</Text>
          <View className="flex-row flex-wrap gap-2">
            {statuses.map((status) => (
              <Pressable
                key={status}
                onPress={() => setSelectedStatus(selectedStatus === status ? null : status)}
                className={`px-4 py-2 rounded-full ${
                  selectedStatus === status ? "bg-primary" : "bg-surface border border-border"
                }`}
              >
                <Text className={selectedStatus === status ? "text-background font-semibold" : "text-foreground"}>
                  {status}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Program Filter */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Program</Text>
          <View className="flex-row flex-wrap gap-2">
            {programs.map((program) => (
              <Pressable
                key={program}
                onPress={() => setSelectedProgram(selectedProgram === program ? null : program)}
                className={`px-4 py-2 rounded-full ${
                  selectedProgram === program ? "bg-primary" : "bg-surface border border-border"
                }`}
              >
                <Text className={selectedProgram === program ? "text-background font-semibold" : "text-foreground"}>
                  {program}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Search Button */}
        <Pressable
          onPress={handleSearch}
          disabled={searchPlayersQuery.isLoading || addToHistoryMutation.isPending}
          className="bg-primary rounded-lg p-4 mb-4"
        >
          <Text className="text-center text-background font-semibold">
            {searchPlayersQuery.isLoading || addToHistoryMutation.isPending ? "Searching..." : "Search"}
          </Text>
        </Pressable>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View className="mb-4">
            <Text className="text-lg font-semibold text-foreground mb-2">
              Results ({searchResults.length})
            </Text>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => router.push({ pathname: "/player-detail", params: { id: item.id } })}
                  className="bg-surface border border-border rounded-lg p-3 mb-2"
                >
                  <Text className="text-foreground font-semibold">{item.name}</Text>
                  <Text className="text-sm text-muted">{item.level} • {item.program}</Text>
                  <Text className="text-xs text-muted mt-1">Status: {item.status}</Text>
                </Pressable>
              )}
            />
          </View>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && searchResults.length === 0 && (
          <View>
            <Text className="text-lg font-semibold text-foreground mb-2">Recent Searches</Text>
            <FlatList
              data={searchHistory}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleQuickSearch(item.searchQuery)}
                  className="bg-surface border border-border rounded-lg p-3 mb-2"
                >
                  <Text className="text-foreground">{item.searchQuery}</Text>
                  <Text className="text-xs text-muted">{item.resultsCount} results</Text>
                </Pressable>
              )}
            />
          </View>
        )}

        {searchResults.length === 0 && searchHistory.length === 0 && !searchPlayersQuery.isLoading && (
          <View className="items-center justify-center py-8">
            <Text className="text-muted">No results found. Try searching for a player.</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
