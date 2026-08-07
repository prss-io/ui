# Blocks (renderer)

`@prss/ui` is the **rendering half** of the PRSS Blocks feature. The PRSS editor
serializes each block to HTML with `data-*` attributes; at build/preview time the
app calls `window.PRSS.ContentRenderer` to turn that markup into real components.
This doc describes how the rendering works, the serialization contract it must
honor, and how to test it. (For the editor half, see the PRSS app repo.)

## Pipeline

```
post HTML string
   │  parseBlockElements()        (src/_common/lib/utils.ts)
   ▼
{ processedHtml, blocks[] }       block nodes replaced by <div data-block-placeholder="__BLOCK_n__">
   │  ContentRenderer             (src/blocks/ContentRenderer.tsx)
   ▼
React tree: plain HTML fragments (dangerouslySetInnerHTML) interleaved with
            <BlockRenderer> instances for each placeholder
   │  BlockRenderer               (src/blocks/BlockRenderer.tsx)
   ▼
<AnimatedWrapper style+animations><div class="mb-6"><Component {...content} /></div></AnimatedWrapper>
```

### Parsing (`parseBlockElements`)

Uses the DOM, not regex:

```ts
const doc = new DOMParser().parseFromString(htmlContent, "text/html");
const jsonBlockElements = doc.querySelectorAll('[data-block="json"]');
// for each: JSON.parse(data-content.replace(/&quot;/g, '"')), push a block,
// then element.outerHTML = `<div data-block-placeholder="__BLOCK_n__"></div>`
```

- Also handles **styled non-JSON blocks** (`[data-block][data-styles]:not([data-block="json"])`).
- `data-specialized-type` **wins** over `specializedType` inside `data-content`.
- Invalid/missing `data-content` → the block is skipped and its original markup
  stays in the ordinary HTML path.
- Placeholders are sequential (`__BLOCK_0__`, `__BLOCK_1__`, …). `ContentRenderer`
  splits `processedHtml` on those and swaps each for a `BlockRenderer`.

### Registry (`BlockRenderer`)

```ts
const blockComponents = {
  hero: HeroBanner, "code-block": CodeBlock, gallery: Gallery,
  card: CardBlock, accordion: AccordionBlock, timeline: TimelineBlock,
  "link-list": LinkList,
};
```

- Dispatch key is `specializedType || type`.
- `customBlockComponents` are merged **after** and therefore override built-ins.
- Unknown type → `console.warn` + `return null` (the block disappears).
- The component is rendered as `<Component {...content} />`, so a block's
  `content.fields` arrive as props (e.g. `props.fields.title`).

### Styles + animations

`BlockRenderer` parses `data-styles` (semicolon-delimited CSS):

- Regular props are camel-cased into wrapper inline styles.
- `--animation-*` props become `AnimatedWrapper` props: `type`, `duration`
  (`Ns`→number), `delay`, `direction`, `easing`, `iterations`, `trigger`.
- `AnimatedWrapper` emits `data-animation-*` attributes and the `prss-animate`
  class; entrance animations (`fadeIn*`, `slideIn*`, `scaleIn`, `zoomIn`,
  `rotateIn`, `bounceIn`) start hidden (`opacity:0`) and are driven by
  `client.js` + `blocks.css` on the client — the timing is **not** inlined at SSR.

## Block components → expected fields

Field names must match the PRSS editor's `DEFAULT_BLOCK_CONTENT`.

| Type | Component | Key `fields` |
|------|-----------|--------------|
| `hero` | `HeroBanner` | `title, subtitle, buttonText, buttonUrl, alignment, backgroundImage, textColor, overlayColor, height` |
| `code-block` | `CodeBlock` | `title, description, code, language, showLineNumbers, theme, highlightLines, fileName, showCopyButton, showHeader` |
| `gallery` | `Gallery` | `title, description, images (JSON string), columns, layout, showCaptions, spacing, borderRadius, lightbox, aspectRatio, imageHeight, attribution, attributionLink` |
| `card` | `CardBlock` | `title, description, image, imagePosition, buttonText, buttonUrl, showButton, backgroundColor, textColor, borderRadius, padding, shadow` |
| `accordion` | `AccordionBlock` | `title, behavior, variant, size, items (JSON string)`; legacy `allowMultiple, firstItemOpen, alwaysOpen` |
| `timeline` | `TimelineBlock` | `title, description, events (JSON string/array), timelineOrientation, accentColor, groupBy` |
| `link-list` | `LinkList` | `title, description, links (JSON string), layoutStyle, layoutOrientation, iconPosition, colors, borderRadius, spacing` |

Editor types with **no renderer here** (`posts, features, testimonial, cta,
pricing, custom_json`) silently disappear at publish unless the caller supplies a
`customBlockComponents` entry — see the plan.

## Client behavior (`src/_common/lib/clientScript.ts` → `build/client.js`)

Not React hydration — plain DOM wiring on `DOMContentLoaded`, exposed as
`window.PRSSUIClient`:

- **Code copy** (Clipboard API + selection fallback).
- **Gallery lightbox** (single global overlay, click delegation, Escape/arrows,
  body scroll lock) and **carousel** (`scrollBy`, disabled-state tracking).
- **Accordion** toggle (`single` / `multiple` / `firstOpen` / `alwaysOpen`,
  `aria-expanded`); visibility is CSS-driven in `blocks.css`.
- **Animations**: injects keyframes, uses `IntersectionObserver` for on-visible /
  on-scroll triggers, plus hover/click triggers.

## Testing

Jest 25 (default env = jsdom). Config lives in `package.json` (`jest`), which maps
CSS/asset imports to a mock and aliases `@/*` → `src/_common/*`. React 18 +
react-dom are dev deps, so components render via `react-dom/server`.

`tests/blocks.test.tsx` covers:

- `parseBlockElements`: block extraction, sequential placeholders,
  `data-specialized-type` precedence, `data-styles` capture, invalid-JSON skip.
- `ContentRenderer`: surrounding HTML preserved, registered block dispatched to its
  component, unknown type dropped, `customBlockComponents` override, `className`
  applied, real-registry end-to-end smoke.
- `BlockRenderer`: plain `data-styles` → inline CSS, `--animation-*` → wrapper
  `data-animation-*` attributes.

The tests build the **exact** `data-block="json"` markup the PRSS editor emits, so
they exercise the real cross-repo contract. Run:

```bash
npx jest tests/blocks.test.tsx        # or: npm test
```

## Review & improvement plan (renderer side)

**P0**
1. **Debug badge removed.** `ContentRenderer` previously rendered a hard-coded
   "@prss/ui local override ✔" badge on every page — removed. Publish a new
   version so consumers stop rendering it.
2. **Escaping audit.** Registered blocks re-render from `fields`; some inject field
   values via `dangerouslySetInnerHTML` (e.g. accordion item content). Audit every
   such path and escape/sanitize at the render boundary; add tests asserting a
   `<script>` in a field cannot execute in the published output.
3. **Registry gaps.** Add renderers for `posts, features, testimonial, cta,
   pricing, custom_json`, or coordinate with the app to hide those editor types. A
   test should fail if the editor advertises a specialized type with no renderer.

**P1**
4. **SSR-safety.** `parseBlockElements` (DOMParser) and `CodeBlock` (uses
   `document` during render) require a DOM. Document this requirement, or provide a
   DOM-free parse path so `renderToString` works in plain Node without a shim.
5. **Custom-property parsing** in `BlockRenderer` is inline; extract it to a pure
   helper and unit-test the full `--animation-*` → props mapping and CSS
   camel-casing.

**P2**
6. **Contract fixture.** Keep a shared fixture of serialized block HTML (mirroring
   the app's `blocksToHtml` output) and assert each registered block renders its
   fields — the canary for a cross-repo format change.
7. **Schema version.** Honor a `schemaVersion` on `data-content` so future format
   changes degrade gracefully instead of `JSON.parse`-then-mis-render.
