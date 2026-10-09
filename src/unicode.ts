import { readFile } from "fs/promises"
import { join as joinPath } from "path"
import { VARIANT_SELECTOR_EMOJI } from "./constants.js"

// Stoat for Web requests `<codepoints>.svg` with lowercase hex codepoints
// without leading zeros, keeping FE0F exactly as typed (see toCodepoint in
// stoat-for-web) => every pack must use these names

export const normalizeCodepoint = (codepoint: string) =>
    parseInt(codepoint, 16).toString(16)

export const toFilename = (codepoints: string[]) =>
    codepoints.map(normalizeCodepoint).join("-") + ".svg"

// Identifies an emoji regardless of zero padding and FE0F placement
export const toKey = (codepoints: string[]) =>
    codepoints
        .map(normalizeCodepoint)
        .filter((codepoint) => codepoint !== VARIANT_SELECTOR_EMOJI)
        .join("-")

export const filenameToKey = (filename: string) =>
    toKey(filename.replace(/\.svg$/, "").split("-"))

export type EmojiStatus =
    | "fully-qualified"
    | "minimally-qualified"
    | "unqualified"

export type UnicodeEmoji = {
    key: string
    filename: string
    codepoints: string
    status: EmojiStatus
    emoji: string
    name: string
    version: string
    group: string
    subgroup: string
}

const emojiTestPath = joinPath(process.cwd(), "data", "emoji-test.txt")

// Parses Unicode's emoji-test.txt, which lists every form of every emoji
export const readEmojiTest = async () => {
    const emojiTest = await readFile(emojiTestPath, "utf8")
    const version = emojiTest.match(/^# Version: (.+)$/m)?.[1] ?? "unknown"
    const emoji: UnicodeEmoji[] = []

    let group = ""
    let subgroup = ""

    for (const line of emojiTest.split("\n")) {
        if (line.startsWith("# group: ")) group = line.slice(9).trim()
        else if (line.startsWith("# subgroup: "))
            subgroup = line.slice(12).trim()

        const match = line.match(
            /^([0-9A-F ]+?)\s*; (fully-qualified|minimally-qualified|unqualified)\s*# (\S+) E(\S+) (.+)$/
        )
        if (!match) continue

        const [, codepoints, status, text, emojiVersion, name] = match
        const split = codepoints.split(" ")

        emoji.push({
            key: toKey(split),
            filename: toFilename(split),
            codepoints: split.map(normalizeCodepoint).join("-"),
            status: status as EmojiStatus,
            emoji: text,
            name,
            version: emojiVersion,
            group,
            subgroup,
        })
    }

    return { version, emoji }
}
