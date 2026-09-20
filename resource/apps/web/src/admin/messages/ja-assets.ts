// Keep the original English fallback live instead of duplicating its strings.
import en from "./en-assets";
export default {
  ...en,
  viewMode: "表示形式",
  gridView: "グリッド表示",
  listView: "リスト表示",
  loadMore: "さらに読み込む",
  allLoaded: "すべて読み込み済み",
  retry: "再試行",
  badges: "バッジ",
  files: "ファイル",
} as const;
