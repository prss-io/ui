import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ContentRenderer from "../src/blocks/ContentRenderer";
import { parseBlockElements } from "../src/_common/lib/utils";

/**
 * Builds the same data-block="json" markup that the PRSS app's blocksToHtml() emits,
 * so these tests exercise the real serialization contract between the two repos.
 */
const makeJsonBlockHtml = ({
  id = "b1",
  specializedType = "hero",
  fields = {},
  styles = "",
  inner = "editor-preview",
}: {
  id?: string;
  specializedType?: string;
  fields?: Record<string, any>;
  styles?: string;
  inner?: string;
}) => {
  const content = { type: "json", fields };
  const data = JSON.stringify({ id, type: "json", specializedType, content }).replace(/"/g, "&quot;");
  const stylesAttr = styles ? ` data-styles="${styles}"` : "";
  return `<div data-block-id="${id}" data-block="json" data-content="${data}" data-specialized-type="${specializedType}"${stylesAttr} class="json-block">${inner}</div>`;
};

describe("prss-ui parseBlockElements", () => {
  it("extracts a json block and replaces it with a sequential placeholder", () => {
    const html = `<p>Before</p>${makeJsonBlockHtml({ fields: { title: "Hi" } })}<p>After</p>`;
    const { processedHtml, blocks } = parseBlockElements(html);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      id: "b1",
      type: "json",
      specializedType: "hero",
      content: { type: "json", fields: { title: "Hi" } },
      placeholder: "__BLOCK_0__",
    });
    expect(processedHtml).toContain('data-block-placeholder="__BLOCK_0__"');
    expect(processedHtml).toContain("<p>Before</p>");
    expect(processedHtml).toContain("<p>After</p>");
  });

  it("lets data-specialized-type win over the value inside data-content", () => {
    const content = { type: "json", specializedType: "card", fields: {} };
    const data = JSON.stringify({ id: "b1", type: "json", content }).replace(/"/g, "&quot;");
    const html = `<div data-block="json" data-content="${data}" data-specialized-type="hero"></div>`;
    const { blocks } = parseBlockElements(html);
    expect(blocks[0].specializedType).toBe("hero");
  });

  it("captures data-styles onto the parsed block", () => {
    const html = makeJsonBlockHtml({ fields: {}, styles: "color: red" });
    const { blocks } = parseBlockElements(html);
    expect(blocks[0].styles).toBe("color: red");
  });

  it("assigns sequential placeholders across multiple blocks", () => {
    const html = makeJsonBlockHtml({ id: "a" }) + makeJsonBlockHtml({ id: "b" });
    const { blocks } = parseBlockElements(html);
    expect(blocks.map((b) => b.placeholder)).toEqual(["__BLOCK_0__", "__BLOCK_1__"]);
  });

  it("skips blocks with invalid JSON and leaves the markup untouched", () => {
    const html = `<div data-block="json" data-content="{not valid}" data-specialized-type="hero"></div>`;
    const { blocks, processedHtml } = parseBlockElements(html);
    expect(blocks).toHaveLength(0);
    expect(processedHtml).not.toContain("data-block-placeholder");
  });
});

describe("prss-ui ContentRenderer", () => {
  it("renders surrounding HTML and dispatches a registered block to its component", () => {
    const html = `<p>Intro</p>${makeJsonBlockHtml({ fields: { title: "Hello Hero" } })}`;
    const custom = {
      hero: (props: any) => <span data-testid="hero">HERO:{props.fields?.title}</span>,
    };
    const out = renderToStaticMarkup(
      <ContentRenderer content={html} customBlockComponents={custom} />
    );
    expect(out).toContain("<p>Intro</p>");
    expect(out).toContain("HERO:Hello Hero");
    // placeholder markers must not leak into final output
    expect(out).not.toContain("data-block-placeholder");
  });

  it("drops unknown block types (no registered component)", () => {
    const html = makeJsonBlockHtml({ specializedType: "does-not-exist", fields: {} });
    const out = renderToStaticMarkup(<ContentRenderer content={html} />);
    expect(out).not.toContain("editor-preview");
    expect(out).not.toContain("data-block-placeholder");
  });

  it("lets custom components override built-in registry entries", () => {
    const html = makeJsonBlockHtml({ specializedType: "hero", fields: { title: "X" } });
    const custom = { hero: () => <div>CUSTOM_HERO</div> };
    const out = renderToStaticMarkup(<ContentRenderer content={html} customBlockComponents={custom} />);
    expect(out).toContain("CUSTOM_HERO");
  });

  it("applies the className to the outer wrapper", () => {
    const out = renderToStaticMarkup(<ContentRenderer content="<p>x</p>" className="my-content" />);
    expect(out).toContain('class="my-content"');
  });

  it("renders a real registered block end-to-end through the block registry", () => {
    const html = makeJsonBlockHtml({ specializedType: "hero", fields: { title: "Real Hero" } });
    const out = renderToStaticMarkup(<ContentRenderer content={html} />);
    // BlockRenderer wraps every rendered block in a div.mb-6; unknown types would not.
    expect(out).toContain("mb-6");
    expect(out).not.toContain("data-block-placeholder");
  });
});

describe("prss-ui BlockRenderer styles + animations", () => {
  it("applies plain data-styles as inline CSS on the wrapper", () => {
    const html = makeJsonBlockHtml({ fields: {}, styles: "color: red" });
    const custom = { hero: () => <span>x</span> };
    const out = renderToStaticMarkup(<ContentRenderer content={html} customBlockComponents={custom} />);
    expect(out).toContain("color:red");
  });

  it("maps --animation-* custom properties onto the animated wrapper", () => {
    const html = makeJsonBlockHtml({
      fields: {},
      styles: "--animation-type: fadeIn; --animation-duration: 2s",
    });
    const custom = { hero: () => <span>x</span> };
    const out = renderToStaticMarkup(<ContentRenderer content={html} customBlockComponents={custom} />);
    expect(out).toContain('data-animation-type="fadeIn"');
    expect(out).toContain('data-animation-duration="2"');
  });
});
