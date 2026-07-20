import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";

import { TempoInput } from "@/components/tempo-input";
import { useGigContext } from "@/context/gig-context";
import { radii, spacing, typography, useTheme } from "@/lib/theme";
import { Sheet } from "@/types/gig";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function GigSetlistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark, shadows } = useTheme();
  const {
    assignSheetToGig,
    getGigById,
    getSheetById,
    removeSheetFromGig,
    reorderGigSetlist,
    sheets,
    updateGigSheetTempo,
  } = useGigContext();

  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState("");

  const gig = getGigById(id);

  const setlistSheets = useMemo(
    () =>
      gig
        ? (gig.setlistSheetIds
            .map((sheetId) => getSheetById(sheetId))
            .filter(Boolean) as Sheet[])
        : [],
    [gig, getSheetById],
  );

  const filteredLibrarySheets = useMemo(() => {
    const query = modalSearchQuery.trim().toLowerCase();
    const sorted = [...sheets].sort((a, b) => a.name.localeCompare(b.name));
    if (!query) {
      return sorted;
    }
    return sorted.filter((sheet) => sheet.name.toLowerCase().includes(query));
  }, [sheets, modalSearchQuery]);

  if (!gig) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyEmoji]}>🔍</Text>
        <Text style={[typography.heading, { color: colors.textPrimary }]}>
          Gig not found
        </Text>
      </View>
    );
  }

  const renderSetlistItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<Sheet>) => (
    <Pressable
      onLongPress={drag}
      onPress={() =>
        router.push({
          pathname: "/gig-mode/[id]",
          params: { id: gig.id, sheetId: item.id },
        })
      }
      style={[
        styles.listRow,
        {
          backgroundColor: isActive ? colors.surfaceElevated : colors.surface,
          borderColor: isActive ? colors.primary : colors.border,
        },
        shadows.card,
      ]}
    >
      <View style={styles.dragHandle}>
        <Text style={{ color: colors.textPlaceholder, fontSize: 14 }}>☰</Text>
      </View>
      <Text
        numberOfLines={1}
        style={[styles.rowText, { color: colors.textPrimary }]}
      >
        {item.name}
      </Text>
      <TempoInput
        value={gig.customTempos[item.id] ?? item.tempo}
        onCommit={(tempo) => updateGigSheetTempo(gig.id, item.id, tempo)}
        style={styles.tempo}
      />
      <Pressable
        style={({ pressed }) => [
          styles.inlineButton,
          {
            backgroundColor: colors.dangerSubtle,
            borderColor: "transparent",
          },
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => removeSheetFromGig(gig.id, item.id)}
      >
        <Text style={[styles.inlineButtonText, { color: colors.danger }]}>
          Remove
        </Text>
      </Pressable>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Info */}
      <View style={styles.headerArea}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {gig.name}
        </Text>
        <View
          style={[styles.sheetBadge, { backgroundColor: colors.primarySubtle }]}
        >
          <Text style={[styles.sheetBadgeText, { color: colors.primary }]}>
            {setlistSheets.length}{" "}
            {setlistSheets.length === 1 ? "sheet" : "sheets"} in setlist
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.topButtons}>
        <Pressable
          style={({ pressed }) => [
            styles.outlineButton,
            { borderColor: colors.border },
            pressed && { backgroundColor: colors.surfaceElevated },
          ]}
          onPress={() => setIsSearchModalVisible(true)}
        >
          <Text
            style={[styles.outlineButtonText, { color: colors.textPrimary }]}
          >
            ➕ Add Sheets
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.filledButton,
            { backgroundColor: colors.primary },
            pressed && { backgroundColor: colors.primaryPressed },
          ]}
          onPress={() => router.push(`/gig-mode/${gig.id}`)}
        >
          <Text
            style={[styles.filledButtonText, { color: colors.textOnPrimary }]}
          >
            ▶ Start Gig
          </Text>
        </Pressable>
      </View>

      {/* Sections */}
      <View style={styles.sectionsContainer}>
        {/* Current Setlist */}
        <View style={[styles.sectionBlock, { flex: 1 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            CURRENT SETLIST
          </Text>
          <GestureHandlerRootView style={styles.sectionBody}>
            <View
              style={[
                styles.listContainer,
                {
                  backgroundColor: isDark
                    ? colors.surface
                    : colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
            >
              <DraggableFlatList
                data={setlistSheets}
                keyExtractor={(item) => item.id}
                renderItem={renderSetlistItem}
                onDragEnd={({ data }) => {
                  reorderGigSetlist(
                    gig.id,
                    data.map((sheet) => sheet.id),
                  );
                }}
                autoscrollThreshold={56}
                autoscrollSpeed={180}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyListState}>
                    <Text style={styles.emptyEmoji}>📋</Text>
                    <Text
                      style={[
                        styles.emptyText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      No sheets yet. Tap + Add Sheets above to add sheets from
                      your library.
                    </Text>
                  </View>
                }
              />
            </View>
          </GestureHandlerRootView>
        </View>
      </View>

      {/* Sheet Search/Add Modal */}
      <Modal
        visible={isSearchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsSearchModalVisible(false);
          setModalSearchQuery("");
        }}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Modal Header */}
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Add Sheets
              </Text>
              <Pressable
                onPress={() => {
                  setIsSearchModalVisible(false);
                  setModalSearchQuery("");
                }}
                style={styles.modalCloseButton}
              >
                <Text
                  style={[styles.modalCloseText, { color: colors.textPrimary }]}
                >
                  ✕
                </Text>
              </Pressable>
            </View>

            {/* Modal Search Bar */}
            <View
              style={[
                styles.modalSearchContainer,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={{ fontSize: 16 }}>🔍</Text>
              <TextInput
                style={[styles.modalSearchInput, { color: colors.textPrimary }]}
                placeholder="Search library..."
                placeholderTextColor={colors.textPlaceholder}
                value={modalSearchQuery}
                onChangeText={setModalSearchQuery}
                clearButtonMode="while-editing"
                returnKeyType="search"
              />
            </View>

            {/* Modal Sheets List */}
            <FlatList
              data={filteredLibrarySheets}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalListContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isInSetlist = gig.setlistSheetIds.includes(item.id);
                return (
                  <View
                    style={[
                      styles.modalRow,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.modalRowText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Pressable
                      style={({ pressed }) => [
                        styles.modalInlineButton,
                        {
                          backgroundColor: isInSetlist
                            ? colors.dangerSubtle
                            : colors.primarySubtle,
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => {
                        if (isInSetlist) {
                          removeSheetFromGig(gig.id, item.id);
                        } else {
                          assignSheetToGig(gig.id, item.id);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.modalInlineButtonText,
                          {
                            color: isInSetlist ? colors.danger : colors.primary,
                          },
                        ]}
                      >
                        {isInSetlist ? "✓ Added" : "➕ Add"}
                      </Text>
                    </Pressable>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.modalEmptyState}>
                  <Text style={{ fontSize: 36 }}>📄</Text>
                  <Text
                    style={[
                      styles.modalEmptyTitle,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {sheets.length === 0
                      ? "Library is empty"
                      : "No matches found"}
                  </Text>
                  <Text
                    style={[
                      styles.modalEmptyText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {sheets.length === 0
                      ? "Go to the Library screen from the home page to import PDFs."
                      : "Try searching for a different name."}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tempo: {
    flex: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyEmoji: {
    fontSize: 32,
  },

  // ── Header ──────────────────────────────────────────────────────────
  headerArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    flex: 1,
  },
  sheetBadge: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  sheetBadgeText: {
    ...typography.small,
  },

  // ── Buttons ─────────────────────────────────────────────────────────
  topButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButtonText: {
    ...typography.bodyBold,
    fontSize: 14,
  },
  filledButton: {
    flex: 1,
    borderRadius: radii.md,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  filledButtonText: {
    ...typography.bodyBold,
    fontSize: 14,
  },

  // ── Sections ────────────────────────────────────────────────────────
  sectionsContainer: {
    flex: 1,
    minHeight: 0,
    gap: spacing.md,
  },
  sectionBlock: {
    flex: 1,
    minHeight: 140,
    gap: spacing.sm,
  },
  sectionBody: {
    flex: 1,
    minHeight: 0,
  },
  sectionTitle: {
    ...typography.small,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: spacing.xs,
  },

  // ── Lists ───────────────────────────────────────────────────────────
  listContainer: {
    borderWidth: 1,
    borderRadius: radii.lg,
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  listContent: {
    gap: spacing.sm,
    padding: spacing.sm,
    paddingBottom: spacing.lg,
  },
  listRow: {
    borderWidth: 1,
    borderRadius: radii.md,
    height: 48,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dragHandle: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    ...typography.caption,
    flex: 1,
  },
  inlineButton: {
    borderRadius: radii.sm,
    minHeight: 32,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  inlineButtonText: {
    ...typography.small,
    fontWeight: "600",
  },
  emptyListState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.caption,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    height: "85%",
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.heading,
  },
  modalCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(128, 128, 128, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.md,
    height: 44,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  modalSearchInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
  },
  modalListContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.md,
    height: 52,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  modalRowText: {
    ...typography.bodyBold,
    flex: 1,
  },
  modalInlineButton: {
    borderRadius: radii.sm,
    minHeight: 32,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  modalInlineButtonText: {
    ...typography.small,
    fontWeight: "600",
  },
  modalEmptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl * 1.5,
    gap: spacing.xs,
  },
  modalEmptyTitle: {
    ...typography.heading,
  },
  modalEmptyText: {
    ...typography.caption,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});
