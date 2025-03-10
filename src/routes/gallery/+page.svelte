<script lang="ts">
  // Import necessary Svelte and utility modules
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';

  // Define the structure of a Photo object
  interface Photo {
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

  // Define the structure of the pagination metadata
  interface Pagination {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
  }

  // Define the structure of the API response for photos
  interface PhotosApiResponse {
    photos: Photo[];
    pagination: Pagination;
  }

  // Define the structure of the application state
  interface AppState {
    photos: Photo[];
    currentPage: number;
    hasMorePages: boolean;
    isLoading: boolean;
    errorMessage: string | null;
    searchQuery: string;
    selectedCollection: string;
    selectedTag: string;
  }

  // Create a reactive store to manage all application state
  const applicationState = writable<AppState>({
    photos: [],
    currentPage: 1,
    hasMorePages: true,
    isLoading: false,
    errorMessage: null,
    searchQuery: '',
    selectedCollection: 'All Collections',
    selectedTag: 'All Tags'
  });

  // Destructure the store for reactive access
  $: ({
    photos,
    currentPage,
    hasMorePages,
    isLoading,
    errorMessage,
    searchQuery,
    selectedCollection,
    selectedTag
  } = $applicationState);

  // Arrays to store dynamically fetched filter options
  let availableCollections: string[] = ['All Collections'];
  let availableTags: string[] = ['All Tags'];

  // Function to fetch and load photo data from the API
  async function loadPhotoData(pageNumber: number, shouldReset: boolean = false): Promise<void> {
    // Exit early if already loading or no more pages to load (unless resetting)
    if (isLoading || (!hasMorePages && !shouldReset)) {
      return;
    }

    // Update loading state
    applicationState.update(state => {
      state.isLoading = true;
      return state;
    });

    try {
      // Construct query parameters for the API request
      const queryParameters = new URLSearchParams({
        page: pageNumber.toString(),
        limit: '25'
      });

      // Add filters to the query parameters if they are not default values
      if (searchQuery) {
        queryParameters.set('search', searchQuery);
      }
      if (selectedCollection !== 'All Collections') {
        queryParameters.set('collection', selectedCollection);
      }
      if (selectedTag !== 'All Tags') {
        queryParameters.set('color', selectedTag.toLowerCase());
      }

      // Fetch data from the API
      const response = await fetch(`/api/photos?${queryParameters}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch photo data: ${response.status}`);
      }

      // Parse the JSON response
      const data: PhotosApiResponse = await response.json();
      const { photos: newPhotos, pagination } = data;

      // Update the photos array based on whether this is a reset or additional load
      applicationState.update(state => {
        state.photos = shouldReset || pageNumber === 1 ? newPhotos : [...state.photos, ...newPhotos];
        state.hasMorePages = pagination.hasNext;
        state.errorMessage = null;
        return state;
      });
    } catch (error) {
      // Handle and store any errors
      applicationState.update(state => {
        state.errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return state;
      });
    } finally {
      // Reset loading state regardless of success or failure
      applicationState.update(state => {
        state.isLoading = false;
        return state;
      });
    }
  }

  // Function to handle scroll events and load more data
  function handleScrollEvent(): void {
    if (isLoading || !hasMorePages) {
      return;
    }

    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    if (distanceFromBottom < 400) {
      applicationState.update(state => {
        state.currentPage += 1;
        return state;
      });
      loadPhotoData(currentPage);
    }
  }

  // Function to handle filter changes and reset pagination
  function handleFilterChange(): void {
    applicationState.update(state => {
      state.currentPage = 1;
      state.hasMorePages = true;
      return state;
    });
    loadPhotoData(1, true);
  }

  // Lifecycle hook to initialize data and event listeners
  onMount(async () => {
    try {
      // Fetch collections and tags concurrently
      const [collectionsResponse, tagsResponse] = await Promise.all([
        fetch('/api/collections').then(res => res.json()),
        fetch('/api/tags').then(res => res.json())
      ]);

      // Update collections with fetched data
      availableCollections = ['All Collections', ...(collectionsResponse as string[])];

      // Update tags with fetched data, capitalizing the first letter
      availableTags = ['All Tags', ...(tagsResponse as string[]).map(tag => tag.charAt(0).toUpperCase() + tag.slice(1))];
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }

    // Initial load of photo data
    loadPhotoData(currentPage);

    // Add scroll event listener
    window.addEventListener('scroll', handleScrollEvent);
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

  {#if errorMessage}
    <p class="error">Error: {errorMessage}</p>
  {:else if photos.length === 0 && !isLoading}
    <p>No photos available.</p>
  {/if}
  {#each photos as photo (photo.photo_id)}
    <a class="grid-item" href={`https://static.billatkinson.us/2240/2240-${photo.photo_id}_Image.webp`}>
      <img src={`https://static.billatkinson.us/320/320-${photo.photo_id}_Image.webp`} alt={photo.photo_title} />
    </a>
  {/each}
  {#if isLoading}
    <div class="loading">Loading {currentPage === 1 ? 'photos' : 'more photos'}...</div>
  {/if}
</section>

<style>
  section {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--size-3);
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