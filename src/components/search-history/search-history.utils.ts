import { type SearchHistoryItem } from '../../types';

const STORAGE_KEY = 'openmrsHistory';

/**
 * Safely retrieves search history from sessionStorage with error handling
 * @returns Array of search history items, or empty array if data is corrupted/unavailable
 */
export const getSearchHistory = (): SearchHistoryItem[] => {
  try {
    const storedData = window.sessionStorage.getItem(STORAGE_KEY);
    
    if (!storedData) {
      return [];
    }

    const history = JSON.parse(storedData);
    
    // Validate that parsed data is an array
    if (!Array.isArray(history)) {
      console.warn('[Cohort Builder] Invalid history data format, resetting');
      window.sessionStorage.removeItem(STORAGE_KEY);
      return [];
    }

    const searchHistory: SearchHistoryItem[] = [];
    
    history.forEach((historyItem, index) => {
      // Validate each history item has required properties
      if (historyItem && historyItem.patients && Array.isArray(historyItem.patients)) {
        searchHistory.push({
          ...historyItem,
          id: (index + 1).toString(),
          results: historyItem.patients.length,
        });
      }
    });
    
    return searchHistory;
  } catch (error) {
    console.error('[Cohort Builder] Error reading search history:', error);
    // Clear corrupted data to prevent repeated errors
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (removeError) {
      console.error('[Cohort Builder] Error clearing corrupted history:', removeError);
    }
    return [];
  }
};
