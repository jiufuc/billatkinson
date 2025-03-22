<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Swiper from "swiper";
  import { Autoplay } from "swiper/modules";
  import "swiper/css";

  // Export props for parent component to pass in
  export let photoIds: number[] = [];
  export let widths: number[] = [];
  export let generateSrcset: (id: number, widths: number[]) => string;

  // Optional configuration props with defaults
  export let transitionSpeed: number = 3000;
  export let autoplayDelay: number = 6000;
  export let baseImgUrl: string =
    "https://static.billatkinson.us/srcset/srcset-";
  export let imgUrlSuffix: string = "_Image.jpg";
  export const aspectRatio: string = "7/5";

  let swiperInstance: Swiper | null = null;
  let progressWidth = 0;
  let progressInterval: ReturnType<typeof setInterval> | null = null;
  let transitioning = false;

  onMount(() => {
    swiperInstance = new Swiper(".swiper", {
      modules: [Autoplay],
      slidesPerView: 1,
      lazyPreloadPrevNext: 1,
      grabCursor: true,
      loop: true,
      speed: transitionSpeed,
      autoplay: {
        delay: autoplayDelay,
        disableOnInteraction: false,
      },
      on: {
        init: () => {
          startProgressBar();
        },
        autoplayStart: () => {
          if (!transitioning) {
            startProgressBar();
          }
        },
        autoplayStop: stopProgressBar,
        slideChangeTransitionStart: () => {
          transitioning = true;
          stopProgressBar();
        },
        slideChangeTransitionEnd: () => {
          transitioning = false;
          resetProgressBar();
          startProgressBar();
        },
      },
    });
  });

  function startProgressBar() {
    if (progressInterval) clearInterval(progressInterval);

    const totalTime = autoplayDelay;
    const interval = 50;
    const increment = (interval / totalTime) * 100;

    progressInterval = setInterval(() => {
      progressWidth = Math.min(progressWidth + increment, 100);
    }, interval);
  }

  function resetProgressBar() {
    progressWidth = 0;
  }

  function stopProgressBar() {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }

  onDestroy(() => {
    if (swiperInstance) {
      swiperInstance.destroy(true, true);
    }
    stopProgressBar();
  });
</script>

<div class="swiper-container">
  <div class="swiper">
    <div class="swiper-wrapper">
      {#each photoIds as photoId}
        <div class="swiper-slide">
          {#if widths.length > 0 && typeof generateSrcset === "function"}
            <img
              srcset={generateSrcset(photoId, widths)}
              src={`${baseImgUrl}${photoId}${imgUrlSuffix}`}
              alt={`Image ${photoId}`}
              loading="lazy"
              class="slide-image"
            />
          {:else}
            <img
              src={`${baseImgUrl}${photoId}${imgUrlSuffix}`}
              alt={`Image ${photoId}`}
              loading="lazy"
              class="slide-image"
            />
          {/if}
          <div class="swiper-lazy-preloader"></div>
        </div>
      {/each}
    </div>
  </div>

  <div class="progress-container">
    <div class="progress-bar" style="width: {progressWidth}%"></div>
  </div>
</div>

<style>
  .swiper-container {
    position: relative;
    width: 100%;
    margin: 0 auto;
    overflow: hidden;
  }

  .swiper {
    width: 100%;
    aspect-ratio: var(--aspect-ratio, 7/5);
  }

  .swiper-slide {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    transition: transform 1s ease;
  }

  :global(.swiper-slide-active) {
    z-index: 2;
  }

  .slide-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 3s ease;
  }

  :global(.swiper-slide-prev .slide-image) {
    transform: scale(1.1);
  }

  :global(.swiper-slide-next .slide-image) {
    transform: scale(1.1);
  }

  :global(.swiper-slide-active .slide-image) {
    transform: scale(1);
  }

  .progress-container {
    position: relative;
    margin-top: 12px;
    float: right;
    width: 15%;
    height: 6px;
    background-color: rgba(59, 59, 59, 0.2);
    z-index: 10;
  }

  .progress-bar {
    height: 100%;
    background-color: #3b3b3b;
    transition: width 0.1s linear;
  }

  :global(.swiper-wrapper) {
    align-items: center;
  }

  :global(.swiper-container-3d .swiper-slide-shadow-left),
  :global(.swiper-container-3d .swiper-slide-shadow-right) {
    display: none !important;
  }
</style>
