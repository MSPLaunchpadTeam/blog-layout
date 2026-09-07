# blog-layout

The MSP Launchpad blog reading layout (layout v3 + the FAQ accordion), served to every blog post through jsDelivr.

## What is here

| File | What |
|---|---|
| `blog-layout.css` | `src/faq-accordion.css` + `src/layout-v3.css`, in that order (generated, do not hand-edit) |
| `blog-layout.js` | `src/faq-accordion.js` + `src/layout-v3.js`, in that order (generated, do not hand-edit) |
| `src/` | the four source files as reviewed on localhost (copies of the EA repo's `projects/blog-infographics/preview/assets/`) |

Source of truth for edits: the EA repo, `projects/blog-infographics/preview/assets/`. Rebuild with
`node projects/blog-infographics/webflow/build_layout_bundle.mjs --out <this clone>`; `test/bundle.test.mjs` there guards the
committed `webflow/dist/` copies against staleness.

## How a post loads it

The n8n blog copy appends ONE thin custom-code block to the end of every post's rich text (the article itself stays plain H2/H3/P):

```html
<div class="w-embed w-script">
  <script>window.MSPL_LAYOUT={"kicker":false,"brand":{"name":"Client name","site":"client.com","url":"https://client.com"}};</script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/MSPLaunchpadTeam/blog-layout@v3.0.0/blog-layout.css">
  <script src="https://cdn.jsdelivr.net/gh/MSPLaunchpadTeam/blog-layout@v3.0.0/blog-layout.js" defer></script>
</div>
```

The base URL comes from the n8n Variable `BLOG_LAYOUT_BASE` (fallback: the constant in the `Layout - Embed` Code node).
The same three lines also work as a Blog Template page paste (before `</body>`, after the Refokus rich-text-enhancer line).

## The knob (`window.MSPL_LAYOUT`, set BEFORE the script)

- `structured`: `'table' | 'cards' | { points: 'table' | 'cards', list: 'cards' | 'table' }` - default: H3 ladders as a table, bullet lists as tiles
- `kicker`: `true | false` - the "N KEY POINTS" pill (off by default)
- `footer`: `true | false` - the brand line (default: on a table only)
- `brand`: `{ name, site, url }` - the values the brand line is drawn from (fallback: `og:site_name` + the page host)

CSS knobs are the variables at the top of `blog-layout.css` (`--mspl-accent`, `--mspl-measure`, ...). A per-client accent
override is one line before the stylesheet: `<style>:root{--mspl-accent:#0f766e}</style>`.

## Release recipe (the team edits ONE place)

1. Edit the sources in the EA repo (`preview/assets/`), run the tests there (`node --test "projects/blog-infographics/test/*.test.mjs"`), look at the localhost preview.
2. `node projects/blog-infographics/webflow/build_layout_bundle.mjs --out <this clone>` and copy the four sources into `src/`.
3. Commit, tag `vMAJOR.MINOR.PATCH`, `git push && git push --tags`.
4. Bump the n8n Variable `BLOG_LAYOUT_BASE` to `https://cdn.jsdelivr.net/gh/MSPLaunchpadTeam/blog-layout@<new tag>`.

jsDelivr caches a tag permanently: never move or delete a published tag; cut a new one. Existing posts keep the tag they were
published with (pinned, reproducible); new posts pick up the new tag from the variable.

## Versions

- `v3.0.0` (2026-09-07) - layout v3 after review round 6g (approved by Thanh 2026-09-07) + the FAQ accordion.
