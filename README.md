# blog-layout

The MSP Launchpad blog reading layout (layout v3 + the FAQ accordion), served to every blog post through jsDelivr from the
Blog Posts template page of each site.

## What is here

| File | What |
|---|---|
| `blog-layout.css` | `src/faq-accordion.css` + `src/layout-v3.css`, in that order (generated, do not hand-edit) |
| `blog-layout.js` | `src/faq-accordion.js` + `src/layout-v3.js`, in that order (generated, do not hand-edit) |
| `src/` | the four source files as reviewed on localhost (copies of the EA repo's `projects/blog-infographics/preview/assets/`) |

Source of truth for edits: the EA repo, `projects/blog-infographics/preview/assets/`. Rebuild with
`node projects/blog-infographics/webflow/build_layout_bundle.mjs --out <this clone>`; `test/bundle.test.mjs` there guards the
committed `webflow/dist/` copies against staleness. The first line of each bundle carries the version it was built as.

## How a site loads it (once, in the Designer)

Two lines on the **Blog Posts template page**, before `</body>`, after the Refokus rich-text-enhancer line
(the paste file: EA repo `projects/blog-infographics/webflow/blog-template-paste.html`):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/MSPLaunchpadTeam/blog-layout@3/blog-layout.css">
<script src="https://cdn.jsdelivr.net/gh/MSPLaunchpadTeam/blog-layout@3/blog-layout.js" defer></script>
```

`@3` is the jsDelivr **major range**: it resolves to the newest `3.x.y` tag, so a release never touches a site.
Nothing goes into a post: Webflow's rich-text editor strips embeds, `<div>` wrappers and inline styles the first time
someone saves the post in the Designer / Editor (measured 2026-09-07 on the Allied Sandbox), which is why v3.1 rebuilds the
TL;DR card and the offer card from plain markup and why the per-post embed of v3.0 was retired.

## What the script derives from the page (no knob needed)

- **Accent**: the site's own Webflow variable `--primary-1` (`blog-layout.css` reads it: `--mspl-accent: var(--primary-1, #e33b40)`);
  a site without it gets the colour of its own button; the source is recorded in `data-mspl-accent` on the rich text.
- **Brand line** under a table block: `og:site_name` + the page host.
- **TL;DR / offer cards**: rebuilt when their wrappers are gone, on a post the pipeline wrote (a kept `data-mspl-label`), never on an older post.

## The knob (`window.MSPL_LAYOUT`, optional, set BEFORE the script)

- `structured`: `'table' | 'cards' | { points: 'table' | 'cards', list: 'cards' | 'table' }` - default: H3 ladders as a table, bullet lists as tiles
- `kicker`: `true | false` - the "N KEY POINTS" pill (off by default)
- `footer`: `true | false` - the brand line (default: on a table only)
- `brand`: `{ name, site, url }` - overrides the page-derived brand line

CSS knobs are the variables at the top of `blog-layout.css` (`--mspl-accent`, `--mspl-measure`, ...). A per-site accent
override, if a site's `--primary-1` is not the colour wanted: one line before the stylesheet, `<style>:root{--mspl-accent:#0f766e}</style>`.

## Release recipe (the team edits ONE place)

1. Edit the sources in the EA repo (`preview/assets/`), run the tests there (`node --test "projects/blog-infographics/test/*.test.mjs"`), look at the localhost preview.
2. Bump `VERSION` in `projects/blog-infographics/webflow/build_layout_bundle.mjs`, run it (dist + paste), then `--out <this clone>` and copy the four sources into `src/`.
3. Commit, tag `v<VERSION>`, `git push && git push --tags`.
4. Check `https://cdn.jsdelivr.net/gh/MSPLaunchpadTeam/blog-layout@3/blog-layout.js` serves the new first line (the range re-resolves within hours; the exact tag URL is immediate).

jsDelivr caches an exact tag permanently: never move or delete a published tag; cut a new one. Keep every 3.x release
backward-compatible (same markup contract) because every site on `@3` picks it up without a re-paste; a breaking change is a `v4`
and a new paste.

## Versions

- `v3.1.0` (2026-09-07) - editor-proof: the TL;DR + offer cards rebuilt from plain markup after a Designer save; accent = the site's `--primary-1` (button-colour fallback); loaded from the template on the `@3` range.
- `v3.0.0` (2026-09-07) - layout v3 after review round 6g (approved by Thanh 2026-09-07) + the FAQ accordion; per-post embed (retired).
