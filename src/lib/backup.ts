import { Directory, File, Paths } from "expo-file-system";

import { base64ToUint8Array } from "@/lib/base64";
import { Backup, serializeBackup } from "@/lib/backup-format";
import type { AppData } from "@/types/gig";

/**
 * Collects the on-disk PDF files referenced by the app data, base64-encoded
 * and keyed by their document-directory-relative path.
 */
async function collectBackupFiles(
  data: AppData,
): Promise<Record<string, string>> {
  const relativePaths = new Set<string>();

  for (const sheet of data.sheets) {
    if (sheet.uri) {
      relativePaths.add(sheet.uri);
    }
  }

  const files: Record<string, string> = {};
  for (const relativePath of relativePaths) {
    const file = new File(Paths.document, relativePath);
    if (file.exists) {
      files[relativePath] = await file.base64();
    }
  }
  return files;
}

/**
 * Writes a self-contained backup JSON into the cache directory (named by
 * export date) and returns the file, ready to hand to the share sheet.
 */
export async function writeBackupFile(data: AppData): Promise<File> {
  const files = await collectBackupFiles(data);
  const exportedAt = new Date().toISOString();
  const json = serializeBackup(data, files, exportedAt);

  const filename = `stage-deck-backup-${exportedAt.slice(0, 10)}.json`;
  const target = new File(Paths.cache, filename);
  if (target.exists) {
    target.delete();
  }
  target.write(json);
  return target;
}

/**
 * Replaces the sheets directory contents with the backup's embedded files.
 * All base64 payloads are decoded up front, so a damaged backup aborts
 * before any existing files are touched.
 */
export function restoreBackupFiles(backup: Backup): void {
  const decoded = Object.entries(backup.files).map(([relativePath, b64]) => ({
    relativePath,
    bytes: base64ToUint8Array(b64),
  }));

  const sheetsDir = new Directory(Paths.document, "sheets");
  if (sheetsDir.exists) {
    sheetsDir.delete();
  }

  for (const { relativePath, bytes } of decoded) {
    const parentPath = relativePath.split("/").slice(0, -1).join("/");
    new Directory(Paths.document, parentPath).create({
      intermediates: true,
      idempotent: true,
    });
    new File(Paths.document, relativePath).write(bytes);
  }
}
