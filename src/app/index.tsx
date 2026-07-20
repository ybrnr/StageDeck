import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { useGigContext } from "@/context/gig-context";
import { useTheme, spacing, radii, typography } from "@/lib/theme";
import type { Gig } from "@/types/gig";

function GigCard({
  gig,
  onRequestDelete,
}: {
  gig: Gig;
  onRequestDelete: (gig: Gig) => void;
}) {
  const { colors, shadows } = useTheme();

  const cardStyle = [
    styles.gigCard,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    shadows.cardStrong,
  ];

  return (
    <View style={cardStyle}>
      <View style={styles.cardHeader}>
        <Text
          style={[styles.gigName, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {gig.name}
        </Text>
        <View style={styles.cardHeaderRight}>
          <View
            style={[
              styles.sheetBadge,
              { backgroundColor: colors.primarySubtle },
            ]}
          >
            <Text style={[styles.sheetBadgeText, { color: colors.primary }]}>
              {gig.setlistSheetIds.length}{" "}
              {gig.setlistSheetIds.length === 1 ? "sheet" : "sheets"}
            </Text>
          </View>
          <Pressable
            onPress={() => onRequestDelete(gig)}
            hitSlop={8}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
            ]}
          >
            <Text style={styles.deleteIcon}>✕</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.gigMeta, { color: colors.textSecondary }]}>
          📅{" "}
          {new Date(gig.date).toLocaleDateString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </Text>
        {gig.location ? (
          <Text style={[styles.gigMeta, { color: colors.textSecondary }]}>
            📍 {gig.location}
          </Text>
        ) : null}
      </View>

      <View style={styles.rowButtons}>
        <Pressable
          style={({ pressed }) => [
            styles.ghostButton,
            { borderColor: colors.border },
            pressed && { backgroundColor: colors.surfaceElevated },
          ]}
          onPress={() => router.push(`/gig-setlist/${gig.id}`)}
        >
          <Text style={[styles.ghostButtonText, { color: colors.textPrimary }]}>
            Edit Setlist
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.accentButton,
            { backgroundColor: colors.primary },
            pressed && { backgroundColor: colors.primaryPressed },
          ]}
          onPress={() => router.push(`/gig-mode/${gig.id}`)}
        >
          <Text
            style={[styles.accentButtonText, { color: colors.textOnPrimary }]}
          >
            Start Gig
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function Index() {
  const { gigs, isReady, deleteGig, exportLibrary, importLibrary } =
    useGigContext();
  const { colors } = useTheme();
  const [gigToDelete, setGigToDelete] = useState<Gig | null>(null);
  const [busyBackup, setBusyBackup] = useState<"export" | "restore" | null>(
    null,
  );

  const handleExportBackup = async () => {
    setBusyBackup("export");
    try {
      await exportLibrary();
    } catch (err) {
      console.error("Backup export failed:", err);
      Alert.alert("Export failed", "Could not create the backup file.");
    } finally {
      setBusyBackup(null);
    }
  };

  const handleRestoreBackup = async () => {
    setBusyBackup("restore");
    try {
      await importLibrary();
    } catch (err) {
      console.error("Backup restore failed:", err);
      Alert.alert(
        "Restore failed",
        err instanceof Error
          ? err.message
          : "Could not read the backup file.",
      );
    } finally {
      setBusyBackup(null);
    }
  };

  const sortedGigs = useMemo(
    () =>
      [...gigs].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    [gigs],
  );

  const handleConfirmDelete = useCallback(() => {
    if (gigToDelete) {
      deleteGig(gigToDelete.id);
      setGigToDelete(null);
    }
  }, [gigToDelete, deleteGig]);

  return (
    <View style={[styles.content, { backgroundColor: colors.background }]}>
      <View style={styles.titleRow}>
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
          Your Gigs
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              { borderColor: colors.border },
              pressed && { backgroundColor: colors.surfaceElevated },
            ]}
            onPress={() => router.push("/library")}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                { color: colors.textPrimary },
              ]}
            >
              📚 Library
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.primary },
              pressed && { backgroundColor: colors.primaryPressed },
            ]}
            onPress={() => router.push("/create-gig")}
          >
            <Text
              style={[
                styles.primaryButtonText,
                { color: colors.textOnPrimary },
              ]}
            >
              + New Gig
            </Text>
          </Pressable>
        </View>
      </View>

      {!isReady ? (
        <View style={styles.emptyState}>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Loading gigs...
          </Text>
        </View>
      ) : null}

      {isReady && sortedGigs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎵</Text>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            No gigs yet
          </Text>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            {'Tap "+ New Gig" to create your first one.'}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={sortedGigs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <GigCard gig={item} onRequestDelete={setGigToDelete} />
        )}
      />

      {/* Backup / Restore */}
      <View style={styles.backupRow}>
        <Pressable
          disabled={busyBackup !== null}
          onPress={handleExportBackup}
          style={({ pressed }) => [
            styles.backupButton,
            pressed && { opacity: 0.6 },
            busyBackup !== null && { opacity: 0.4 },
          ]}
        >
          <Text style={[styles.backupButtonText, { color: colors.textSecondary }]}>
            {busyBackup === "export" ? "Exporting…" : "💾 Export Backup"}
          </Text>
        </Pressable>
        <Text style={[styles.backupButtonText, { color: colors.textPlaceholder }]}>
          •
        </Text>
        <Pressable
          disabled={busyBackup !== null}
          onPress={handleRestoreBackup}
          style={({ pressed }) => [
            styles.backupButton,
            pressed && { opacity: 0.6 },
            busyBackup !== null && { opacity: 0.4 },
          ]}
        >
          <Text style={[styles.backupButtonText, { color: colors.textSecondary }]}>
            {busyBackup === "restore" ? "Restoring…" : "📥 Restore Backup"}
          </Text>
        </Pressable>
      </View>

      <ConfirmDialog
        visible={gigToDelete !== null}
        title="Delete Gig"
        message={`Are you sure you want to delete "${gigToDelete?.name ?? ""}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setGigToDelete(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  screenTitle: {
    ...typography.title,
  },
  helperText: {
    ...typography.caption,
    textAlign: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingBottom: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.heading,
  },
  listContent: {
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  backupRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  backupButton: {
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  backupButtonText: {
    ...typography.small,
    fontWeight: "600",
  },

  // ── Gig Card ────────────────────────────────────────────────────────
  gigCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
  gigName: {
    ...typography.heading,
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
  metaRow: {
    gap: spacing.xs,
  },
  gigMeta: {
    ...typography.caption,
  },
  rowButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },

  // ── Buttons ─────────────────────────────────────────────────────────
  primaryButton: {
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    ...typography.bodyBold,
  },
  ghostButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostButtonText: {
    ...typography.bodyBold,
    fontSize: 14,
  },
  accentButton: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  accentButtonText: {
    ...typography.bodyBold,
    fontSize: 14,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    ...typography.bodyBold,
    fontSize: 14,
  },
});
