<script lang="ts">
  import { onMount } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  const widths = [750, 1080, 1366, 1880];
  const photoIds = [1030, 1234, 1443, 1538, 1817, 2005, 2118];

  function generateSrcset(id: number, widths: number[]): string {
    const zone = "https://static.billatkinson.us";
    const sourceImage = `srclg/srclg-${id}_Image.webp`;
    return widths
      .map((w) => `${zone}/cdn-cgi/image/width=${w}/${sourceImage} ${w}w`)
      .join(", ");
  }

  let currentIndex = 0;
  const animatedIndex = tweened(currentIndex, { duration: 3000, easing: cubicOut });

  let autoplayInterval: number | null;
  onMount(() => {
    autoplayInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % photoIds.length;
      animatedIndex.set(currentIndex);
    }, 6000);
    return () => clearInterval(autoplayInterval);
  });

  let slideshowEl: HTMLDivElement;
  let isDragging = false;
  let startX = 0;
  let dragOffset = 0;

  function startDrag(event: { clientX: number; }) {
    clearInterval(autoplayInterval); 
    isDragging = true;
    startX = event.clientX;
    dragOffset = 0;
    window.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', stopDrag);
  }

  function drag(event: { clientX: any; }) {
    if (!isDragging || !slideshowEl) return;
    const currentX = event.clientX;
    dragOffset = currentX - startX;

    const slideWidth = slideshowEl.clientWidth;
    const dragFraction = dragOffset / slideWidth;
    const targetIndex = currentIndex - dragFraction;

    const clampedIndex = Math.max(currentIndex - 1, Math.min(currentIndex + 1, targetIndex));
    animatedIndex.set(clampedIndex);
  }

  function stopDrag() {
    if (!isDragging || !slideshowEl) return;
    isDragging = false;
    window.removeEventListener('mousemove', drag);
    window.removeEventListener('mouseup', stopDrag);

    const slideWidth = slideshowEl.clientWidth;
    const minDrag = slideWidth * 0.2;

    if (dragOffset > minDrag) {
      currentIndex = (currentIndex - 1 + photoIds.length) % photoIds.length;
    } else if (dragOffset < -minDrag) {
      currentIndex = (currentIndex + 1) % photoIds.length;
    }
    animatedIndex.set(currentIndex);

    autoplayInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % photoIds.length;
      animatedIndex.set(currentIndex);
    }, 6500);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="slideshow"
  bind:this={slideshowEl}
  on:mousedown={startDrag}
>
  {#each photoIds as id, index}
    {@const offset = index - $animatedIndex}
    {@const translateX = offset * 100}
    {@const scale = 1 + 0.1 * Math.abs(offset)}
    <div
      class="slide"
      style="
        transform: translateX({translateX}%) scale({scale});
      "
    >
      <div class="slide-inner">
        <div
          class="background"
          style="
            transform: translateX({-translateX * 0.5}%);
          "
        >
          <img
            class="embla__parallax__img"
            srcset={generateSrcset(id, widths)}
            src={`https://static.billatkinson.us/srcsm/srcsm-${id}_Image.webp`}
            alt="Image {id}"
          />
        </div>
      </div>
    </div>
  {/each}
</div>

<style>
  .slideshow {
    position: relative;
    width: 100%;
    height: auto;
    aspect-ratio: 16/9;
    overflow: hidden;
  }

  .slide {
    position: absolute;
    pointer-events: none;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .slide-inner {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .background {
    position: absolute;
    top: 0;
    left: -10%;
    width: 120%;
    height: 100%;
    overflow: hidden;
  }

  .background img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    overflow: hidden;
  }
</style>