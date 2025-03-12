<!-- src/lib/components/PhotoGrid.svelte -->
<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import type { Photo } from '$lib/types';
  import { debounce } from '$lib/utils';
  import 'lazysizes';
  import Masonry from 'masonry-layout';
  import imagesLoaded from 'imagesloaded';

  export let photos: Photo[];
  export let isLoading: boolean;
  export let hasMorePages: boolean;
  export let errorMessage: string | null;

  let grid: HTMLElement;
  let msnry: any;

  const widths: number[] = [320, 480, 640, 720, 880, 1120, 1340, 1800, 2240];

  function generateSrcset(photoId: number, widths: number[]): string {
    const zone = 'https://static.billatkinson.us';
    const sourceImage = `srclg/srclg-${photoId}_Image.webp`;
    return widths
      .map(width => `${zone}/cdn-cgi/image/width=${width}/${sourceImage} ${width}w`)
      .join(', ');
  }

  function masonryInit() {
    if (!grid || typeof window === 'undefined') return;
    imagesLoaded(grid, () => {
      msnry = new Masonry(grid, {
        itemSelector: '.grid-item',
        columnWidth: '.grid-item',
        gutter: '.gutter-sizer',
        percentPosition: true,
        transitionDuration: 0,
      });
      msnry.layout();
    });
  }

  onMount(() => {
    masonryInit();
  });

  $: if (msnry && photos.length > 0) {
    (async () => {
      await tick();
      imagesLoaded(grid, () => {
        msnry.reloadItems();
        msnry.layout();
      });
    })();
  }

  const debouncedLayout = debounce(() => {
    if (msnry) msnry.layout();
  }, 300);

  document.addEventListener('lazyloaded', debouncedLayout);

  onDestroy(() => {
    if (msnry) {
      msnry.destroy();
    }
    document.removeEventListener('lazyloaded', debouncedLayout);
  });
</script>

<div class="grid" bind:this={grid}>
  <div class="gutter-sizer"></div>
  {#if errorMessage}
    <p class="error">{errorMessage}</p>
  {:else if photos.length === 0 && !isLoading}
    <p>No photos available.</p>
  {/if}
  {#each photos as photo (photo.photo_id)}
    <a href={`https://static.billatkinson.us/srclg/srclg-${photo.photo_id}_Image.webp`} class="grid-item" style="aspect-ratio: {photo.width} / {photo.height};">
      <img
        data-srcset={generateSrcset(photo.photo_id, widths)}
        data-src={`https://static.billatkinson.us/srcsm/srcsm-${photo.photo_id}_Image.webp`}
        data-sizes="auto"
        alt={photo.photo_title}
        class="lazyload"
      />
    </a>
  {/each}
  {#if isLoading}
    <div class="loading">Loading {hasMorePages ? 'more photos' : 'photos'}...</div>
  {/if}
</div>

<style>
  .grid {
    width: 101.5%;
    min-height: 100vh;
    padding-bottom: 400px;
  }

  .gutter-sizer {
    width: 1.5%;
  }

  .grid-item {
    width: 23.5%;
    margin-bottom: 1.5%;
  }

  .grid-item img {
    display: block;
    width: 100%;
    height: auto;
  }

  @media (min-width: 768px) and (max-width: 1279px) {
    .grid {
      width: 100%;
    }
    .grid-item {
      width: 32.3%;
    }
  }

  @media (max-width: 767px) {
    .grid {
      width: 100%;
    }
    .grid-item {
      margin-bottom: 3%;
      width: 48.5%;
    }
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