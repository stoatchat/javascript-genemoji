import { copyFile, mkdir, readdir } from "fs/promises"
import { existsSync } from "fs"
import { join as joinPath } from "path"
import { packsDir } from "../app.js"
import { withAndWithoutVariationSelectors } from "../variation-selectors.js"

export const getAllExistingTwemoji = async () => {
    let out: string[] = []

    const twemojiDir = joinPath(packsDir, "twemoji", "assets", "svg")

    const twemojiSvgs = await readdir(twemojiDir)

    for (const emoji of twemojiSvgs) {
        out.push(emoji)
    }

    return out
}

export const copyTwemojiTo = async (outDir: string) => {
    const twemojiDir = joinPath(packsDir, "twemoji", "assets", "svg")

    if (!existsSync(outDir)) await mkdir(outDir)

    const twemojiSvgs = await readdir(twemojiDir)

    for (const emoji of twemojiSvgs) {
        const inPath = joinPath(twemojiDir, emoji)
        const outputFilenames = withAndWithoutVariationSelectors(emoji)
        const existingPackAsset = outputFilenames
            .map((filename) => joinPath(outDir, filename))
            .find((path) => existsSync(path))
        const source = existingPackAsset ?? inPath

        for (const filename of outputFilenames) {
            const outPath = joinPath(outDir, filename)
            if (!existsSync(outPath)) await copyFile(source, outPath)
        }
    }
}
