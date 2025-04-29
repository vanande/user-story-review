// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { UserStory } from "./types"; // Assuming UserStory type is here or imported

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to generate the short story title
export function generateShortStoryTitle(story: { id: number; source_key?: string | null; epic_name?: string | null } | null | undefined): string {
  if (!story) return "Invalid Story";
  const source = story.source_key ? `[${story.source_key}] ` : '';
  // Limit epic name length for display
  const epic = story.epic_name ? `${story.epic_name.substring(0, 30)}${story.epic_name.length > 30 ? '...' : ''} ` : 'Unknown Epic ';
  return `${source}${epic}#${story.id}`;
}

// Overload or specific version if needed for stats where source/epic might be different
export function generateShortStatTitle(stat: { storyId: number | null; source_key?: string | null; epic_name?: string | null } | null | undefined): string {
  if (!stat || stat.storyId === null) return "Aggregated"; // Or handle null storyId differently
  const source = stat.source_key ? `[${stat.source_key}] ` : '';
  const epic = stat.epic_name ? `${stat.epic_name.substring(0, 30)}${stat.epic_name.length > 30 ? '...' : ''} ` : 'Unknown Epic ';
  return `${source}${epic}#${stat.storyId}`;
}