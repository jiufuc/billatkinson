<script lang="ts">
  import Swiper from "$lib/components/Swiper.svelte";
  import { generateSrcset, viewport } from "$lib/utils";
  import { fly, fade } from "svelte/transition";
  import { expoOut } from "svelte/easing";

  const photoIds = [1030, 1234, 1443, 1630, 1997, 2005, 2118];
  const widths = [750, 1080, 1366, 1880, 2240, 3000];
  
  let headlineVisible = false;
  let swiperVisible = false;
</script>

<section class="section-headline" 
  use:viewport={{
    onEnter: () => headlineVisible = true,
    onExit: () => headlineVisible = false
  }}>
  
  {#if headlineVisible}
    <h4 in:fly={{ y: 60, duration: 1500, opacity: 0, easing: expoOut }}>
      Over 900 color photographs celebrating the beauty of nature.
    </h4>
  {/if}
</section>

<div use:viewport={{
    onEnter: () => swiperVisible = true,
    onExit: () => swiperVisible = false
  }}>
  
  {#if swiperVisible}
    <div in:fade={{ duration: 1000 }}>
      <Swiper
        photoIds={photoIds}
        widths={widths}
        generateSrcset={generateSrcset}
        transitionSpeed={3000}
        autoplayDelay={6000}
      />
    </div>
  {/if}
</div>

<style>
  .section-headline {
    position: relative;
    width: 100%;
    text-align: center;
    padding: 60px 25px 120px;
  }

  h4 {
    font-family: "New York";
    font-weight: 400;
  }
</style>