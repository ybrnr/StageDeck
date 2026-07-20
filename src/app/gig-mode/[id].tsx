import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SheetViewerScreen } from "@/components/sheet-viewer-screen";
import { useGigContext } from "@/context/gig-context";
import { radii, spacing, typography, useTheme } from "@/lib/theme";
import type { Sheet } from "@/types/gig";

export default function GigModeScreen() {
  const { id, sheetId } = useLocalSearchParams<{
    id: string;
    sheetId?: string;
  }>();
  const { getGigById, getSheetById, updateGigSheetTempo } = useGigContext();
  const { colors } = useTheme();

  const gig = getGigById(id);

  const setlistSheets = useMemo(() => {
    if (!gig) {
      return [];
    }

    return gig.setlistSheetIds
      .map((sId) => getSheetById(sId))
      .filter(Boolean) as Sheet[];
  }, [gig, getSheetById]);

  if (!gig) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 32 }}>🔍</Text>
        <Text style={[typography.heading, { color: colors.textPrimary }]}>
          Gig not found
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

  if (setlistSheets.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 32 }}>📋</Text>
        <Text style={[typography.heading, { color: colors.textPrimary }]}>
          No sheets yet
        </Text>
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, textAlign: "center" },
          ]}
        >
          Add sheets to the setlist first.
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.primary },
            pressed && { backgroundColor: colors.primaryPressed },
          ]}
          onPress={() => router.replace(`/gig-setlist/${gig.id}`)}
        >
          <Text
            style={[styles.primaryButtonText, { color: colors.textOnPrimary }]}
          >
            Go to Setlist
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SheetViewerScreen
      sheets={setlistSheets}
      initialSheetId={sheetId}
      getTempo={(sheet) => gig.customTempos[sheet.id] ?? sheet.tempo}
      onTempoChange={(sheet, tempo) =>
        updateGigSheetTempo(gig.id, sheet.id, tempo)
      }
      renderHeaderInfo={({ sheet, currentPage, totalPages }) => (
        <>
          <Text
            style={[styles.gigName, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {gig.name}
          </Text>
          <Text
            style={[styles.sheetMeta, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {sheet.name}
            {totalPages > 1 ? ` • Page ${currentPage + 1} of ${totalPages}` : ""}
          </Text>
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
  gigName: {
    ...typography.bodyBold,
  },
  sheetMeta: {
    ...typography.caption,
  },

  // ── Buttons ─────────────────────────────────────────────────────────
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
  primaryButton: {
    borderRadius: radii.md,
    minHeight: 44,
    paddingHorizontal: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    ...typography.bodyBold,
  },
});
