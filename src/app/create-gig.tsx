import { router } from "expo-router";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useGigContext } from "@/context/gig-context";
import { useTheme, spacing, radii, typography } from "@/lib/theme";

function formatTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDateDisplay(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CreateGigScreen() {
  const { createGig } = useGigContext();
  const { colors, shadows } = useTheme();

  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date());
  const [hasPickedDate, setHasPickedDate] = useState(false);
  const [hasPickedTime, setHasPickedTime] = useState(false);
  const [location, setLocation] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const onConfirmDate = (selectedDate: Date) => {
    setShowDatePicker(false);
    setDate((prev) => {
      const next = new Date(prev);
      next.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
      );
      return next;
    });
    setHasPickedDate(true);
  };

  const onConfirmTime = (selectedDate: Date) => {
    setShowTimePicker(false);
    setDate((prev) => {
      const next = new Date(prev);
      next.setHours(selectedDate.getHours(), selectedDate.getMinutes());
      return next;
    });
    setHasPickedTime(true);
  };

  const onCreate = () => {
    if (!name.trim() || !hasPickedDate || !hasPickedTime) {
      Alert.alert("Invalid gig", "Please set a name and a valid date & time.");
      return;
    }

    try {
      const gigId = createGig({ name, date: date.toISOString(), location });
      router.replace(`/gig-setlist/${gigId}`);
    } catch {
      Alert.alert("Invalid gig", "Please set a name and a valid date & time.");
    }
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      color: colors.textPrimary,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Name Field ──────────────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            GIG NAME <Text style={{ color: colors.danger }}>*</Text>
          </Text>
          <TextInput
            style={inputStyle}
            value={name}
            onChangeText={setName}
            placeholder="Summer Festival"
            placeholderTextColor={colors.textPlaceholder}
          />
        </View>

        {/* ── Date & Time ─────────────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            DATE & TIME <Text style={{ color: colors.danger }}>*</Text>
          </Text>
          <View style={styles.dateTimeRow}>
            <Pressable
              style={({ pressed }) => [
                styles.dateButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                shadows.card,
                pressed && { backgroundColor: colors.surfaceElevated },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateIcon]}>📅</Text>
              <Text
                style={[
                  styles.dateButtonText,
                  {
                    color: hasPickedDate
                      ? colors.textPrimary
                      : colors.textPlaceholder,
                  },
                ]}
              >
                {hasPickedDate ? formatDateDisplay(date) : "Pick a date"}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.timeButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                shadows.card,
                pressed && { backgroundColor: colors.surfaceElevated },
              ]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={[styles.dateIcon]}>🕐</Text>
              <Text
                style={[
                  styles.dateButtonText,
                  {
                    color: hasPickedTime
                      ? colors.textPrimary
                      : colors.textPlaceholder,
                  },
                ]}
              >
                {hasPickedTime ? formatTime(date) : "Time"}
              </Text>
            </Pressable>
          </View>
        </View>

        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          date={date}
          onConfirm={onConfirmDate}
          onCancel={() => setShowDatePicker(false)}
        />

        <DateTimePickerModal
          isVisible={showTimePicker}
          mode="time"
          date={date}
          is24Hour
          onConfirm={onConfirmTime}
          onCancel={() => setShowTimePicker(false)}
        />

        {/* ── Location Field ──────────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            LOCATION
          </Text>
          <TextInput
            style={inputStyle}
            value={location}
            onChangeText={setLocation}
            placeholder="City Hall, Main Stage"
            placeholderTextColor={colors.textPlaceholder}
          />
        </View>

        {/* ── Submit ──────────────────────────────────────────────── */}
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            { backgroundColor: colors.primary },
            pressed && { backgroundColor: colors.primaryPressed },
          ]}
          onPress={onCreate}
        >
          <Text style={[styles.submitText, { color: colors.textOnPrimary }]}>
            Create Gig
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.xl,
    paddingBottom: 40,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  label: {
    ...typography.small,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginLeft: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    ...typography.body,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dateButton: {
    flex: 2,
    borderWidth: 1,
    borderRadius: radii.md,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  timeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dateIcon: {
    fontSize: 16,
  },
  dateButtonText: {
    ...typography.caption,
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.sm,
    borderRadius: radii.md,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    ...typography.bodyBold,
    fontSize: 17,
  },
});
