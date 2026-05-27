import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "saveflex_download_history";
const MAX_ITEMS = 20;

const readHistory = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeHistory = (items) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage might be disabled (private mode, quota). Fail silently.
  }
};

/**
 * Hook to manage download history in localStorage.
 * Items shape: { url, platform, title, thumbnail, author, downloadedAt }
 */
export function useDownloadHistory() {
  const [history, setHistory] = useState(() => readHistory());

  // Sync across tabs.
  useEffect(() => {
    const handler = (e) => {
      if (e.key === STORAGE_KEY) {
        setHistory(readHistory());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const addItem = useCallback((item) => {
    if (!item || !item.url) return;
    const entry = {
      url: item.url,
      platform: item.platform || "unknown",
      title: item.title || "Untitled",
      thumbnail: item.thumbnail || null,
      author: item.author || null,
      downloadedAt: new Date().toISOString(),
    };
    setHistory((prev) => {
      const filtered = prev.filter((x) => x.url !== entry.url);
      const next = [entry, ...filtered].slice(0, MAX_ITEMS);
      writeHistory(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((url) => {
    setHistory((prev) => {
      const next = prev.filter((x) => x.url !== url);
      writeHistory(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    writeHistory([]);
    setHistory([]);
  }, []);

  return { history, addItem, removeItem, clearAll };
}

export default useDownloadHistory;
