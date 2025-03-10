// src/lib/utils.ts
import type { AppState } from './types';

export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

export function buildQueryParams(state: AppState, pageNumber: number): URLSearchParams {
  return new URLSearchParams({
    page: pageNumber.toString(),
    limit: '25',
    ...(state.searchQuery && { search: state.searchQuery }),
    ...(state.selectedCollection !== 'All Collections' && { collection: state.selectedCollection }),
    ...(state.selectedTag !== 'All Tags' && { color: state.selectedTag.toLowerCase() })
  });
}