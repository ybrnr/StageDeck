import { GigProvider } from "@/context/gig-context";
import { useTheme } from "@/lib/theme";
import { Stack } from "expo-router";

export default function RootLayout() {
  const { colors } = useTheme();

  return (
    <GigProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.headerBackground },
          headerTintColor: colors.headerText,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
          headerTitleStyle: {
            fontWeight: "600",
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Gigs" }} />
        <Stack.Screen name="library" options={{ title: "Sheet Library" }} />
        <Stack.Screen name="create-gig" options={{ title: "Create Gig" }} />
        <Stack.Screen name="gig-setlist/[id]" options={{ title: "Setlist" }} />
        <Stack.Screen
          name="gig-mode/[id]"
          options={{
            title: "Gig Mode",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="library-mode"
          options={{
            title: "Library Mode",
            headerShown: false,
          }}
        />
      </Stack>
    </GigProvider>
  );
}
