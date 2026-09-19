import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  SiteListPanel,
  SitePanel,
} from "../src/site/layout/site-panel";

afterEach(cleanup);

describe("site panel layouts", () => {
  it("preserves the standard site surface and optional clipping", () => {
    render(<SitePanel data-testid="panel" clip className="p-4" />);

    const panel = screen.getByTestId("panel");
    expect(panel.dataset.slot).toBe("site-panel");
    expect(panel.classList.contains("site-panel")).toBe(true);
    expect(panel.classList.contains("overflow-hidden")).toBe(true);
    expect(panel.classList.contains("p-4")).toBe(true);
  });

  it("preserves the responsive list surface classes", () => {
    render(<SiteListPanel data-testid="list" />);

    const panel = screen.getByTestId("list");
    expect(panel.dataset.slot).toBe("site-list-panel");
    expect(panel.classList.contains("border-b")).toBe(true);
    expect(panel.classList.contains("lg:rounded-xl")).toBe(true);
    expect(panel.classList.contains("lg:border")).toBe(true);
  });
});
