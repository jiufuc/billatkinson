// src/lib/types.ts
export interface Photo {
  photo_idx: number;
  photo_id: number;
  photo_title: string;
  photo_collection: string | null;
  photo_location: string | null;
  photo_year: number | null;
  camera: string | null;
  film_stock: string | null;
  film_format: string | null;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
}

export interface PhotosApiResponse {
  photos: Photo[];
  pagination: Pagination;
}

export interface AppState {
  photos: Photo[];
  currentPage: number;
  hasMorePages: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  searchQuery: string;
  selectedCollection: string;
  selectedTag: string;
}