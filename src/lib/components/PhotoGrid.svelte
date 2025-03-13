<!-- src/lib/components/PhotoGrid.svelte -->
<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { writable } from 'svelte/store';
  import { debounce } from "$lib/utils";
  import type { Photo } from "$lib/types";
  import "lazysizes";
  import imagesLoaded from "imagesloaded";
  import gsap from "gsap";

  export let photos: Photo[];

  let grid: HTMLElement;
  let msnry: any;
  let lightbox: any;
  let observer: IntersectionObserver;
  const photoCount = writable(0);
  let cursor: HTMLDivElement;
  let images: NodeListOf<HTMLImageElement>;
  let animationTimelines = new Map(); // Store timelines for cleanup

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
          zoom: false,
          counter: false,
          bgOpacity: 1,
          padding: { top: 65, bottom: 65, left: 25, right: 25 },
          preload: [2, 5],
        });
        lightbox.on("uiRegister", function () {
          lightbox.pswp.ui.registerElement({
            name: "caption",
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
      }
    });
  }

  // Function to initialize GSAP effects for images
  function initializeImageEffects(images: NodeListOf<HTMLImageElement>) {
    // Clean up existing animations
    animationTimelines.forEach((tl) => tl.kill());
    animationTimelines.clear();

    images.forEach((img) => {
      const parent = img.closest(".grid-item");
      if (!parent) return;

      const tl = gsap.timeline({ paused: true });
      animationTimelines.set(img, tl);

      img.addEventListener("mouseenter", () => {
        tl.clear();
        tl.to(img, {
          scale: 1.1,
          duration: 0.3,
          ease: "power2.out",
        }).play();
      });

      img.addEventListener("mousemove", (e) => {
        if (!parent) return;
        const bounds = parent.getBoundingClientRect();
        const offsetX = (e.clientX - bounds.left - bounds.width / 2) * 0.1;
        const offsetY = (e.clientY - bounds.top - bounds.height / 2) * 0.1;

        gsap.to(img, {
          x: offsetX,
          y: offsetY,
          duration: 0.1,
          ease: "power2.out",
        });
      });

      img.addEventListener("mouseleave", () => {
        tl.clear();
        gsap.to(img, {
          scale: 1,
          x: 0,
          y: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      });
    });
  }

  onMount(() => {
    initializeGallery();

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target.querySelector("img.lazyload");
          if (img) {
            img.addEventListener(
              "lazyloaded",
              () => {
                entry.target.classList.add("in-view");
              },
              { once: true }
            );
          } else {
            entry.target.classList.add("in-view");
          }
          observer.unobserve(entry.target);
        }
      });
    });

    if (grid) {
      const gridItems = grid.querySelectorAll(".grid-item");
      gridItems.forEach((item) => observer.observe(item));
    }
  });

  // Reactive statement to handle both Masonry and GSAP updates
  $: if (grid && photos) {
    (async () => {
      await tick(); // Wait for DOM updates
      imagesLoaded(grid, () => {
        if (msnry) {
          msnry.reloadItems();
          msnry.layout();
        }

        // Update images and reapply GSAP effects
        images = grid.querySelectorAll(".grid-item img");
        initializeImageEffects(images);

        // Update observer
        const gridItems = grid.querySelectorAll(".grid-item");
        gridItems.forEach((item) => observer.observe(item));
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
    if (observer) observer.disconnect();
    document.removeEventListener("lazyloaded", debouncedLayout);
    animationTimelines.forEach((tl) => tl.kill());
    animationTimelines.clear();
  });
</script>

<div bind:this={cursor} class="cursor"></div>
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
    transition: all 0.5s ease-in-out; 
    opacity: 0; 
    transform: translateY(20%); 
    overflow: hidden;
  }

  :global(.grid-item.in-view) {
    opacity: 1;
    transform: translateY(0); 
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

  .cursor {
    position: fixed;
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%) scale(0.5);
    transition: opacity 0.2s ease-out;
    opacity: 0;
    z-index: 9999;
    mix-blend-mode: difference;
  }
</style>