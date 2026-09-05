# 0007 — Deux pièges découverts au premier dispatch réel

- **Date** : 2026-09-05
- **Statut** : accepté, corrigé
- **Origine** : remise bloquée de l'implémenteur sur `i-3388`

## Contexte

Le premier dispatch réel n'a produit aucune ligne de code, et c'est le bon
résultat. L'agent a rendu un blocage, l'arbre de travail intact, aucun test
écrit — « sans possibilité de les exécuter, un rouge déclaré aurait été un
rouge inventé ». Ses trois constats ont été vérifiés un par un et sont exacts.

## Piège 1 — Une décision écrite qu'aucune commande n'applique

La décision 0006 a modifié `file_policy` dans `pipeline.config.json`. Elle n'a
rien changé.

`verify-scope.mjs:37` et `validate-handoff.mjs:1121` lisent
`rules.file_policy`, c'est-à-dire la **copie injectée** dans
`pipeline/rules.json`, jamais la configuration. Seul `apply-profile` réécrit ce
champ, et il n'avait pas été relancé.

Mesuré après coup :

```
config : allow [... "package.json", "pnpm-lock.yaml"]
rules  : deny  ["package.json", "pnpm-lock.yaml", ...]
```

`next-issues` lit la configuration et annonçait donc `i-3388` dispatchable,
pendant que `verify-scope` aurait refusé son diff comme « hors rôle
implementer ». Le seul endroit où l'écart devenait visible était `pre-push`,
c'est-à-dire après tout le travail.

C'est exactement le défaut que ce cadre décrit partout ailleurs — une règle
écrite que rien n'applique — arrivé à sa propre surface de configuration.

**Corrigé** : `apply-profile` relancé, les deux fichiers concordent.

**La ligne à retenir**, ajoutée aux pièges : modifier `file_policy` dans
`pipeline.config.json` ne change rien tant qu'`apply-profile` n'a pas réécrit
`pipeline/rules.json`.

## Piège 2 — Un agent qui ne peut exécuter aucune commande

`agent_runtime.args` portait `--permission-mode acceptEdits`. Ce mode accepte
les écritures de fichiers et **rien d'autre** : dans une session non
interactive, `pnpm`, `node` et `git` sont refusés sans possibilité de
demander.

L'implémenteur ne pouvait donc ni installer la dépendance du critère 4, ni
jouer un test, ni surtout observer le code de sortie non nul que
`evidence.red_proof` exige. Il a refusé de livrer plutôt que de déclarer un
rouge qu'il n'avait pas vu, ce qui est le comportement attendu — mais aucun
dispatch n'aurait jamais abouti.

**Corrigé, et prouvé plutôt que supposé** : `--allowedTools` énumère
`Bash(pnpm:*)`, `Bash(node:*)`, `Bash(git:*)`, `Read`, `Write`, `Edit`,
`Glob`, `Grep`. Deux sondes ont été exécutées avant d'écrire la
configuration : la première a confirmé qu'un agent peut lancer
`pnpm run check:tokens`, la seconde qu'écriture, `git` et `node` passent
ensemble.

`bypassPermissions` aurait été plus court et ouvrait le shell entier à un
agent autonome. L'énumération garde la liste sous les yeux de qui relit la
configuration.

## Ce que cet échec dit du cadre

Un dispatch qui échoue en produisant trois constats vérifiables vaut mieux
qu'un dispatch qui produit du code sur des fondations fausses. Les deux pièges
étaient invisibles à la lecture : le premier ne se voyait qu'en comparant deux
fichiers que personne ne compare, le second qu'en exécutant réellement un
agent.

Aucune relecture attentive ne les aurait trouvés.
