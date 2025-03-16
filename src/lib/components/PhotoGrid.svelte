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

  const widths: number[] = [320, 480, 640, 720, 880, 1024];

  function generateSrcset(photoId: number, widths: number[]): string {
    const zone = "https://static.billatkinson.us";
    const sourceImage = `srcsm/srcsm-${photoId}_Image.webp`;
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
          pswpModule: () => import("photoswipe"),
          gallery: ".grid",
          children: "a.grid-item",
          initialZoomLevel: "fit",
          secondaryZoomLevel: "fill",
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
  }

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

    grid.querySelectorAll(".grid-item").forEach((item) => {
      item.addEventListener("mouseenter", handleMouseEnter as EventListener);
      item.addEventListener("mousemove", handleMouseMove as EventListener);
      item.addEventListener("mouseleave", handleMouseLeave as EventListener);
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

  $: if (grid && photos) {
    (async () => {
      await tick();
      imagesLoaded(grid, () => {
        if (msnry) {
          msnry.reloadItems();
          msnry.layout();
        }
        initializeHover(grid);
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
  });
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
          <span class="p-location"><br class="sp" />{photo.photo_location}</span
          >
          <span class="p-year">({photo.photo_year})</span>
        </div>
      </div>
    </a>
  {/each}
</div>

<style>
  .grid {
    width: 100%;
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
