// src/routes/gallery/+page.server.ts
import type { PageServerLoad } from './$types';
import type { PhotosApiResponse } from '$lib/types';

export const load: PageServerLoad = async ({ fetch }) => {
  const photosResponse = await fetch('/api/photos?page=1&limit=25');
  if (!photosResponse.ok) {
    throw new Error('Failed to load photos');
  }
  const { photos, pagination } = (await photosResponse.json()) as PhotosApiResponse;

  const [collectionsResponse, tagsResponse] = await Promise.all([
    fetch('/api/collections'),
    fetch('/api/tags')
  ]);

  const collections = ['All Collections', ...(await collectionsResponse.json()) as string[]];
  const tags = ['All Tags', ...(await tagsResponse.json() as string[]).map((tag: string) => tag.charAt(0).toUpperCase() + tag.slice(1))];

  return {
    photos,
    pagination,
    collections,
    tags
  };
};