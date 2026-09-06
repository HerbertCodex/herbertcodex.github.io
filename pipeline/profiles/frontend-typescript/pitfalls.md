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

## A gitignore pattern that only held while the directory existed

**Believed**: `pipeline/handoffs/` in `.gitignore` ignores the handoff directory.

**True**: a trailing slash matches directories only. The directory is absent from a
fresh checkout — precisely because it is ignored — so `git check-ignore -q
pipeline/handoffs` answered "not ignored" and `apply-profile --check` failed in CI
while passing locally, where the directory happens to exist.

**Now**: the pattern is `pipeline/handoffs`, without the slash, and the fix was proven
by replaying the CI condition in a fresh clone rather than reasoned about.

## A context block only travels when its heading names its addressee

**Believed**: persisting evidence with `append_context` puts it in front of the next
role.

**True**: `contextsFor` keeps only blocks whose heading matches `## Context for <Role>`.
A free heading — `CI i-3388`, `verify-scope i-3388 <base>..<sha>` — is archived on the
record and never travels. That is deliberate: a closure proof is audit material rather
than an instruction, and unaddressed blocks were half the weight on the heaviest issue
measured.

**Now**: anything a role must read carries `## Context for <Role>`. Anything meant for
the audit trail keeps its own heading and stays on the record.

**Still unresolved, and it is in the core**: the orchestrator prompt prescribes the
unaddressed heading `## verify-scope <issue> <base>..<sha>`, while the QA prompt
announces that same output as present in the QA package. Both cannot hold: the heading
the first prescribes is precisely the one the filter drops. QA reported the gap and
replayed `verify-scope` by hand. Not fixable here — the core is not to be modified.

## A repeated context heading replaces, it does not append

**Believed**: two `append_context` blocks under the same heading both reach the role.

**True**: `contextsFor` keeps only the last block per heading — "only the last
instruction is live, the earlier one is history". A correction sent as a second block
under the same heading silently deleted the two scope decisions the first one carried.
The record still holds both; only one travels.

**Now**: a correction rewrites the whole block, and what the package actually carries is
verified before dispatch rather than assumed.

## A role forbidden to write the artefact its own contract requires

**Believed**: denying `pipeline/**` to Product keeps it away from the control store.

**True**: it also denied `pipeline/pages/` and `pipeline/handoffs/`, where the Product
prompt requires it to render a review page and archive its proposal — and where
`validate-handoff` refuses a proposal that has none. The role had to violate its policy
to satisfy its contract.

Worse, three earlier rounds wrote the same files without declaring them and passed. The
round that declared them honestly in `evidence.files` was the one refused. **Honesty was
punished**, which is the shape of rule that teaches agents to stay quiet.

**Now**: Product's policy opens exactly `pipeline/pages/**` and `pipeline/handoffs/**`
and denies the control store, the rules, the prompts, the briefs and the profile
individually rather than by a blanket `pipeline/**`.

## A large handoff arrives as a pointer, not as the document

**Believed**: the `AGENT_HANDOFF` block always carries the whole handoff.

**True**: a 62 KB proposal does not fit. Product wrote the document to its archive and
returned a short handoff carrying `handoff_file { path }`. Validating the pointer
reported four missing fields and looked like a defective agent; the document itself
validated cleanly.

**Now**: a handoff carrying `handoff_file` is validated at that path, not inline.

## A module read by the build config must not reach a component, even lazily

**Believed**: a dynamic `import()` inside an arrow that is never called costs nothing at
build time.

**True**: `vite.config.ts` imports `scripts/routes.mjs` to read the prerender list, and
Vite's config loader **bundles** that file and follows its relative imports — the lazy
ones included. A page table carrying `load: () => import("./WorksPage")` failed
`pnpm run build` on `[UNRESOLVED_IMPORT]`, measured during the `i-1ee9` spike.

**Now**: the table carries names only; the name-to-component map lives in the route file
and is typed, so a page added without a component does not compile. See the amendment to
decision 0009.

## A coverage exclusion names a directory the screens have left

**Believed**: excluding `src/routes/**` from coverage keeps browser-proven screens out of
the unit threshold.

**True**: decision 0009 replaced one route file per page with a single dynamic route and
moved the screens to `src/shared/`, where the exclusion no longer applied. Coverage fell
to 36.84% against a threshold of 90 — four page components at 0%, each of them proven by
the browser suite.

**Now**: the exclusion follows the screens (`src/shared/*Page.tsx`) and the threshold is
untouched. Verified that the gate still bites: an uncovered function planted in
`src/shared/pages.ts` drops it to 87.09% and it refuses.
