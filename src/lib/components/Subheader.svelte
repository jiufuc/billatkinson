<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { fade, fly } from "svelte/transition";
  import { isStickyStore } from "$lib/stores";

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

  const currentPath = $derived(page.url.pathname);
  let isSticky = $state(false);
  let isMenuOpen = $state(false);

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  onMount(() => {
    const sentinel = document.getElementById("sticky-sentinel");
    const subheader = document.querySelector(".site-subheader");

    if (sentinel && subheader) {
      const observer = new IntersectionObserver(
        (entries) => {
          const shouldBeSticky = entries[0].intersectionRatio < 1;
          isStickyStore.set(shouldBeSticky);
          isSticky = shouldBeSticky;
          if (shouldBeSticky) {
            subheader.classList.add("sticky-active");
          } else {
            subheader.classList.remove("sticky-active");
            isMenuOpen = false;
          }
        },
        { threshold: 1 }
      );

      observer.observe(sentinel);
    }

    function handleClickOutside(event: MouseEvent) {
      const menu = document.querySelector(".main-nav.mobile");
      const hamburger = document.querySelector(".hamburger");

      if (
        isMenuOpen &&
        menu &&
        hamburger &&
        !menu.contains(event.target as Node) &&
        !hamburger.contains(event.target as Node)
      ) {
        isMenuOpen = false;
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  });

  function topFunction() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
</script>

<div id="sticky-sentinel"></div>

<div class="site-subheader container-fluid">
  {#if isSticky}
    <a
      href="/"
      class="mini-logo"
      in:fade={{ duration: 300 }}
      out:fly={{ y: -90, duration: 200 }}
    >
      <div class="mini-logo__a" in:fly={{ x: -30, duration: 300, delay: 300 }}>
        Bill
      </div>
      <div class="mini-logo__d" in:fly={{ x: -30, duration: 300, delay: 200 }}>
        Atkinson
      </div>
      <div class="mini-logo__s" in:fly={{ x: -30, duration: 300, delay: 100 }}>
        Photography
      </div>
    </a>
  {/if}

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

  {#if isSticky}
    <button
      class="hamburger"
      onclick={toggleMenu}
      aria-label="Toggle mobile menu"
    >
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
    </button>
  {/if}

  {#if isMenuOpen}
    <nav class="main-nav mobile" transition:fade={{ duration: 200 }}>
      <ul class="nav">
        {#each menuItems as item}
          <li
            class="menu-item {item.label.toLowerCase()} {currentPath ===
            item.path
              ? 'active'
              : ''}"
          >
            <a
              href={item.path}
              aria-current={currentPath === item.path ? "page" : undefined}
              class="nav-link"
              onclick={() => (isMenuOpen = false)}
            >
              {item.label}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  {/if}

  {#if isSticky}
    <button
      onclick={topFunction}
      id="toTop"
      title="Go to top"
      transition:fade={{ duration: 200 }}
    >
      <svg
        width="24"
        height="24"
        xmlns="http://www.w3.org/2000/svg"
        fill-rule="evenodd"
        clip-rule="evenodd"
        ><path
          d="M11 2.206l-6.235 7.528-.765-.645 7.521-9 7.479 9-.764.646-6.236-7.53v21.884h-1v-21.883z"
        /></svg
      >
      <span class="sr-only">Back to top</span>
    </button>
  {/if}
</div>

<style>
  .site-subheader {
    position: sticky;
    z-index: 999;
    top: 0;
    display: flex;
    align-items: center;
    height: 4rem;
    background-color: transparent;
  }

  .site-subheader.sticky-active {
    background-color: #f9f4f1;
    justify-content: center;
    transition: background-color 0.3s ease;
  }

  .main-nav {
    position: absolute;
    display: flex;
    right: 1rem;
  }

  .main-nav a.nav-link:after {
    content: "";
    display: block;
    border-top: 0.15em solid rgba(52, 38, 22);
    opacity: 0;
    transform: scaleX(0);
    transition:
      transform 0.2s ease-in-out,
      opacity 0.2s linear;
  }

  .main-nav a.nav-link:hover:after,
  .main-nav li.active a:after {
    transform: scaleX(0.65);
    opacity: 0.65;
  }

  .nav {
    display: flex;
    flex-wrap: wrap;
    list-style: none;
  }

  .nav-link {
    display: block;
    padding: 0.5em 0.6em;
  }

  .hamburger {
    display: none;
    background: transparent;
    border: none;
    flex-direction: column;
    justify-content: space-around;
    width: 30px;
    height: 24px;
    padding: 0;
    cursor: pointer;
  }

  .hamburger .bar {
    width: 100%;
    height: 3px;
    background-color: black;
    transition: all 0.3s;
  }

  @media (max-width: 767px) {
    :global(.site-subheader.sticky-active .main-nav) {
      display: none;
    }

    .hamburger {
      position: absolute;
      display: flex;
      right: 1rem;
    }

    .main-nav {
      justify-content: center;
      width: 100%;
    }

    .main-nav.mobile {
      position: absolute;
      display: block;
      top: 100%;
      right: 0;
      padding: 1rem;
      background: white;
      min-width: 40%;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      border-radius: 0 0 15px 15px;
      font-size: 18px;
    }

    .main-nav.mobile .nav {
      flex-direction: column;
      align-items: center;
    }

    .main-nav.mobile .nav-link {
      padding: 0.75em 1em;
      width: 100%;
    }
  }

  .mini-logo {
    position: absolute;
    display: flex;
    left: 1rem;
    font-size: 22px;
    gap: 0.5rem;
  }

  @media (min-width: 992px) {
    .mini-logo {
      font-size: 30px;
    }
  }

  #toTop {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 999;
    background-color: rgba(185, 183, 181, 0.85);
    cursor: pointer;
    padding: 1rem;
    border-radius: 50%;
    transition: background-color 0.3s ease;
  }

  #toTop:hover {
    background-color: rgba(215, 213, 211, 1);
  }

  #sticky-sentinel {
    height: 1px;
    width: 100%;
  }
</style>
