<script lang="ts">
  import Autoplay from 'embla-carousel-autoplay'
  import emblaCarouselSvelte from 'embla-carousel-svelte'

  const widths: number[] = [750, 1080, 1366, 1880];
  const photoId: number[] = [1030, 1234, 1443];

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

  let plugins = [Autoplay()]
  let options = { loop: true }
</script>

<div class="embla" use:emblaCarouselSvelte="{{ options, plugins }}">
  <div class="embla__container">
    {#each photoId as id}
      <div class="embla__slide">
        <img
          srcset={generateSrcset(id, widths)}
          src={`https://static.billatkinson.us/srcsm/srcsm-${id}_Image.webp`}
          alt="Image {id}"
        />
      </div>
    {/each}
  </div>
</div>

<style>
  .embla {
    overflow: hidden;
  }
  .embla__container {
    display: flex;
  }
  .embla__slide {
    flex: 0 0 100%;
    min-width: 0;
  }
</style>