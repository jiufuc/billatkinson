<!-- src/lib/components/PhotoGrid.svelte -->
<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { debounce, throttle } from "$lib/utils";
  import type { Photo } from "$lib/types";
  import "lazysizes";
  import imagesLoaded from "imagesloaded";

  export let photos: Photo[];

  let grid: HTMLElement;
  let msnry: any;
  let lightbox: any;
  let observer: IntersectionObserver;
  
  // Memoization cache for srcset generation
  const srcsetCache = new Map<number, string>();
  const widths: number[] = [320, 480, 640, 720, 880, 1024];

  // Memoized srcset generation
  function generateSrcset(photoId: number, widths: number[]): string {
    if (srcsetCache.has(photoId)) {
      return srcsetCache.get(photoId)!;
    }
    
    const zone = "https://static.billatkinson.us";
    const sourceImage = `srcsm/srcsm-${photoId}_Image.webp`;
    const result = widths
      .map(
        (width) =>
          `${zone}/cdn-cgi/image/width=${width}/${sourceImage} ${width}w`
      )
      .join(", ");
      
    srcsetCache.set(photoId, result);
    return result;
  }

  async function initializeGallery() {
    try {
      // Dynamically import Masonry for code-splitting
      const Masonry = (await import("masonry-layout")).default;
      const PhotoSwipeLightbox = (await import("photoswipe/lightbox")).default;

      if (!grid) return;

      await tick();

      imagesLoaded(grid, () => {
        // Initialize Masonry layout
        msnry = new Masonry(grid, {
          itemSelector: ".grid-item",
          columnWidth: ".grid-item",
          gutter: ".gutter-sizer",
          percentPosition: true,
          transitionDuration: 0,
        });
        msnry.layout();

        // Initialize PhotoSwipe lightbox if not already initialized
        if (!lightbox) {
          lightbox = new PhotoSwipeLightbox({
            pswpModule: () => import("photoswipe"),
            gallery: ".grid",
            children: "a.grid-item",
            initialZoomLevel: "fit",
            secondaryZoomLevel: "fill",
            bgOpacity: 1,
            padding: { top: 65, bottom: 65, left: 25, right: 25 },
            preload: [2, 5],
          });
          
          // Register UI elements for PhotoSwipe
          lightbox.on("uiRegister", function () {
            // Add caption element
            lightbox.pswp.ui.registerElement({
              name: "caption",
              isButton: false,
              appendTo: "root",
              html: "Caption text",
              onInit: (el: { innerHTML: string }, pswp: any) => {
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
            
            // Add download button
            lightbox.pswp.ui.registerElement({
              name: "download-button",
              isButton: true,
              tagName: "a",
              html: '<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" class="pswp__icn"><path d="M20.5 14.3 17.1 18V10h-2.2v7.9l-3.4-3.6L10 16l6 6.1 6-6.1ZM23 23H9v2h14Z" /></svg>',
              onInit: (
                el: HTMLAnchorElement,
                pswp: {
                  on: (arg0: string, arg1: () => void) => void;
                  currSlide: { data: { element: any } };
                }
              ) => {
                el.setAttribute("download", "");
                el.setAttribute("target", "_blank");
                el.setAttribute("rel", "noopener");
                pswp.on("change", () => {
                  const anchor = pswp.currSlide.data.element;
                  if (anchor && anchor instanceof HTMLAnchorElement) {
                    (el as HTMLAnchorElement).href = anchor.href;
                  }
                });
              },
            });
          });
          
          lightbox.init();
        }
      });
    } catch (error) {
      console.error("Error initializing gallery:", error);
    }
  }

  // Hover effect
  function initializeHover(grid: HTMLElement) {
    let currentItem: HTMLElement | null = null;

    const handleMouseEnter = (e: MouseEvent) => {
      currentItem = e.currentTarget as HTMLElement;
      const img = currentItem.querySelector("img");
      if (img) {
        img.classList.add("scaled");
      }
    };

    const handleMouseMove = throttle((e: MouseEvent) => {
      if (!currentItem) return;
      const img = currentItem.querySelector("img");
      if (img) {
        const bounds = currentItem.getBoundingClientRect();
        const offsetX = (e.clientX - bounds.left - bounds.width / 2) * 0.05;
        const offsetY = (e.clientY - bounds.top - bounds.height / 2) * 0.05;
        requestAnimationFrame(() => {
          img.style.transform = `scale(1.05) translate(${offsetX}px, ${offsetY}px)`;
        });
      }
    }, 16);

    const handleMouseLeave = () => {
      if (currentItem) {
        const img = currentItem.querySelector("img");
        if (img) {
          img.classList.remove("scaled");
          img.style.transform = "scale(1)";
        }
        currentItem = null;
      }
    };

    // Attach event listeners to each grid item to preserve interactive behavior
    grid.querySelectorAll(".grid-item").forEach((item) => {
      item.addEventListener("mouseenter", handleMouseEnter as EventListener);
      item.addEventListener("mousemove", handleMouseMove as EventListener);
      item.addEventListener("mouseleave", handleMouseLeave as EventListener);
    });
  }

  // Optimized initialization for intersection observer
  function setupIntersectionObserver() {
    if (!grid) return;

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          const img = target.querySelector("img.lazyload");
          
          if (img) {
            img.addEventListener(
              "lazyloaded",
              () => {
                target.classList.add("in-view");
              },
              { once: true }
            );
          } else {
            target.classList.add("in-view");
          }
          
          observer.unobserve(target);
        }
      });
    }, {
      rootMargin: "200px", // Preload images before they enter the viewport
      threshold: 0.1
    });

    const gridItems = grid.querySelectorAll(".grid-item");
    gridItems.forEach((item) => observer.observe(item));
  }

  // Handle components lifecycle
  onMount(() => {
    initializeGallery();
    setupIntersectionObserver();

    // Create a single event listener for lazyloaded events
    const debouncedLayout = debounce(() => {
      if (msnry) msnry.layout();
    }, 200);
    
    document.addEventListener("lazyloaded", debouncedLayout);

    return () => {
      document.removeEventListener("lazyloaded", debouncedLayout);
    };
  });

  // Handle photo changes, refreshing the layout when photos change
  $: if (grid && photos) {
    (async () => {
      await tick();
      imagesLoaded(grid, () => {
        if (msnry) {
          msnry.reloadItems();
          msnry.layout();
        }
        
        // Re-initialize hover effects and observe new items
        initializeHover(grid);
        
        const gridItems = grid.querySelectorAll(".grid-item");
        gridItems.forEach((item) => {
          if (!item.classList.contains("in-view")) {
            observer.observe(item);
          }
        });
      });
    })();
  }

  // Clean up when component is destroyed
  onDestroy(() => {
    if (msnry) msnry.destroy();
    if (lightbox) lightbox.destroy();
    if (observer) observer.disconnect();
    document.removeEventListener("lazyloaded", debouncedLayout);
  });

  const debouncedLayout = debounce(() => {
    if (msnry) msnry.layout();
  }, 200);
</script>

<div class="grid" bind:this={grid}>
  <div class="gutter-sizer"></div>
  {#each photos as photo (photo.photo_id)}
    <a
      href={`https://static.billatkinson.us/src/src-${photo.photo_id}_Image.jpg`}
      data-pswp-src={`https://static.billatkinson.us/srclg/srclg-${photo.photo_id}_Image.webp`}
      data-pswp-width={photo.width}
      data-pswp-height={photo.height}
      style="aspect-ratio: {photo.width} / {photo.height};"
      class="grid-item"
      aria-label={`View photo: ${photo.photo_title}`}
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
          <span class="p-location"><br class="sp" />{photo.photo_location}</span>
          <span class="p-year">({photo.photo_year})</span>
        </div>
      </div>
    </a>
  {/each}
</div>

<style>
  .grid {
    width: 100%;
    contain: layout style;
  }

  .gutter-sizer {
    width: 1%;
  }

  .grid-item img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
    transform-origin: center;
    will-change: transform;
    transition: transform 0.3s ease-out;
  }

  :global(.grid-item img.scaled) {
    transform: scale(1.05);
  }

  .grid-item {
    width: 24.25%;
    margin-bottom: 1%;
    transition:
      transform 0.6s ease-in-out,
      opacity 0.6s ease-in-out;
    will-change: transform, opacity;
    opacity: 0;
    transform: translateY(20%);
    overflow: hidden;
    border-radius: 1rem;
    position: relative;
  }

  :global(.grid-item.in-view) {
    opacity: 1;
    transform: translateY(0);
  }

  @media (min-width: 768px) and (max-width: 1279px) {
    .grid-item {
      width: 32.66%;
    }
  }

  @media (max-width: 767px) {
    .grid-item {
      width: 49.5%;
    }

    .p-dash {
      display: none;
    }
  }
</style>