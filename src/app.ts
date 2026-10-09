import { join as joinPath } from "path"
import fs from "fs/promises"
import { existsSync as exists } from "fs"
import { copyFluent } from "./extractors/fluent-generic.js"
import { copyTwemojiTo } from "./extractors/twemoji.js"
import { copyNoto3DTo, copyNotoTo } from "./extractors/noto.js"
import { copyMutantTo } from "./extractors/mutant.js"
import {
    ensureUnicodeForms,
    ensureVariationSelectorAliases,
} from "./variation-selectors.js"

//#region Constants and Setup

export const cwd = process.cwd()
export const packsDir = joinPath(cwd, "packs")

const fluentExists = exists(joinPath(packsDir, "fluent"))

if (!fluentExists) {
    console.error(new Error("Please install the git submodules first."))
    process.exit(1)
}

// Clear emoji directory if it exists already, then create a new one

export const outDir = joinPath(cwd, "emoji")

if (exists(outDir)) await fs.rm(outDir, { recursive: true })
await fs.mkdir(outDir)

const generatedPackDirs: string[] = []

//#endregion Constants and Setup

//#region Twemoji

console.time("pack-twemoji")
console.log("pack-twemoji: Generating pack twemoji...")

const twemojiOutDir = joinPath(outDir, "twemoji")
await copyTwemojiTo(twemojiOutDir)
generatedPackDirs.push(twemojiOutDir)

console.timeEnd("pack-twemoji")

//#endregion Twemoji

//#region Fluent

const fluentTypes = [
    ["fluent-flat", "Flat"],
    ["fluent-3d", "3D"],
    ["fluent-color", "Color"],
]

for (const fluentType of fluentTypes) {
    const [flavorId, flavorName] = fluentType
    console.time(`pack-${flavorId}`)
    console.log(`pack-${flavorId}: Generating pack ${flavorId}...`)

    const packOutDir = joinPath(outDir, flavorId)
    await copyFluent(flavorName, packOutDir)

    console.log(
        `pack-${flavorId}: Generating twemoji placeholders for missing files...`
    )
    await copyTwemojiTo(packOutDir)
    generatedPackDirs.push(packOutDir)

    console.timeEnd(`pack-${flavorId}`)
}

//#endregion Fluent

//#region Noto

const notoTypes: [string, (outDir: string) => Promise<void>][] = [
    ["noto", copyNotoTo],
    ["noto-3d", copyNoto3DTo],
]

for (const [packId, copyNoto] of notoTypes) {
    console.time(`pack-${packId}`)
    console.log(`pack-${packId}: Generating pack ${packId}...`)

    const packOutDir = joinPath(outDir, packId)
    await copyNoto(packOutDir)

    console.log(
        `pack-${packId}: Generating twemoji placeholders for missing files...`
    )
    await copyTwemojiTo(packOutDir)
    generatedPackDirs.push(packOutDir)

    console.timeEnd(`pack-${packId}`)
}

//#endregion Noto

//#region Mutant

console.time("pack-mutant")
console.log("pack-mutant: Generating pack mutant...")

const mutantOutDir = joinPath(outDir, "mutant")
await copyMutantTo(mutantOutDir)

console.log(`pack-mutant: Generating twemoji placeholders for missing files...`)
await copyTwemojiTo(mutantOutDir)
generatedPackDirs.push(mutantOutDir)

console.timeEnd("pack-mutant")

//#endregion Mutant Remix

console.time("variation-selector-aliases")
console.log("Generating variation-selector aliases...")
await ensureVariationSelectorAliases(generatedPackDirs)
console.timeEnd("variation-selector-aliases")

console.time("unicode-forms")
console.log("Generating every Unicode form of each emoji...")
await ensureUnicodeForms(generatedPackDirs)
console.timeEnd("unicode-forms")
