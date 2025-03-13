<!-- src/lib/components/PhotoGrid.svelte -->
<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { writable } from 'svelte/store';
  import { debounce } from "$lib/utils";
  import type { Photo } from "$lib/types";
  import "lazysizes";
  import imagesLoaded from "imagesloaded";
  import "photoswipe/style.css";

  export let photos: Photo[];

  let grid: HTMLElement;
  let msnry: any;
  let lightbox: any;
  const photoCount = writable(0);

  const widths: number[] = [320, 480, 640, 720, 880, 1120, 1340, 1800, 2240];

  function generateSrcset(photoId: number, widths: number[]): string {
    const zone = "https://static.billatkinson.us";
    const sourceImage = `srclg/srclg-${photoId}_Image.webp`;
    return widths
      .map(
        (width) =>
          `${zone}/cdn-cgi/image/width=${width}/${sourceImage} ${width}w`
      )
      .join(", ");
  }

   async function initializeGallery() {
    const Masonry = (await import("masonry-layout")).default;
    const PhotoSwipeLightbox = (await import("photoswipe/lightbox")).default;

    if (!grid) return;

    await tick();

    imagesLoaded(grid, () => {
      msnry = new Masonry(grid, {
        itemSelector: ".grid-item",
        columnWidth: ".grid-item",
        gutter: ".gutter-sizer",
        percentPosition: true,
        transitionDuration: 0,
      });
      msnry.layout();

      if (!lightbox) {
        lightbox = new PhotoSwipeLightbox({
          gallery: ".grid",
          children: "a.grid-item",
          pswpModule: () => import("photoswipe"),
          showHideAnimationType: "zoom",
          zoom: false,
          counter: false,
          bgOpacity: 1,
          padding: { top: 65, bottom: 65, left: 25, right: 25 },
          preload: [2, 5],
        });
        lightbox.on("uiRegister", function () {
          lightbox.pswp.ui.registerElement({
            name: "caption",
            order: 9,
            isButton: false,
            appendTo: "root",
            html: "Caption text",
            onInit: (el: { innerHTML: string; }, pswp: any) => {
              lightbox.pswp.on("change", () => {
                const currSlideElement = lightbox.pswp.currSlide.data.element;
                let captionHTML = "";
                if (currSlideElement) {
                  const hiddenCaption =
                    currSlideElement.querySelector(".hidden-caption");
                  if (hiddenCaption) {
                    captionHTML = hiddenCaption.innerHTML;
                  }
                }
                el.innerHTML = captionHTML || "";
              });
            },
          });
          lightbox.pswp.ui.registerElement({
            name: "download-button",
            order: 8,
            isButton: true,
            tagName: "a",
            html: '<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" class="pswp__icn"><path d="M20.5 14.3 17.1 18V10h-2.2v7.9l-3.4-3.6L10 16l6 6.1 6-6.1ZM23 23H9v2h14Z" /></svg>',
            onInit: (el: { setAttribute: (arg0: string, arg1: string) => void; }, pswp: { on: (arg0: string, arg1: () => void) => void; currSlide: { data: { src: any; }; }; }) => {
              el.setAttribute("download", "");
              el.setAttribute("target", "_blank");
              el.setAttribute("rel", "noopener");
      
              pswp.on("change", () => {
                console.log("change");
                (el as any).href = pswp.currSlide.data.src;
              });
            },
          });
        });
        lightbox.init();
        console.log("PhotoSwipe initiated");
      }
    });
  }

  onMount(() => {
    initializeGallery();
  });

  $: if (msnry && photos.length !== $photoCount) {
    photoCount.set(photos.length);
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
  }, 200);

  document.addEventListener("lazyloaded", debouncedLayout);

  onDestroy(() => {
    if (msnry) msnry.destroy();
    if (lightbox) lightbox.destroy();
    document.removeEventListener("lazyloaded", debouncedLayout);
  });
</script>

<div class="grid" bind:this={grid}>
  <div class="gutter-sizer"></div>
  {#each photos as photo (photo.photo_id)}
    <a
      href={`https://static.billatkinson.us/srclg/srclg-${photo.photo_id}_Image.webp`}
      target="_blank"
      data-pswp-width={photo.width}
      data-pswp-height={photo.height}
      style="aspect-ratio: {photo.width} / {photo.height};"
      class="grid-item"
    >
      <img
        data-srcset={generateSrcset(photo.photo_id, widths)}
        data-src={`https://static.billatkinson.us/srcsm/srcsm-${photo.photo_id}_Image.webp`}
        data-sizes="auto"
        alt={photo.photo_title}
        class="lazyload"
      />
      <div class="hidden-caption">
        <div class="caption-content">
          <strong class="p-id">#{photo.photo_id}:</strong>
          <strong class="p-title">{photo.photo_title}</strong>
          <span class="p-dash">—</span>
          <span class="p-location"><br class="sp">{photo.photo_location}</span>
          <span class="p-year">({photo.photo_year})</span>
        </div>
      </div>
    </a>
  {/each}
</div>

<style>
  .grid {
    width: 101.5%;
  }

  .gutter-sizer {
    width: 1.5%;
  }
  
  .grid-item img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
  }

  .grid-item {
    width: 23.5%;
    margin-bottom: 1.5%;
  }

  @media (min-width: 768px) and (max-width: 1279px) {
    .grid-item {
      width: 31.83%;
    }
  }

  @media (max-width: 767px) {
    .grid-item {
      width: 48.5%;
    }

    .p-dash {
      display: none;
    }
  }
</style>
