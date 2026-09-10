# 0020 — Le menu nomme les sections, pas les anciennes adresses

- **Date** : 2026-09-10
- **Statut** : accepté, signalé par l'opérateur
- **Portée** : la barre du site ; complète les décisions 0018 et 0019

## Contexte

La page montre **cinq** sections numérotées — `01 Réalisations`, `02
Expérience`, `03 Formation`, `04 Compétences`, `05 Contact`. Le menu en nommait
**trois** : Réalisations, Parcours, Contact.

Deux de ces trois noms étaient justes. Le troisième, « Parcours », **ne
correspondait à aucun titre de la page** : c'était le nom de l'adresse
`/fr/parcours`, gardé après que l'adresse eut cessé d'être une page. Un lecteur
qui cherchait « Compétences » dans le menu ne le trouvait pas, et celui qui
actionnait « Parcours » atterrissait sur un titre nommé « Expérience ».

L'opérateur l'a lu sur le site publié : « il y a Expérience et Compétences qui
manquent du menu ».

## Décision

**Le menu nomme les sections que la page montre**, et une table les déclare :
`SECTIONS`, dans `src/shared/pages.ts`.

```
Réalisations   #realisations   #work
Expérience     #experience     #experience
Formation      #formation      #education
Compétences    #competences    #skills
Contact        #contact        #contact
```

Trois choses en découlent.

### Aucun libellé n'est écrit deux fois

Les deux sections qui portaient une adresse — `works` et `contact` — prennent
leurs noms de la table des adresses plutôt que de les réécrire. Les trois autres
prennent leur libellé **de leur propre titre** : la même entrée de dictionnaire
sert le menu et le bandeau de section, donc les deux ne peuvent pas dire
autrement. Le type `Said` a été exporté pour que la table déclare _quelle
phrase_ elle nomme, et non la phrase elle-même — une déclaration qu'un compilateur
peut refuser.

### `#parcours` reste, et ne sert plus le menu

L'adresse `/fr/parcours` a été partagée : elle doit continuer de conduire
quelque part. Son ancre nomme désormais le **groupe** des trois sections du
parcours, porté par leur conteneur. Le menu, lui, ne la nomme plus.

### Les certifications ne sont pas dans le menu

Cette section n'existe **que s'il y a une certification à montrer**. Un lien de
menu conduisant à rien serait pire qu'une section non nommée. Elle reste entre
Formation et Compétences, numérotée avec les autres.

## Ce que ça coûte, mesuré

La barre grandit, et il faut le dire :

| largeur | barre avant | barre après | réserve avant | réserve après |
| ------- | ----------- | ----------- | ------------- | ------------- |
| 320 px  | 186 px      | **226 px**  | 208 px        | **240 px**    |
| 375 px  | 186 px      | 186 px      | 208 px        | 240 px        |
| 768 px  | 72 px       | **112 px**  | 144 px        | **160 px**    |
| 1440 px | 72 px       | 72 px       | 144 px        | 160 px        |

`scroll-padding-top` — la réserve que le navigateur garde libre au-dessus de ce
vers quoi il conduit — **devait** monter : à 320 px, la barre de 226 px aurait
recouvert un titre posé à 208 px, ce qui est exactement le défaut que cette
réserve existe pour empêcher. Vérifié aux six largeurs après le changement : le
titre cliqué se pose à 240 px ou à 160 px, toujours sous la barre.

Sur un téléphone de 320 px, la barre occupe donc un quart de l'écran. C'est le
prix d'un menu qui nomme tout, et il est assumé plutôt que découvert.

## Ce qui le prouve

`tests/e2e/menu-ancres.spec.ts` lit la table `SECTIONS` : le menu porte
exactement ses ancres, chacune désigne un élément qui existe, et la marque suit
les cinq. `tests/e2e/adressage.spec.ts` continue d'exiger que les six anciennes
adresses conduisent à une ancre existante — `#parcours` comprise.

Voir aussi [[0018-une-page-par-langue]] et [[0019-la-marque-suit-la-lecture]].
