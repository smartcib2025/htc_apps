import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function VideoPlayer() {
  const colors = useColors();
  const { videoId } = useLocalSearchParams();
  const [video, setVideo] = useState<any>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    loadVideo();
  }, [videoId]);

  const loadVideo = async () => {
    if (!videoId) return;
    setLoading(true);
    try {
      const vid = await (trpc.videos.byId as any)({ videoId: parseInt(videoId as string) });
      setVideo(vid);
      
      // Update view count
      try {
        await (trpc.videos.updateViewCount as any)({ videoId: parseInt(videoId as string) });
      } catch (e) {
        // Ignore mutation errors
      }
      
      // Load annotations
      const annots = await (trpc.annotations.list as any)({ videoId: parseInt(videoId as string) });
      setAnnotations(annots);
    } catch (error) {
      console.error("Error loading video:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!video) {
    return (
      <ScreenContainer className="justify-center items-center">
        <Text className="text-foreground">Video not found</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Video Player Placeholder */}
          <View className="bg-surface rounded-lg overflow-hidden border border-border aspect-video justify-center items-center">
            <Text className="text-muted text-center">Video Player</Text>
            <Text className="text-xs text-muted mt-2">{video.videoUrl}</Text>
          </View>

          {/* Video Info */}
          <View className="gap-2">
            <Text className="text-xl font-bold text-foreground">{video.title}</Text>
            <Text className="text-sm text-muted">{video.description}</Text>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-xs text-muted">
                {new Date(video.uploadDate).toLocaleDateString()}
              </Text>
              <View className="bg-primary px-2 py-1 rounded">
                <Text className="text-xs font-semibold text-background">{video.viewCount || 0} views</Text>
              </View>
            </View>
          </View>

          {/* Playback Speed Controls */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Playback Speed</Text>
            <View className="flex-row flex-wrap gap-2">
              {speeds.map((speed) => (
                <TouchableOpacity
                  key={speed}
                  onPress={() => setPlaybackSpeed(speed)}
                  className={`px-3 py-2 rounded ${
                    playbackSpeed === speed
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      playbackSpeed === speed
                        ? "text-background"
                        : "text-foreground"
                    }`}
                  >
                    {speed}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Annotations */}
          {annotations.length > 0 && (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Annotations</Text>
              {annotations.map((ann) => (
                <View key={ann.id} className="bg-surface rounded-lg p-3 border border-border">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-xs text-muted">{ann.annotationType}</Text>
                      <Text className="text-sm text-foreground mt-1">{ann.content}</Text>
                    </View>
                    <Text className="text-xs text-muted">{Math.floor(ann.timestamp)}s</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View className="gap-2 mt-4">
            <TouchableOpacity className="bg-primary px-4 py-3 rounded-lg items-center">
              <Text className="text-background font-semibold">Add Annotation</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-surface border border-border px-4 py-3 rounded-lg items-center">
              <Text className="text-foreground font-semibold">Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
