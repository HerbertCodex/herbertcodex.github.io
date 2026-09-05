# 0010 — Le portfolio dit ce que le CV dit : IA agentique

- **Date** : 2026-09-05
- **Statut** : accepté, tranché par l'opérateur sur pièce
- **Remplace** : le positionnement « ingénieur back-end » de la maquette validée

## Ce qui a déclenché la révision

L'opérateur a fourni son CV. La maquette et lui ne disaient pas la même chose.

La maquette annonçait « Ingénieur logiciel » et présentait quatre réalisations
back-end. Le CV annonce :

> Développeur · Intégrateur IA Générative · Agents et assistants LLM en
> production · Auteur d'une pipeline d'orchestration multi-agents

Un recruteur qui lit les deux voit l'écart, et l'écart coûte plus qu'un
positionnement imparfait : il fait douter des deux.

Trois autres contradictions sont apparues à la lecture :

- les quatre « réalisations » de la maquette venaient du salariat, pas de
  projets personnels ; le CV n'en compte que deux, `agent-pipeline` et
  `decodevoyage.com` ;
- l'employeur « CIE DSTD » n'existe pas : c'est la Compagnie Ivoirienne
  d'Électricité, et la période était fausse d'un mois ;
- la ligne 2024-2026 marquée « à compléter » est en réalité Modjo GAIA ·
  OloSuite, mai 2025 à août 2026.

## Décision

**Le portfolio suit le CV.** `agent-pipeline` devient la première réalisation,
et le back-end reste comme socle plutôt que comme argument.

Le titre passe de « Ingénieur logiciel » à « Agents LLM en production ».

Les quatre réalisations deviennent, dans cet ordre : `agent-pipeline`,
`decodevoyage.com`, les assistants LLM livrés chez Modjo GAIA, et le
microservice de paiement d'Everest Consulting. Chacune garde son bandeau de
provenance — « projet personnel » ou « en entreprise, <employeur> » — parce
qu'un travail salarié n'a pas moins de valeur, il en a souvent plus : il a
servi à quelqu'un.

## Le parti pris graphique ne change pas, il se justifie mieux

La maquette repose sur une idée : ce que cette personne construit n'a pas
d'écran, donc on montre le schéma de ce que ça fait plutôt qu'une capture.

Cette idée avait été trouvée pour du back-end. Elle est **plus juste** pour de
l'agentique : un agent, une machine d'état, une file de messages ne se
photographient pas davantage. Les quatre schémas montrent désormais un cycle
d'issue, une boucle de revue, le chemin d'une demande à travers un contrôle de
droits, et un flux de paiement.

Et la page se démontre elle-même : **elle est construite par `agent-pipeline`,
qui est la première réalisation qu'elle présente.** Aucune capture d'écran ne
dirait cela.

## Ce qui reste faux tant que l'opérateur n'a pas répondu

Dix-huit compétences annoncées ne sont adossées à aucun projet ni aucune
expérience de la page, parce que le CV les liste sans les attribuer à une
mission :

```
RAG, Bases vectorielles, LangChain, LangGraph, Row Level Security,
Python, FastAPI, Flask, NestJS, Express, Java, SQL,
Kubernetes, GitLab CI, GitHub Actions, Observabilité, TDD, BDD
```

Rien n'a été deviné : chaque technologie ajoutée à une ligne d'expérience est
reprise textuellement d'une puce du CV. Placer les dix-huit restantes demande
une information que seul l'opérateur détient.

La règle du périmètre — toute compétence annoncée est adossée à un projet
présenté ou à une expérience listée — n'est donc **pas encore satisfaite**, et
c'est voulu : elle mesure un manque réel au lieu de le masquer.

## Amendement du 2026-09-05 — le titre affiché

Cette décision disait « le portfolio suit le CV », et le CV s'ouvre sur
« Développeur ». Le titre affiché est pourtant **« Ingénieur logiciel »**,
choisi par l'opérateur après avoir entendu la réserve.

L'amendement est écrit ici parce que le rôle Produit a signalé deux fois que le
journal contredisait la maquette. Une décision consignée qui ne dit pas ce que
le produit fait est pire qu'une décision absente : elle donne l'assurance
qu'un choix a été pesé, à un endroit qui ne décrit plus rien.

**Ce qui suit le CV** : le positionnement, l'ordre des réalisations, les
employeurs, les périodes, les compétences. **Ce qui ne le suit pas** : le seul
titre affiché. La réserve tient — un recruteur qui lit les deux verra l'écart —
et l'opérateur l'a tranchée en connaissance de cause.
