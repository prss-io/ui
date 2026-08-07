# AGENTS.md — @prss/ui (PRSS Runtime Library)

The runtime that powers **PRSS themes**. It provides the data-access API themes
call (`PRSS.getProp`, `PRSS.getItems`, …) and the **block system** that turns
editor markup into rich components (Gallery, Hero, Accordion, …). Published to npm
as **`@prss/ui`**.

- **Package:** `@prss/ui`
- **Consumed by:** the PRSS app (loaded from a CDN at build/preview time and
  exposed as the global `PRSS`) and by every PRSS theme (as the webpack external
  `@prss/ui` → `PRSS`).

## How it fits

```
PRSS app ──loads──► @prss/ui/build/index.js  (window.PRSS)
     │                              ▲
     │ server-side builds a site    │ themes call PRSS.* and are compiled with
     ▼ with a theme                 │ @prss/ui as an external (never bundled)
theme/build/<template>.js (PRSSComponent) ┘
```

Themes never bundle React or `@prss/ui`. At build/preview the PRSS app exposes
`window.PRSS`, `window.React`, `window.ReactDOM`; themes reference them via
webpack `externals` (`"@prss/ui": "PRSS"`, `"react": "React"`, …).

## Source layout

```
src/
  index.ts        # public entry → build/index.js: re-exports core + ContentRenderer + Menu
  index-core.ts   # → build/index-core.js: core utilities ONLY (no React components)
  core.ts         # the theme-facing runtime API (init, getProp, getItems, …)
  index.css
  blocks/         # block components + the renderers
    ContentRenderer.tsx   # parses post HTML, swaps data-block markup → block components
    BlockRenderer.tsx     # registry {hero, code-block, gallery, card, accordion, timeline, link-list}
    HeroBanner / Gallery / CardBlock / AccordionBlock / TimelineBlock / CodeBlock / LinkList
    AnimatedWrapper.tsx   # scroll/entrance animations
    styles/*.css
  _common/
    components/ui/*  # shadcn/ui primitives
    components/Menu.tsx
    lib/clientScript.ts   # → build/client.js (dark mode, interactions; no React)
    lib/utils.ts
```

Build outputs (`build/`): `index.js` (full runtime), `index-core.js` (core only),
`client.js`, `blocks.css`, `index.css`.

## Runtime API (`src/core.ts`)

Themes call these (globally as `PRSS.*`):

| Function | Purpose |
| --- | --- |
| `init(data, deployFlag?)` | Seed the current buffer item (post + site) — **call first** in every template. |
| `getProp(path, override?)` | Dot-path read, e.g. `getProp("vars")`, `getProp("site.title")`. |
| `getJsonProp(path)` | `getProp` + `JSON.parse`. |
| `propExists(path)` | Whether a prop is defined. |
| `getItems(template?, sort?, override?, category?)` | Resolve site posts/pages (by template, sorted by `createdAt`, filtered). |
| `getItem(uuid)` / `getItemBySlug(slug)` / `getRawPostItem(uuid)` | Single-item lookups. |
| `getComponent(slug)` | Find a `component`-template item by slug. |
| `getStructurePaths(nodes)` / `walkStructure(nodes, cb)` | Traverse the site's content tree. |
| `getSiteUrl()` / `getPathUrl(p)` | Resolve absolute URLs (deploy vs local). |
| `formattedDate` / `timeAgo` | Date helpers. |
| `stripTags` / `stripShortcodes` / `truncateString` | Content helpers for cards/excerpts. |
| `setContent` / `appendToHead` / `appendToBody` | DOM helpers. |

`PRSSItems` is a global array the PRSS app injects with all site items; `getItems`
joins it against `site.structure`.

## The block system

Editor "blocks" are stored in post HTML as:

```html
<div data-block="json" data-specialized-type="gallery"
     data-content="{&quot;fields&quot;:{&quot;title&quot;:&quot;My Gallery&quot;}}">…</div>
```

- **`ContentRenderer`** (exported, and exposed as `window.PRSS.ContentRenderer`)
  parses a post's HTML, finds `data-block` nodes, decodes `data-content`, and
  renders the matching component from **`BlockRenderer`**'s registry.
- **`BlockRenderer`** maps `specializedType || type` → a component
  (`hero`, `code-block`, `gallery`, `card`, `accordion`, `timeline`, `link-list`);
  accepts `customBlockComponents` for theme-supplied blocks.
- `AnimatedWrapper` reads `--animation-*` style props to add entrance animations.

Deep dive (pipeline, field tables, client behavior, tests, improvement plan):
[.agents/blocks.md](blocks.md).

### Adding a block

1. Create `src/blocks/MyBlock.tsx` (use the shadcn UI primitives, respect the
   `dark` class, no inline styles — add a CSS file).
2. Register it in `BlockRenderer.tsx`'s `blockComponents` under a `specializedType`
   key that matches the block's `data-specialized-type`.
3. Build. The PRSS app supplies the block's editor UI and default field values;
   this library only renders the resulting markup.

Blocks must expose **structured fields**, not a raw-JSON textarea.

## Commands

| Task | Command |
| --- | --- |
| Build | `npm run build` (`node scripts/build.js`) |
| Test | `npm test` (Jest) |
| Lint | `npm run lint` / `npm run lint:fix` |

## Publish

Bump the **minor** version → `npm publish` → commit + push. Consumers pin a
specific version, so a publish alone changes nothing until a consumer references
the new version.

## Conventions

- Keep `core.ts` framework-light; components live under `blocks/` and `_common/`.
  Keep `index-core.ts` component-free.
- Use the shadcn UI primitives for new components; support light/dark via the
  `dark` class; avoid inline styles (add a CSS file).
- Themes call this API by global name (`PRSS.*`) — treat it as a stable public
  contract; don't rename or change signatures without updating consumers.
