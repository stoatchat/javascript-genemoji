import { copyFile, mkdir, readdir } from "fs/promises"
import { existsSync } from "fs"
import { join as joinPath } from "path"
import { packsDir } from "../app.js"
import { sortEmojis } from "../sorting.js"

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

    let twemojiSvgs = await readdir(twemojiDir)

    // Sort emojis according to Emoji 15 ordering
    twemojiSvgs = await sortEmojis(twemojiSvgs)

    for (const emoji of twemojiSvgs) {
        const inPath = joinPath(twemojiDir, emoji)
        const outPath = joinPath(outDir, emoji)
        if (!existsSync(outPath)) await copyFile(inPath, outPath)
    }
}
