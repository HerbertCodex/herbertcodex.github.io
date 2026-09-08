# 0016 — La station de mesure n'est pas le visiteur

Statut : accepté le 2026-09-08. Amende le périmètre approuvé au round 2 de la
spec `s-8ahk`, sans le réécrire.

## Ce qui s'est passé

Le périmètre `docs/decisions/perimetre-approuve-rythme-vertical-round2.json`,
approuvé par l'opérateur le 2026-09-08 à 09:55:52Z, annonce quatre fois que
l'accueil resserré mesure **606 px à 1278 px de large** et 584 px aux trois
autres largeurs (lignes 53, 107, 214 et 274). Le critère 2 de l'issue `i-7ey8`
reprenait ce chiffre.

L'intégration continue l'a contredit sur le commit `9292e18` : la page mesure
**584 px aux quatre largeurs**. Un test sur 98 en échec, deux cas sur huit.

## Pourquoi 606 était faux

La pile déclarée est
`--font-grotesk: "Helvetica Neue", Helvetica, Arial, "Liberation Sans", sans-serif`.

La station qui a produit toutes les mesures de cette spec — la machine de
l'orchestrateur — ne possède **aucune de ces quatre faces**. QA l'a prouvé
plutôt que supposé : un même texte à 100 px y mesure 2310 dans Arial, dans
Helvetica, dans Helvetica Neue, dans Liberation Sans **et dans un nom de police
inventé pour l'occasion**. Les quatre faces nommées s'y comportent exactement
comme un nom absent, et le site y est servi en DejaVu Sans.

DejaVu Sans est plus large qu'Arial à corps égal. À 1278 px, la description de
la troisième cellule passe sur une seconde ligne : `.entries` fait 169 px au
lieu de 147. L'écart est de 22 px, et 606 − 584 = 22.

L'environnement d'intégration possède Liberation Sans, métriquement compatible
avec Arial. Un visiteur réel a Helvetica ou Arial. **L'intégration continue est
donc plus proche du visiteur que la station de mesure**, et 584 est la hauteur
vraie.

## La décision

L'opérateur a tranché le 2026-09-08 : corriger le chiffre vers 584, la
recommandation de QA. Le critère 2 devient une égalité à 584 px aux quatre
largeurs, et il nomme désormais sa condition de validité — il ne vaut que
« sur un environnement qui résout réellement la pile `--font-grotesk` ».

Le seuil de 640 px que l'opérateur avait fixé n'est pas menacé : il est mieux
tenu qu'annoncé. La marge au cas le plus serré passe de 34 px à 56 px.

## Pourquoi un amendement et non une correction

Le document approuvé n'est pas modifié. Il est référencé par le plan de la spec
avec son empreinte `sha256`, et `validate-handoff` refuse tout plan dérivé
d'une proposition modifiée après approbation. Ce contrôle existe pour empêcher
qu'un périmètre signé soit réécrit après coup ; le contourner pour notre
confort aurait été en faire un contrôle décoratif.

Le document d'origine garde donc sa trace, l'erreur avec, et la correction est
datée à côté. Quelqu'un qui relira dans six mois verra les deux.

## Ce que cela change pour la suite

Une hauteur absolue en pixels ne se mesure pas n'importe où. Le test qui la
vérifie porte maintenant un témoin : il compare la pile déclarée à un nom de
police inventé et se saute lui-même, en le disant, quand les deux mesurent
pareil. Une mesure prise sur une station qui n'a pas les polices du site décrit
cette station et personne d'autre.

Trois étapes ont laissé passer 606 — ma mesure initiale, la proposition de
Product, le round que l'opérateur a approuvé — parce que toutes les trois
mesuraient au même endroit. Ce n'est pas une inattention : c'est ce qui arrive
quand la vérification partage l'angle mort de ce qu'elle vérifie.

Voir aussi [[0011-parallelisme-limite-a-un-arbre]] et
[[0014-tout-passe-par-le-cycle]].
