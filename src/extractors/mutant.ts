import { existsSync } from "fs"
import { copyFile, mkdir, readdir } from "fs/promises"
import { join as joinPath } from "path"
import { packsDir } from "../app.js"
import { sortEmojis } from "../sorting.js"
import { VARIANT_SELECTOR_EMOJI } from "../constants.js"

export const copyMutantTo = async (outDir: string) => {
    const mutantDir = joinPath(packsDir, "mutant-remix", "emoji")

    if (!existsSync(outDir)) await mkdir(outDir)

    let mutantSvgs = await readdir(mutantDir)

    // Normalize filenames first
    const normalizedSvgs = mutantSvgs.map((emoji) => {
        const codepoints = emoji.split("-")
        const normalizedFilename =
            codepoints.length === 2
                ? codepoints
                      .filter((x) => x !== VARIANT_SELECTOR_EMOJI)
                      .join("-")
                : codepoints.join("-")
        return { original: emoji, normalized: normalizedFilename }
    })

    // Sort by normalized filename
    const sortedNormalized = await sortEmojis(
        normalizedSvgs.map((x) => x.normalized)
    )

    // Create reverse mapping
    const normalizedToOriginal = new Map(
        normalizedSvgs.map((x) => [x.normalized, x.original])
    )

    for (const normalized of sortedNormalized) {
        const original = normalizedToOriginal.get(normalized)!
        const inPath = joinPath(mutantDir, original)
        const outPath = joinPath(outDir, normalized)

        await copyFile(inPath, outPath)
    }
}
