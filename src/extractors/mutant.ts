import { existsSync } from "fs"
import { copyFile, mkdir, readdir } from "fs/promises"
import { join as joinPath } from "path"
import { packsDir } from "../app.js"
import { withAndWithoutVariationSelectors } from "../variation-selectors.js"

export const copyMutantTo = async (outDir: string) => {
    const mutantDir = joinPath(packsDir, "mutant-remix", "emoji")

    if (!existsSync(outDir)) await mkdir(outDir)

    const mutantSvgs = await readdir(mutantDir)

    for (const emoji of mutantSvgs) {
        const inPath = joinPath(mutantDir, emoji)

        for (const filename of withAndWithoutVariationSelectors(emoji)) {
            await copyFile(inPath, joinPath(outDir, filename))
        }
    }
}
