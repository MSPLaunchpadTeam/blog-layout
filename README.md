# blog-layout

The MSP Launchpad blog reading layout (layout v3 + the FAQ accordion), served to every blog post through jsDelivr from the
Blog Posts template page of each site.

## What is here

| File | What |
|---|---|
| `blog-layout.css` | `src/faq-accordion.css` + `src/layout-v3.css`, in that order (generated, do not hand-edit) |
| `blog-layout.js` | `src/tokens.js` + `src/faq-accordion.js` + `src/layout-v3.js`, in that order (generated, do not hand-edit) |
| `src/` | the five source files as reviewed on localhost (copies of the EA repo's `projects/blog-infographics/preview/assets/`) |

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
No `integrity=` hash on purpose: a range URL changes content with every release, and an SRI hash would break the page
at the first release. A site that wants SRI pins an exact tag (`@v3.1.0`) and adds the hash, at the cost of a re-paste per release.
Nothing goes into a post: Webflow's rich-text editor strips embeds, `<div>` wrappers and inline styles the first time
someone saves the post in the Designer / Editor (measured 2026-09-07 on the Allied Sandbox), which is why v3.1 rebuilds the
TL;DR card and the offer card from plain markup and why the per-post embed of v3.0 was retired.

## What the script derives from the page (no knob needed)

- **Accent**: the site's own Webflow variable `--primary-1` (`blog-layout.css` reads it: `--mspl-accent: var(--primary-1, #e33b40)`);
  a site without it gets the colour of its own button; the source is recorded in `data-mspl-accent` on the rich text.
- **Brand line** under a table block: `og:site_name` (no website URL).
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
2. Bump `VERSION` in `projects/blog-infographics/webflow/build_layout_bundle.mjs`, run it (dist + paste), then `--out <this clone>` and copy the five sources into `src/`.
3. Commit, tag `v<VERSION>`, `git push && git push --tags`.
4. Check `https://cdn.jsdelivr.net/gh/MSPLaunchpadTeam/blog-layout@3/blog-layout.js` serves the new first line (the range re-resolves within hours; the exact tag URL is immediate).

jsDelivr caches an exact tag permanently: never move or delete a published tag; cut a new one. Keep every 3.x release
backward-compatible (same markup contract) because every site on `@3` picks it up without a re-paste; a breaking change is a `v4`
and a new paste.

## Sandbox candidates

rc.13 matches section-opening paragraph colour to ordinary body copy and displays
the main image at intrinsic proportions. It retains rc.12 token conversion and
all FAQ/layout interactions. Use immutable candidate URLs only; no stable tag.
The generation pipeline's 1200×630 JPEG contract and the two article repairs are
documented in EA `RC13-RELEASE.md`. New main artwork is pending separate paid-call
approval; existing thumbnails and body images remain unchanged. Rollback is the
rc.12 asset pair at `571fae9750ccf109b8b4d8f448ccabac4aaa3985`, without Refokus.

rc.12 includes the class-token conversion used by the sandbox. Install an immutable
commit URL for both assets, then remove only its Refokus rich-text-enhancer script.
Do not apply that removal to stable `@3`: its v3.1.0 bundle still needs Refokus.
Candidates are branch commits, with no stable tag push. Retain the complete prior
footer code (rc.11 assets plus Refokus) for rollback. See EA `RC12-RELEASE.md`.

Sandbox rc.12 is staging-published at immutable asset commit
`571fae9750ccf109b8b4d8f448ccabac4aaa3985`; both CDN files are byte-verified.
Read-only audit covers 63 staged CMS records (9 drafts), 55 live records and all
55 public pages. Only class tokens occur; 118 body comparisons match actual
Refokus output exactly. 333 Node and 227 offline Python checks pass. Saved template
settings and published article/image/unrelated-script preservation pass.
Actual 1440/390/320 screenshots and CTA, FAQ, contents, image zoom and native menu
checks are recorded in EA `RC12-RELEASE.md`, with screenshots under
`preview/out/shots/rc12/`. MSP Company's pre-existing mobile overflow and the
existing hidden Sources panels remain unchanged. Rollback is rc.11 at
`9a3b81f01befcc426210d972affe579178758774` plus
`<script src="https://tools.refokus.com/rich-text-enhancer/bundle.v1.0.0.js"></script>`.

## Versions

- `3.2.0-rc.13` (2026-09-09, candidate branch only) - section-opening paragraphs match body typography; hero keeps intrinsic image proportions. No stable `@3` promotion.

- `3.2.0-rc.12` (2026-09-09, candidate branch only) - owned paired class-token conversion before FAQ/layout, including legacy nested button/icon classes. Preserves existing elements and handlers, no duplicate spans or Webflow/IX2 resets. Immutable sandbox candidate only; rc.11 plus Refokus is rollback. No CSS behavior changes or stable `@3` promotion.
- `3.2.0-rc.11` (2026-09-09, candidate branch only) - approved localhost presentation: full CMS biography and author-story link, body-sized section introductions, narrower table number/H3 columns, white deliberate callouts outside CTA sections, and responsive suppression of bold in single-line bullets using less than 70% of text width. Original bullet layout and accessible contents/FAQ/enlargement retained; zoom supports AVIF infographic delivery. Sandbox immutable commit only; rc.10 remains rollback and stable `@3` is unchanged.
- `3.2.0-rc.10` (2026-09-09, candidate branch only) - PNG enlargement dialog with fit/actual size, panning and keyboard controls; collapsed mobile contents list; explicit `data-mspl-role="callout"` paragraphs only; expandable first-sentence CMS author biography. Native bold remains as authored; no automatic percentage/currency highlighting. Immutable commit pin on sandbox only; rc.9 remains rollback and stable `@3` is unchanged.
- `3.2.0-rc.6` (2026-09-08, candidate branch only) - Sources use ordinary bullets without underlines or row dividers, while retaining the card border and closed default. Only the final FAQ item's bottom divider is removed.
- `3.2.0-rc.5` (2026-09-08, candidate branch only) - blog corners follow native site buttons; centred stacked CTA; clean Sources typography with closed default; list introductions stay plain and only ordered steps get connected rails. Images require matching artwork from the generation pipeline.
- `3.2.0-rc.4` (2026-09-08, candidate branch only) - “In short” summary label; visible “What we're covering:” title; fixed-colour CTA buttons lift slightly on hover without underlining; readable, initially expanded Sources panel. Native author content comes from each site's selected CMS author record.
- `3.2.0-rc.3` (2026-09-08, candidate branch only) - empty optional CMS embeds no longer create blank space before the native author box.
- `3.2.0-rc.2` (2026-09-08, candidate branch only) - table credits omit website URLs; offer button colours stay fixed on hover; Sources count references instead of supporting prose. Supersedes rc.1 on sandbox only.
- `3.2.0-rc.1` (2026-09-08, candidate branch only) - explicit native content markers preserve table rows, list treatments, summary, offers and renamed FAQ sections through text edits; current-heading contents links; accessible unique FAQ IDs and mobile wrapping. Install using an immutable commit URL on the Allied Sandbox only. No stable tag: actual Webflow editor/save/publish and second-save marker survival must pass before release. `v3.1.0` remains the rollback release and the shared `@3` target.
- `v3.1.0` (2026-09-07) - editor-proof: the TL;DR + offer cards rebuilt from plain markup after a Designer save; accent = the site's `--primary-1` (button-colour fallback); loaded from the template on the `@3` range.
- `v3.0.0` (2026-09-07) - layout v3 after review round 6g (approved by Thanh 2026-09-07) + the FAQ accordion; per-post embed (retired).
