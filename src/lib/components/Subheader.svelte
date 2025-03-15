<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";

  type MenuItem = {
    path: string;
    label: string;
  };

  const menuItems: MenuItem[] = [
    { path: "/", label: "Home" },
    { path: "/gallery", label: "Gallery" },
    { path: "/prints", label: "Prints" },
    { path: "/about", label: "About" },
    { path: "/contact", label: "Contact" },
  ];

  $: currentPath = $page.url.pathname;

  let isSticky = false;

  onMount(() => {
    const sentinel = document.getElementById("sticky-sentinel");
    const subheader = document.querySelector(".site-subheader");

    if (sentinel && subheader) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const shouldBeSticky = entry.intersectionRatio < 1;
            isSticky = shouldBeSticky;
            if (shouldBeSticky) {
              subheader.classList.add("sticky-active");
            } else {
              subheader.classList.remove("sticky-active");
            }
          });
        },
        { threshold: 1.0 }
      );

      observer.observe(sentinel);
    }
  });

  function topFunction() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
</script>

<div id="sticky-sentinel"></div>
<div class="site-subheader container-fluid">
  <a href="/" class="mini-logo">
    <div class="mini-logo__a">Bill</div>
    <div class="mini-logo__d">Atkinson</div>
    <div class="mini-logo__s">Photography</div>
  </a>
  <nav class="main-nav">
    <ul class="nav">
      {#each menuItems as item}
        <li
          class="menu-item {item.label.toLowerCase()} {currentPath === item.path
            ? 'active'
            : ''}"
        >
          <a
            href={item.path}
            aria-current={currentPath === item.path ? "page" : undefined}
            class="nav-link"
          >
            {item.label}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
  <button on:click={topFunction} id="toTop" title="Go to top" class:show={isSticky}>
    Top
  </button>
</div>

<style>
  .site-subheader {
    position: sticky;
    z-index: 990;
    top: 0;
    display: flex;
    justify-content: flex-end;
    padding-top: 0.333em;
    padding-bottom: 0.333em;
    background-color: transparent;
  }
  
  .site-subheader.sticky-active {
    background-color: white;
    opacity: 1;
    transition: background-color 0.3s ease;
  }

  .main-nav a.nav-link:after {
    content: "";
    display: block;
    border-top: 0.16667em solid #000;
    opacity: 0;
    transform: scaleX(0);
    transition:
      transform 0.2s ease-in-out,
      opacity 0.2s linear;
  }

  .main-nav a.nav-link:hover:after,
  .main-nav li.active a:after {
    transform: scaleX(0.65);
    opacity: 1;
  }
  
  .nav {
    display: flex;
    flex-wrap: wrap;
    margin-right: -0.6em;
    list-style: none;
  }

  .nav-link {
    display: block;
    padding: 0.5em 0.6em;
  }
  
  .mini-logo {
    visibility: visible;
    opacity: 1;
    display: flex;
    font-size: 22px;
    gap: 0.5rem;
    margin-right: auto;
  }
  
  @media (max-width: 383px) {
    .mini-logo {
      display: none;
    }
  }
  
  @media (min-width: 992px) {
    .mini-logo {
      font-size: 30px;
    }
  }
  
  .mini-logo > div {
    opacity: 0;
    transform: translateX(-3rem);
    transition: all 0.3s ease-in;
  }
  
  :global(.site-subheader.sticky-active) .mini-logo__a {
    opacity: 1;
    transform: translateX(0);
    transition-delay: 0.3s;
  }
  
  :global(.site-subheader.sticky-active) .mini-logo__d {
    opacity: 1;
    transform: translateX(0);
    transition-delay: 0.2s;
  }
  
  :global(.site-subheader.sticky-active) .mini-logo__s {
    opacity: 1;
    transform: translateX(0);
    transition-delay: 0.1s;
  }
  
  #toTop {
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 99;
    background-color: rgba(125, 125, 125, 0.85);
    color: white;
    cursor: pointer;
    padding: 25px;
    border-radius: 50%;
    font-size: 18px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0s 0.3s;
  }
  
  #toTop.show {
    opacity: 1;
    visibility: visible;
    transition: opacity 0.3s ease, visibility 0s 0s, background-color 0.3s ease;
  }
  
  #toTop:hover {
    background-color: rgba(155, 155, 155, 1);
  }
  
  #sticky-sentinel {
    height: 1px;
    width: 100%;
  }
</style>