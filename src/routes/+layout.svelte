<script lang="ts">
	import '../app.css';
  import { Header, Subheader, Footer} from "$lib/index";
	let { children } = $props();
</script>

<main>
  <Header />
  <Subheader />
  {@render children()}
  <Footer />
</main>