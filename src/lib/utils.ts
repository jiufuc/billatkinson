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
  const params: Record<string, string> = {
    page: pageNumber.toString(),
    limit: '15',
  };
  if (state.searchQuery && state.searchQuery.trim() !== '') {
    params.search = state.searchQuery.trim();
  }
  if (state.selectedCollection !== 'All Collections') {
    params.collection = state.selectedCollection;
  }
  if (state.sortField) {
    params.sortField = state.sortField;
  }
  if (state.sortDirection) {
    params.sortDirection = state.sortDirection;
  }
  return new URLSearchParams(params);
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

export function generateSrcset(photoId: number, widths: number[]): string {
  const srcsetCache = new Map<number, string>();
  if (srcsetCache.has(photoId)) {
    return srcsetCache.get(photoId)!;
  }
  
  const zone = "https://static.billatkinson.us";
  const url = `srcset/srcset-${photoId}_Image.jpg`;
  const result = widths
    .map(
      (width) =>
        `${zone}/cdn-cgi/image/w=${width},f=auto/${url} ${width}w`
    )
    .join(", ");
    
  srcsetCache.set(photoId, result);
  return result;
}


export function viewport(element: HTMLElement, {
  onEnter = () => {},
  onExit = () => {}
}: {
  onEnter?: () => void,
  onExit?: () => void
} = {}) {
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          onEnter();
        } else {
          onExit();
        }
      });
    }
  );

  intersectionObserver.observe(element);

  return {
    destroy() {
      intersectionObserver.unobserve(element);
    },
    update(params: { onEnter?: () => void, onExit?: () => void }) {
      onEnter = params.onEnter || onEnter;
      onExit = params.onExit || onExit;
    }
  };
}