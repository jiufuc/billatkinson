<script module>
  export const ssr = false;
</script>
<script lang="ts">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import { debounce, fetchPhotos } from "$lib/utils";
  import type { Photo, Pagination, AppState } from "$lib/types";
  import GalleryGrid from "$lib/components/GalleryGrid.svelte";
  import GalleryFilters from "$lib/components/GalleryFilters.svelte";
  import { isStickyStore } from "$lib/stores";

  const { data } = $props<{
    data: {
      photos: Photo[];
      pagination: Pagination;
      collections: string[];
      tags: string[];
    };
  }>();

  const applicationState = writable<AppState>({
    photos: data.photos,
    currentPage: 1,
    hasMorePages: data.pagination.hasNext,
    isLoading: false,
    errorMessage: null,
    searchQuery: "",
    selectedCollection: "All Collections",
    selectedTag: "All Tags",
  });

  let availableCollections = data.collections;
  let availableTags = data.tags;
  let loadMorePromise = Promise.resolve();
  let observer: IntersectionObserver;
  let sentinel: HTMLDivElement | null = $state(null);

  const debouncedLoadMore = debounce(() => {
    loadMorePromise = loadMorePromise.then(() =>
      fetchPhotosAndUpdate($applicationState.currentPage + 1)
    );
  }, 300);

  async function fetchPhotosAndUpdate(
    page: number,
    reset = false
  ): Promise<void> {
    if ($applicationState.isLoading) return;

    applicationState.update((state) => ({
      ...state,
      isLoading: true,
      errorMessage: null,
    }));

    try {
      const { photos, pagination } = await fetchPhotos($applicationState, page);

      applicationState.update((state) => ({
        ...state,
        photos: reset ? photos : [...state.photos, ...photos],
        hasMorePages: pagination.hasNext,
        currentPage: page,
        isLoading: false,
      }));
    } catch (error) {
      applicationState.update((state) => ({
        ...state,
        isLoading: false,
        errorMessage: (error as Error).message,
      }));
    }
  }

  function resetAndLoad() {
    fetchPhotosAndUpdate(1, true);
  }

  function loadMore() {
    debouncedLoadMore();
  }

  function handleFilterChange() {
    resetAndLoad();
  }

  function createIntersectionObserver(
    callback: () => void
  ): IntersectionObserver {
    const rootMargin = `${Math.round(window.innerHeight)}px`;
    return new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !$applicationState.isLoading &&
          $applicationState.hasMorePages
        ) {
          callback();
        }
      },
      { threshold: 0, rootMargin }
    );
  }

  onMount(() => {
    observer = createIntersectionObserver(loadMore);
    const handleResize = debounce(() => {
      observer.disconnect();
      observer = createIntersectionObserver(loadMore);
      if (sentinel) observer.observe(sentinel);
    }, 200);

    window.addEventListener("resize", handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  });

  $effect(() => {
    if (observer && sentinel) {
      if ($applicationState.hasMorePages) {
        observer.observe(sentinel);
      } else {
        observer.unobserve(sentinel);
      }
    }
  });
</script>

<div id="sticky-sentinel"></div>

<section>
  <GalleryFilters 
    bind:applicationState={$applicationState} 
    collections={availableCollections} 
    tags={availableTags} 
    isSticky={$isStickyStore}
    on:filter={handleFilterChange}
  />

  <GalleryGrid photos={$applicationState.photos} />

  {#if $applicationState.isLoading}
    <div class="loading-indicator">
      <span>Loading more photos...</span>
    </div>
  {/if}

  {#if $applicationState.hasMorePages}
    <div bind:this={sentinel} style="height: 1px;"></div>
  {/if}
  
  {#if $applicationState.errorMessage}
    <div class="error-message">
      <p>Error: {$applicationState.errorMessage}</p>
      <button onclick={resetAndLoad}>Retry</button>
    </div>
  {/if}
</section>

<style>
  section {
    display: block;
    border-top: 0.1rem solid #999;
  }

  .loading-indicator {
    text-align: center;
    padding: 1rem;
    font-style: italic;
    color: #666;
  }

  .error-message {
    background-color: #fff0f0;
    color: #d32f2f;
    padding: 1rem;
    margin: 1rem;
    border-radius: 4px;
    text-align: center;
  }

  .error-message button {
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: #f5f5f5;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
  }
</style>