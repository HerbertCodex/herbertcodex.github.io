# Pitfalls learned in this repository

What an escaped defect leaves behind. Each entry names what was believed, what was
true, and the gate that now refuses it — an entry with no third part is a story, and
stories do not stop anything.

## The TypeScript 7 package no longer exposes the compiler API

**Believed**: `typescript@latest` is the right pin for a TypeScript project.

**True**: `typescript@7` is the Go port. Its npm package exports only `version` and an
`unstable/ast` entry point; `ts.createSourceFile` is `undefined`. The project map
generator parses the AST, so it would have been written against an API marked unstable
by its own authors, and typescript-eslint does not support that line yet.

**Now**: TypeScript is pinned to the 5.x line, and the pin is deliberate rather than
inherited. Read `docs/decisions/0002-typescript-5.md` before bumping it.

## `--dir` and a configured `include` do not compose in Vitest

**Believed**: `vitest run --dir tests/unit` narrows the run to that directory.

**True**: `--dir` is applied *and* the configured `include` stays relative to the
project root, so the runner looked for `tests/unit/tests/unit/**` and reported "No test
files found" while exiting 1. A gate that fails because it found nothing looks exactly
like a gate that fails because something is broken.

**Now**: the suite is bounded by `include` in `vitest.config.ts` alone, and
`test_unit` is `pnpm run test:unit` with no path argument.

## Nitro 3 beta breaks on `preset: "static"` after prerendering

**Believed**: a statically deployed site sets the Nitro `static` preset.

**True**: with Nitro `3.0.260610-beta` and Vite 8, the prerender step succeeds and
writes `.output/public`, then the following build step fails with
`rolldownOptions.input should not be an html file when building for SSR`.

**Now**: the preset is left at its default and `prerender` alone produces the static
artefact in `.output/public`, which is what `smoke` serves and what deployment
publishes. See `docs/decisions/0003-static-deployment.md`; revisit when Nitro 3 is
stable.

## `vite build` exits 0 on a route it could not compile

**Believed**: the `build` gate refuses a broken route. That is what a build gate is for.

**True**: measured here on 2026-09-04. With a syntactically invalid `about.tsx`, and
again with an import of a module that does not exist, `vite build` exited **0**. The
prerenderer skipped the route and the build reported success; `.output/public` simply
had no `/about` in it. A second trap sat underneath: because `.output` was not cleaned
first, the previous build's `about/index.html` was still there, so even a check of the
artefact confirmed a page the current source could no longer produce.

**Now**: `build` is `node scripts/clean-output.mjs && vite build && node
scripts/check-build.mjs`. The clean step removes the stale artefact, and the check
refuses a declared route that was not prerendered. `scripts/routes.mjs` is the single
list the Nitro prerender, the build check and `smoke` all read, so the three cannot
disagree.

**What it still does not catch**: an import through the `~` alias that resolves to
nothing is externalised rather than refused, and the build stays green. `check` catches
it, which is why both gates exist.

## A gate that scans the vendored framework reports somebody else's code

**Believed**: a secrets scan and a dead-code report should cover the whole tree.

**True**: the first run of `scan:secrets` flagged an example credential inside
`agent-pipeline/skills/security/references/`, and the first run of `knip` reported 126
unused files, all of them the framework's own scripts. Neither is this project's code,
and neither can be fixed here — the core is not to be modified.

**Now**: both tools are bounded to `src`, `scripts` and `tests`. A gate reporting what
its reader cannot act on is a gate its reader learns to skip.

## The counter's paragraph was the same ten lines in two routes

**Believed**: the starter template is too small to contain duplication.

**True**: `duplication` was red on its first run — the documentation paragraph was
copied between `src/routes/index.tsx` and `src/routes/[...404].tsx`.

**Now**: it is `src/shared/StarterNote.tsx`, and the threshold was not touched. A
threshold loosened once loosens again.

## A file policy changed in the configuration was not the one being enforced

**Believed**: editing `file_policy` in `pipeline.config.json` changes what a role may
write.

**True**: `verify-scope.mjs` and `validate-handoff.mjs` read `rules.file_policy` — the
copy injected into `pipeline/rules.json` — never the configuration. Only `apply-profile`
rewrites that field. After decision 0006 the two disagreed: the configuration allowed
`package.json`, the injected rules still denied it. `next-issues` reads the
configuration, so the issue looked dispatchable while `verify-scope` would have refused
its diff as out of role.

**Now**: `apply-profile` is run after every `file_policy` change. The only place the
drift surfaced on its own was `pre-push`, which is after the work.

## An agent that could edit files could not run a single command

**Believed**: `--permission-mode acceptEdits` is enough for a role that writes code.

**True**: it accepts file edits and nothing else. In a non-interactive session `pnpm`,
`node` and `git` are refused with no way to ask. The first real dispatch produced no
code at all — correctly, since the implementer refused to declare a red proof it could
not observe.

**Now**: `agent_runtime.args` enumerates `--allowedTools`. The list was proven with two
probes before being written, rather than assumed. `bypassPermissions` would have been
shorter and would have opened the whole shell to an autonomous agent.
