import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AppData } from "@/types/gig";
import { emptyAppData, loadAppData, saveAppData } from "../gig-storage";

jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories cannot use ES imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const STORAGE_KEY = "stage-deck:v1";

describe("gig-storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    return AsyncStorage.clear();
  });

  it("returns empty data when nothing is stored", async () => {
    await expect(loadAppData()).resolves.toEqual(emptyAppData);
  });

  it("returns empty data when the stored value is corrupted", async () => {
    await AsyncStorage.setItem(STORAGE_KEY, "not-json{");
    await expect(loadAppData()).resolves.toEqual(emptyAppData);
  });

  it("fills in missing top-level fields from older payloads", async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ gigs: [] }));
    await expect(loadAppData()).resolves.toEqual(emptyAppData);
  });

  it("round-trips saved data", async () => {
    const data: AppData = {
      gigs: [
        {
          id: "gig-1",
          name: "Summer Festival",
          date: "2026-08-01T18:00:00.000Z",
          setlistSheetIds: ["sheet-1"],
          customTempos: { "sheet-1": 140 },
          createdAt: 1,
          updatedAt: 2,
        },
      ],
      sheets: [
        {
          id: "sheet-1",
          name: "song.pdf",
          uri: "sheets/sheet-1/original.pdf",
          size: 1024,
          importedAt: 1,
          tempo: 120,
        },
      ],
      pdfPageCounts: { "sheet-1": 2 },
    };

    await saveAppData(data);
    await expect(loadAppData()).resolves.toEqual(data);
  });
});
