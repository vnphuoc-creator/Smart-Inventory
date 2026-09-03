/**
 * Safe localStorage wrapper that handles private browsing restrictions,
 * quota exceeded errors on mobile devices, and missing window.localStorage.
 */
export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn(`[safeStorage] Failed to read "${key}":`, e);
      return null;
    }
  },

  setItem(key: string, value: string): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      window.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`[safeStorage] Failed to save "${key}" (storage full or restricted):`, e);
      return false;
    }
  },

  removeItem(key: string): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[safeStorage] Failed to remove "${key}":`, e);
    }
  },

  clear(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.clear();
    } catch (e) {
      console.warn('[safeStorage] Failed to clear storage:', e);
    }
  },
};
