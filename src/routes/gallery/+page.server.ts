// src/routes/gallery/+page.server.ts
import type { PageServerLoad } from './$types';
import type { PhotosApiResponse } from '$lib/types';

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    const photosResponse = await fetch('/api/photos?page=1&limit=15');
    if (!photosResponse.ok) throw new Error('Failed to load photos');
    const { photos, pagination } = (await photosResponse.json()) as PhotosApiResponse;

    const [collectionsResponse, tagsResponse] = await Promise.all([
      fetch('/api/collections'),
      fetch('/api/tags')
    ]);

    const collections = collectionsResponse.ok
      ? ['All Collections', ...(await collectionsResponse.json()) as string[]]
      : ['All Collections'];

    const tags = tagsResponse.ok
      ? ['All Tags', ...(await tagsResponse.json() as string[]).map((tag: string) => tag.charAt(0).toUpperCase() + tag.slice(1))]
      : ['All Tags'];

    return { photos, pagination, collections, tags };
  } catch (error) {
    return { error: 'Failed to load gallery data', photos: [], pagination: { hasNext: false } };
  }
};

export const ssr = false;