import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SheetViewerScreen } from "@/components/sheet-viewer-screen";
import { useGigContext } from "@/context/gig-context";
import { radii, spacing, typography, useTheme } from "@/lib/theme";

export default function LibraryModeScreen() {
  const { sheetId } = useLocalSearchParams<{ sheetId?: string }>();
  const { sheets, updateSheetTempo } = useGigContext();
  const { colors } = useTheme();

  // Alphabetically sort the library sheets
  const sortedSheets = useMemo(() => {
    return [...sheets].sort((a, b) => a.name.localeCompare(b.name));
  }, [sheets]);

  if (sortedSheets.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 32 }}>📄</Text>
        <Text style={[typography.heading, { color: colors.textPrimary }]}>
          Library is empty
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.ghostButton,
            { borderColor: colors.border },
            pressed && { backgroundColor: colors.surfaceElevated },
          ]}
          onPress={() => router.back()}
        >
          <Text style={[styles.ghostButtonText, { color: colors.textPrimary }]}>
            Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SheetViewerScreen
      sheets={sortedSheets}
      initialSheetId={sheetId}
      getTempo={(sheet) => sheet.tempo}
      onTempoChange={(sheet, tempo) => updateSheetTempo(sheet.id, tempo)}
      renderHeaderInfo={({ sheet, currentPage, totalPages }) => (
        <>
          <Text
            style={[styles.screenType, { color: colors.primary }]}
            numberOfLines={1}
          >
            Library View
          </Text>
          <Text
            style={[styles.sheetMeta, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {sheet.name}
          </Text>
          {totalPages > 1 && (
            <Text style={[styles.sheetMeta, { color: colors.textSecondary }]}>
              Page {currentPage + 1} of {totalPages}
            </Text>
          )}
        </>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  screenType: {
    ...typography.small,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sheetMeta: {
    ...typography.bodyBold,
  },
  ghostButton: {
    borderWidth: 1,
    borderRadius: radii.md,
    minHeight: 40,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  ghostButtonText: {
    ...typography.bodyBold,
    fontSize: 14,
  },
});
