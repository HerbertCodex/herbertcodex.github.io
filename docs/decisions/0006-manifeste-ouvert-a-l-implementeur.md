# 0006 — L'implémenteur peut écrire le manifeste, le verrou et la liste des routes

- **Date** : 2026-09-05
- **Statut** : accepté, tranché par l'opérateur
- **Portée** : toutes les issues, pas seulement `i-3388`

## Contexte

Le chantier ne pouvait pas démarrer. `next-issues` refusait la première issue :

```
i-3388  no eligible role can write the complete reserved scope
```

`i-3388` réserve `package.json`, parce que la décision 0005 lui donne
explicitement la charge d'installer `@solid-primitives/i18n@2.2.1` **et** de
l'importer dans le même changement. Or `file_policy.implementer` refusait ce
fichier.

Les deux règles se contredisaient. Ce n'était pas un oubli de configuration :
chacune avait sa raison. Le refus existait pour qu'un agent n'ajoute pas une
dépendance de son propre chef. La décision 0005 disait « même changement » parce
qu'installer avant d'importer laisse `dead_code` rouge, ce qui avait déjà été
mesuré et rejeté.

Le blocage était donc utile : il a rendu visible une contradiction que personne
n'aurait vue avant qu'un agent la contourne.

## Décision

`package.json` et `pnpm-lock.yaml` passent du `deny` à l'`allow` de
l'implémenteur. Les deux mouvements sont nécessaires : `allow` est une liste
blanche, retirer un chemin du `deny` ne suffit donc pas à l'autoriser.

Ce qui reste fermé à l'implémenteur ne change pas : `pnpm-workspace.yaml`,
`pipeline.config.json`, `AGENTS.md`, `CLAUDE.md`, `.github/**`,
`agent-pipeline/**`, `pipeline/**` et `docs/decisions/**`. Un agent ne réécrit
toujours ni les règles du cadre, ni la CI, ni le journal qui enregistre ce qu'on
a décidé.

## Ce que cette ouverture coûte, nommé plutôt que minimisé

**Aucune commande n'arrête désormais un agent qui ajoute une dépendance dont
personne n'a discuté.** C'est le coût réel, et il faut le dire ainsi.

Ce qui subsiste n'est pas rien, mais n'est pas la même garde :

- `audit` refuse une dépendance portant une alerte de sécurité ;
- `dead_code` refuse une dépendance installée sans usage, ce qui élimine le cas
  le plus fréquent — celle qu'on ajoute « pour plus tard » ;
- le diff passe sous relecture humaine, et une ligne ajoutée à `package.json` s'y
  voit.

Ce qu'aucune de ces trois ne couvre : une dépendance réellement utilisée, sans
alerte publiée, mais que personne n'a choisie. Elle passe. Seule la relecture la
verra, et la relecture est précisément ce que ce cadre existe pour ne pas avoir
à supposer attentive.

## L'alternative écartée

Une exception par issue — une liste de chemins qu'une issue nommément désignée
peut écrire, adossée à un numéro de décision — aurait gardé la porte fermée par
défaut et ne l'aurait ouverte que là où une décision écrite l'autorise. Elle a
été écartée parce que le cœur ne fournit pas ce mécanisme : il aurait fallu
l'écrire et le prouver côté projet, pour un seul cas connu.

**Si un jour une dépendance non discutée passe en revue, c'est cette
alternative qu'il faut reprendre**, et non resserrer le `deny` au risque de
rebloquer le chantier. Le constat serait alors une mesure, pas une supposition.

## Conséquences

- `i-3388` est dispatchable ; les six autres issues attendent leurs dépendances,
  comme le plan approuvé le prescrit.
- `pnpm-lock.yaml` est ajouté aux réservations de `i-3388` : `pnpm add` le
  réécrit en même temps que `package.json`, et une réservation qui ne nomme pas
  un fichier réellement écrit ne sérialise rien.
- La décision 0005 n'est pas amendée. Sa règle — installer et importer dans le
  même changement — devient applicable au lieu d'être contredite.

## Amendement du 2026-09-05 — `scripts/routes.mjs`

Le premier dispatch a buté sur le même mur, une issue plus loin. `i-3388`
change l'ensemble des routes du site, mais `scripts/routes.mjs` n'était dans
l'`allow` d'aucun rôle.

Ce fichier n'est pas un script parmi d'autres : c'est la **liste unique** que
lisent le prérendu Nitro (`vite.config.ts`), `check-build.mjs` et `smoke.mjs`.
Elle a été créée après le piège « `vite build` sort 0 sur une route qu'il n'a
pas su compiler ». Sans pouvoir l'écrire, l'implémenteur aurait livré `/fr` et
`/en` gardées par rien : présentes peut-être, vérifiées par aucune des deux
portes faites précisément pour refuser une route disparue.

**Décision : `scripts/routes.mjs` seul entre dans l'`allow`, pas `scripts/**`.**

La distinction porte tout le raisonnement. `scripts/routes.mjs` est un fichier
de **données** — la liste de ce que le site publie. Les autres fichiers de
`scripts/` sont les **portes** : `check-build.mjs`, `smoke.mjs`,
`check-tokens.mjs`, `scan-secrets.mjs`. Un implémenteur qui pourrait les
réécrire pourrait rendre verte n'importe quelle porte, ce qui est d'une autre
nature que d'ajouter une dépendance : il ne s'agirait plus d'une décision non
discutée, mais d'un juge que le jugé réécrit.

Vérifié après régénération, sur `pipeline/rules.json` et non sur la
configuration — c'est la leçon du piège 1 de la décision 0007 :

```
OUVERT  scripts/routes.mjs
ferme   scripts/check-build.mjs
ferme   scripts/smoke.mjs
ferme   scripts/check-tokens.mjs
ferme   scripts/scan-secrets.mjs
ferme   vite.config.ts
```

`vite.config.ts` reste fermé et n'a pas besoin d'être ouvert : il importe
`PRERENDERED` depuis `scripts/routes.mjs`, donc écrire la liste suffit.

### Ce qui reste ouvert : `i-9dqd`

`i-9dqd` exige de créer `scripts/check-translations.mjs` **et** de déclarer la
commande dans `pipeline.config.json`, refusé à tous les rôles par conception.
Aucun rôle ne peut donc la livrer en l'état.

L'opérateur a choisi de trancher au moment où l'issue devient actionnable —
elle dépend de `i-3388` et `i-8m5b` — plutôt que sur une projection. Le constat
est persisté sur `i-3388` comme découverte parquée : enregistré, jamais
planifié, visible dans l'inbox de triage tant qu'il n'est pas traité.
