import { useCallback, useEffect, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useMetronome } from "@/hooks/use-metronome";
import { clampBpm } from "@/lib/tempo";
import { radii, spacing, typography, useTheme } from "@/lib/theme";

interface MetronomeHeaderProperties {
  tempo: number;
  onTempoChange: (tempo: number) => void;
}
export const MetronomeHeader = ({
  tempo,
  onTempoChange,
}: MetronomeHeaderProperties) => {
  const { colors, isDark } = useTheme();

  const [bpm, setBpm] = useState(tempo);
  const [inputValue, setInputValue] = useState(bpm.toString());
  const [isPlaying, setIsPlaying] = useState(false);

  const { flashAnim } = useMetronome({ bpm, isPlaying });

  // Sync state if tempo prop changes externally (e.g. active sheet switches)
  useEffect(() => {
    setBpm(tempo);
    setInputValue(tempo.toString());
  }, [tempo]);

  const commitInputValue = useCallback(() => {
    const parsed = Number.parseInt(inputValue);
    const nextBpm = clampBpm(Number.isNaN(parsed) ? tempo : parsed);
    setBpm(nextBpm);
    onTempoChange(nextBpm);
  }, [inputValue, tempo, onTempoChange]);

  const playButtonColor = isPlaying ? colors.danger : colors.primary;

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Beat pulse: the whole bar flashes so the tempo is readable from a
          music stand away — deliberately silent for on-stage use. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.beatFlash,
          {
            backgroundColor: colors.primary,
            opacity: flashAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.45],
            }),
          },
        ]}
      />

      <View style={styles.controlsRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Tempo</Text>

        <View style={styles.inputBlock}>
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
            value={inputValue}
            keyboardType="number-pad"
            onChangeText={(text) => {
              if (/^\d*$/.test(text)) {
                setInputValue(text);
              }
            }}
            onBlur={commitInputValue}
            onSubmitEditing={commitInputValue}
            returnKeyType="done"
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.playButton,
            { backgroundColor: playButtonColor },
            pressed && { backgroundColor: colors.primaryPressed },
            isPlaying && { opacity: 0.9 },
          ]}
          onPress={() => {
            commitInputValue();
            setIsPlaying((value) => !value);
          }}
        >
          <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
            {isPlaying ? "Stop" : "Play"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Sized by its content (48pt controls + padding) instead of a percentage
  // of the screen, so the controls can't overflow on short displays.
  wrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    overflow: "hidden",
  },
  beatFlash: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    ...typography.heading,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  playButton: {
    minHeight: 48,
    minWidth: 80,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  buttonText: {
    ...typography.bodyBold,
  },
  inputBlock: {
    minWidth: 86,
    gap: spacing.xs,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});
