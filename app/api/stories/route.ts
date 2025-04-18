import { NextResponse } from "next/server"
import fs from "fs/promises" // Add fs import
import path from "path" // Add path import
import { UserStory } from "@/lib/types" // Import UserStory type

// Function to shuffle an array (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export async function GET() {
  try {
    // --- Load stories from merged.json ---
    const jsonPath = path.join(process.cwd(), "data", "merged.json") // Use process.cwd() for correct path in Next.js
    const jsonData = await fs.readFile(jsonPath, "utf-8")
    const data = JSON.parse(jsonData)

    let allStories: UserStory[] = []
    let storyIdCounter = 1 // Simple counter for unique IDs

    for (const sourceKey of Object.keys(data)) {
      const source = data[sourceKey]
      if (source.epics && Array.isArray(source.epics)) {
        for (const epic of source.epics) {
          if (epic.user_stories && Array.isArray(epic.user_stories)) {
            for (const story of epic.user_stories) {
              // Extract data, providing defaults for optional fields
              const description = story.user_story
              // Generate a title (e.g., first 70 chars)
              const title = description.substring(0, 70) + (description.length > 70 ? "..." : "")
              const acceptance_criteria = story.acceptance_criteria || []
              // Assign INVEST criteria or null if not present
              const independent = story.independent === undefined ? null : story.independent
              const negotiable = story.negotiable === undefined ? null : story.negotiable
              const valuable = story.valuable === undefined ? null : story.valuable
              const estimable = story.estimable === undefined ? null : story.estimable
              const small = story.small === undefined ? null : story.small
              const testable = story.testable === undefined ? null : story.testable

              allStories.push({
                id: storyIdCounter++, // Assign a unique ID
                title: title,
                description: description,
                acceptance_criteria: acceptance_criteria,
                independent: independent,
                negotiable: negotiable,
                valuable: valuable,
                estimable: estimable,
                small: small,
                testable: testable,
              })
            }
          }
        }
      }
    }

    // --- Select 5 random stories ---
    const shuffledStories = shuffleArray(allStories);
    const selectedStories = shuffledStories.slice(0, 5);


    console.log(`Fetched ${selectedStories.length} random stories from merged.json. Total stories: ${allStories.length}`)

    return NextResponse.json({
      success: true,
      stories: selectedStories, // Return the 5 random stories from JSON
    })
  } catch (error) {
    console.error("Error fetching stories from merged.json:", error) // Update error message
    return NextResponse.json(
      {
        error: "Failed to fetch stories from file", // Update error message
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// No POST method needed for just reading from JSON
