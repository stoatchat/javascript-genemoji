# Stoat genemoji

## Description

genemoji is a small CLI tool to generate Stoat's emoji asset folder. It transforms the various folder structures of the emoji packs into a unified directory structure.

## Supported Packs

-   [Fluent](https://github.com/microsoft/fluentui-emoji)
-   [Twemoji](https://twemoji.twitter.com)
-   [Mutant Remix](https://mutant.stoat.chat)
-   [Noto Color Emoji](https://fonts.google.com/noto/specimen/Noto+Emoji)

## Submodule Hint

This project contains submodules. Run `git submodule init` after you clone this repository to initialize the submodules.
It is also recommended to run `git submodule update` after you pull from upstream.

## Resources

### genemoji

-   [The Metadata We Use to Power Emoji in Stoat](https://github.com/googlefonts/emoji-metadata)

### Stoat

-   [Stoat Project Board](https://github.com/orgs/stoatchat/discussions) (Submit feature requests here)
-   [Revolt Testers Server](https://app.revolt.chat/invite/Testers)
-   [Contribution Guide](https://developers.stoat.chat/developing/contrib)

## Quick Start

```sh
yarn build
yarn start
```

When genemoji is finished generating the packs, the output will be located in `emoji/`, split up by pack ID.

## CLI Commands

| Command           | Description                                                      |
| ----------------- | ---------------------------------------------------------------- |
| `yarn dev`        | Start TypeScript watcher, rebuilds on change.                    |
| `yarn build`      | Build the CLI.                                                   |
| `yarn start`      | Initiate generation with built CLI.                              |
| `yarn format`     | Run Prettier on the client. (check only)                         |
| `yarn format:fix` | Run Prettier on the client. (automatically fixes bad formatting) |
