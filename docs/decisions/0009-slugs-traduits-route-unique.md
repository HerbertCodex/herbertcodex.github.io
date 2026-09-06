# 0009 — Slugs traduits, portés par une route unique et une table

- **Date** : 2026-09-05
- **Statut** : accepté, tranché par l'opérateur
- **Portée** : spec s-5bjp, toutes les pages

## Contexte

L'implémenteur a signalé, pendant le cycle de `i-3388`, que la maquette et le
plan approuvé ne s'accordaient pas :

- la maquette fait pointer le sélecteur de langue vers `/en/work` quand la
  version française est sur `/fr/realisations` ;
- le critère de `i-841g` exige que `/fr/projets` bascule vers `/en/projects` ;
- le plan approuvé réserve **un seul fichier par page**, et le routage par
  fichiers de SolidStart tire le slug du nom de fichier — un fichier unique
  donne donc le même slug dans les deux langues.

Le code livré par `i-3388` avait déjà tranché, et du mauvais côté : `about.tsx`
sert `/fr/about` autant que `/en/about`. Le public prioritaire est un recruteur
français, et son adresse disait « about ».

## Décision

**Chaque langue a ses propres slugs**, et ils sont portés par **une seule route
dynamique** plutôt que par un fichier par page et par langue.

```
src/routes/[locale]/[slug].tsx      une route pour toutes les pages
src/shared/pages.ts                 la table, source unique
```

La table associe une identité de page à son slug dans chaque langue et au
composant qui l'affiche. Elle est lue par trois consommateurs et par eux seuls :
la route, le sélecteur de langue, et `scripts/routes.mjs` pour le prérendu.

Ajouter une page devient une ligne dans la table et un composant dans son
module. Aucun fichier de route n'est créé.

## Pourquoi la route unique plutôt qu'un fichier par langue

Deux fichiers par page — `parcours.tsx` et `about.tsx` rendant le même
composant — auraient marché. La route unique est retenue parce qu'elle supprime
la classe d'erreur au lieu de la surveiller : avec des fichiers séparés, la
correspondance entre les langues vit à deux endroits qui peuvent diverger. Avec
la table, il n'y a qu'un endroit.

C'est la même leçon que les décisions 0007 et 0008 ont payée deux fois : une
règle écrite à un endroit et appliquée depuis un autre finit par diverger, et
l'écart ne se voit qu'au pire moment.

## Ce que cette forme coûte, nommé plutôt que minimisé

**Une page absente ne se voit plus à la construction.** Avec un fichier par
page, un fichier manquant est une erreur immédiate. Avec la table, une entrée
mal orthographiée ne se manifeste qu'en visitant l'adresse.

Deux garde-fous, et ils ne sont pas facultatifs :

- **la table est typée**, de sorte qu'une faute de frappe soit une erreur de
  compilation et non une découverte en production ;
- **une porte confronte la table, `PRERENDERED` et les pages réellement
  rendues.** Sans elle, les slugs traduits sont _pires_ que des slugs partagés :
  plus de surface, aucune garantie.

`/en/realisations` doit répondre 404, jamais rendre la page anglaise sous une
adresse française.

## Ce qui n'est pas prouvé et doit l'être en premier

`[locale]` est déjà un segment dynamique et `/fr` comme `/en` sont bien
prérendues — `check-build` le vérifie à chaque construction. Un segment
dynamique **imbriqué**, `[locale]/[slug]`, est le même mécanisme un cran plus
profond, mais il n'a pas été exécuté ici.

**C'est la première chose que l'implémenteur doit prouver**, avant d'écrire quoi
que ce soit d'autre. Si le prérendu ne traverse pas deux segments dynamiques, la
forme retenue tombe et il faut revenir aux fichiers par langue. Le supposer
coûterait le travail entier.

## Conséquences

- La spec `s-5bjp` est `active` : cette révision exige un `scope_change` approuvé
  par l'opérateur, ce qu'est le présent document.
- `i-841g` est réécrite : son critère de bascule porte désormais sur des slugs
  traduits.
- `i-802r`, `i-2wjm` et `i-hxac` ne créent plus de fichier de route ; leurs
  réservations changent en conséquence.
- La table et sa porte demandent une issue à elles, en amont des trois pages.
- `src/routes/[locale]/about.tsx`, livrée par `i-3388`, disparaît au profit de
  la route dynamique. Ce n'est pas une régression de `i-3388` : ses quatre
  critères restent satisfaits, seule la forme de l'adressage change.

## Amendement du 2026-09-06 — la table ne porte pas le composant

Cette décision écrivait : « La table associe une identité de page à son slug
dans chaque langue **et au composant qui l'affiche**. » Le code ne le fait pas,
et il ne le peut pas.

**La mesure qui l'a établie**, faite pendant l'implémentation de `i-1ee9` :
`vite.config.ts` importe `scripts/routes.mjs` pour lire la liste de prérendu.
Le chargeur de configuration de Vite **empaquette** ce fichier et suit ses
imports relatifs — y compris un import dynamique écrit dans une flèche qui
n'est jamais appelée. Une table portant `load: () => import("./WorksPage")`
fait échouer `pnpm run build` sur `[UNRESOLVED_IMPORT]`.

**Ce que le code fait à la place** : la table porte les noms seuls, et le lien
nom vers composant vit dans `src/routes/[locale]/[slug].tsx`, typé
`Record<NamedPageKey, Component>`. Une page ajoutée à la table sans composant
ne compile pas.

L'invariant qui comptait est donc préservé — un seul endroit décide, et un
oubli est refusé à la construction — par un autre moyen que celui prévu. La
décision est amendée plutôt que réécrite, pour que la contrainte qui l'a forcée
reste lisible : un module lu par la configuration de build n'appartient pas au
même monde que le code applicatif.
