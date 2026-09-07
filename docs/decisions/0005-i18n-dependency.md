# 0005 — @solid-primitives/i18n autorisée, installée à son premier usage

- **Date** : 2026-09-04
- **Statut** : acceptée, autorisée par l'opérateur
- **Portée** : spec s-0001 et au-delà — cette autorisation ne se redemande pas

## Contexte

Le site est bilingue français / anglais (round 1 du périmètre s-0001). Product
recommandait d'écrire le mécanisme ici plutôt que d'installer une bibliothèque, sur la
base de la surface réellement concernée : 30 à 50 clés d'interface pour trois pages,
soit 60 à 80 lignes chiffrées. L'opérateur a tranché en faveur d'une bibliothèque.

L'évaluation comparative — `pipeline/handoffs/i18n-dependency-assessment.json`, rendue
dans `pipeline/pages/dependency-i18n.html` — a confronté quatre candidats sur des
mesures relevées au registre npm et à la base d'alertes GitHub le 2026-09-04, jamais de
mémoire.

## Décision

**`@solid-primitives/i18n@2.2.1` est autorisée.** Aucun agent n'a besoin de redemander :
l'issue qui met en place le socle bilingue l'installe et l'importe dans le même
changement.

Pourquoi celle-ci :

- seul candidat écrit pour Solid, avec une bascule de langue qui passe par les signaux ;
- zéro dépendance transitive : rien d'autre n'entre avec elle ;
- licence MIT, aucune alerte publiée la concernant ;
- `peerDependencies solid-js ^1.6.12`, vérifié contre le `solid-js 1.9.14` du projet.

**Sa faiblesse, nommée plutôt que minimisée** : seize mois sans publication au
2026-09-04. Acceptable ici parce que la surface utilisée est minuscule — si le paquet
était abandonné, le remplacer coûterait les 60 à 80 lignes déjà chiffrées, soit une
journée et non une migration. C'est précisément ce qui la distingue d'`i18next`, mieux
maintenue mais qui exigerait en plus un adaptateur Solid tiers : remplacer un risque
visible par un risque caché.

## Elle s'installe au premier usage, et cela a été mesuré

Elle a été installée une première fois le 2026-09-04, avant toute utilisation.
`dead_code` l'a refusée immédiatement :

```
Unused dependencies (1)
@solid-primitives/i18n  package.json:30:6
```

Le gate avait raison. Une dépendance installée avant son premier usage est du code mort
avec une excuse, exactement comme un helper créé « pour plus tard ». Trois voies
existaient : l'exclure dans `knip.json`, ce qui aurait rendu vert un rapport exact ;
garder un gate rouge par conception, qu'on apprend alors à ne plus lire ; ou la retirer
et l'installer au moment de son usage. L'opérateur a retenu la troisième.

Elle a donc été retirée, et `package.json` comme `pnpm-lock.yaml` sont revenus à
l'identique. **La règle qui en découle** : l'issue du socle bilingue porte
`pnpm add @solid-primitives/i18n@2.2.1` et le premier import dans le même changement.

## Conséquences

- La frontière entre les deux mécanismes de traduction est fixée par le périmètre
  approuvé : dictionnaires de la bibliothèque pour les libellés d'interface, fichiers de
  contenu par langue pour le texte long. Rien ne traverse.
- `audit` couvre désormais cette bibliothèque le jour où elle est installée. Un audit
  propre dit qu'aucune alerte n'est publiée à cette date ; il ne prouve pas qu'aucune
  vulnérabilité n'existe.
- Si le paquet est un jour déclaré abandonné, la sortie est déjà chiffrée dans
  l'évaluation : le mécanisme maison que Product recommandait initialement.
