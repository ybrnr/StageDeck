import Pdf from "react-native-pdf";
import { useKeepAwake } from "expo-keep-awake";
import { router } from "expo-router";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MetronomeHeader } from "@/components/metronome-header";
import { useSheetViewer } from "@/hooks/use-sheet-viewer";
import { radii, spacing, typography, useTheme } from "@/lib/theme";
import type { Sheet } from "@/types/gig";

type HeaderInfo = {
  sheet: Sheet;
  currentPage: number;
  totalPages: number;
};

type SheetViewerScreenProps = {
  sheets: Sheet[];
  initialSheetId?: string;
  getTempo: (sheet: Sheet) => number;
  onTempoChange: (sheet: Sheet, tempo: number) => void;
  renderHeaderInfo: (info: HeaderInfo) => ReactNode;
};

/**
 * Full-screen sheet viewer shared by gig mode and library mode: header bar
 * with exit button and sheet counter, metronome, PDF page, and tap areas on
 * the left/right edges for page navigation. The middle of the screen is left
 * free so the PDF view keeps its own gestures.
 */
export function SheetViewerScreen({
  sheets,
  initialSheetId,
  getTempo,
  onTempoChange,
  renderHeaderInfo,
}: SheetViewerScreenProps) {
  useKeepAwake();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    currentIndex,
    currentPage,
    totalPages,
    currentSheet,
    handleLeftTap,
    handleRightTap,
  } = useSheetViewer(sheets, initialSheetId);

  if (!currentSheet) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          Sheet not available.
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header Bar */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.headerBackground,
              borderBottomColor: colors.headerBorder,
              paddingTop: Math.max(insets.top, spacing.md) + spacing.xs,
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.exitButton,
              { borderColor: colors.border },
              pressed && { backgroundColor: colors.surfaceElevated },
            ]}
            onPress={() => router.back()}
          >
            <Text style={[styles.exitText, { color: colors.textPrimary }]}>
              ✕ Exit
            </Text>
          </Pressable>

          <View style={styles.headerInfo}>
            {renderHeaderInfo({ sheet: currentSheet, currentPage, totalPages })}
          </View>

          <View
            style={[
              styles.counterPill,
              { backgroundColor: colors.primarySubtle },
            ]}
          >
            <Text style={[styles.counterText, { color: colors.primary }]}>
              {currentIndex + 1}/{sheets.length}
            </Text>
          </View>
        </View>

        {/* Metronome */}
        <MetronomeHeader
          key={currentSheet.id}
          tempo={getTempo(currentSheet)}
          onTempoChange={(tempo) => onTempoChange(currentSheet, tempo)}
        />

        {/* PDF Viewer */}
        <View style={styles.viewerWrap}>
          <Pdf
            key={`${currentSheet.id}_${currentPage}`}
            source={{ uri: currentSheet.uri }}
            page={currentPage + 1}
            scrollEnabled={false}
            enablePaging
            style={[styles.pdf, { backgroundColor: colors.background }]}
            onError={(error) => {
              console.warn("PDF load error:", error, "uri:", currentSheet.uri);
            }}
          />

          {/* Navigation tap areas */}
          <Pressable
            testID="left-tap-area"
            style={styles.leftTapArea}
            onPress={handleLeftTap}
          />
          <Pressable
            testID="right-tap-area"
            style={styles.rightTapArea}
            onPress={handleRightTap}
          />
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },

  // ── Header ──────────────────────────────────────────────────────────
  header: {
    minHeight: 60,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  exitButton: {
    borderWidth: 1,
    borderRadius: radii.sm,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  exitText: {
    ...typography.small,
    fontWeight: "600",
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  counterPill: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  counterText: {
    ...typography.small,
    fontWeight: "700",
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

  // ── Viewer ──────────────────────────────────────────────────────────
  viewerWrap: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    width: "100%",
  },
  leftTapArea: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "35%",
  },
  rightTapArea: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "35%",
  },
});
