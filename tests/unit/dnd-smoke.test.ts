import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { describe, expect, it } from "vitest";

/**
 * @dnd-kit risk-gate smoke test (plan U1).
 *
 * @dnd-kit declares `react >=16.8`, so React 19 is in range, but the failure
 * mode we care about is runtime/SSR — not install. Rendering a real
 * DndContext + SortableContext to a string exercises @dnd-kit's provider tree
 * under this project's React 19 without a browser, catching SSR-time import or
 * context errors before U6b/U7 depend on it. Full hydration is verified by the
 * Kanban Playwright spec (U6b).
 */
describe("@dnd-kit under React 19 (SSR smoke)", () => {
  it("renders DndContext + SortableContext to string without throwing", () => {
    const html = renderToString(
      createElement(DndContext, {
        children: createElement(SortableContext, {
          items: ["a", "b"],
          children: createElement("div", null, "board-ok"),
        }),
      }),
    );
    expect(html).toContain("board-ok");
  });
});
