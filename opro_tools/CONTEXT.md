# Directory Context: `/opro_tools`

## Purpose
The npm package `skillmd_opro_tools`, which holds the generic tools that the OPRO optimizer skill runs with `npx`. The package holds no code that is specific to one target skill.

## Key Exports & Entry Points
- `bin/skillmd_opro_tools.mjs`: the program that `npx skillmd_opro_tools ...` starts. It registers `tsx` and imports `src/cli.ts`.
- `src/`: the tools themselves — see its own [CONTEXT.md](src/CONTEXT.md).
- Command to run this folder: `npx skillmd_opro_tools <tool name> ...`, from any folder of the repository.

## Rules
- The package is a workspace of the repository, named in `pnpm-workspace.yaml`, and the root `package.json` depends on it, so that `pnpm install` writes the `skillmd_opro_tools` link into `node_modules/.bin` and `npx` finds it with no network.
- The package is `private` while it is not published. A published package ships compiled JavaScript, and then `bin/skillmd_opro_tools.mjs` imports the JavaScript and drops `tsx`.

## Background
- The package comes from milestone 2 of [issue #4](https://github.com/jeromeetienne/skillmd_opro/issues/4), and milestone 0 of the same issue built its two first tools.
