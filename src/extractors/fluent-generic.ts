import { existsSync } from "fs"
import { copyFile, mkdir, readdir, readFile, writeFile } from "fs/promises"
import { join as joinPath } from "path"
import { packsDir } from "../app.js"
import { FLUENT_TONE_DIRS, FLUENT_TONE_DIR_TO_CODEPOINT } from "../constants.js"
import { embedPngInSvg } from "../embed-png.js"
import { MSFTMetadataFile } from "../types.js"
import { toFilename } from "../unicode.js"
import { withAndWithoutVariationSelectors } from "../variation-selectors.js"

const copyWithSkinTones = async (
    copyTo: string,
    flavorName: string,
    emojiPath: string,
    codepoints: string[]
) => {
    for (let tone of FLUENT_TONE_DIRS) {
        const toneDir = joinPath(emojiPath, tone, flavorName)
        if (!existsSync(toneDir)) {
            console.log(
                "Warning:",
                toneDir.replace(process.cwd(), ""),
                "is missing, this is likely an issue with the pack. Will be provided by twemoji"
            )
            continue
        }

        const codepointOfEmoji =
            tone === "Default"
                ? codepoints
                : [
                      codepoints[0],
                      FLUENT_TONE_DIR_TO_CODEPOINT[tone],
                      ...codepoints.slice(1),
                  ]

        const fileName = (await readdir(toneDir)).filter(
            (x) => x.endsWith(".svg") || x.endsWith(".png")
        )[0]

        const inPath = joinPath(toneDir, fileName)
        const outputFilenames = withAndWithoutVariationSelectors(
            toFilename(codepointOfEmoji)
        )

        if (fileName.endsWith(".png")) {
            const pngData = await readFile(inPath)
            const svg = embedPngInSvg(pngData)
            await Promise.all(
                outputFilenames.map((filename) =>
                    writeFile(joinPath(copyTo, filename), svg)
                )
            )
        } else {
            await Promise.all(
                outputFilenames.map((filename) =>
                    copyFile(inPath, joinPath(copyTo, filename))
                )
            )
        }
    }
}

const copySingle = async (
    copyTo: string,
    flavorName: string,
    emojiPath: string,
    codepoints: string[]
) => {
    const assetDir = joinPath(emojiPath, flavorName)
    if (!existsSync(assetDir)) {
        console.log(
            "Warning:",
            assetDir.replace(process.cwd(), ""),
            "is missing, this is likely an issue with the pack. Will be provided by twemoji"
        )
        return
    }
    const fileName = (await readdir(assetDir)).filter(
        (x) => x.endsWith(".svg") || x.endsWith(".png")
    )[0]

    const inPath = joinPath(assetDir, fileName)
    const outputFilenames = withAndWithoutVariationSelectors(
        toFilename(codepoints)
    )

    if (fileName.endsWith(".png")) {
        const pngData = await readFile(inPath)
        const svg = embedPngInSvg(pngData)
        await Promise.all(
            outputFilenames.map((filename) =>
                writeFile(joinPath(copyTo, filename), svg)
            )
        )
    } else {
        await Promise.all(
            outputFilenames.map((filename) =>
                copyFile(inPath, joinPath(copyTo, filename))
            )
        )
    }
}

export const copyFluent = async (flavorName: string, toPath: string) => {
    const fluentEmojiDir = joinPath(packsDir, "fluent", "assets")
    const emojis = await readdir(fluentEmojiDir)

    if (!existsSync(toPath)) await mkdir(toPath)

    for (let emoji of emojis) {
        const emojiPath = joinPath(fluentEmojiDir, emoji)
        const emojiDirContents = (await readdir(emojiPath)).filter(
            (x) => !x.endsWith(".json")
        )

        const metadataFile: MSFTMetadataFile = JSON.parse(
            (await readFile(joinPath(emojiPath, "metadata.json"))).toString()
        )
        const codepoints = metadataFile.unicode.split(" ")

        const hasSkinTones = emojiDirContents.includes("Medium-Dark") // name unlikely to be reused

        if (hasSkinTones) {
            await copyWithSkinTones(toPath, flavorName, emojiPath, codepoints)
        } else {
            await copySingle(toPath, flavorName, emojiPath, codepoints)
        }
    }
}
