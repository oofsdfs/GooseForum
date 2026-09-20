// Keep the original English fallback live instead of duplicating its strings.
import en from "./en-assets";
export default {
  ...en,
  viewMode: "Visualizzazione",
  gridView: "Griglia",
  listView: "Elenco",
  loadMore: "Carica altro",
  allLoaded: "Tutti caricati",
  retry: "Riprova",
  badges: "Badge",
  files: "File",
} as const;
