import type { AppData, Gig, Sheet } from "@/types/gig";

export const BACKUP_FORMAT = "stage-deck-backup";
export const BACKUP_VERSION = 1;

/**
 * A full library backup: the app data plus the referenced PDF files embedded
 * as base64, keyed by their document-directory-relative path. Self-contained,
 * so it can be restored on a different device.
 */
export type Backup = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  data: AppData;
  files: Record<string, string>;
};

export function serializeBackup(
  data: AppData,
  files: Record<string, string>,
  exportedAt: string,
): string {
  const backup: Backup = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt,
    data,
    files,
  };
  return JSON.stringify(backup);
}

/**
 * File paths in a backup are written relative to the document directory and
 * must stay inside the sheets folder — anything else (absolute paths, `..`
 * traversal) is rejected so a malicious backup cannot write elsewhere.
 */
export function isSafeBackupFilePath(path: string): boolean {
  return (
    path.startsWith("sheets/") &&
    !path.split("/").some((segment) => segment === "" || segment === "..")
  );
}

function isValidSheet(value: unknown): value is Sheet {
  const sheet = value as Partial<Sheet> | null;
  return (
    typeof sheet === "object" &&
    sheet !== null &&
    typeof sheet.id === "string" &&
    typeof sheet.name === "string" &&
    typeof sheet.uri === "string" &&
    typeof sheet.tempo === "number"
  );
}

function isValidGig(value: unknown): value is Gig {
  const gig = value as Partial<Gig> | null;
  return (
    typeof gig === "object" &&
    gig !== null &&
    typeof gig.id === "string" &&
    typeof gig.name === "string" &&
    Array.isArray(gig.setlistSheetIds)
  );
}

/**
 * Parses and validates a backup JSON string. Throws an `Error` with a
 * user-presentable message when the content is not a usable backup.
 */
export function parseBackup(raw: string): Backup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The selected file is not a valid JSON file.");
  }

  const candidate = parsed as Partial<Backup> | null;
  if (
    typeof candidate !== "object" ||
    candidate === null ||
    candidate.format !== BACKUP_FORMAT
  ) {
    throw new Error("The selected file is not a Stage Deck backup.");
  }

  if (
    typeof candidate.version !== "number" ||
    candidate.version > BACKUP_VERSION
  ) {
    throw new Error(
      "This backup was created by a newer version of Stage Deck. Please update the app and try again.",
    );
  }

  const data = candidate.data as Partial<AppData> | undefined;
  if (
    !data ||
    !Array.isArray(data.gigs) ||
    !Array.isArray(data.sheets) ||
    !data.gigs.every(isValidGig) ||
    !data.sheets.every(isValidSheet)
  ) {
    throw new Error("The backup file is damaged and cannot be restored.");
  }

  const files = candidate.files ?? {};
  if (typeof files !== "object" || Array.isArray(files)) {
    throw new Error("The backup file is damaged and cannot be restored.");
  }
  for (const [path, content] of Object.entries(files)) {
    if (!isSafeBackupFilePath(path) || typeof content !== "string") {
      throw new Error("The backup file is damaged and cannot be restored.");
    }
  }

  return {
    format: BACKUP_FORMAT,
    version: candidate.version,
    exportedAt:
      typeof candidate.exportedAt === "string" ? candidate.exportedAt : "",
    data: {
      gigs: data.gigs,
      sheets: data.sheets,
      pdfPageCounts: data.pdfPageCounts ?? {},
    },
    files: files as Record<string, string>,
  };
}
