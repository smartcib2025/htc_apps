import { Pressable, Text, View } from "react-native";

import { LANGUAGE_OPTIONS, useLanguage, type LanguageCode } from "@/lib/i18n";
import { useColors } from "@/hooks/use-colors";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const colors = useColors();
  const { language, setLanguage, t } = useLanguage();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t("selectLanguage")}>
      {!compact ? <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 8 }}>{t("language")}</Text> : null}
      <View style={{ flexDirection: "row", gap: 8 }}>
        {LANGUAGE_OPTIONS.map((option) => {
          const selected = option.code === language;
          return (
            <Pressable
              key={option.code}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.nativeLabel}
              onPress={() => void setLanguage(option.code as LanguageCode)}
              style={({ pressed }) => ({
                minWidth: compact ? 48 : 78,
                paddingHorizontal: compact ? 10 : 12,
                paddingVertical: compact ? 7 : 9,
                borderRadius: 999,
                alignItems: "center",
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primary : colors.surface,
                opacity: pressed ? 0.72 : 1,
              })}
            >
              <Text style={{ color: selected ? colors.background : colors.foreground, fontSize: 12, fontWeight: "700" }}>
                {option.nativeLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
