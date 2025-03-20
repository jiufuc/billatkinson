<!-- src/lib/components/GalleryFilters.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { melt, createPopover } from "@melt-ui/svelte";
  import { fade, fly } from "svelte/transition";
  import type { AppState } from "$lib/types";
  import { debounce } from "$lib/utils";

  export let applicationState: AppState;
  export let collections: string[] = [];
  export let isSticky: boolean = false;

  const dispatch = createEventDispatcher<{
    filter: void;
  }>();

  // Popover for mobile filters
  const {
    elements: { trigger, content, overlay, arrow },
    states: { open },
  } = createPopover({
    forceVisible: true,
    preventScroll: false,
  });

  // Custom tags input implementation
  let inputValue = "";
  let tags: string[] = [];

  // Sort field options
  const sortFieldOptions = [
    { value: "id", label: "Sort by ID" },
    { value: "year", label: "Sort by Year" }
  ];

  function addTag(e: KeyboardEvent) {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        tags = [...tags, inputValue.trim()];
        // Update search query in applicationState
        applicationState.searchQuery = tags.join(" ");
        handleFilterChange();
      }
      inputValue = "";
    }
  }

  function removeTag(index: number) {
    tags = tags.filter((_, i) => i !== index);
    // Update search query in applicationState
    applicationState.searchQuery = tags.join(" ");
    handleFilterChange();
  }

  // Toggle sort direction
  function toggleSortDirection() {
    applicationState.sortDirection = applicationState.sortDirection === "asc" ? "desc" : "asc";
    handleFilterChange();
  }

  // Function to handle scroll completion and execute callback
  function scrollToTopThenExecute(callback: () => void) {
    // If already at top, just execute callback immediately
    if (window.scrollY < 10) {
      callback();
      return;
    }

    // Create one-time scroll end detection
    const handleScrollEnd = () => {
      if (window.scrollY < 10) {
        window.removeEventListener('scroll', handleScrollEnd);
        clearTimeout(fallbackTimer);
        callback();
      }
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScrollEnd);
    
    // Start scrolling to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Fallback timer in case scroll event doesn't fire properly
    const fallbackTimer = setTimeout(() => {
      window.removeEventListener('scroll', handleScrollEnd);
      callback();
    }, 800);
  }

  // Handle filter application or clearing
  function applyFilter(shouldClear = false) {
    // Close popover if open
    if ($open) $open = false;
    
    // Scroll first, then update state and filter
    scrollToTopThenExecute(() => {
      if (shouldClear) {
        // Clear tags
        tags = [];
        inputValue = "";
        // Reset application state
        applicationState.selectedCollection = "All Collections";
        applicationState.searchQuery = "";
        applicationState.sortField = "id";
        applicationState.sortDirection = "asc";
      }
      // Always dispatch the filter event
      dispatch("filter");
    });
  }

  const debouncedFilterChange = debounce(() => applyFilter(), 300);

  function handleFilterChange() {
    debouncedFilterChange();
  }

  function clearFilters() {
    applyFilter(true);
  }

  // Initialize tags from searchQuery when component mounts
  $: {
    if (applicationState.searchQuery && tags.length === 0) {
      tags = applicationState.searchQuery.split(/\s+/).filter(tag => tag.length > 0);
    }
  }
</script>

<div class="filters-container">
  <div
    class="filters"
    style={isSticky ? "opacity: 0; pointer-events: none;" : "opacity: 1;"}
  >
    <!-- Custom Tags Input for search -->
    <div class="w-full md:w-64 relative overflow-hidden border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white transition-all duration-200">
      <div class="tags-input-container">
        {#each tags as tag, index}
          <span 
            class="tag-item"
            in:fly={{ y: -20, duration: 200 }}
            out:fly={{ y: 20, duration: 150 }}
          >
            {tag}
            <button
              class="tag-remove-btn"
              aria-label={`Remove ${tag}`}
              on:click={() => removeTag(index)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </span>
        {/each}
        <input
          bind:value={inputValue}
          on:keydown={addTag}
          class="tag-input"
          placeholder={tags.length ? "Add more tags..." : "Type tags and press Enter..."}
        />
      </div>
    </div>

    <!-- Collection Select -->
    <select
      bind:value={applicationState.selectedCollection}
      on:change={handleFilterChange}
      class="w-64 px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none cursor-pointer transition-all duration-200 bg-no-repeat bg-right custom-select"
    >
      {#each collections as collection}
        <option value={collection}>{collection}</option>
      {/each}
    </select>

    <!-- Sort Field and Direction Controls -->
    <div class="flex items-center gap-1 md:gap-2">
      <select
        bind:value={applicationState.sortField}
        on:change={handleFilterChange}
        class="w-40 px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none cursor-pointer transition-all duration-200 bg-no-repeat bg-right custom-select"
      >
        {#each sortFieldOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>

      <!-- Sort Direction Toggle Button -->
      <button
        on:click={toggleSortDirection}
        class="px-3 py-2.5 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:bg-gray-100 transition-all duration-200 flex items-center justify-center"
        aria-label={applicationState.sortDirection === "asc" ? "Sort ascending" : "Sort descending"}
      >
        {#if applicationState.sortDirection === "asc"}
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
            class="transition-transform duration-300"
          >
            <path d="m3 8 4-4 4 4" />
            <path d="M7 4v16" />
            <path d="M11 12h4" />
            <path d="M11 16h7" />
            <path d="M11 20h10" />
          </svg>
        {:else}
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
            class="transition-transform duration-300"
          >
            <path d="m3 16 4 4 4-4" />
            <path d="M7 20V4" />
            <path d="M11 4h10" />
            <path d="M11 8h7" />
            <path d="M11 12h4" />
          </svg>
        {/if}
      </button>
    </div>

    <button
      class="flex items-center gap-2 px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 cursor-pointer transition-all duration-200 font-medium"
      on:click={clearFilters}
      title="Clear all filters"
      aria-label="Clear all filters"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
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
      class="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-white hover:bg-gray-100 p-4 rounded-full shadow-lg transition-all duration-300 ease border border-gray-200 cursor-pointer"
      transition:fly={{ y: 20, duration: 300 }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-gray-800"
      >
        <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
      </svg>
      <span class="sr-only">Open filters</span>
    </button>
    {#if $open}
      <div
        use:melt={$overlay}
        class="fixed inset-0 bg-transparent z-50"
        transition:fade={{ duration: 200 }}
      ></div>
      <div
        use:melt={$content}
        class="fixed z-100 bg-white border border-gray-300 shadow-xl rounded-xl p-6 max-w-90 w-max-content"
        transition:fade={{ duration: 300 }}
      >
        <div
          use:melt={$arrow}
          class="absolute w-3 h-3 bg-inherit transform rotate-45 border border-gray-300 border-t-0 border-l-0 z-0"
        ></div>
        <div class="flex flex-col items-center gap-5 min-w-[300px]">
          <h3 class="text-lg font-medium text-gray-900 self-start">Filter Photos</h3>
          
          <!-- Custom Tags Input in Popover -->
          <div class="w-full relative overflow-hidden border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
            <div class="tags-input-container">
              {#each tags as tag, index}
                <span 
                  class="tag-item"
                  in:fly={{ y: -20, duration: 200 }}
                  out:fly={{ y: 20, duration: 150 }}
                >
                  {tag}
                  <button
                    class="tag-remove-btn"
                    aria-label={`Remove ${tag}`}
                    on:click={() => removeTag(index)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </span>
              {/each}
              <input
                bind:value={inputValue}
                on:keydown={addTag}
                class="tag-input"
                placeholder={tags.length ? "Add more tags..." : "Type tags and press Enter..."}
              />
            </div>
          </div>

          <!-- Collection Select in Popover -->
          <div class="w-full space-y-1.5">
            <label for="collection-select" class="text-sm font-medium text-gray-700">Collection</label>
            <select
              id="collection-select"
              bind:value={applicationState.selectedCollection}
              on:change={handleFilterChange}
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none cursor-pointer transition-all duration-200 bg-no-repeat bg-right custom-select"
            >
              {#each collections as collection}
                <option value={collection}>{collection}</option>
              {/each}
            </select>
          </div>

          <!-- Sort Options in Popover -->
          <div class="w-full space-y-1.5">
            <label for="sort-field-select" class="text-sm font-medium text-gray-700">Sort By</label>
            <select
              id="sort-field-select"
              bind:value={applicationState.sortField}
              on:change={handleFilterChange}
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none cursor-pointer transition-all duration-200 bg-no-repeat bg-right custom-select"
            >
              {#each sortFieldOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
            
          <button
            on:click={toggleSortDirection}
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-2 text-gray-800"
          >
            {applicationState.sortDirection === "asc" ? "Ascending Order" : "Descending Order"}
            {#if applicationState.sortDirection === "asc"}
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
                class="ml-1 transition-transform duration-300"
              >
                <path d="m3 8 4-4 4 4" />
                <path d="M7 4v16" />
                <path d="M11 12h4" />
                <path d="M11 16h7" />
                <path d="M11 20h10" />
              </svg>
            {:else}
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
                class="ml-1 transition-transform duration-300"
              >
                <path d="m3 16 4 4 4-4" />
                <path d="M7 20V4" />
                <path d="M11 4h10" />
                <path d="M11 8h7" />
                <path d="M11 12h4" />
              </svg>
            {/if}
          </button>

          <button
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 cursor-pointer transition-all duration-200 font-medium"
            on:click={clearFilters}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
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
    padding: 1.25rem;
    gap: 1rem;
    justify-content: center;
    transition: all 0.3s ease;
  }

  @media (max-width: 768px) {
    .filters {
      flex-direction: column;
      align-items: stretch;
      gap: 1.25rem;
      padding: 1.25rem 1rem;
    }
  }

  /* Tags input that grows horizontally */
  .tags-input-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 0.5rem;
    gap: 0.375rem;
    min-height: 42px;
    width: 100%;
  }

  .tag-item {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.625rem;
    background-color: #dbeafe;
    color: #1e40af;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .tag-item:hover {
    background-color: #bfdbfe;
  }

  .tag-remove-btn {
    margin-left: 0.25rem;
    color: #1e40af;
    transition: color 0.2s;
  }

  .tag-remove-btn:hover,
  .tag-remove-btn:focus {
    color: #1e3a8a;
    outline: none;
  }

  .tag-input {
    flex: 1;
    min-width: 120px;
    border: none;
    outline: none;
    font-size: 0.875rem;
    line-height: 1.5;
    color: #1f2937;
    padding: 0.25rem 0;
  }

  /* Custom select styling */
  .custom-select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-position: right 10px center;
    padding-right: 35px;
  }

  /* Ensure the focus rings are visible */
  :global(.focus-visible) {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  select {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
</style>