import { Directory, File, Paths } from "expo-file-system";
import { PDFDocument } from "pdf-lib";

export type ImportedPdf = {
  /** Path of the sheet's PDF, relative to the document directory. */
  uri: string;
  /** Number of pages in the document. */
  pageCount: number;
};

/**
 * Copies a picked PDF into the sheet's directory (`sheets/${sheetId}/`) and
 * reads its page count.
 *
 * The source document is parsed *before* any existing files are touched, so a
 * corrupt PDF can never destroy a previously imported sheet — the function
 * throws and the old files stay intact.
 */
export async function importPdfFile(
  sheetId: string,
  sourceUri: string,
): Promise<ImportedPdf> {
  const sourceFile = new File(sourceUri);
  const fileBytes = new Uint8Array(await sourceFile.bytes());
  const pdfDoc = await PDFDocument.load(fileBytes);
  const pageCount = pdfDoc.getPageCount();

  const sheetDir = new Directory(Paths.document, `sheets/${sheetId}`);
  sheetDir.create({ intermediates: true, idempotent: true });

  const relativePath = `sheets/${sheetId}/original.pdf`;
  const originalFile = new File(Paths.document, relativePath);
  if (originalFile.exists) {
    originalFile.delete();
  }
  sourceFile.copy(originalFile);

  return { uri: relativePath, pageCount };
}
