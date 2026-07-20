import { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme, spacing, radii, typography } from "@/lib/theme";

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 18,
          stiffness: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onCancel}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <View />
      </Pressable>

      {/* Dialog */}
      <View style={styles.centeredContainer} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.dialog,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.dangerSubtle },
            ]}
          >
            <Text style={[styles.iconText, { color: colors.danger }]}>✕</Text>
          </View>

          {/* Text */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                { borderColor: colors.border },
                pressed && { backgroundColor: colors.surfaceElevated },
              ]}
            >
              <Text
                style={[styles.cancelButtonText, { color: colors.textPrimary }]}
              >
                {cancelLabel}
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                { backgroundColor: colors.danger },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
  },
  dialog: {
    width: "100%",
    maxWidth: 340,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    alignItems: "center",
    gap: spacing.sm,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  iconText: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 24,
  },
  title: {
    ...typography.heading,
    textAlign: "center",
  },
  message: {
    ...typography.caption,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%",
    marginTop: spacing.xs,
  },
  button: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    ...typography.bodyBold,
    fontSize: 14,
  },
  confirmButton: {},
  confirmButtonText: {
    ...typography.bodyBold,
    fontSize: 14,
    color: "#FFFFFF",
  },
});
