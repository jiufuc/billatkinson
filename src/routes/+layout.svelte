<script lang="ts">
	import '../app.css';
  import { Header, Subheader, Footer} from "$lib/index";
	let { children } = $props();
</script>

<Header />
<Subheader />
  <div class="wrap">
    <main class="main container-fluid">
      {@render children()}
    </main>
  </div>
<Footer />