import { useGigContext } from "@/context/gig-context";
import type { Sheet } from "@/types/gig";
import { useEffect, useRef, useState } from "react";

/**
 * Drives the sheet viewer: tracks which sheet is displayed, which page of a
 * multi-page PDF is visible, and handles left/right tap navigation that
 * cycles through pages before advancing to the next sheet.
 *
 * Page counts come from global state — an O(1) synchronous lookup, no
 * filesystem reads.
 */
export function useSheetViewer(sheets: Sheet[], sheetId?: string) {
  const { getPdfPageCount } = useGigContext();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const hasInitializedRef = useRef(false);
  const prevSheetIdRef = useRef<string | undefined>(undefined);

  // Keep index in-bounds if sheets are dynamically modified or deleted
  useEffect(() => {
    if (currentIndex >= sheets.length && sheets.length > 0) {
      setCurrentIndex(sheets.length - 1);
    }
  }, [sheets.length, currentIndex]);

  // Sync index when sheetId changes externally or on first load
  useEffect(() => {
    if (sheets.length === 0) return;

    if (
      sheetId &&
      (sheetId !== prevSheetIdRef.current || !hasInitializedRef.current)
    ) {
      const idx = sheets.findIndex((s) => s.id === sheetId);
      if (idx !== -1) {
        setCurrentIndex(idx);
        setCurrentPage(0);
      }
      prevSheetIdRef.current = sheetId;
      hasInitializedRef.current = true;
    }
  }, [sheetId, sheets]);

  const currentSheet = sheets[currentIndex];

  // Derive the page count synchronously from global state
  const totalPages = getPdfPageCount(currentSheet?.id) ?? 1;

  const handleSheetChange = (
    newIndex: number,
    startAtLastPage: boolean = false,
  ) => {
    const targetSheet = sheets[newIndex];
    if (!targetSheet) return;

    setCurrentIndex(newIndex);

    if (startAtLastPage) {
      const lastPage = (getPdfPageCount(targetSheet.id) ?? 1) - 1;
      setCurrentPage(Math.max(0, lastPage));
    } else {
      setCurrentPage(0);
    }
  };

  const handleLeftTap = () => {
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
    } else if (currentIndex > 0) {
      handleSheetChange(currentIndex - 1, true);
    }
  };

  const handleRightTap = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((p) => p + 1);
    } else if (currentIndex < sheets.length - 1) {
      handleSheetChange(currentIndex + 1, false);
    }
  };

  return {
    currentIndex,
    currentPage,
    totalPages,
    currentSheet,
    handleLeftTap,
    handleRightTap,
    setCurrentIndex,
    setCurrentPage,
  };
}
