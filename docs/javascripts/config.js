/**
 * Edit UI Configuration
 * 
 * Set EDIT_API_ENDPOINT to your Cloudflare Worker URL to enable anonymous edit suggestions.
 * If not set, only the "Edit on GitHub" button will be available.
 * 
 * Example:
 * window.EDIT_API_ENDPOINT = 'https://dnd-compendium-edit-api.your-subdomain.workers.dev';
 */

// Leave empty to disable anonymous edits (only GitHub edit button will show)
// Uncomment and set to your worker URL after deploying:
// window.EDIT_API_ENDPOINT = 'https://your-worker-url.workers.dev';

window.EDIT_API_ENDPOINT = null;

// Remove the homepage entry from the sidebar navigation
document.addEventListener("DOMContentLoaded", () => {
  const siteName = document.querySelector(".md-header__title")?.textContent?.trim();
  document.querySelectorAll(".md-nav__link").forEach((link) => {
    const text = link.textContent.trim();
    if (siteName && text === siteName) {
      const item = link.closest(".md-nav__item");
      if (item) {
        item.remove();
      }
    }
  });
});

// Add a "Random" button next to the search control in the header
document.addEventListener("DOMContentLoaded", () => {
  const headerOptions = document.querySelector(".md-header__inner .md-header__options");
  if (!headerOptions || headerOptions.querySelector(".random-article-button")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "md-header__button random-article-button";
  button.setAttribute("aria-label", "Random article");
  button.textContent = "Random";

  let docs = [];
  const getDocs = async () => {
    if (docs.length) return docs;
    try {
      const resp = await fetch(new URL("search/search_index.json", window.location.origin), {
        cache: "no-store",
      });
      const json = await resp.json();
      docs =
        (json?.docs || []).filter(
          (d) =>
            d.location &&
            d.location !== "index.html" &&
            !d.location.startsWith("search/") &&
            !d.location.includes("404.html")
        ) || [];
    } catch (e) {
      console.warn("Random article: failed to load search index", e);
    }
    return docs;
  };

  button.addEventListener("click", async () => {
    const list = await getDocs();
    if (!list.length) return;
    const choice = list[Math.floor(Math.random() * list.length)];
    const target = new URL(choice.location, window.location.origin);
    window.location.href = target.toString();
  });

  const searchControl = headerOptions.querySelector("[data-md-component='search']");
  headerOptions.insertBefore(button, searchControl || headerOptions.firstChild);
});

// Make section titles click through to their index page when one exists,
// while keeping the expand/collapse toggle behavior.
document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".md-nav__item--nested");
  sections.forEach((section) => {
    const label = section.querySelector(":scope > input + label.md-nav__link");
    const nav = section.querySelector(":scope > nav");
    if (!label || !nav) return;

    const titleText = label.textContent.trim();
    const indexLink = nav.querySelector(":scope > ul > li > a.md-nav__link");
    if (!indexLink) return;

    const indexText = indexLink.textContent.trim();
    if (indexText !== titleText) return;

    // Remove the index entry from the child list
    const indexLi = indexLink.closest("li");
    if (indexLi) indexLi.remove();

    const titleSpan = label.querySelector(".md-ellipsis");
    if (!titleSpan) return;

    const anchor = document.createElement("a");
    anchor.href = indexLink.href;
    anchor.textContent = titleSpan.textContent;
    anchor.className = "section-index-link";
    anchor.addEventListener("click", (ev) => ev.stopPropagation());

    titleSpan.replaceWith(anchor);

    // If we are on this index page, mirror the active state
    try {
      const indexPath = new URL(indexLink.href, window.location.href).pathname.replace(/index\.html$/, "");
      const currentPath = window.location.pathname.replace(/index\.html$/, "");
      if (currentPath === indexPath) {
        anchor.classList.add("md-nav__link--active");
        anchor.setAttribute("aria-current", "page");
        // Ensure its parent section is expanded
        const toggle = section.querySelector(":scope > input.md-nav__toggle");
        if (toggle) toggle.checked = true;
      }
    } catch (e) {
      /* ignore URL parsing issues */
    }
  });
});
