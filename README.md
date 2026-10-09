# Stoat genemoji

## Description

genemoji is a small CLI tool to generate Stoat's emoji asset folder. It transforms the various folder structures of the emoji packs into a unified directory structure.

## Supported Packs

-   [Fluent](https://github.com/microsoft/fluentui-emoji)
-   [Twemoji](https://github.com/jdecked/twemoji)
-   [Mutant Remix](https://mutant.stoat.chat)
-   [Noto Emoji](https://github.com/googlefonts/noto-emoji)

## Submodule Hint

This project contains submodules. Run `git submodule init` after you clone this repository to initialize the submodules.
It is also recommended to run `git submodule update` after you pull from upstream.

## Resources

### genemoji

-   [The Metadata We Use to Power Emoji in Stoat](https://github.com/googlefonts/emoji-metadata)

### Stoat

-   [Stoat Project Board](https://github.com/stoatchat/discussions/discussions) (Submit feature requests here)
-   [Stoat Testers Server](https://stoat.chat/invite/Testers)
-   [Contribution Guide](https://developers.stoat.chat/developing/contrib)

## Quick Start

genemoji runs on [Bun](https://bun.sh).

```sh
bun install
bun start
```

When genemoji is finished generating the packs, the output will be located in `emoji/`, split up by pack ID.

The coverage report (`bun run report`) is [published to GitHub Pages](https://stoatchat.github.io/javascript-genemoji).

## CLI Commands

| Command              | Description                                                           |
| -------------------- | --------------------------------------------------------------------- |
| `bun start`          | Generate the emoji packs.                                             |
| `bun dev`            | Generate the emoji packs, re-running on source changes.               |
| `bun run report`     | Write an HTML coverage report into `report/` (run after `bun start`). |
| `bun run typecheck`  | Type-check the sources with TypeScript.                               |
| `bun run format`     | Run Prettier on the client. (check only)                              |
| `bun run format:fix` | Run Prettier on the client. (automatically fixes bad formatting)      |
