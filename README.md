# Stage Deck 🎸

A gig companion app for musicians, built with [Expo](https://expo.dev) and React Native.

Import your sheet music as PDFs, organize it into setlists per gig, and use **Gig Mode** on stage: a distraction-free, full-screen sheet viewer with tap-to-turn pages, a built-in metronome with per-song (and per-gig) tempos, and a screen that stays awake while you play.

## Features

- **Sheet library** — import PDFs (single- or multi-page), search, and manage tempos per sheet. Multi-page PDFs are split into individual pages on import for instant page turns.
- **Gigs & setlists** — create gigs with date, time, and location; build and reorder setlists via drag & drop.
- **Gig mode** — full-screen viewer that walks through the setlist in order. Tap the left/right edge of the screen to flip pages and songs. Per-gig tempo overrides don't touch your library defaults.
- **Metronome** — a silent, visual-only beat pulse (30–300 BPM). Deliberately no audible click: the metronome is for memorizing tempos and counting in on stage, not for playing to a clicktrack.
- **Backup & restore** — export the entire library (gigs, setlists, tempos, and the PDFs themselves) as a single self-contained JSON file via the share sheet, and restore it on any device.
- Light & dark theme following the system setting.

## Project structure

```
src/
  app/          expo-router screens (gigs, library, setlist, viewer modes)
  components/   shared UI (sheet viewer, metronome header, tempo input, dialogs)
  context/      gig-context: central app state + persistence + PDF import
  hooks/        use-sheet-viewer (page/sheet navigation), use-metronome
  lib/          storage, PDF import/splitting, theme tokens, tempo helpers
  types/        domain types (Gig, Sheet, AppData)
```

State is persisted to AsyncStorage (`stage-deck:v1`); imported PDFs live in the app's document directory under `sheets/<sheetId>/`.

## Development

```bash
npm install
npx expo start
```

The project uses a [development build](https://docs.expo.dev/develop/development-builds/introduction/) (`expo-dev-client`) — native runs via:

```bash
npm run ios
npm run android
```

> **Note:** after adding native dependencies (e.g. `expo-keep-awake`), rebuild the dev client.

### Scripts

- `npm test` — run unit tests (Jest)
- `npm run lint` — ESLint via `expo lint`
- `npm run format` — Prettier
