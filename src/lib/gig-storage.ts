import { AppData } from "@/types/gig";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "stage-deck:v1";

export const emptyAppData: AppData = {
  gigs: [],
  sheets: [],
  pdfPageCounts: {},
};

export async function loadAppData(): Promise<AppData> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return emptyAppData;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      gigs: parsed.gigs ?? [],
      sheets: parsed.sheets ?? [],
      pdfPageCounts: parsed.pdfPageCounts ?? {},
    };
  } catch {
    return emptyAppData;
  }
}

export async function saveAppData(data: AppData) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
