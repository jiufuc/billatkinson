<script>
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  let photos = writable([]);

  async function getPhotos() {
    try {
      const response = await fetch('/api/photos');
      if (!response.ok) throw new Error("Failed to fetch photos");
      photos.set(await response.json());
    } catch (error) {
      console.error(error);
    }
  };

   onMount(() => {
    getPhotos();
   });
</script>

<section>
  <h1>Test photo grid</h1>
  {#each $photos as photo}
    <a class="grid-item" href="https://static.billatkinson.us/2240/2240-{photo.photo_id}_Image.webp">
      <img src="https://static.billatkinson.us/480/480-{photo.photo_id}_Image.webp" alt={photo.photo_title} />
    </a>
  {/each}
</section>

<style>
  section {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--size-3);
  }
</style>