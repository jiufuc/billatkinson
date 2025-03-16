<script lang="ts">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import { debounce, fetchPhotos } from "$lib/utils";
  import type { Photo, Pagination, AppState } from "$lib/types";
  import PhotoGrid from "$lib/components/PhotoGrid.svelte";
  import { createPopover, melt } from "@melt-ui/svelte";
  import { fade } from "svelte/transition";
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

  const debouncedFilterChange = debounce(() => resetAndLoad(), 300);

  const debouncedLoadMore = debounce(() => {
    loadMorePromise = loadMorePromise.then(() =>
      fetchPhotosAndUpdate($applicationState.currentPage + 1)
    );
  }, 300);

  function handleFilterChange() {
    debouncedFilterChange();
  }

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

  const {
    elements: { trigger, content, overlay },
    states: { open },
  } = createPopover({
    forceVisible: true,
    preventScroll: false,
  });
</script>

<div id="sticky-sentinel"></div>

<section>
  <div
    class="filters"
    style={$isStickyStore ? "opacity: 0; pointer-events: none;" : "opacity: 1;"}
  >
    <input
      type="text"
      placeholder="Search keywords..."
      bind:value={$applicationState.searchQuery}
      oninput={handleFilterChange}
    />
    <select
      bind:value={$applicationState.selectedCollection}
      onchange={handleFilterChange}
    >
      {#each availableCollections as collection}
        <option value={collection}>{collection}</option>
      {/each}
    </select>
    <select
      bind:value={$applicationState.selectedTag}
      onchange={handleFilterChange}
    >
      {#each availableTags as tag}
        <option value={tag}>{tag}</option>
      {/each}
    </select>
  </div>
  {#if $isStickyStore}
    <button
      type="button"
      use:melt={$trigger}
      class="filter-button"
      transition:fade={{ duration: 200 }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M20 7h-9"></path>
        <path d="M14 17H5"></path>
        <circle cx="17" cy="17" r="3"></circle>
        <circle cx="7" cy="7" r="3"></circle>
      </svg>
      <span class="sr-only">Open filters</span>
    </button>
    {#if $open}
      <div
        use:melt={$overlay}
        class="popover-overlay"
        transition:fade={{ duration: 200 }}
      ></div>
      <div
        use:melt={$content}
        class="popover-content"
        transition:fade={{ duration: 200 }}
      >
        <div class="filters popover-filters">
          <input
            type="text"
            placeholder="Search keywords..."
            bind:value={$applicationState.searchQuery}
            oninput={handleFilterChange}
          />
          <select
            bind:value={$applicationState.selectedCollection}
            onchange={handleFilterChange}
          >
            {#each availableCollections as collection}
              <option value={collection}>{collection}</option>
            {/each}
          </select>
          <select
            bind:value={$applicationState.selectedTag}
            onchange={handleFilterChange}
          >
            {#each availableTags as tag}
              <option value={tag}>{tag}</option>
            {/each}
          </select>
        </div>
      </div>
    {/if}
  {/if}

  <PhotoGrid photos={$applicationState.photos} />

  {#if $applicationState.hasMorePages}
    <div bind:this={sentinel} style="height: 1px;"></div>
  {/if}
</section>

<style>
  section {
    display: block;
    border-top: 0.1rem solid #999;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    padding: 1rem;
    gap: 0.5rem 2rem;
    justify-content: center;
    transition: opacity 0.2s ease;
  }

  input,
  select {
    margin-left: -1rem;
    padding: 0.3rem;
    min-width: 200px;
    border: 1px solid #ccc;
  }

  .filter-button {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    z-index: 99;
    background-color: rgba(225, 223, 221, 1);
    color: black;
    cursor: pointer;
    padding: 1rem;
    border-radius: 50%;
    font-size: 1rem;
    transition: all 0.3s ease;
  }

  .filter-button:hover {
    background-color: rgba(255, 253, 251, 1);
  }

  .popover-content {
    position: absolute;
    display: flex;
    flex-direction: column;
    background: white;
    border: 1px solid #ccc;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 100;
    padding: 1rem;
    border-radius: 5%;
  }

  .popover-filters {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
</style>
