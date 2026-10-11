import { describe, expect, it } from 'vitest';

import { FEELING_TREE } from './feeling-tree';
import { labelBox, layoutUpright, type Point, type UprightLayout } from './upright-layout';

const PATHS: readonly (readonly number[])[] = [
  [],
  ...FEELING_TREE.flatMap((core, i) => [
    [i],
    ...core.children.flatMap((sub, j) => [[i, j], ...sub.children.map((_, k) => [i, j, k])]),
  ]),
];

const WIDTHS = [
  { name: 'wide', narrow: false },
  { name: 'narrow', narrow: true },
] as const;

const toView = ({ viewBox, scale, center }: UprightLayout, point: Point): Point => ({
  x: viewBox.x + viewBox.w / 2 + scale * (point.x - center.x),
  y: viewBox.y + viewBox.h / 2 + scale * (point.y - center.y),
});

const outside = (layout: UprightLayout): readonly string[] =>
  layout.items
    .filter((item) =>
      labelBox(item)
        .map((point) => toView(layout, point))
        .some(
          ({ x, y }) =>
            x < layout.viewBox.x ||
            x > layout.viewBox.x + layout.viewBox.w ||
            y < layout.viewBox.y ||
            y > layout.viewBox.y + layout.viewBox.h
        )
    )
    .map((item) => item.name);

describe('layoutUpright', () => {
  it.each(WIDTHS)('keeps every label inside the view box of the $name tree', ({ narrow }) => {
    const escaped = PATHS.flatMap((path) =>
      outside(layoutUpright(path, narrow)).map((name) => `${path.join('-')}: ${name}`)
    );
    expect(escaped).toEqual([]);
  });

  it('places the same feelings in the wide and the narrow tree, so CSS can show either', () => {
    const differ = PATHS.filter((path) => {
      const keys = (narrow: boolean) => layoutUpright(path, narrow).items.map((item) => item.key);
      return keys(false).join() !== keys(true).join();
    });
    expect(differ).toEqual([]);
  });

  it.each(WIDTHS)('places the first core feeling on the right of the $name tree', ({ narrow }) => {
    const xs = layoutUpright([], narrow).items.map((item) => item.point.x);
    expect(xs[0]).toBe(Math.max(...xs));
  });
});
