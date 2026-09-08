# 0017 — La page introuvable garde le pas resserré, et c'est délibéré

Statut : accepté le 2026-09-08.

## Le fait

Depuis la spec `s-8ahk`, l'espace entre le titre et le texte de l'écran
« adresse introuvable » vaut **16 px** au lieu des 24 px qu'il valait avant.

La règle qui resserre l'espace sous les titres est écrite une fois, dans la
feuille commune. Cet écran porte un titre, donc il l'a suivie.

## Pourquoi c'était une question

Le critère 9 de `i-2w1e` promettait que cet écran « garde le rythme vertical
qu'il a aujourd'hui ». Son énumération vérifiable, elle, ne nommait que
l'espace **au-dessus** du titre. L'intitulé promettait donc plus large que la
liste.

L'implémenteur a déclaré l'écart ouvertement, et QA a refusé de l'enterrer : il
a validé sur la lecture énumérée — la seule qu'il puisse mesurer — puis a
renvoyé la contradiction à l'opérateur plutôt que de trancher un arbitrage de
produit.

## La décision

L'opérateur laisse les 16 px. Deux raisons :

1. **La cohérence.** Tous les autres titres du site portent ce pas. Restaurer
   les 24 px ferait de la page d'erreur la seule à garder l'ancien rythme.
2. **Le coût d'une exception.** Une règle particulière pour un écran serait une
   deuxième règle à maintenir, pour 8 px sur l'écran le moins vu du site.

## Ce qu'on en retient

**Une promesse écrite dans l'intitulé d'un critère n'est pas une promesse tant
que son énumération ne la contient pas.** Ce qui est mesuré est ce qui est
énuméré ; le reste est une intention. Quand les deux divergent, c'est
l'énumération qui gouverne, et l'écart remonte à l'opérateur au lieu d'être
tranché en silence dans un sens ou dans l'autre.

Voir aussi [[0016-la-station-de-mesure-n-est-pas-le-visiteur]].
