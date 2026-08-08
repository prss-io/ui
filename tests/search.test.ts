/**
 * Search ranking is a product decision, not an implementation detail: what comes
 * first is what readers act on. These pin the rules that matter — every term has
 * to match, and where it matched decides the order.
 */
import { search, loadSearchIndex } from "../src/search";

jest.mock("../src/core", () => ({
  getPathUrl: (p = "") => `https://example.test/${p}`,
}));

const pages = [
  {
    path: "/docs/install/",
    title: "Install",
    headings: ["Requirements"],
    text: "Install the package with npm. Requirements are listed below.",
  },
  {
    path: "/docs/caret/",
    title: "setCaretPosition",
    headings: ["Methods"],
    text: "Sets the internal caret position. Call setCaretPosition twice.",
  },
  {
    path: "/blog/notes/",
    title: "Release notes",
    headings: [],
    text: "We changed how install works and improved the caret handling.",
  },
];

const mockIndex = (items: any) => {
  (global as any).fetch = jest.fn(async () => ({ ok: true, json: async () => ({ items }) }));
};

beforeEach(() => {
  jest.resetModules();
  mockIndex(pages);
});

const run = async (q: string, limit?: number) => {
  jest.isolateModules(() => {});
  const mod = require("../src/search");
  return mod.search(q, limit);
};

describe("search", () => {
  it("puts a title match above a passing mention in body text", async () => {
    const results = await run("install");
    expect(results[0].title).toBe("Install");
    expect(results.map((r: any) => r.title)).toContain("Release notes");
  });

  it("requires every term, so typing more narrows the results", async () => {
    const results = await run("install caret");
    expect(results.map((r: any) => r.title)).toEqual(["Release notes"]);
  });

  it("finds a page by a term only its body contains", async () => {
    const results = await run("npm");
    expect(results.map((r: any) => r.title)).toEqual(["Install"]);
  });

  it("returns an excerpt around the match, not the top of the page", async () => {
    const results = await run("caret");
    expect(results[0].excerpt.toLowerCase()).toContain("caret");
  });

  it("reports the heading a match sits under", async () => {
    const results = await run("requirements");
    expect(results[0].heading).toBe("Requirements");
  });

  it("builds a usable url from the indexed path", async () => {
    const results = await run("npm");
    expect(results[0].url).toBe("https://example.test/docs/install/");
  });

  it("ignores noise words that would match everything", async () => {
    expect(await run("the")).toEqual([]);
  });

  it("returns nothing for an empty query rather than the whole site", async () => {
    expect(await run("   ")).toEqual([]);
  });

  it("honours the result limit", async () => {
    const results = await run("install", 1);
    expect(results).toHaveLength(1);
  });

  it("is case insensitive", async () => {
    const upper = await run("SETCARETPOSITION");
    expect(upper[0].title).toBe("setCaretPosition");
  });

  it("degrades to no results when the index is missing", async () => {
    (global as any).fetch = jest.fn(async () => ({ ok: false, json: async () => ({}) }));
    const mod = require("../src/search");
    expect(await mod.search("install")).toEqual([]);
  });

  it("degrades to no results when the request fails outright", async () => {
    (global as any).fetch = jest.fn(async () => {
      throw new Error("offline");
    });
    const mod = require("../src/search");
    expect(await mod.search("install")).toEqual([]);
  });

  it("fetches the index once, however many searches are run", async () => {
    const mod = require("../src/search");
    await mod.search("install");
    await mod.search("caret");
    await mod.loadSearchIndex();
    expect((global as any).fetch).toHaveBeenCalledTimes(1);
  });
});
