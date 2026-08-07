import { existsSync } from "fs"
import { copyFile, readdir } from "fs/promises"
import { basename, extname, join as joinPath } from "path"
import { VARIANT_SELECTOR_EMOJI } from "./constants.js"

export const withAndWithoutVariationSelectors = (filename: string) => {
    const extension = extname(filename)
    const codepoints = basename(filename, extension).split("-")

    if (!codepoints.includes(VARIANT_SELECTOR_EMOJI)) return [filename]

    const withoutVariationSelectors =
        codepoints
            .filter((codepoint) => codepoint !== VARIANT_SELECTOR_EMOJI)
            .join("-") + extension

    return [filename, withoutVariationSelectors]
}

export const ensureVariationSelectorAliases = async (packDirs: string[]) => {
    const filenamesByPack = await Promise.all(
        packDirs.map((dir) => readdir(dir)),
    )
    const aliases = new Map<string, string>()

    for (const filenames of filenamesByPack) {
        for (const filename of filenames) {
            const [withVariationSelectors, withoutVariationSelectors] =
                withAndWithoutVariationSelectors(filename)

            if (withoutVariationSelectors !== undefined) {
                aliases.set(withVariationSelectors, withoutVariationSelectors)
            }
        }
    }

    for (let index = 0; index < packDirs.length; index++) {
        const packDir = packDirs[index]
        const filenames = new Set(filenamesByPack[index])

        for (const [
            withVariationSelectors,
            withoutVariationSelectors,
        ] of aliases) {
            const hasWith = filenames.has(withVariationSelectors)
            const hasWithout = filenames.has(withoutVariationSelectors)

            if (hasWith === hasWithout) continue

            const source = hasWith
                ? withVariationSelectors
                : withoutVariationSelectors
            const destination = hasWith
                ? withoutVariationSelectors
                : withVariationSelectors

            if (!existsSync(joinPath(packDir, destination))) {
                await copyFile(
                    joinPath(packDir, source),
                    joinPath(packDir, destination),
                )
                filenames.add(destination)
            }
        }
    }
}
