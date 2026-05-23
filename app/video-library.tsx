import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function VideoLibrary() {
  const colors = useColors();
  const router = useRouter();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "training", "match", "technique", "analysis", "other"];

  useEffect(() => {
    loadVideos();
  }, [selectedCategory]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const result = await (trpc.videos.list as any)({ limit: 20, offset: 0 });
      const filtered = Array.isArray(result)
        ? selectedCategory === "all" 
          ? result 
          : result.filter((v: any) => v.category === selectedCategory)
        : [];
      setVideos(filtered);
    } catch (error) {
      console.error("Error loading videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoPress = (videoId: number) => {
    router.push({
      pathname: "/video-player",
      params: { videoId: videoId.toString() }
    });
  };

  const renderVideoCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleVideoPress(item.id)}
      style={{ marginBottom: 12 }}
      activeOpacity={0.7}
    >
      <View className="bg-surface rounded-lg p-3 border border-border">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground" numberOfLines={1}>{item.title}</Text>
            <Text className="text-xs text-muted mt-1">{item.category}</Text>
          </View>
          <View className="bg-primary px-2 py-1 rounded">
            <Text className="text-xs font-semibold text-background">{item.viewCount || 0}</Text>
          </View>
        </View>
        <Text className="text-xs text-muted" numberOfLines={2}>{item.description}</Text>
        <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-border">
          <Text className="text-xs text-muted">{new Date(item.uploadDate).toLocaleDateString()}</Text>
          <Text className="text-xs text-primary font-semibold">Watch</Text>
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
            <Text className="text-2xl font-bold text-foreground">Video Library</Text>
            <Text className="text-sm text-muted">Training & Match Analysis</Text>
          </View>

          {/* Category Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full ${
                  selectedCategory === cat
                    ? "bg-primary"
                    : "bg-surface border border-border"
                }`}
              >
                <Text
                  className={`text-sm font-semibold capitalize ${
                    selectedCategory === cat
                      ? "text-background"
                      : "text-foreground"
                  }`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Videos List */}
          {loading ? (
            <View className="flex-1 justify-center items-center py-8">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : videos.length > 0 ? (
            <FlatList
              data={videos}
              renderItem={renderVideoCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <View className="flex-1 justify-center items-center py-8">
              <Text className="text-muted text-center">No videos found in this category</Text>
            </View>
          )}

          {/* Upload Button */}
    <TouchableOpacity
      className="bg-primary px-4 py-3 rounded-lg items-center mt-4"
    >
      <Text className="text-background font-semibold">Upload Video</Text>
    </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
