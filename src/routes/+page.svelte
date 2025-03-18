<script lang="ts">
  import HeroSlider from "$lib/components/HeroSlider.svelte";
  import { fly } from "svelte/transition";
  import { expoOut } from "svelte/easing";
  import { onMount } from "svelte";

  let show = false;

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

  <HeroSlider />
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
