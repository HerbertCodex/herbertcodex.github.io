# 0002 — TypeScript pinned to the 5.x line

- **Date**: 2026-09-04
- **Status**: accepted

## Context

`typescript@latest` resolves to 7.0.2, the Go port. Its npm package exports only
`version` and an `unstable/ast` entry point: `ts.createSourceFile` and `ts.SyntaxKind`
are `undefined`.

`scripts/project-map.mjs` parses the TypeScript AST, because the project map is what
every reuse note is judged against and a regular expression reads a `.tsx` file badly.
Writing it against an API its own authors mark unstable would put the most load-bearing
gate in the installation on a moving target. typescript-eslint 8 does not support that
line either, which would have taken `lint` and `design_limits` with it.

## Decision

TypeScript is pinned to `5.9.3`.

## Consequence

`pnpm outdated` will keep offering 7.x. Bumping it means porting the map generator to
`typescript/unstable/ast` and confirming typescript-eslint supports the release —
not accepting a dependency update. `tsconfig.json` also gained `skipLibCheck` and the
`node` types, without which `check` failed on `node_modules` rather than on this code.
