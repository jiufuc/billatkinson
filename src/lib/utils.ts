// src/lib/utils.ts
import type { AppState, Pagination, Photo } from './types';

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

export function throttle<T extends (...args: any[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void {
    let timeoutId: number | undefined;
    let lastExecTime = 0;

    return function(this: any, ...args: Parameters<T>) {
        const currentTime = Date.now();
        const timeSinceLastExec = currentTime - lastExecTime;

        if (!timeoutId) {
            func.apply(this, args);
            lastExecTime = currentTime;
        } else if (timeSinceLastExec >= delay) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
            func.apply(this, args);
            lastExecTime = currentTime;
        } else if (!timeoutId) {
            timeoutId = setTimeout(() => {
                timeoutId = undefined;
                func.apply(this, args);
                lastExecTime = Date.now();
            }, delay - timeSinceLastExec);
        }
    };
}

export function buildQueryParams(state: AppState, pageNumber: number): URLSearchParams {
  return new URLSearchParams({
    page: pageNumber.toString(),
    limit: '15',
    ...(state.searchQuery && { search: state.searchQuery }),
    ...(state.selectedCollection !== 'All Collections' && { collection: state.selectedCollection }),
    ...(state.selectedTag !== 'All Tags' && { color: state.selectedTag.toLowerCase() })
  });
}

export async function fetchPhotos(state: AppState, pageNumber: number): Promise<{ photos: Photo[]; pagination: Pagination }> {
  const params = buildQueryParams(state, pageNumber);
  const response = await fetch(`/api/photos?${params}`);
  if (!response.ok) throw new Error('Failed to fetch more photos');
  return response.json();
}

export function cn(...inputs: (string | undefined | null | boolean)[]): string {
  return inputs.filter(Boolean).join(" ");
}