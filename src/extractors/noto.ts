import { existsSync } from "fs"
import { copyFile, mkdir, readdir, readFile, writeFile } from "fs/promises"
import { join as joinPath } from "path"
import { packsDir } from "../app.js"
import { embedPngInSvg } from "../embed-png.js"
import { toFilename } from "../unicode.js"

const NOTO_3D_PNG_SIZE = "128"

// emoji_u00a9_fe0f.svg -> a9-fe0f.svg
const normalizeNotoFilename = (filename: string) =>
    toFilename(
        filename
            .replace("emoji_u", "")
            .replace(/\.(svg|png)$/, "")
            .split("_")
    )

// Noto keeps its flags apart from the other 2D emoji, for some reason
const NOTO_2D_DIRS = [
    ["2D", "svg"],
    ["third_party", "region-flags", "waved-svg"],
]

export const copyNotoTo = async (outDir: string) => {
    if (!existsSync(outDir)) await mkdir(outDir)

    for (const dir of NOTO_2D_DIRS) {
        const notoDir = joinPath(packsDir, "noto", ...dir)
        const notoSvgs = (await readdir(notoDir)).filter((x) =>
            x.endsWith(".svg")
        )

        for (const emoji of notoSvgs) {
            const inPath = joinPath(notoDir, emoji)
            const outPath = joinPath(outDir, normalizeNotoFilename(emoji))

            await copyFile(inPath, outPath)
        }
    }
}

export const copyNoto3DTo = async (outDir: string) => {
    const notoDir = joinPath(packsDir, "noto", "3D", "png", NOTO_3D_PNG_SIZE)

    if (!existsSync(outDir)) await mkdir(outDir)

    const notoPngs = (await readdir(notoDir)).filter((x) => x.endsWith(".png"))

    for (const emoji of notoPngs) {
        const inPath = joinPath(notoDir, emoji)
        const outPath = joinPath(outDir, normalizeNotoFilename(emoji))

        await writeFile(outPath, embedPngInSvg(await readFile(inPath)))
    }
}
