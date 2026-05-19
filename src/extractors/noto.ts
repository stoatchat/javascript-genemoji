import { existsSync } from "fs"
import { copyFile, mkdir, readdir } from "fs/promises"
import { join as joinPath } from "path"
import { packsDir } from "../app.js"
import { sortEmojis } from "../sorting.js"

export const copyNotoTo = async (outDir: string) => {
    const notoDir = joinPath(packsDir, "noto", "svg")

    if (!existsSync(outDir)) await mkdir(outDir)

    let notoSvgs = await readdir(notoDir)

    // Sort emojis according to Emoji 15 ordering
    const normalizedSvgs = notoSvgs.map((emoji) => {
        const normalizedFilename = emoji
            .replace("emoji_u", "")
            .replaceAll("_", "-")
        return { original: emoji, normalized: normalizedFilename }
    })

    const sortedNormalized = await sortEmojis(
        normalizedSvgs.map((x) => x.normalized)
    )

    // Create reverse mapping
    const normalizedToOriginal = new Map(
        normalizedSvgs.map((x) => [x.normalized, x.original])
    )

    for (const normalized of sortedNormalized) {
        const original = normalizedToOriginal.get(normalized)!
        const inPath = joinPath(notoDir, original)
        const outPath = joinPath(outDir, normalized)

        await copyFile(inPath, outPath)
    }
}
