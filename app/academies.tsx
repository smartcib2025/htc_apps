import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAppContext } from "@/lib/app-context";
import { useLanguage } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

export default function AcademiesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { academyId, setAcademy } = useAppContext();
  const { t } = useLanguage();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");

  const academiesQuery = trpc.tenant.myAcademies.useQuery(undefined, { retry: false });
  const createMutation = trpc.tenant.create.useMutation({
    onSuccess: async (result) => {
      await setAcademy({ id: result.academy.id, name: result.academy.name, slug: result.academy.slug });
      setName("");
      setSlug("");
      setShowCreate(false);
      setError("");
      router.back();
    },
    onError: (mutationError) => setError(mutationError.message),
  });

  const items = useMemo(() => academiesQuery.data ?? [], [academiesQuery.data]);

  const submitCreate = () => {
    const normalizedSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");
    if (name.trim().length < 2 || normalizedSlug.length < 2) {
      setError("Enter an academy name and a lowercase slug.");
      return;
    }
    createMutation.mutate({ name: name.trim(), slug: normalizedSlug });
  };

  return (
    <ScreenContainer className="p-5">
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-1 mr-3">
          <Text className="text-2xl font-bold text-foreground">{t("academyWorkspace")}</Text>
          <Text className="text-sm text-muted mt-1">{t("switchAcademy")}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowCreate((value) => !value)}
          style={({ pressed }) => [{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }, pressed && { opacity: 0.75 }]}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>{showCreate ? t("close") : t("createWorkspaceAction")}</Text>
        </Pressable>
      </View>

      {showCreate ? (
        <View className="bg-surface border border-border rounded-2xl p-4 mb-5">
          <Text className="text-base font-semibold text-foreground mb-3">{t("createWorkspace")}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t("academyName")}
            placeholderTextColor={colors.muted}
            className="border border-border rounded-xl px-4 py-3 text-foreground mb-3"
          />
          <TextInput
            value={slug}
            onChangeText={setSlug}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={t("academySlug")}
            placeholderTextColor={colors.muted}
            className="border border-border rounded-xl px-4 py-3 text-foreground mb-3"
          />
          <Pressable
            accessibilityRole="button"
            disabled={createMutation.isPending}
            onPress={submitCreate}
            style={({ pressed }) => [{ backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: "center" }, pressed && { opacity: 0.75 }, createMutation.isPending && { opacity: 0.5 }]}
          >
            {createMutation.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>{t("createWorkspaceAction")}</Text>}
          </Pressable>
        </View>
      ) : null}

      {error || academiesQuery.error ? (
        <View className="bg-error/10 border border-error/30 rounded-xl p-3 mb-4">
          <Text className="text-error text-sm">{error || academiesQuery.error?.message}</Text>
        </View>
      ) : null}

      {academiesQuery.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.academy.id)}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        ListEmptyComponent={
          !academiesQuery.isLoading ? (
            <View className="bg-surface rounded-2xl border border-border p-5">
              <Text className="text-foreground font-semibold">{t("noAcademies")}</Text>
              <Text className="text-muted text-sm mt-1">{t("createWorkspace")}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const selected = item.academy.id === academyId;
          return (
            <Pressable
              accessibilityRole="button"
              onPress={async () => {
                await setAcademy({ id: item.academy.id, name: item.academy.name, slug: item.academy.slug });
                router.back();
              }}
              style={({ pressed }) => [
                { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.border, borderWidth: selected ? 2 : 1, borderRadius: 16, padding: 16 },
                pressed && { opacity: 0.75 },
              ]}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-foreground text-lg font-semibold">{item.academy.name}</Text>
                  <Text className="text-muted text-sm mt-1">{item.academy.slug} · {item.membership.role}</Text>
                </View>
                {selected ? <Text style={{ color: colors.primary, fontWeight: "700" }}>{t("active")}</Text> : null}
              </View>
              <View className="flex-row mt-3">
                <View className="rounded-full px-3 py-1 mr-2" style={{ backgroundColor: `${item.academy.primaryColor ?? colors.primary}18` }}>
                  <Text style={{ color: item.academy.primaryColor ?? colors.primary, fontSize: 12, fontWeight: "600" }}>{item.academy.subscriptionPlan}</Text>
                </View>
                <View className="rounded-full px-3 py-1" style={{ backgroundColor: `${colors.success}18` }}>
                  <Text style={{ color: colors.success, fontSize: 12, fontWeight: "600" }}>{item.academy.subscriptionStatus}</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </ScreenContainer>
  );
}
