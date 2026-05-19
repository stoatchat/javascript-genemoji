import https from "https"
import { existsSync } from "fs"
import { readFile } from "fs/promises"
import { join as joinPath } from "path"
import { cwd } from "./app.js"

export type Emoji15Ordering = {
    [key: string]: number
}

let cachedOrdering: Emoji15Ordering | null = null

/**
 * Download and cache the Emoji 15 ordering from Google Fonts
 */
const downloadEmoji15Ordering = async (): Promise<Emoji15Ordering> => {
    return new Promise((resolve, reject) => {
        const url =
            "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/ordering/emoji_15_0_ordering.json"

        https
            .get(url, (response) => {
                let data = ""

                response.on("data", (chunk) => {
                    data += chunk
                })

                response.on("end", () => {
                    try {
                        const ordering = JSON.parse(data)
                        resolve(ordering)
                    } catch (error) {
                        reject(error)
                    }
                })
            })
            .on("error", (error) => {
                reject(error)
            })
    })
}

/**
 * Get the Emoji 15 ordering, either from cache, local file, or remote
 */
export const getEmoji15Ordering = async (): Promise<Emoji15Ordering> => {
    if (cachedOrdering) {
        return cachedOrdering
    }

    const orderingFilePath = joinPath(cwd, ".emoji15-ordering.json")

    // Try to load from local cache first
    if (existsSync(orderingFilePath)) {
        try {
            const fileContent = await readFile(orderingFilePath, "utf-8")
            cachedOrdering = JSON.parse(fileContent)
            return cachedOrdering
        } catch (error) {
            console.warn(
                "Warning: Failed to load cached Emoji 15 ordering, fetching from remote..."
            )
        }
    }

    // Download from remote
    try {
        console.log("Fetching Emoji 15 ordering from Google Fonts...")
        const ordering = await downloadEmoji15Ordering()
        cachedOrdering = ordering

        // Cache locally for future runs
        try {
            const fs = await import("fs/promises")
            await fs.writeFile(
                orderingFilePath,
                JSON.stringify(ordering, null, 2)
            )
        } catch (error) {
            console.warn("Warning: Failed to cache Emoji 15 ordering locally")
        }

        return ordering
    } catch (error) {
        console.error(
            "Error fetching Emoji 15 ordering:",
            error instanceof Error ? error.message : error
        )
        throw error
    }
}

/**
 * Convert emoji codepoints to a format that can be looked up in the ordering
 */
export const codepointsToOrderingKey = (codepoints: string[]): string => {
    // Convert codepoint array like ["1f600"] to format used in ordering
    // Filter out variant selectors (fe0f)
    const filtered = codepoints
        .filter((cp) => cp !== "fe0f")
        .map((cp) => `U+${cp.toUpperCase()}`)

    return filtered.join(" ")
}

/**
 * Get the sort order value for a given emoji codepoint
 */
export const getEmojiSortOrder = async (
    codepoints: string[]
): Promise<number> => {
    const ordering = await getEmoji15Ordering()
    const key = codepointsToOrderingKey(codepoints)

    // Return the order from the Emoji 15 ordering, or a high number if not found
    return ordering[key] ?? Infinity
}

/**
 * Sort emoji filenames according to Emoji 15 ordering
 * Filenames are expected to be in format: "xxxx-yyyy-zzzz.svg"
 */
export const sortEmojis = async (filenames: string[]): Promise<string[]> => {
    const ordering = await getEmoji15Ordering()

    // Create a map of filename to sort order
    const filenameToOrder: Map<string, number> = new Map()

    for (const filename of filenames) {
        // Extract codepoints from filename (remove .svg extension)
        const codepoints = filename.replace(/\.svg$/, "").split("-")
        const key = codepointsToOrderingKey(codepoints)
        const order = ordering[key] ?? Infinity

        filenameToOrder.set(filename, order)
    }

    // Sort filenames by their order value, maintaining original order for ties
    return [...filenames].sort((a, b) => {
        const orderA = filenameToOrder.get(a) ?? Infinity
        const orderB = filenameToOrder.get(b) ?? Infinity
        return orderA - orderB
    })
}
