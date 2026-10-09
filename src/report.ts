import { execSync } from "child_process"
import { existsSync as exists } from "fs"
import fs from "fs/promises"
import { join as joinPath } from "path"
import { filenameToKey, readEmojiTest, UnicodeEmoji } from "./unicode.js"

// Generates a plain HTML report into emoji/ showing which emoji each pack
// draws itself, which it borrows from twemoji, and which it lacks entirely.
// Run `bun start` first.

const cwd = process.cwd()
const outDir = joinPath(cwd, "emoji")
const packsDir = joinPath(cwd, "packs")

const FALLBACK_PACK = "twemoji"

const PACK_SOURCES: Record<string, string> = {
    twemoji: "twemoji",
    "fluent-flat": "fluent",
    "fluent-3d": "fluent",
    "fluent-color": "fluent",
    noto: "noto",
    "noto-3d": "noto",
    mutant: "mutant-remix",
}

if (!exists(outDir)) {
    console.error(new Error("Please run `bun start` before the report."))
    process.exit(1)
}

//#region Unicode reference

const unicode = await readEmojiTest()
const unicodeVersion = unicode.version
const reference = unicode.emoji.filter(
    (emoji) => emoji.status === "fully-qualified"
)
const referenceKeys = new Set(reference.map((emoji) => emoji.key))

//#endregion Unicode reference

//#region Pack scan

type Status = "native" | "fallback" | "missing"

type Pack = {
    id: string
    source: string
    // normalised key -> filename to preview and whether the pack drew it
    entries: Map<string, { filename: string; native: boolean }>
    // Unicode forms a client could request, that have no file
    missingForms: UnicodeEmoji[]
}

const fallbackFiles = new Map<string, Buffer>()
for (const filename of await fs.readdir(joinPath(outDir, FALLBACK_PACK))) {
    fallbackFiles.set(
        filename,
        await fs.readFile(joinPath(outDir, FALLBACK_PACK, filename))
    )
}

// Placeholders are byte for byte copies of the twemoji file
const isPlaceholder = async (packDir: string, filename: string) => {
    if (packDir === joinPath(outDir, FALLBACK_PACK)) return false

    const fallback = fallbackFiles.get(filename)
    if (!fallback) return false

    const path = joinPath(packDir, filename)
    if ((await fs.stat(path)).size !== fallback.length) return false

    return (await fs.readFile(path)).equals(fallback)
}

const packIds = (await fs.readdir(outDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) =>
        a === FALLBACK_PACK ? -1 : b === FALLBACK_PACK ? 1 : a.localeCompare(b)
    )

const packs: Pack[] = []

for (const id of packIds) {
    const packDir = joinPath(outDir, id)
    const entries: Pack["entries"] = new Map()

    for (const filename of (await fs.readdir(packDir)).sort()) {
        if (!filename.endsWith(".svg")) continue

        const key = filenameToKey(filename)
        const native = !(await isPlaceholder(packDir, filename))
        const existing = entries.get(key)

        if (!existing || (native && !existing.native)) {
            entries.set(key, { filename, native })
        }
    }

    const filenames = new Set(await fs.readdir(packDir))
    const missingForms = unicode.emoji.filter(
        (emoji) => entries.has(emoji.key) && !filenames.has(emoji.filename)
    )

    packs.push({
        id,
        source: PACK_SOURCES[id] ?? id,
        entries,
        missingForms,
    })
}

const statusOf = (pack: Pack, key: string): Status => {
    const entry = pack.entries.get(key)
    if (!entry) return "missing"
    return entry.native ? "native" : "fallback"
}

const sourceVersion = (source: string) => {
    try {
        return execSync("git describe --tags --always", {
            cwd: joinPath(packsDir, source),
        })
            .toString()
            .trim()
    } catch {
        return "unknown"
    }
}

//#endregion Pack scan

//#region HTML

const escapeHtml = (text: string) =>
    text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")

const generatedAt = new Date().toISOString().slice(0, 16).replace("T", " ")

const page = (title: string, body: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
td.fallback, span.fallback { background: #ffff99; }
td.missing, span.missing { background: #ff9999; }
span.cell { display: inline-block; width: 32px; height: 32px; margin: 2px; vertical-align: top; }
img { width: 32px; height: 32px; }
</style>
</head>
<body>
${body}
<hr>
<p>Generated ${generatedAt} UTC by genemoji. Reference: Unicode emoji ${escapeHtml(
    unicodeVersion
)}.</p>
</body>
</html>
`

const legend = `<p>Legend: plain = drawn by the pack, <span class="fallback">yellow</span> = twemoji placeholder, <span class="missing">red</span> = not available.</p>`

const image = (pack: Pack, key: string, title: string, prefix = "") => {
    const entry = pack.entries.get(key)
    if (!entry) return ""
    return `<img src="${prefix}${pack.id}/${
        entry.filename
    }" alt="" title="${escapeHtml(title)}" loading="lazy">`
}

const emojiTitle = (emoji: UnicodeEmoji) =>
    `${emoji.name} (${emoji.codepoints}, E${emoji.version})`

const countStatuses = (pack: Pack) => {
    const counts = { native: 0, fallback: 0, missing: 0 }
    for (const emoji of reference) counts[statusOf(pack, emoji.key)]++
    return counts
}

const groupReference = () => {
    const groups = new Map<string, UnicodeEmoji[]>()
    for (const emoji of reference) {
        if (!groups.has(emoji.group)) groups.set(emoji.group, [])
        groups.get(emoji.group)!.push(emoji)
    }
    return groups
}

const indexPage = () => {
    const rows = packs.map((pack) => {
        const counts = countStatuses(pack)
        const extras = [...pack.entries.keys()].filter(
            (key) => !referenceKeys.has(key)
        ).length
        return `<tr>
<td><a href="${pack.id}.html">${pack.id}</a></td>
<td>${escapeHtml(sourceVersion(pack.source))}</td>
<td align="right">${counts.native}</td>
<td align="right">${counts.fallback}</td>
<td align="right">${counts.missing}</td>
<td align="right">${extras}</td>
<td align="right">${pack.missingForms.length}</td>
</tr>`
    })

    return page(
        "genemoji report",
        `<h1>genemoji report</h1>
<p>Coverage of the ${
            reference.length
        } fully-qualified emoji in Unicode emoji ${escapeHtml(
            unicodeVersion
        )}, per pack.</p>
<table border="1" cellpadding="4" cellspacing="0">
<tr><th>Pack</th><th>Source version</th><th>Drawn by pack</th><th>Twemoji placeholder</th><th>Not available</th><th>Extra files</th><th>Missing file names</th></tr>
${rows.join("\n")}
</table>
<p>"Extra files" are files that are not a fully-qualified Unicode emoji, such as custom emoji.
"Missing file names" counts Unicode forms of emoji the pack has (with or without FE0F) that a client could request but that have no file. It should be 0.</p>
<ul>
<li><a href="compare.html">Compare all packs side by side</a></li>
<li><a href="gaps.html">Only emoji that some pack does not draw</a></li>
</ul>`
    )
}

const compareTable = (emojis: UnicodeEmoji[]) => {
    const header = `<tr><th>Name</th><th>Codepoints</th><th>Version</th>${packs
        .map((pack) => `<th><a href="${pack.id}.html">${pack.id}</a></th>`)
        .join("")}</tr>`
    const rows: string[] = []
    let currentGroup = ""

    for (const emoji of emojis) {
        if (emoji.group !== currentGroup) {
            currentGroup = emoji.group
            rows.push(
                `<tr><th colspan="${
                    packs.length + 3
                }" align="left">${escapeHtml(currentGroup)}</th></tr>`
            )
        }

        const cells = packs.map((pack) => {
            const status = statusOf(pack, emoji.key)
            const className = status === "native" ? "" : ` class="${status}"`
            return `<td${className}>${image(
                pack,
                emoji.key,
                `${pack.id}: ${emojiTitle(emoji)}`
            )}</td>`
        })

        rows.push(
            `<tr><td>${escapeHtml(emoji.name)}</td><td>${
                emoji.codepoints
            }</td><td>${emoji.version}</td>${cells.join("")}</tr>`
        )
    }

    return `${legend}
<table border="1" cellpadding="2" cellspacing="0">
${header}
${rows.join("\n")}
</table>`
}

const comparePage = () =>
    page(
        "Compare packs - genemoji report",
        `<p><a href="index.html">Back to report</a></p>
<h1>Compare packs</h1>
<p>All ${reference.length} fully-qualified emoji in every pack.</p>
${compareTable(reference)}`
    )

const gapsPage = () => {
    const gaps = reference.filter((emoji) =>
        packs.some((pack) => statusOf(pack, emoji.key) !== "native")
    )
    return page(
        "Gaps - genemoji report",
        `<p><a href="index.html">Back to report</a></p>
<h1>Gaps</h1>
<p>${gaps.length} of ${
            reference.length
        } emoji are not drawn by at least one pack.</p>
${compareTable(gaps)}`
    )
}

const packPage = (pack: Pack) => {
    const counts = countStatuses(pack)
    const notDrawn = reference.filter(
        (emoji) => statusOf(pack, emoji.key) !== "native"
    )

    const notDrawnRows = notDrawn.map((emoji) => {
        const status = statusOf(pack, emoji.key)
        return `<tr><td class="${status}">${image(
            pack,
            emoji.key,
            emojiTitle(emoji)
        )}</td><td>${escapeHtml(emoji.name)}</td><td>${
            emoji.codepoints
        }</td><td>${emoji.version}</td><td>${
            status === "fallback" ? "twemoji placeholder" : "not available"
        }</td></tr>`
    })

    const sections = [...groupReference()].map(([groupName, emojis]) => {
        const cells = emojis.map((emoji) => {
            const status = statusOf(pack, emoji.key)
            const className = status === "native" ? "cell" : `cell ${status}`
            return `<span class="${className}">${image(
                pack,
                emoji.key,
                emojiTitle(emoji)
            )}</span>`
        })
        return `<h3>${escapeHtml(groupName)} (${emojis.length})</h3>
<div>${cells.join("")}</div>`
    })

    const extras = [...pack.entries]
        .filter(([key]) => !referenceKeys.has(key))
        .map(
            ([key, entry]) =>
                `<span class="${
                    entry.native ? "cell" : "cell fallback"
                }">${image(pack, key, entry.filename)}</span>`
        )

    return page(
        `${pack.id} - genemoji report`,
        `<p><a href="index.html">Back to report</a></p>
<h1>${pack.id}</h1>
<p>Source: packs/${pack.source} at ${escapeHtml(
            sourceVersion(pack.source)
        )}. Drawn by pack: ${counts.native}, twemoji placeholder: ${
            counts.fallback
        }, not available: ${counts.missing}.</p>
<p>Contents: <a href="#not-drawn">Not drawn by this pack</a>, <a href="#all">All emoji</a>, <a href="#extra">Extra files</a>, <a href="#missing-files">Missing file names</a></p>

<h2 id="not-drawn">Not drawn by this pack (${notDrawn.length})</h2>
${
    notDrawn.length === 0
        ? "<p>None.</p>"
        : `<table border="1" cellpadding="2" cellspacing="0">
<tr><th>Shown</th><th>Name</th><th>Codepoints</th><th>Version</th><th>Status</th></tr>
${notDrawnRows.join("\n")}
</table>`
}

<h2 id="all">All emoji (${reference.length})</h2>
${legend}
<p>Hover an emoji for its name and codepoints.</p>
${sections.join("\n")}

<h2 id="extra">Extra files (${extras.length})</h2>
<p>Files in this pack that are not a fully-qualified Unicode emoji.</p>
<div>${extras.join("")}</div>

<h2 id="missing-files">Missing file names (${pack.missingForms.length})</h2>
<p>Unicode forms of emoji this pack has, for which no file exists.</p>
${
    pack.missingForms.length === 0
        ? "<p>None.</p>"
        : `<ul>${pack.missingForms
              .map(
                  (emoji) =>
                      `<li>${emoji.filename} (${escapeHtml(emoji.name)}, ${
                          emoji.status
                      })</li>`
              )
              .join("")}</ul>`
}`
    )
}

await fs.writeFile(joinPath(outDir, "index.html"), indexPage())
await fs.writeFile(joinPath(outDir, "compare.html"), comparePage())
await fs.writeFile(joinPath(outDir, "gaps.html"), gapsPage())
for (const pack of packs) {
    await fs.writeFile(joinPath(outDir, `${pack.id}.html`), packPage(pack))
}

console.log(
    `report: wrote ${packs.length + 3} pages for ${
        reference.length
    } emoji to emoji/`
)

//#endregion HTML
