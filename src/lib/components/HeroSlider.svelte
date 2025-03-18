<script lang="ts">
  import { onMount } from "svelte";
  import { tweened } from "svelte/motion";
  import { cubicOut, linear } from "svelte/easing";
  import { writable, derived } from "svelte/store";
  import { fly } from "svelte/transition";

  const widths = [750, 1080, 1366, 1880, 2240, 3000];
  const photoIds = [1030, 1234, 1443, 1630, 1997, 2005, 2118];

  const BUFFER_SIZE = 2;

  const currentIndexStore = writable(0);
  const animatedIndex = tweened(0, { duration: 3000, easing: cubicOut });

  const AUTOPLAY_DURATION = 6000;

  const progressValue = tweened(0, {
    duration: AUTOPLAY_DURATION,
    easing: linear,
  });

  function getModuloIndex(index: number): number {
    return ((index % photoIds.length) + photoIds.length) % photoIds.length;
  }

  const visibleSlides = derived(currentIndexStore, ($currentIndex) => {
    const slides = [];

    for (let i = -BUFFER_SIZE; i <= BUFFER_SIZE; i++) {
      const absoluteIndex = $currentIndex + i;
      const normalizedIndex = getModuloIndex(absoluteIndex);

      slides.push({
        dataIndex: normalizedIndex,
        virtualPosition: absoluteIndex,
        photoId: photoIds[normalizedIndex],
      });
    }

    return slides;
  });

  function generateSrcset(id: number, widths: number[]): string {
    const zone = "https://static.billatkinson.us";
    const sourceImage = `srclg/srclg-${id}_Image.webp`;
    return widths
      .map((w) => `${zone}/cdn-cgi/image/width=${w}/${sourceImage} ${w}w`)
      .join(", ");
  }

  let autoplayInterval: number | null = null;
  let slideshowEl: HTMLDivElement;
  let isDragging = false;
  let startX = 0;
  let dragOffset = 0;
  let loadedImages = new Set<number>();
  let isBrowser = false;

  function preloadImage(id: number): void {
    if (!isBrowser || loadedImages.has(id)) return;

    const img = new window.Image();
    img.onload = () => loadedImages.add(id);
    img.src = `https://static.billatkinson.us/srcsm/srcsm-${id}_Image.webp`;
  }

  $: if (isBrowser) {
    const currentIndex = $currentIndexStore;
    preloadImage(photoIds[getModuloIndex(currentIndex + 1)]);
    preloadImage(photoIds[getModuloIndex(currentIndex + 2)]);
    preloadImage(photoIds[getModuloIndex(currentIndex - 1)]);
    preloadImage(photoIds[getModuloIndex(currentIndex - 2)]);
  }

  function startProgressAnimation() {
    progressValue.set(0, { duration: 0 });
    progressValue.set(1, { duration: AUTOPLAY_DURATION });
  }

  function startAutoplay() {
    if (autoplayInterval !== null) {
      clearInterval(autoplayInterval);
    }

    startProgressAnimation();

    autoplayInterval = setInterval(() => {
      const nextIndex = $currentIndexStore + 1;
      currentIndexStore.set(nextIndex);
      animatedIndex.set(nextIndex);

      startProgressAnimation();
    }, AUTOPLAY_DURATION);
  }

  onMount(() => {
    isBrowser = true;

    startAutoplay();

    preloadImage(photoIds[0]);
    preloadImage(photoIds[getModuloIndex(1)]);
    preloadImage(photoIds[getModuloIndex(-1)]);

    return () => {
      if (autoplayInterval !== null) {
        clearInterval(autoplayInterval);
      }
    };
  });

  function startDrag(event: { clientX: number }) {
    if (autoplayInterval !== null) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    }

    isDragging = true;
    startX = event.clientX;
    dragOffset = 0;
    window.addEventListener("mousemove", drag);
    window.addEventListener("mouseup", stopDrag);

    progressValue.set($progressValue, { duration: 0 });
  }

  function drag(event: { clientX: any }) {
    if (!isDragging || !slideshowEl) return;
    const currentX = event.clientX;
    dragOffset = currentX - startX;

    const slideWidth = slideshowEl.clientWidth;
    const dragFraction = dragOffset / slideWidth;

    const targetPosition = $currentIndexStore - dragFraction;
    animatedIndex.set(targetPosition);
  }

  function stopDrag() {
    if (!isDragging || !slideshowEl) return;
    isDragging = false;
    window.removeEventListener("mousemove", drag);
    window.removeEventListener("mouseup", stopDrag);

    const slideWidth = slideshowEl.clientWidth;
    const minDrag = slideWidth * 0.2;
    let indexChanged = false;

    if (dragOffset > minDrag) {
      const prevIndex = $currentIndexStore - 1;
      currentIndexStore.set(prevIndex);
      animatedIndex.set(prevIndex);
      indexChanged = true;
    } else if (dragOffset < -minDrag) {
      const nextIndex = $currentIndexStore + 1;
      currentIndexStore.set(nextIndex);
      animatedIndex.set(nextIndex);
      indexChanged = true;
    } else {
      animatedIndex.set($currentIndexStore);
    }

    startAutoplay();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="slideshow"
  bind:this={slideshowEl}
  on:mousedown={startDrag}
  in:fly={{ duration: 300, delay: 1200 }}
>
  <div class="slides-container">
    {#each $visibleSlides as slide, i}
      {@const offset = slide.virtualPosition - $animatedIndex}
      {@const translateX = offset * 100}
      {@const scale = 1 + 0.1 * Math.abs(offset)}
      {@const zIndex = 100 - Math.abs(offset) * 10}
      <div
        class="slide"
        style="
          transform: translateX({translateX}%);
          z-index: {zIndex};
        "
      >
        <div class="slide-inner">
          <div
            class="background"
            style="
              transform: translateX({-translateX * 0.5}%) scale({scale});
              transform-origin: {offset < 0 ? 'left' : 'right'} center;
            "
          >
            <img
              class="embla__parallax__img"
              srcset={generateSrcset(slide.photoId, widths)}
              src={`https://static.billatkinson.us/srcsm/srcsm-${slide.photoId}_Image.webp`}
              alt="Image {slide.photoId}"
              loading={Math.abs(offset) <= 1 ? "eager" : "lazy"}
            />
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<div class="progress-container">
  <div class="progress-bar" style="width: {$progressValue * 100}%"></div>
</div>

<style>
  .slideshow {
    position: relative;
    width: 100%;
    height: auto;
    aspect-ratio: 3/2;
    overflow: hidden;
  }

  .slides-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .slide {
    position: absolute;
    pointer-events: none;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    will-change: transform;
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
    left: 0;
    width: 100%;
    height: 100%;
    will-change: transform;
  }

  .background img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .progress-container {
    position: relative;
    margin-top: 12px;
    float: right;
    width: 15%;
    height: 6px;
    background-color: rgba(59, 59, 59, 0.2);
    z-index: 150;
  }

  .progress-bar {
    height: 100%;
    background-color: #3b3b3b;
    will-change: width;
  }
</style>
