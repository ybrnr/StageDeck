import type { AppData } from "@/types/gig";
import {
  BACKUP_VERSION,
  isSafeBackupFilePath,
  parseBackup,
  serializeBackup,
} from "../backup-format";

const sampleData: AppData = {
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
  pdfPageCounts: {},
};

const sampleFiles = { "sheets/sheet-1/original.pdf": "Zm9vYmFy" };

describe("serializeBackup / parseBackup", () => {
  it("round-trips a backup", () => {
    const json = serializeBackup(sampleData, sampleFiles, "2026-07-08T00:00:00.000Z");
    const backup = parseBackup(json);

    expect(backup.version).toBe(BACKUP_VERSION);
    expect(backup.exportedAt).toBe("2026-07-08T00:00:00.000Z");
    expect(backup.data).toEqual(sampleData);
    expect(backup.files).toEqual(sampleFiles);
  });

  it("rejects non-JSON content", () => {
    expect(() => parseBackup("not json {")).toThrow("not a valid JSON file");
  });

  it("rejects JSON that is not a Stage Deck backup", () => {
    expect(() => parseBackup(JSON.stringify({ some: "object" }))).toThrow(
      "not a Stage Deck backup",
    );
  });

  it("rejects backups from a newer format version", () => {
    const json = serializeBackup(sampleData, {}, "");
    const tampered = JSON.stringify({
      ...JSON.parse(json),
      version: BACKUP_VERSION + 1,
    });
    expect(() => parseBackup(tampered)).toThrow("newer version");
  });

  it("rejects backups with damaged data entries", () => {
    const json = serializeBackup(sampleData, {}, "");
    const parsed = JSON.parse(json);
    parsed.data.sheets = [{ id: 42 }];
    expect(() => parseBackup(JSON.stringify(parsed))).toThrow("damaged");
  });

  it("rejects backups with unsafe file paths", () => {
    const json = serializeBackup(
      sampleData,
      { "sheets/../../etc/passwd": "Zm9v" },
      "",
    );
    expect(() => parseBackup(json)).toThrow("damaged");
  });

  it("defaults missing pdfPageCounts to an empty object", () => {
    const json = serializeBackup(sampleData, {}, "");
    const parsed = JSON.parse(json);
    delete parsed.data.pdfPageCounts;
    expect(parseBackup(JSON.stringify(parsed)).data.pdfPageCounts).toEqual({});
  });
});

describe("isSafeBackupFilePath", () => {
  it.each([
    "sheets/sheet-1/original.pdf",
    "sheets/sheet-1/pages/page_0.pdf",
  ])("accepts %s", (path) => {
    expect(isSafeBackupFilePath(path)).toBe(true);
  });

  it.each([
    "/etc/passwd",
    "sheets/../secrets.json",
    "sheets//double-slash.pdf",
    "other-dir/file.pdf",
    "sheets/",
  ])("rejects %s", (path) => {
    expect(isSafeBackupFilePath(path)).toBe(false);
  });
});
