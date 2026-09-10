# 0019 — La marque du menu suit la lecture, par une ligne

- **Date** : 2026-09-10
- **Statut** : accepté, demandé par l'opérateur
- **Portée** : la barre du site ; révise le point 7 de la décision 0018

## Contexte

La décision 0018 a ramené le site sur une page unique et retiré le marqueur du
menu, en écrivant qu'un marqueur suivant la section visible **serait une
fonctionnalité de plus, à demander**. Elle a d'abord été rebranchée sur
l'**ancre de l'adresse** : la marque se posait au clic, sur un lien partagé et
au retour arrière.

L'opérateur l'a lue et a demandé la suite : « quand je scrolle, la barre orange
doit se déplacer aussi ; actuellement tant que je ne clique pas, ça ne change
pas. »

## Décision

**La marque suit ce qui est lu, décidé par une ligne de lecture.**

> La section en force est la **dernière dont le titre est passé au-dessus de la
> ligne de lecture**.

Trois choses en découlent, et chacune a été mesurée plutôt que supposée.

### La ligne n'est pas un nombre choisi

C'est `scroll-padding-top` — la réserve que `src/shared/SiteBar.css` garde déjà
sous la barre restée en haut, et qui vaut 144 px ou 208 px selon la fenêtre.

C'est **exactement là que le navigateur pose un titre sur lequel on vient de
cliquer**. Cliquer et défiler s'accordent donc par construction, et non par
coïncidence ; et la ligne suit la réserve le jour où une requête de média la
déplace. Un nombre écrit dans le composant aurait été un second réglage à tenir
d'accord avec le premier.

### Rien n'est marqué en haut de la page

L'ouverture — le nom, la phrase, la rangée de faits — n'appartient à aucune
section. Un menu qui marquerait « Réalisations » avant que le lecteur y soit
arrivé dirait faux.

### Le bas de la page est le seul cas que la ligne ne tranche pas

**Mesuré** : à 1440 px de large, il manque 314 px de défilement pour amener le
titre du contact sur la ligne. La dernière section ne peut donc **jamais**
l'atteindre, et sans ce cas elle n'aurait jamais été marquée.

La règle ajoutée est celle du lecteur, pas celle de la géométrie : **arrivé en
bas, on lit la fin**, donc la dernière section.

## Ce qui est écarté

- **`IntersectionObserver`.** Il répond « cet élément touche cette bande », et
  la question posée est « quelle section est lue ». Il faut alors choisir une
  bande, arbitrer quand deux sections s'y trouvent, et traiter le cas où aucune
  ne s'y trouve — trois réglages là où la ligne n'en demande aucun.
- **Retenir le dernier clic.** C'est ce que faisait la version précédente. Une
  marque gardée de notre côté finit par contredire ce que le lecteur voit dès
  qu'il défile.

## Coût

Un écouteur de défilement passif, dont la lecture est ramenée à **une par image**
par `requestAnimationFrame` : un événement de défilement arrive des dizaines de
fois par seconde, et mesurer une position à chaque fois ferait recalculer la
mise en page autant de fois. La lecture elle-même est trois `getBoundingClientRect`
et un `getComputedStyle`.

## Ce qui le prouve

`tests/e2e/menu-ancres.spec.ts`, neuf assertions, dont trois nouvelles : la
marque suit le défilement **sans aucun clic** dans les deux langues, elle
disparaît en haut de la page, et c'est la dernière section qui est marquée en
bas. Les assertions **attendent** la marque au lieu de la lire aussitôt : elle
est le résultat d'un défilement et d'une image d'animation.

Morsures vérifiées : sans le cas du bas de page, trois assertions tombent ;
sans l'écoute du défilement, trois aussi.

Voir aussi [[0018-une-page-par-langue]].
