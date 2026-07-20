import { ConfirmDialog } from "@/components/confirm-dialog";
import { TempoInput } from "@/components/tempo-input";
import { useGigContext } from "@/context/gig-context";
import { radii, spacing, typography, useTheme } from "@/lib/theme";
import type { Sheet } from "@/types/gig";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function LibraryScreen() {
  const { sheets, gigs, importPdfSheets, updateSheetTempo, deleteSheet } =
    useGigContext();
  const { colors, isDark, shadows } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [sheetToDelete, setSheetToDelete] = useState<Sheet | null>(null);

  const gigsUsingSheetToDelete = useMemo(() => {
    if (!sheetToDelete) {
      return [];
    }
    return gigs.filter((gig) =>
      gig.setlistSheetIds.includes(sheetToDelete.id),
    );
  }, [gigs, sheetToDelete]);

  const deleteMessage = useMemo(() => {
    if (!sheetToDelete) {
      return "";
    }
    const base = `Are you sure you want to delete "${sheetToDelete.name}"? This action cannot be undone.`;
    if (gigsUsingSheetToDelete.length === 0) {
      return base;
    }
    const gigNames = gigsUsingSheetToDelete
      .map((gig) => `"${gig.name}"`)
      .join(", ");
    const warning =
      gigsUsingSheetToDelete.length === 1
        ? `⚠️ This sheet is used in the gig ${gigNames} and will be removed from its setlist.`
        : `⚠️ This sheet is used in ${gigsUsingSheetToDelete.length} gigs (${gigNames}) and will be removed from their setlists.`;
    return `${warning}\n\n${base}`;
  }, [sheetToDelete, gigsUsingSheetToDelete]);

  const handleConfirmDelete = useCallback(() => {
    if (sheetToDelete) {
      deleteSheet(sheetToDelete.id);
      setSheetToDelete(null);
    }
  }, [sheetToDelete, deleteSheet]);
  const handleImport = async () => {
    setIsImporting(true);
    try {
      await importPdfSheets();
    } catch {
      Alert.alert("Import failed", "Could not import selected PDF files.");
    } finally {
      setIsImporting(false);
    }
  };
  const filteredSheets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const sorted = [...sheets].sort((a, b) => a.name.localeCompare(b.name));
    if (!query) {
      return sorted;
    }
    return sorted.filter((sheet) => sheet.name.toLowerCase().includes(query));
  }, [sheets, searchQuery]);
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const renderSheetItem = ({ item }: { item: Sheet }) => (
    <View
      style={[
        styles.sheetRow,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        shadows.card,
      ]}
    >
      <Pressable
        style={styles.sheetLeft}
        onPress={() =>
          router.push({
            pathname: "/library-mode",
            params: { sheetId: item.id },
          })
        }
      >
        <Text style={styles.sheetIcon}>📄</Text>
        <View style={styles.sheetInfo}>
          <Text
            numberOfLines={1}
            style={[styles.sheetName, { color: colors.textPrimary }]}
          >
            {item.name}
          </Text>
          <Text style={[styles.sheetMeta, { color: colors.textSecondary }]}>
            {formatSize(item.size)} • Imported {formatDate(item.importedAt)}
          </Text>
        </View>
      </Pressable>
      <TempoInput
        value={item.tempo}
        onCommit={(tempo) => updateSheetTempo(item.id, tempo)}
      />
      <Pressable
        onPress={() => setSheetToDelete(item)}
        hitSlop={8}
        style={({ pressed }) => [
          styles.deleteButton,
          pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
        ]}
      >
        <Text style={styles.deleteIcon}>✕</Text>
      </Pressable>
    </View>
  );
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search & Actions Bar */}
      <View style={styles.searchBarRow}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search sheets..."
            placeholderTextColor={colors.textPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        <Pressable
          disabled={isImporting}
          style={({ pressed }) => [
            styles.importButton,
            { backgroundColor: colors.primary },
            pressed && !isImporting && { backgroundColor: colors.primaryPressed },
            isImporting && { opacity: 0.8 },
          ]}
          onPress={handleImport}
        >
          {isImporting ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <ActivityIndicator color={colors.textOnPrimary} size="small" />
              <Text style={[styles.importButtonText, { color: colors.textOnPrimary }]}>
                Processing PDFs...
              </Text>
            </View>
          ) : (
            <Text
              style={[styles.importButtonText, { color: colors.textOnPrimary }]}
            >
              📄 Import PDFs
            </Text>
          )}
        </Pressable>
      </View>
      {/* Sheets List */}
      <View
        style={[
          styles.listWrapper,
          {
            backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
            borderColor: colors.border,
          },
        ]}
      >
        <FlatList
          data={filteredSheets}
          keyExtractor={(item) => item.id}
          renderItem={renderSheetItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>
                {searchQuery.trim() ? "🔍" : "📄"}
              </Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {searchQuery.trim()
                  ? "No sheets found"
                  : "Your Library is empty"}
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                {searchQuery.trim()
                  ? "Try searching for a different keyword."
                  : "Tap 'Import PDFs' above to add sheets."}
              </Text>
            </View>
          }
        />
      </View>
      <ConfirmDialog
        visible={sheetToDelete !== null}
        title="Delete Sheet"
        message={deleteMessage}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setSheetToDelete(null)}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  searchBarRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.md,
    height: 44,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    padding: 0,
  },
  importButton: {
    height: 44,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  importButtonText: {
    ...typography.bodyBold,
    fontSize: 14,
  },
  listWrapper: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  listContent: {
    gap: spacing.sm,
    padding: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sheetLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sheetIcon: {
    fontSize: 24,
  },
  sheetInfo: {
    flex: 1,
    gap: 2,
  },
  sheetName: {
    ...typography.bodyBold,
  },
  sheetMeta: {
    ...typography.small,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(229, 57, 53, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteIcon: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E53935",
    lineHeight: 14,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl * 2,
    gap: spacing.xs,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    ...typography.heading,
  },
  emptySubtitle: {
    ...typography.caption,
    textAlign: "center",
  },
});
