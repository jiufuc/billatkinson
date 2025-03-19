<!-- src/lib/components/GalleryFilters.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { melt, createPopover } from "@melt-ui/svelte";
  import { fade } from "svelte/transition";
  import type { AppState } from "$lib/types";
  import { debounce } from "$lib/utils";

  export let applicationState: AppState;
  export let collections: string[] = [];
  export let tags: string[] = [];
  export let isSticky: boolean = false;

  const dispatch = createEventDispatcher<{
    filter: void;
  }>();

  const debouncedFilterChange = debounce(() => {
    dispatch("filter");
  }, 300);

  function handleFilterChange() {
    debouncedFilterChange();
  }

  function clearFilters() {
    applicationState.searchQuery = "";
    applicationState.selectedCollection = "All Collections";
    applicationState.selectedTag = "All Tags";
    dispatch("filter");
  }

  // Popover for mobile filters
  const {
    elements: { trigger, content, overlay, arrow },
    states: { open },
  } = createPopover({
    forceVisible: true,
    preventScroll: false,
  });
</script>

<div class="filters-container">
  <div
    class="filters"
    style={isSticky ? "opacity: 0; pointer-events: none;" : "opacity: 1;"}
  >
    <input
      type="text"
      placeholder="Search keywords..."
      bind:value={applicationState.searchQuery}
      on:input={handleFilterChange}
      class="w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
    />

    <!-- Collection Select -->
    <select
      bind:value={applicationState.selectedCollection}
      on:change={handleFilterChange}
      class="w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
    >
      {#each collections as collection}
        <option value={collection}>{collection}</option>
      {/each}
    </select>

    <!-- Tag Select -->
    <select
      bind:value={applicationState.selectedTag}
      on:change={handleFilterChange}
      class="w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
    >
      {#each tags as tag}
        <option value={tag}>{tag}</option>
      {/each}
    </select>

    <button
      class="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 cursor-pointer transition-all duration-300 ease"
      on:click={clearFilters}
      title="Clear all filters"
      aria-label="Clear all filters"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
      Clear
    </button>
  </div>

  {#if isSticky}
    <button
      type="button"
      use:melt={$trigger}
      class="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-gray-200 hover:bg-gray-300 p-4 rounded-full shadow-md transition-all duration-300 ease border-none cursor-pointer"
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
        class="fixed inset-0 bg-transparent bg-opacity-20 z-50"
        transition:fade={{ duration: 200 }}
      ></div>
      <div
        use:melt={$content}
        class="fixed z-100 bg-white border border-gray-300 shadow-lg rounded-lg p-5 max-w-90 w-max-content"
        transition:fade={{ duration: 200 }}
      >
        <div
          use:melt={$arrow}
          class="absolute w-3 h-3 bg-inherit transform rotate-45 border border-gray-300 border-t-0 border-l-0 z-0"
        ></div>
        <div class="flex flex-col items-center gap-5 min-w-[280px]">
          <input
            type="text"
            placeholder="Search keywords..."
            bind:value={applicationState.searchQuery}
            on:input={handleFilterChange}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <!-- Collection Select in Popover -->
          <select
            bind:value={applicationState.selectedCollection}
            on:change={handleFilterChange}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {#each collections as collection}
              <option value={collection}>{collection}</option>
            {/each}
          </select>

          <!-- Tag Select in Popover -->
          <select
            bind:value={applicationState.selectedTag}
            on:change={handleFilterChange}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {#each tags as tag}
              <option value={tag}>{tag}</option>
            {/each}
          </select>

          <button
            class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 cursor-pointer transition-all duration-300 ease"
            on:click={clearFilters}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Clear Filters
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .filters {
    display: flex;
    flex-wrap: wrap;
    padding: 1rem;
    gap: 1rem;
    justify-content: center;
    transition: opacity 0.2s ease;
  }

  @media (max-width: 768px) {
    .filters {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
