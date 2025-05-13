import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateShortStoryTitle(
  story: { id: number; source_key?: string | null; epic_name?: string | null } | null | undefined
): string {
  if (!story) return "Story invalide";

  const epic = story.epic_name
    ? `${story.epic_name.substring(0, 30)}${story.epic_name.length > 30 ? "..." : ""}`
    : "Epic inconnu";
  return `${epic} #${story.id}`;
}

export function generateFullStoryTitle(
  story: { id: number; epic_name?: string | null } | null | undefined
): string {
  if (!story) return "Story invalide";
  const epic = story.epic_name || "Epic inconnu";
  return `${epic} #${story.id}`;
}

export function generateShortStatTitle(
  stat:
    | { storyId: number | null; source_key?: string | null; epic_name?: string | null }
    | null
    | undefined
): string {
  if (!stat || stat.storyId === null) return "Agrégé";
  const epic = stat.epic_name
    ? `${stat.epic_name.substring(0, 30)}${stat.epic_name.length > 30 ? "..." : ""}`
    : "Epic inconnu";
  return `[${epic}] #${stat.storyId}`;
}
