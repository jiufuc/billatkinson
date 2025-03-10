<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<main>
  <div class="nav">
    <a href='/' aria-label="none">Home</a>
    <a href='/gallery' aria-label="none">Gallery</a>
  </div>
  {@render children()}
</main>

<style>
  .nav {
    height: 80px;
  }
  a {
    padding-left: 40px;
    line-height: 80px;
  }
</style>