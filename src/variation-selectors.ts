import { existsSync } from "fs"
import { copyFile, readdir } from "fs/promises"
import { basename, extname, join as joinPath } from "path"
import { VARIANT_SELECTOR_EMOJI } from "./constants.js"
import { filenameToKey, readEmojiTest } from "./unicode.js"

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
        packDirs.map((dir) => readdir(dir))
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
                    joinPath(packDir, destination)
                )
                filenames.add(destination)
            }
        }
    }
}

// Unicode allows FE0F in several places per emoji (fully-qualified,
// minimally-qualified and unqualified forms) and clients request whichever
// form was typed, so every form needs its own file
export const ensureUnicodeForms = async (packDirs: string[]) => {
    const { emoji } = await readEmojiTest()
    const formsByKey = new Map<string, string[]>()

    for (const { key, filename } of emoji) {
        if (!formsByKey.has(key)) formsByKey.set(key, [])
        formsByKey.get(key)!.push(filename)
    }

    for (const packDir of packDirs) {
        const filenames = new Set(await readdir(packDir))

        for (const [key, forms] of formsByKey) {
            const source =
                forms.find((filename) => filenames.has(filename)) ??
                [...filenames].find(
                    (filename) => filenameToKey(filename) === key
                )
            if (!source) continue

            for (const filename of forms) {
                if (filenames.has(filename)) continue

                await copyFile(
                    joinPath(packDir, source),
                    joinPath(packDir, filename)
                )
                filenames.add(filename)
            }
        }
    }
}
