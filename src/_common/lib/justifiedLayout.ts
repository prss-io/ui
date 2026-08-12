/*!
 * Justified layout — port of the algorithm used by Flickr's justified-layout
 * (https://github.com/flickr/justified-layout, MIT), trimmed to the pieces a
 * gallery block needs.
 *
 * Original work Copyright 2019 SmugMug, Inc.
 * Licensed under the terms of the MIT license.
 *
 * Rows are filled to the container width at a height as close to
 * `rowHeight` as the tolerance allows, so every image keeps its own
 * proportions instead of being cropped into a grid cell.
 */

export interface JustifiedLayoutOptions {
  /** Width available to a row, in pixels. */
  rowWidth: number;
  /** Preferred row height, in pixels. Rows deviate from it within the tolerance. */
  rowHeight: number;
  /** Gap between items, in pixels. */
  spacing: number;
  /** Fraction of `rowHeight` a row may deviate by, e.g. 0.25. */
  heightTolerance: number;
}

export interface JustifiedBox {
  aspectRatio: number;
  top: number;
  left: number;
  width: number;
  height: number;
}

interface RowItem {
  aspectRatio: number;
  top: number;
  left: number;
  width: number;
  height: number;
}

class Row {
  top: number;
  rowWidth: number;
  spacing: number;
  rowHeight: number;
  minAspectRatio: number;
  maxAspectRatio: number;
  items: RowItem[] = [];
  height = 0;

  constructor(params: JustifiedLayoutOptions & { top: number }) {
    this.top = params.top;
    this.rowWidth = params.rowWidth;
    this.spacing = params.spacing;
    this.rowHeight = params.rowHeight;
    this.minAspectRatio = (params.rowWidth / params.rowHeight) * (1 - params.heightTolerance);
    this.maxAspectRatio = (params.rowWidth / params.rowHeight) * (1 + params.heightTolerance);
  }

  private aspectRatioSum(items: RowItem[]) {
    return items.reduce((sum, item) => sum + item.aspectRatio, 0);
  }

  /**
   * Attempt to add one item to the row. Returns false when the item was
   * rejected because the row reads better without it — the caller then starts
   * a new row with it.
   */
  addItem(aspectRatio: number): boolean {
    const item: RowItem = { aspectRatio, top: 0, left: 0, width: 0, height: 0 };
    const newItems = this.items.concat(item);
    const rowWidthWithoutSpacing = this.rowWidth - (newItems.length - 1) * this.spacing;
    const newAspectRatio = this.aspectRatioSum(newItems);
    const targetAspectRatio = rowWidthWithoutSpacing / this.rowHeight;

    if (newAspectRatio < this.minAspectRatio) {
      // Row would be too tall: keep the item and stay open for more.
      this.items = newItems;
      return true;
    }

    if (newAspectRatio > this.maxAspectRatio) {
      // Row would be too short. A single very wide item has no alternative.
      if (this.items.length === 0) {
        this.items = newItems;
        this.completeLayout(rowWidthWithoutSpacing / newAspectRatio);
        return true;
      }

      const previousRowWidthWithoutSpacing = this.rowWidth - (this.items.length - 1) * this.spacing;
      const previousAspectRatio = this.aspectRatioSum(this.items);
      const previousTargetAspectRatio = previousRowWidthWithoutSpacing / this.rowHeight;

      // Keep whichever set lands closer to the target row shape.
      if (
        Math.abs(newAspectRatio - targetAspectRatio) >
        Math.abs(previousAspectRatio - previousTargetAspectRatio)
      ) {
        this.completeLayout(previousRowWidthWithoutSpacing / previousAspectRatio);
        return false;
      }

      this.items = newItems;
      this.completeLayout(rowWidthWithoutSpacing / newAspectRatio);
      return true;
    }

    this.items = newItems;
    this.completeLayout(rowWidthWithoutSpacing / newAspectRatio);
    return true;
  }

  /** Fix the row height and position every item from it. */
  completeLayout(newHeight: number) {
    const rowWidthWithoutSpacing = this.rowWidth - (this.items.length - 1) * this.spacing;
    // Panoramas and very tall images would otherwise produce absurd rows.
    const clampedHeight = Math.max(0.5 * this.rowHeight, Math.min(newHeight, 2 * this.rowHeight));
    let clampedToNativeRatio = 1;

    if (newHeight !== clampedHeight) {
      this.height = clampedHeight;
      clampedToNativeRatio = rowWidthWithoutSpacing / clampedHeight / (rowWidthWithoutSpacing / newHeight);
    } else {
      this.height = newHeight;
    }

    let itemWidthSum = 0;
    for (const item of this.items) {
      item.top = this.top;
      item.width = item.aspectRatio * this.height * clampedToNativeRatio;
      item.height = this.height;
      item.left = itemWidthSum;
      itemWidthSum += item.width + this.spacing;
    }
  }

  /** Lay out a partial row (the last one) at a given height, left aligned. */
  forceComplete(rowHeight: number) {
    this.completeLayout(rowHeight);
  }
}

/** Lay out boxes of the given aspect ratios into justified rows. */
export function justifiedLayout(
  aspectRatios: number[],
  options: JustifiedLayoutOptions
): { containerHeight: number; boxes: JustifiedBox[] } {
  let containerHeight = 0;
  let boxes: JustifiedBox[] = [];
  let currentRow: Row | undefined;
  let lastRowHeight = 0;

  const closeRow = (row: Row) => {
    lastRowHeight = row.height;
    boxes = boxes.concat(row.items);
    containerHeight += row.height + options.spacing;
    return new Row({ top: containerHeight, ...options });
  };

  for (const aspectRatio of aspectRatios) {
    if (!currentRow) currentRow = new Row({ top: containerHeight, ...options });

    let itemAdded = currentRow.addItem(aspectRatio);

    if (currentRow.height > 0) {
      currentRow = closeRow(currentRow);

      if (!itemAdded) {
        itemAdded = currentRow.addItem(aspectRatio);
        if (currentRow.height > 0) currentRow = closeRow(currentRow);
      }
    }
  }

  if (currentRow && currentRow.items.length > 0) {
    // The last row keeps the previous row's height rather than being stretched.
    currentRow.forceComplete(lastRowHeight || options.rowHeight);
    boxes = boxes.concat(currentRow.items);
    containerHeight += currentRow.height;
  } else if (boxes.length) {
    containerHeight -= options.spacing;
  }

  return { containerHeight, boxes };
}

export default justifiedLayout;
