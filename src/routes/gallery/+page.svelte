<!-- src/routes/gallery/+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import type { Photo, Pagination, AppState } from '$lib/types';
  import { debounce, buildQueryParams } from '$lib/utils'; 
  import 'lazysizes';
  import 'masonry-layout';

  // Define the widths for the srcset
  const widths: number[] = [320, 480, 640, 720, 880, 1120, 1340, 1800, 2240];

  // Function to generate a responsive srcset using Cloudflare Image Resizing
  function generateSrcset(photoId: number, widths: number[]): string {
    const zone = 'https://static.billatkinson.us';
    const sourceImage = `2240/2240-${photoId}_Image.webp`;
    return widths
      .map(width => `${zone}/cdn-cgi/image/width=${width}/${sourceImage} ${width}w`)
      .join(', ');
  }

  // Define the props passed from the server
  export let data: {
    photos: Photo[];
    pagination: Pagination;
    collections: string[];
    tags: string[];
  };

  // Create a reactive store to manage application state
  const applicationState = writable<AppState>({
    photos: data.photos,
    currentPage: 1,
    hasMorePages: data.pagination.hasNext,
    isLoading: false,
    errorMessage: null,
    searchQuery: '',
    selectedCollection: 'All Collections',
    selectedTag: 'All Tags'
  });

  // Arrays to store dynamically fetched filter options
  let availableCollections = data.collections;
  let availableTags = data.tags;

  // Function to fetch and load photo data from the API
  async function loadPhotoData(pageNumber: number, shouldReset: boolean = false): Promise<void> {
    if ($applicationState.isLoading || (!$applicationState.hasMorePages && !shouldReset)) return;

    applicationState.update(state => ({ ...state, isLoading: true }));

    let newState: Partial<AppState> = { isLoading: false };

    try {
      const response = await fetch(`/api/photos?${buildQueryParams($applicationState, pageNumber)}`);
      if (!response.ok) throw new Error('Failed to fetch more photos');
      const { photos: newPhotos, pagination } = (await response.json()) as { photos: Photo[]; pagination: Pagination };

      newState.photos = shouldReset || pageNumber === 1 ? newPhotos : [...$applicationState.photos, ...newPhotos];
      newState.hasMorePages = pagination.hasNext;
      newState.errorMessage = null;
    } catch (error) {
      newState.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      applicationState.update(state => ({ ...state, ...newState }));
    }
  }

  // Function to handle scroll events and load more data
  function handleScrollEvent(): void {
    if ($applicationState.isLoading || !$applicationState.hasMorePages) return;
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    if (distanceFromBottom < 400 || scrollHeight <= clientHeight) {
      applicationState.update(state => ({ ...state, currentPage: state.currentPage + 1 }));
      loadPhotoData($applicationState.currentPage);
    }
  }

  // Function to handle filter changes and reset pagination
  function resetAndLoad(): void {
    applicationState.update(state => ({
      ...state,
      currentPage: 1,
      hasMorePages: true,
      photos: []
    }));
    loadPhotoData(1, true);
  }

  // Debounced function for search input to prevent rapid API calls
  const debouncedHandleFilterChange = debounce(() => {
    console.log('Debounced filter change triggered for search query:', $applicationState.searchQuery);
    resetAndLoad();
  }, 300);

  // Function to handle immediate filter changes (e.g., dropdowns)
  function handleFilterChange(): void {
    resetAndLoad();
  }

  // Lifecycle hook to initialize data and event listeners
  onMount(() => {
    loadPhotoData($applicationState.currentPage);
    window.addEventListener('scroll', handleScrollEvent);
    handleScrollEvent();
  });

  // Cleanup hook to remove event listeners
  onDestroy(() => {
    window.removeEventListener('scroll', handleScrollEvent);
  });
</script>

<section>
  <div class="filters">
    <input
      type="text"
      placeholder="Search photos..."
      bind:value={$applicationState.searchQuery}
      on:input={debouncedHandleFilterChange}
    />
    <select
      bind:value={$applicationState.selectedCollection}
      on:change={handleFilterChange}
    >
      {#each availableCollections as collection}
        <option value={collection}>{collection}</option>
      {/each}
    </select>
    <select
      bind:value={$applicationState.selectedTag}
      on:change={handleFilterChange}
    >
      {#each availableTags as tag}
        <option value={tag}>{tag}</option>
      {/each}
    </select>
  </div>

  <div class="grid">
    {#if $applicationState.errorMessage}
      <p class="error">Error: {$applicationState.errorMessage}</p>
    {:else if $applicationState.photos.length === 0 && !$applicationState.isLoading}
      <p>No photos available.</p>
    {/if}
    {#each $applicationState.photos as photo (photo.photo_id)}
      <a
        href={`https://static.billatkinson.us/3000/3000-${photo.photo_id}_Image.webp`}
        class="grid-item"
      >
        <img
          data-srcset={generateSrcset(photo.photo_id, widths)}
          data-src={`https://static.billatkinson.us/1024/1024-${photo.photo_id}_Image.webp`}
          data-sizes="auto"
          alt={photo.photo_title}
          class="lazyload"
        />
      </a>
    {/each}
    {#if $applicationState.isLoading}
      <div class="loading">Loading {$applicationState.currentPage === 1 ? 'photos' : 'more photos'}...</div>
    {/if}
  </div>
</section>

<style>
  section {
    display: block;
    min-height: 100vh;
    padding-bottom: 400px;
  }

  .filters {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    position: sticky;
    top: 0;
    background: white;
    z-index: 10;
  }

  input,
  select {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-3);
  }

  .grid-item {
    transition: opacity 0.3s;
  }

  .loading {
    text-align: center;
    padding: 1rem;
    font-style: italic;
  }

  .error {
    color: red;
    text-align: center;
    padding: 1rem;
  }
</style>