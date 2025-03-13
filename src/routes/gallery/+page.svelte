<!-- src/lib/components/+page.svelte -->
<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import { writable } from "svelte/store";
  import { debounce, fetchPhotos } from "$lib/utils";
  import type { Photo, Pagination, AppState } from "$lib/types";
  import PhotoGrid from "$lib/components/PhotoGrid.svelte";

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
    searchQuery: "",
    selectedCollection: "All Collections",
    selectedTag: "All Tags",
  });

  let availableCollections = data.collections;
  let availableTags = data.tags;
  let sentinel: HTMLDivElement;
  let loadMorePromise = Promise.resolve();
  let observer: IntersectionObserver;

  const debouncedFilterChange = debounce(() => resetAndLoad(), 300);

  const debouncedLoadMore = debounce(() => {
    loadMorePromise = loadMorePromise.then(() =>
      fetchPhotosAndUpdate($applicationState.currentPage + 1)
    );
  }, 300);

  function handleFilterChange() {
    debouncedFilterChange();
  }

  async function fetchPhotosAndUpdate(page: number, reset = false): Promise<void> {
    if ($applicationState.isLoading) return;

    applicationState.update(state => ({
      ...state,
      isLoading: true,
      errorMessage: null
    }));

    try {
      const { photos, pagination } = await fetchPhotos($applicationState, page);

      applicationState.update(state => ({
        ...state,
        photos: reset ? photos : [...state.photos, ...photos], 
        hasMorePages: pagination.hasNext,
        currentPage: page,
        isLoading: false
      }));
    } catch (error) {
      applicationState.update(state => ({
        ...state,
        isLoading: false,
        errorMessage: (error as Error).message
      }));
    }
  }

  function resetAndLoad() {
    fetchPhotosAndUpdate(1, true);
  }

  function loadMore() {
    debouncedLoadMore();
  }

  function createIntersectionObserver(
    callback: () => void
  ): IntersectionObserver {
    const rootMargin = `${Math.round(window.innerHeight * 0.9)}px`;
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

  afterUpdate(() => {
    if (sentinel && $applicationState.hasMorePages) {
      observer.observe(sentinel);
    } else if (sentinel) {
      observer.unobserve(sentinel);
    }
  });
</script>

<section>
  <div class="filters">
    <input
      type="text"
      placeholder="Search keywords..."
      bind:value={$applicationState.searchQuery}
      on:input={handleFilterChange}
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
  />

  {#if $applicationState.hasMorePages}
    <div bind:this={sentinel} style="height: 1px;"></div>
  {/if}
</section>

<style>
  section {
    display: block;
  }

  .filters {
    display: flex;
    margin-left: -1rem;
    padding: 1rem;
    gap: 1rem;
  }

  input,
  select {
    padding: 0.3rem;
    border: 1px solid #ccc;
  }
</style>
