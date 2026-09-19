import type { UserBadgePayload } from "@gooseforum/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@gooseforum/ui/components/avatar";
import { cn } from "@gooseforum/ui/lib/utils";
import { badgeTone } from "./profile-badge";

export function ProfileAvatar({
  src,
  name,
  badge,
  className,
  framed = true,
  compactBadge = false,
  badgePosition = "right",
  hideOutline,
  avatarClassName,
  badgeClassName,
}: {
  src: string;
  name: string;
  badge?: UserBadgePayload | null;
  className?: string;
  framed?: boolean;
  compactBadge?: boolean;
  badgePosition?: "left" | "right";
  hideOutline?: boolean;
  avatarClassName?: string;
  badgeClassName?: string;
}) {
  const shouldHideOutline = hideOutline ?? !framed;
  return (
    <span className={cn("relative isolate inline-block shrink-0", className)}>
      <Avatar
        className={cn(
          "size-full",
          framed && "border-2 border-background bg-background shadow-sm",
          shouldHideOutline && "after:hidden",
          avatarClassName,
        )}
      >
        <AvatarImage src={src} alt={name} className="object-cover" />
        <AvatarFallback className="text-lg font-semibold">
          {name.trim().slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {badge ? (
        <span
          className={cn(
            "pointer-events-none absolute -bottom-1 z-30 flex size-[38%] min-h-5 min-w-5 items-center justify-center rounded-full p-0.5 shadow-sm ring-1 ring-inset",
            badgePosition === "left" ? "-left-1" : "-right-1",
            compactBadge && "min-h-4 min-w-4",
            badgeTone(badge.color, badge.level),
            badgeClassName,
          )}
          title={badge.description || badge.name}
        >
          <img
            src={badge.iconUrl || "/static/badges/contributor.svg"}
            alt={badge.name}
            className="size-full object-contain"
          />
        </span>
      ) : null}
    </span>
  );
}
