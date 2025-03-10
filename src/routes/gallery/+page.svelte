<script>
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';

  const state = writable({ photos: [], page: 1, hasNext: true, isLoading: false, error: null });
  $: ({ photos, page, hasNext, isLoading, error } = $state);

  async function loadPhotos(pageNum) {
    if (isLoading || !hasNext) return;
    $state.isLoading = true;
    try {
      const res = await fetch(`/api/photos?page=${pageNum}&limit=25`);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const { photos: newPhotos, pagination } = await res.json();
      $state.photos = pageNum === 1 ? newPhotos : [...photos, ...newPhotos];
      $state.hasNext = pagination.hasNext;
      $state.error = null;
    } catch (err) {
      $state.error = err.message;
    } finally {
      $state.isLoading = false;
    }
  }

  function handleScroll() {
    if (isLoading || !hasNext) return;
    if (document.documentElement.scrollHeight - (document.documentElement.scrollTop + document.documentElement.clientHeight) < 400) {
      $state.page += 1;
      loadPhotos($state.page);
    }
  }

  onMount(() => {
    loadPhotos(page);
    window.addEventListener('scroll', handleScroll);
  });

  onDestroy(() => window.removeEventListener('scroll', handleScroll));
</script>

<section>
  {#if error}
    <p class="error">Error: {error}</p>
  {:else if photos.length === 0 && !isLoading}
    <p>No photos available.</p>
  {/if}
  {#each photos as photo (photo.photo_id)}
    <a class="grid-item" href="https://static.billatkinson.us/2240/2240-{photo.photo_id}_Image.webp">
      <img src="https://static.billatkinson.us/320/320-{photo.photo_id}_Image.webp" alt={photo.photo_title} />
    </a>
  {/each}
  {#if isLoading}
    <div class="loading">Loading {page === 1 ? 'photos' : 'more'}...</div>
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
  .grid-item { transition: opacity 0.3s; }
  .loading { text-align: center; padding: 1rem; font-style: italic; }
  .error { color: red; text-align: center; padding: 1rem; }
</style>