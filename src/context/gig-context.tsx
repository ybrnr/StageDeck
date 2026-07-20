import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { Alert } from "react-native";

import { restoreBackupFiles, writeBackupFile } from "@/lib/backup";
import { Backup, parseBackup } from "@/lib/backup-format";
import { loadAppData, saveAppData } from "@/lib/gig-storage";
import { createId } from "@/lib/id";
import { importPdfFile } from "@/lib/pdf-import";
import { DEFAULT_BPM } from "@/lib/tempo";
import type { AppData, CreateGigInput, Gig, Sheet } from "@/types/gig";

type GigContextValue = {
  gigs: Gig[];
  sheets: Sheet[];
  isReady: boolean;
  createGig: (input: CreateGigInput) => string;
  deleteGig: (gigId: string) => void;
  deleteSheet: (sheetId: string) => void;
  importPdfSheets: () => Promise<void>;
  assignSheetToGig: (gigId: string, sheetId: string) => void;
  removeSheetFromGig: (gigId: string, sheetId: string) => void;
  reorderGigSetlist: (gigId: string, nextSheetIds: string[]) => void;
  updateSheetTempo: (sheetId: string, tempo: number) => void;
  updateGigSheetTempo: (gigId: string, sheetId: string, tempo: number) => void;
  getGigById: (gigId: string) => Gig | undefined;
  getSheetById: (sheetId: string) => Sheet | undefined;
  getPdfPageCount: (sheetId: string) => number | undefined;
  exportLibrary: () => Promise<void>;
  importLibrary: () => Promise<void>;
};

const GigContext = createContext<GigContextValue | null>(null);

const SHEETS_DIR = new Directory(Paths.document, "sheets");

function normalizeDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString();
}

/**
 * Prompts the user with a native alert to confirm whether to overwrite a duplicate sheet.
 */
function askOverwriteConfirm(filename: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      "Duplicate Sheet Detected",
      `A sheet named "${filename}" has already been imported. Do you want to overwrite it?`,
      [
        {
          text: "Skip",
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: "Overwrite",
          style: "destructive",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: false },
    );
  });
}

/**
 * Prompts the user to confirm that restoring a backup will replace all
 * current data.
 */
function askRestoreConfirm(backup: Backup): Promise<boolean> {
  const exportedAt = backup.exportedAt
    ? new Date(backup.exportedAt).toLocaleDateString()
    : "an unknown date";
  const { gigs, sheets } = backup.data;

  return new Promise((resolve) => {
    Alert.alert(
      "Restore Backup?",
      `This backup from ${exportedAt} contains ${gigs.length} gig${gigs.length === 1 ? "" : "s"} and ${sheets.length} sheet${sheets.length === 1 ? "" : "s"}.\n\nRestoring will replace ALL current gigs and sheets. This cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: "Replace Everything",
          style: "destructive",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: false },
    );
  });
}

export function GigProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<AppData>({
    gigs: [],
    sheets: [],
    pdfPageCounts: {},
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const loaded = await loadAppData();
        setData(loaded);
        setIsReady(true);
      } catch (err) {
        // Deliberately stay not-ready: saving is disabled while not ready, so
        // a failed load can never overwrite the stored data with empty state.
        console.error("Failed to load app data:", err);
        Alert.alert(
          "Failed to load data",
          "Your gigs and sheets could not be loaded. Please restart the app.",
        );
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    saveAppData(data).catch((err) => {
      console.error("Failed to save app data:", err);
    });
  }, [data, isReady]);

  const createGig = useCallback((input: CreateGigInput) => {
    const id = createId("gig");
    const now = Date.now();
    const normalizedDate = normalizeDate(input.date);

    if (!input.name.trim() || !normalizedDate) {
      throw new Error("Invalid gig data");
    }

    const gig: Gig = {
      id,
      name: input.name.trim(),
      date: normalizedDate,
      location: input.location?.trim() ? input.location.trim() : undefined,
      setlistSheetIds: [],
      customTempos: {},
      createdAt: now,
      updatedAt: now,
    };

    setData((prev) => ({ ...prev, gigs: [gig, ...prev.gigs] }));
    return id;
  }, []);

  const deleteGig = useCallback((gigId: string) => {
    setData((prev) => ({
      ...prev,
      gigs: prev.gigs.filter((gig) => gig.id !== gigId),
    }));
  }, []);

  const deleteSheet = useCallback((sheetId: string) => {
    // Remove the sheet's files from disk
    try {
      const sheetDir = new Directory(SHEETS_DIR, sheetId);
      if (sheetDir.exists) {
        sheetDir.delete();
      }
    } catch (err) {
      console.error(`Failed to delete files for sheet ${sheetId}:`, err);
    }

    setData((prev) => {
      const { [sheetId]: _removedCount, ...pdfPageCounts } = prev.pdfPageCounts;

      return {
        ...prev,
        sheets: prev.sheets.filter((sheet) => sheet.id !== sheetId),
        pdfPageCounts,
        gigs: prev.gigs.map((gig) => {
          const usesSheet =
            gig.setlistSheetIds.includes(sheetId) ||
            sheetId in gig.setlistSheetIds;
          if (!usesSheet) {
            return gig;
          }

          const { [sheetId]: _removedTempo, ...customTempos } =
            gig.customTempos;

          return {
            ...gig,
            setlistSheetIds: gig.setlistSheetIds.filter((id) => id !== sheetId),
            customTempos,
            updatedAt: Date.now(),
          };
        }),
      };
    });
  }, []);

  const importPdfSheets = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    // Sheets imported in this batch, keyed by lowercased name so a duplicate
    // filename later in the same pick also triggers the overwrite prompt.
    const importedByName = new Map<string, Sheet>();
    const pageCounts = new Map<string, number>();
    const failedImports: string[] = [];

    for (const asset of result.assets) {
      const originalName = asset.name.endsWith(".pdf")
        ? asset.name
        : `${asset.name}.pdf`;
      const nameKey = originalName.toLowerCase();

      const storedSheet = data.sheets.find(
        (s) => s.name.toLowerCase() === nameKey,
      );
      const existingSheet = importedByName.get(nameKey) ?? storedSheet;

      let sheetId: string;
      if (existingSheet) {
        const shouldOverwrite = await askOverwriteConfirm(originalName);
        if (!shouldOverwrite) {
          continue;
        }
        sheetId = existingSheet.id;
      } else {
        sheetId = createId("sheet");
      }

      // Copies the PDF into the sheet's directory. Validates before touching
      // files, so a failed import leaves any previous version of the sheet
      // intact.
      try {
        const imported = await importPdfFile(sheetId, asset.uri);

        importedByName.set(nameKey, {
          id: sheetId,
          name: originalName,
          uri: imported.uri,
          size: asset.size ?? 0,
          importedAt: Date.now(),
          tempo: existingSheet?.tempo ?? DEFAULT_BPM,
        });
        pageCounts.set(sheetId, imported.pageCount);
      } catch (err) {
        console.error(`Failed to import PDF ${originalName}:`, err);
        failedImports.push(originalName);
      }
    }

    if (importedByName.size > 0) {
      const importedSheets = [...importedByName.values()];

      setData((prev) => {
        const importedById = new Map(importedSheets.map((s) => [s.id, s]));
        const nextSheets = prev.sheets.map(
          (sheet) => importedById.get(sheet.id) ?? sheet,
        );
        const existingIds = new Set(prev.sheets.map((s) => s.id));
        const addedSheets = importedSheets.filter(
          (s) => !existingIds.has(s.id),
        );

        const pdfPageCounts = { ...prev.pdfPageCounts };
        for (const [sheetId, pageCount] of pageCounts) {
          pdfPageCounts[sheetId] = pageCount;
        }

        return {
          ...prev,
          sheets: [...nextSheets, ...addedSheets],
          pdfPageCounts,
        };
      });
    }

    if (failedImports.length > 0) {
      Alert.alert(
        "Import failed",
        `The following file${failedImports.length === 1 ? "" : "s"} could not be imported and ${failedImports.length === 1 ? "was" : "were"} skipped:\n\n${failedImports.join("\n")}\n\nThe file may be corrupted or password-protected.`,
      );
    }
  }, [data.sheets]);

  const assignSheetToGig = useCallback((gigId: string, sheetId: string) => {
    setData((prev) => ({
      ...prev,
      gigs: prev.gigs.map((gig) => {
        if (gig.id !== gigId || gig.setlistSheetIds.includes(sheetId)) {
          return gig;
        }

        return {
          ...gig,
          setlistSheetIds: [...gig.setlistSheetIds, sheetId],
          updatedAt: Date.now(),
        };
      }),
    }));
  }, []);

  const removeSheetFromGig = useCallback((gigId: string, sheetId: string) => {
    setData((prev) => ({
      ...prev,
      gigs: prev.gigs.map((gig) => {
        if (gig.id !== gigId) {
          return gig;
        }

        return {
          ...gig,
          setlistSheetIds: gig.setlistSheetIds.filter((id) => id !== sheetId),
          updatedAt: Date.now(),
        };
      }),
    }));
  }, []);

  const reorderGigSetlist = useCallback(
    (gigId: string, nextSheetIds: string[]) => {
      setData((prev) => ({
        ...prev,
        gigs: prev.gigs.map((gig) => {
          if (gig.id !== gigId) {
            return gig;
          }

          return {
            ...gig,
            setlistSheetIds: nextSheetIds,
            updatedAt: Date.now(),
          };
        }),
      }));
    },
    [],
  );

  const updateSheetTempo = useCallback((sheetId: string, tempo: number) => {
    setData((prev) => ({
      ...prev,
      sheets: prev.sheets.map((sheet) => {
        if (sheet.id !== sheetId) {
          return sheet;
        }
        return { ...sheet, tempo };
      }),
    }));
  }, []);

  const updateGigSheetTempo = useCallback(
    (gigId: string, sheetId: string, tempo: number) => {
      setData((prev) => ({
        ...prev,
        gigs: prev.gigs.map((gig) => {
          if (gig.id !== gigId) {
            return gig;
          }
          return {
            ...gig,
            customTempos: {
              ...gig.customTempos,
              [sheetId]: tempo,
            },
            updatedAt: Date.now(),
          };
        }),
      }));
    },
    [],
  );

  const exportLibrary = useCallback(async () => {
    const backupFile = await writeBackupFile(data);
    await Sharing.shareAsync(backupFile.uri, {
      mimeType: "application/json",
      dialogTitle: "Export Stage Deck Backup",
      UTI: "public.json",
    });
  }, [data]);

  const importLibrary = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/json", "application/octet-stream"],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    const raw = await new File(result.assets[0].uri).text();
    const backup = parseBackup(raw);

    const confirmed = await askRestoreConfirm(backup);
    if (!confirmed) {
      return;
    }

    restoreBackupFiles(backup);
    setData(backup.data);
  }, []);

  const getGigById = useCallback(
    (gigId: string) => data.gigs.find((gig) => gig.id === gigId),
    [data.gigs],
  );

  // Sheet URIs are stored relative to the document directory;
  // resolve them to absolute URIs for the viewer.
  const resolvedSheets = useMemo(() => {
    return data.sheets.map((sheet) => ({
      ...sheet,
      uri: sheet.uri ? new File(Paths.document, sheet.uri).uri : sheet.uri,
    }));
  }, [data.sheets]);

  const getSheetById = useCallback(
    (sheetId: string) => resolvedSheets.find((sheet) => sheet.id === sheetId),
    [resolvedSheets],
  );

  const getPdfPageCount = useCallback(
    (sheetId: string) => data.pdfPageCounts[sheetId],
    [data.pdfPageCounts],
  );

  const value = useMemo(
    () => ({
      gigs: data.gigs,
      sheets: resolvedSheets,
      isReady,
      createGig,
      deleteGig,
      deleteSheet,
      importPdfSheets,
      assignSheetToGig,
      removeSheetFromGig,
      reorderGigSetlist,
      updateSheetTempo,
      updateGigSheetTempo,
      getGigById,
      getSheetById,
      getPdfPageCount,
      exportLibrary,
      importLibrary,
    }),
    [
      assignSheetToGig,
      createGig,
      deleteGig,
      deleteSheet,
      data.gigs,
      resolvedSheets,
      getGigById,
      getSheetById,
      getPdfPageCount,
      importPdfSheets,
      isReady,
      removeSheetFromGig,
      reorderGigSetlist,
      updateSheetTempo,
      updateGigSheetTempo,
      exportLibrary,
      importLibrary,
    ],
  );

  return <GigContext.Provider value={value}>{children}</GigContext.Provider>;
}

export function useGigContext() {
  const value = useContext(GigContext);

  if (!value) {
    throw new Error("useGigContext must be used inside GigProvider");
  }

  return value;
}
