<script lang="ts">
  import Swiper from "$lib/components/Swiper.svelte";
  import { generateSrcset } from "$lib/utils";
  import { fly } from "svelte/transition";
  import { expoOut } from "svelte/easing";
  import { onMount } from "svelte";

  let show = false;
  const photoIds = [1030, 1234, 1443, 1630, 1997, 2005, 2118];
  const widths = [750, 1080, 1366, 1880, 2240, 3000];

  onMount(() => {
    show = true;
  });
</script>

{#if show}
  <section
    class="section-headline"
    in:fly={{ y: 60, duration: 1500, opacity: 1, easing: expoOut }}
  >
    <h4>Over 900 color photographs celebrating the beauty of nature.</h4>
  </section>

  <Swiper 
    {photoIds}
    {widths}
    {generateSrcset}
    transitionSpeed={3000}
    autoplayDelay={6000}
    aspectRatio="7/5"
  />
{/if}

<style>
  .section-headline {
    position: relative;
    width: 100%;
    text-align: center;
    padding: 60px 25px 120px;
  }

  .section-headline h4 {
    font-family: "New York";
    font-weight: 400;
  }
</style>
