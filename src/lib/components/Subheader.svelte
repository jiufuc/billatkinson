<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { get } from "svelte/store";

  // Define the structure of each menu item
  type MenuItem = {
    path: string;
    label: string;
  };

  // Navigation items
  const menuItems: MenuItem[] = [
    { path: "/", label: "Home" },
    { path: "/gallery", label: "Gallery" },
    { path: "/prints", label: "Prints" },
    { path: "/about", label: "About" },
    { path: "/contact", label: "Contact" }
  ];

  // Get current path from SvelteKit's store
  let currentPath: string = get(page).url.pathname;

  onMount(() => {
    const sentinel = document.getElementById("sticky-sentinel");
    const subheader = document.querySelector(".site-subheader");

    if (sentinel && subheader) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.intersectionRatio < 1) {
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

    const setActiveLink = () => {
      currentPath = window.location.pathname;
    };

    setActiveLink();
    window.addEventListener("popstate", setActiveLink);
  });
</script>

<div id="sticky-sentinel"></div>
<div class="site-subheader container-fluid">
  <nav id="main-nav" class="main-nav">
    <ul id="menu-main-menu" class="nav nav--left">
      {#each menuItems as item}
        <li class="menu-item {item.label.toLowerCase()} {currentPath === item.path ? 'active' : ''}">
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
  <a href="/" class="mini-logo">
    <div class="mini-logo__a">B</div>
    <div class="mini-logo__d">—</div>
    <div class="mini-logo__s">A</div>
  </a>
</div>

<style>
  .main-nav a.nav-link:after {
    content: "";
    display: block;
    border-top: 0.16667em solid #000;
    opacity: 0;
    transform: scaleX(0);
    transition: transform 0.2s ease-in-out, opacity 0.2s linear;
  }

  .main-nav a.nav-link:hover {
    color: inherit;
    opacity: 1;
  }

  .main-nav a.nav-link:hover:after,
  .main-nav li.active a:after {
    transform: scaleX(0.65);
    opacity: 1;
  }

  .mini-logo {
    visibility: visible;
    opacity: 1;
    display: flex;
    font-size: 23px;
  }

  @media (max-width: 374px) {
    .mini-logo {
      display: none;
    }
  }

  @media (min-width: 992px) {
    .mini-logo {
      font-size: 30px;
    }
  }

  .mini-logo:hover {
    text-decoration: none;
  }

  .mini-logo > div {
    padding: 0 0.15em;
  }

  .nav--left {
    margin-left: -0.6em;
  }

  .nav {
    display: flex;
    flex-wrap: wrap;
    padding-left: 0;
    margin-bottom: 0;
    list-style: none;
  }

  .nav-link {
    display: block;
    padding: 0.5em 0.6em;
  }

  .nav-link:focus,
  .nav-link:hover {
    text-decoration: none;
  }

  #sticky-sentinel {
    height: 1px;
    width: 100%;
  }

  .mini-logo > div {
    opacity: 0;
    transform: translateX(20px);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .site-subheader {
    position: sticky;
    z-index: 990;
    top: 0;
    display: flex;
    justify-content: space-between;
    padding-top: 0.333em;
    padding-bottom: 0.333em;
    background-color: transparent;
  }

  .site-subheader.sticky-active {
    background-color: white;
    opacity: 1;
    transition: background-color 0.3s ease;
  }

  .site-subheader.sticky-active .mini-logo__a {
    opacity: 1;
    transform: translateX(0);
    transition-delay: 0.1s;
  }

  .site-subheader.sticky-active .mini-logo__d {
    opacity: 1;
    transform: translateX(0);
    transition-delay: 0.2s;
  }

  .site-subheader.sticky-active .mini-logo__s {
    opacity: 1;
    transform: translateX(0);
    transition-delay: 0.3s;
  }
</style>
