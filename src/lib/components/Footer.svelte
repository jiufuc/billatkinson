<script lang="ts">
  import type { FooterLink } from "$lib/types";

  const footerLinks: FooterLink[] = [
    { title: "Legacy Site", href: "/" },
    { title: "To Top", href: "#top" }
  ];

  const currentYear = new Date().getFullYear();
</script>

<footer class="site-footer container-fluid">
  <div class="site-footer__brand b-hero">
    <div class="b-hero__l">Bill</div>
    <div class="b-hero__m">Atkinson</div>
    <div class="b-hero__r">Photography</div>
  </div>

  <div class="site-footer__cph flex flex-wrap md:items-center md:justify-between">
    <div class="site-footer__copy order-2 md:order-0 mb-2 md:mb-0">
      {currentYear} © Bill Atkinson
    </div>
    <ul id="menu-footer-links" class="flex md:justify-end order-1 mb-2 md:mb-0">
      {#each footerLinks as link, i}
        <li class="menu-item {i === 0 ? 'mi-separated' : ''}">
          <a
            title={link.title}
            href={link.href}
            target={link.target ?? undefined}
            rel={link.target ? "noopener" : undefined}
            class="text-gray-700 hover:text-black"
          >
            {link.title}
          </a>
        </li>
      {/each}
    </ul>
  </div>
</footer>

<style>
  .site-footer {
    margin-top: 50px;
  }

  @media (min-width: 768px) {
    .site-footer {
      margin-top: 150px;
    }
  }

  .site-footer__brand {
    margin-bottom: 2em;
  }

  .site-footer__cph {
    padding-bottom: 1em;
  }

  @media (max-width: 767px) {
    .site-footer__cph > * {
      flex: 0 0 100%;
    }
  }

  .site-footer a:hover {
    color: #808080;
    transition: color 0.2s ease;
  }

  .mi-separated {
    display: flex;
    align-items: center;
  }

  .mi-separated:after {
    content: "|";
    margin-left: 1em;
    margin-right: 1em;
  }
</style>
