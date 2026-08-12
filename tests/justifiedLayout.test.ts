import { justifiedLayout } from "../src/_common/lib/justifiedLayout";

const OPTIONS = { rowWidth: 1000, rowHeight: 240, spacing: 10, heightTolerance: 0.25 };

describe("justifiedLayout", () => {
  it("fills each full row to the container width", () => {
    const { boxes } = justifiedLayout([1.5, 1.5, 1.5, 1.5, 1.5, 1.5], OPTIONS);

    const rows = new Map<number, typeof boxes>();
    boxes.forEach((box) => {
      const row = rows.get(box.top) || [];
      row.push(box);
      rows.set(box.top, row);
    });

    const rowTops = [...rows.keys()];
    // Every row but the last is justified to the full width.
    rowTops.slice(0, -1).forEach((top) => {
      const row = rows.get(top)!;
      const width = row.reduce((sum, box) => sum + box.width, 0) + (row.length - 1) * OPTIONS.spacing;
      expect(width).toBeCloseTo(OPTIONS.rowWidth, 4);
    });
  });

  it("keeps every image's own proportions", () => {
    const ratios = [0.7, 1.5, 2.4, 1, 1.78];
    const { boxes } = justifiedLayout(ratios, OPTIONS);

    boxes.forEach((box, index) => {
      expect(box.width / box.height).toBeCloseTo(ratios[index], 2);
    });
  });

  it("does not stretch a partial last row", () => {
    const { boxes, containerHeight } = justifiedLayout([1.5, 1.5, 1.5, 1.5], OPTIONS);

    const lastTop = Math.max(...boxes.map((box) => box.top));
    const lastRow = boxes.filter((box) => box.top === lastTop);
    const lastRowWidth =
      lastRow.reduce((sum, box) => sum + box.width, 0) + (lastRow.length - 1) * OPTIONS.spacing;

    expect(lastRow).toHaveLength(1);
    expect(lastRowWidth).toBeLessThan(OPTIONS.rowWidth);
    expect(containerHeight).toBeGreaterThan(lastTop);
  });

  it("returns no boxes for an empty gallery", () => {
    expect(justifiedLayout([], OPTIONS)).toEqual({ containerHeight: 0, boxes: [] });
  });
});
