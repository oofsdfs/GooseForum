import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { GooseAdminApi } from "@gooseforum/client";
import { FileResourcesManagementPage } from "./file-resources-management-page";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("appends grid pages, retries failures, and resets pagination when switching to list", async () => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  let onIntersect: IntersectionObserverCallback;
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { onIntersect = callback; }
    observe() {}
    disconnect() {}
  });
  const file = (id: number) => ({ id, name: `file-${id}`, type: "application/pdf", url: `/files/${id}`, size: 100, userId: 1, createdAt: "" });
  const files = vi.fn()
    .mockResolvedValueOnce({ list: [file(1)], total: 40, page: 1 })
    .mockRejectedValueOnce(new Error("network failed"))
    .mockResolvedValueOnce({ list: [file(2)], total: 40, page: 2 })
    .mockResolvedValueOnce({ list: [file(1)], total: 40, page: 1 });
  render(<FileResourcesManagementPage api={{ assets: { files } } as unknown as GooseAdminApi} text={key => key} />);
  await screen.findByRole("button", { name: "file-1" });
  act(() => onIntersect([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
  await screen.findByText("network failed");
  expect(screen.getByRole("button", { name: "file-1" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "retry" }));
  await screen.findByRole("button", { name: "file-2" });
  expect(screen.getByRole("button", { name: "file-1" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "listView" }));
  await screen.findByRole("table");
  await waitFor(() => expect(files).toHaveBeenLastCalledWith({ page: 1, pageSize: 20 }));
  expect(screen.queryByRole("button", { name: "file-2" })).toBeNull();
});
