<!-- src/routes/gallery/+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import type { Photo, Pagination, AppState } from '$lib/types';
  import { debounce, fetchPhotos } from '$lib/utils';
  import PhotoGrid from '$lib/components/PhotoGrid.svelte';

  export let data: {
    photos: Photo[];
    pagination: Pagination;
    collections: string[];
    tags: string[];
  };

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

  let availableCollections = data.collections;
  let availableTags = data.tags;

  async function loadPhotoData(pageNumber: number, shouldReset: boolean = false): Promise<void> {
    if ($applicationState.isLoading || (!$applicationState.hasMorePages && !shouldReset)) return;

    applicationState.update(state => ({ ...state, isLoading: true }));

    let newState: Partial<AppState> = { isLoading: false };

    try {
      const { photos: newPhotos, pagination } = await fetchPhotos($applicationState, pageNumber);
      newState.photos = shouldReset || pageNumber === 1 ? newPhotos : [...$applicationState.photos, ...newPhotos];
      newState.hasMorePages = pagination.hasNext;
      newState.errorMessage = null;
    } catch (error) {
      newState.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      applicationState.update(state => ({ ...state, ...newState }));
    }
  }

  function handleScrollEvent(): void {
    if ($applicationState.isLoading || !$applicationState.hasMorePages) return;
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    if (distanceFromBottom < 400 || scrollHeight <= clientHeight) {
      loadMore();
    }
  }

  function resetAndLoad(): void {
    applicationState.update(state => ({
      ...state,
      currentPage: 1,
      hasMorePages: true,
      photos: []
    }));
    loadPhotoData(1, true);
  }

  const debouncedHandleFilterChange = debounce(() => {
    console.log('Debounced filter change triggered for search query:', $applicationState.searchQuery);
    resetAndLoad();
  }, 300);

  function handleFilterChange(): void {
    resetAndLoad();
  }

  function loadMore(): void {
    applicationState.update(state => ({ ...state, currentPage: state.currentPage + 1 }));
    loadPhotoData($applicationState.currentPage);
  }

  onMount(() => {
    window.addEventListener('scroll', handleScrollEvent);
    handleScrollEvent();
  });

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

  <PhotoGrid
    photos={$applicationState.photos}
    isLoading={$applicationState.isLoading}
    hasMorePages={$applicationState.hasMorePages}
    loadMore={loadMore}
    errorMessage={null}
  />
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
</style>