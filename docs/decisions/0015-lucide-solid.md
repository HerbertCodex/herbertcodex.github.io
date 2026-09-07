# 0015 — `lucide-solid` autorisée, installée à son premier usage

- **Date** : 2026-09-07
- **Statut** : acceptée, autorisée par l'opérateur
- **Portée** : spec s-5bjp et au-delà — cette autorisation ne se redemande pas

## Contexte

Le bouton de thème affiche aujourd'hui le mot « Sombre ». L'opérateur veut une
icône, qui change avec le mode.

## Mesures relevées au registre npm le 2026-09-07, jamais de mémoire

```
version .................. 1.41.0
licence .................. ISC
dependances transitives .. aucune
peerDependencies ......... solid-js ^1.4.7, contre 1.9.14 dans ce projet
derniere publication ..... 2026-09-04
taille decompressee ...... 47 345 Ko
nombre de fichiers ....... 13 492
```

## Décision

**`lucide-solid` est autorisée.** Aucun agent n'a besoin de redemander.

Ce qui la recommande : licence permissive, aucune dépendance transitive,
compatibilité vérifiée avec la version de Solid du projet, et une publication
de trois jours — là où `@solid-primitives/i18n` dormait depuis seize mois quand
la décision 0005 l'a retenue.

## Son coût, nommé plutôt que minimisé

**47 Mo et 13 492 fichiers pour deux icônes.** Chaque icône est un module
séparé, donc le paquet livré au visiteur ne portera que le soleil et la lune :
le poids ne touche pas le site. Il touche `node_modules`, le temps
d'installation, et chaque exécution de la CI.

L'alternative a été proposée à l'opérateur avec cette mesure : recopier les
deux tracés, la licence ISC le permettant, pour une vingtaine de lignes et
aucune dépendance. **L'opérateur a retenu la bibliothèque en connaissance du
chiffre**, parce qu'elle rend gratuites les icônes suivantes.

## Elle s'installe à son premier usage

Même règle que la décision 0005, et pour la même raison mesurée : `dead_code`
refuse une dépendance installée avant son premier import. Une dépendance
installée avant son usage est du code mort avec une excuse.

L'issue qui livre l'icône porte donc `pnpm add lucide-solid` **et** le premier
import dans le même changement.
