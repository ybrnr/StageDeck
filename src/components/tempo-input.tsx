import { useEffect, useState } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";

import { clampBpm } from "@/lib/tempo";
import { radii, spacing, typography, useTheme } from "@/lib/theme";

type TempoInputProps = {
  value?: number;
  onCommit: (tempo: number) => void;
  style?: StyleProp<ViewStyle>;
};

/** Compact inline BPM editor used in the library and setlist rows. */
export function TempoInput({ value, onCommit, style }: TempoInputProps) {
  const { colors, isDark } = useTheme();
  const [text, setText] = useState(value ? String(value) : "");

  // Sync when the tempo changes externally
  useEffect(() => {
    setText(value ? String(value) : "");
  }, [value]);

  const commit = () => {
    const parsed = Number.parseInt(text, 10);
    if (!text.trim() || Number.isNaN(parsed) || parsed <= 0) {
      setText(value ? String(value) : "");
      return;
    }
    const clamped = clampBpm(parsed);
    setText(String(clamped));
    onCommit(clamped);
  };

  return (
    <View style={[styles.wrap, style]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>BPM</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: isDark
              ? colors.surfaceElevated
              : colors.background,
            borderColor: colors.border,
            color: colors.textPrimary,
          },
        ]}
        value={text}
        placeholder="—"
        placeholderTextColor={colors.textPlaceholder}
        keyboardType="number-pad"
        returnKeyType="done"
        onChangeText={(v) => {
          if (/^\d*$/.test(v)) setText(v);
        }}
        onBlur={commit}
        onSubmitEditing={commit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  label: {
    ...typography.small,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.sm,
    height: 36,
    width: 50,
    paddingHorizontal: spacing.xs,
    fontWeight: "700",
    textAlign: "center",
    fontSize: 14,
  },
});
