export type Sheet = {
  id: string;
  name: string;
  uri: string;
  size: number;
  importedAt: number;
  tempo: number;
};

export type Gig = {
  id: string;
  name: string;
  date: string;
  location?: string;
  setlistSheetIds: string[];
  customTempos: Record<string, number>;
  createdAt: number;
  updatedAt: number;
};

export type AppData = {
  gigs: Gig[];
  sheets: Sheet[];
  /** Page count of each sheet's PDF, keyed by sheet id. */
  pdfPageCounts: Record<string, number>;
};

export type CreateGigInput = {
  name: string;
  date: string;
  location?: string;
};
