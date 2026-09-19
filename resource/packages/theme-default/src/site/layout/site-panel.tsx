import type { ComponentProps } from "react";
import { cn } from "@gooseforum/ui/lib/utils";

export function SitePanel({
  className,
  clip = false,
  ...props
}: ComponentProps<"section"> & { clip?: boolean }) {
  return (
    <section
      data-slot="site-panel"
      className={cn(
        "site-panel rounded-xl border bg-background",
        clip && "overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

export function SiteListPanel({
  className,
  ...props
}: ComponentProps<"section">) {
  return (
    <section
      data-slot="site-list-panel"
      className={cn(
        "overflow-hidden border-b bg-background lg:rounded-xl lg:border",
        className,
      )}
      {...props}
    />
  );
}
