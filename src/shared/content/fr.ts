import type { Words } from "./facts";

/*
 * Une ligne de resultat n'est presente que lorsqu'un resultat reel existe.
 * Trois des quatre realisations n'en portent pas : la maquette y ecrivait un
 * emplacement d'attente, et un ordre de grandeur vraisemblable passerait toutes
 * les portes de ce depot sans etre vrai pour autant.
 */

/**
 * Everything the site says in French.
 */
export const FRENCH: Words = {
  works: {
    "agent-pipeline": {
      title: "agent-pipeline : orchestration multi-agents",
      problem:
        "Un développement assisté par IA produit vite et sans trace. Rien ne dit qui a décidé quoi, ni ce qui a " +
        "été vérifié avant que le code entre.",
      did:
        "Séparé les rôles — Produit définit, l'implémenteur écrit, QA valide sans écrire, l'orchestrateur contrôle " +
        "les transitions. Une machine d'état borne les mouvements, des portes exécutables refusent, et chaque " +
        "preuve est attachée à un commit par son empreinte.",
      result:
        "Cette page en est la démonstration : elle est construite par cette pipeline, et chaque décision de sa " +
        "conception est écrite dans son journal.",
      diagram: {
        alt:
          "Le rôle Produit définit, le code est écrit, la revue valide, la clôture enregistre. Les portes de " +
          "qualité s'interposent et peuvent renvoyer le travail en arrière.",
        caption: "Un cycle d'issue",
        source: "Node.js, MIT",
        labels: { product: "PRODUIT", code: "CODE", review: "REVUE", gates: "PORTES", closure: "CLÔTURE" },
      },
    },
    decodevoyage: {
      title: "decodevoyage.com, livré en pilotant des agents",
      problem:
        "Livrer seul une application publique complète : architecture, modèles de domaine, référencement, " +
        "conformité.",
      did:
        "Écrit les spécifications et l'architecture, puis piloté des agents de code pour la mise en œuvre, avec " +
        "revue critique de ce qu'ils produisaient plutôt qu'acceptation.",
      diagram: {
        alt:
          "Une spécification alimente des agents de code, qui produisent du code, lequel passe en revue critique " +
          "avant de repartir vers les agents.",
        caption: "Piloter plutôt qu'écrire",
        source: "Revue critique",
        labels: { spec: "SPEC", agents: "AGENTS", code: "CODE", review: "REVUE" },
      },
    },
    "assistants-llm": {
      title: "Assistants et agents LLM en production",
      problem:
        "Un assistant qui lit les données d'une entreprise doit ne lire que celles auxquelles son utilisateur a " +
        "droit, et ne jamais laisser fuiter celles d'un autre client.",
      did:
        "Placé le contrôle des droits sur le chemin de la donnée plutôt qu'à côté : cloisonnement entre clients, " +
        "contrôle par rôle, traçabilité des sources citées. Puis suivi des usages et du coût d'inférence, et " +
        "itérations à partir des retours utilisateurs.",
      diagram: {
        alt:
          "Une demande d'un utilisateur métier entre dans l'agent, passe par le contrôle des droits, atteint les " +
          "données de son entreprise, et la réponse remonte.",
        caption: "Chemin d'une demande",
        source: "OpenAI, Claude",
        labels: { asker: "MÉTIER", agent: "AGENT", answer: "RÉPONSE", rights: "DROITS", records: "DONNÉES" },
      },
    },
    paiement: {
      title: "Microservice de paiement",
      problem:
        "Chaque paiement bloquait la commande jusqu'à la réponse de la banque. Quand un service tombait, les " +
        "commandes en cours étaient perdues.",
      did:
        "Placé une file de messages entre l'interface et les traitements : la commande est acceptée tout de suite, " +
        "traitée ensuite, et rien ne disparaît si un service redémarre. Architecture en couches, séparation " +
        "stricte du domaine et de l'accès aux données.",
      diagram: {
        alt:
          "Une commande passe par l'API, entre dans une file de messages, puis est écrite en base. Le cache " +
          "répond directement aux lectures.",
        caption: "Flux d'un paiement",
        source: "Kafka, Redis",
        labels: { buyer: "CLIENT", api: "API", cache: "CACHE", queue: "FILE", store: "BASE" },
      },
    },
  },
  experiences: {
    modjo: {
      role: "Développeur, agents et assistants LLM en production",
      summary:
        "Éditeur SaaS. Assistants branchés sur les données des clients, avec cloisonnement entre clients et " +
        "contrôle par rôle sur le chemin de la donnée, puis suivi des usages et du coût d'inférence.",
    },
    everest: {
      role: "Développeur back-end",
      summary:
        "Microservices métier : paiement, file de messages entre les services, séparation stricte du domaine et " +
        "de l'accès aux données.",
    },
    cie: {
      role: "Développeur fullstack Angular",
      summary:
        "Applications métier d'un opérateur national d'électricité : modélisation, base de données et interfaces.",
    },
    synelia: {
      role: "Développeur front-end Angular",
      summary: "Interfaces web et contribution à une application mobile.",
    },
  },
  education: {
    "master-miage": {
      degree: "Master MIAGE, parcours DLIS",
      institution: "Université de Rennes — développement des logiciels et intégration de systèmes",
    },
    "licence-miage": { degree: "Licence MIAGE", institution: "Université Félix Houphouët-Boigny, Abidjan" },
  },
  certifications: [],
  skills: {
    llm: { name: "Agents & assistants LLM" },
    platform: { name: "Plateforme agentique" },
    security: { name: "Sécurité & gouvernance" },
    development: { name: "Développement" },
    data: { name: "Données" },
    devops: { name: "DevOps" },
    interfaces: { name: "Interfaces" },
    methods: { name: "Méthodes" },
  },
  terms: {
    "automated-tests": "Tests automatisés",
    "code-review": "Revue de code",
    gdpr: "RGPD",
    "inference-cost": "Coûts d'inférence",
    "quality-gates": "Portes de qualité",
    "rest-api": "API REST",
    specification: "Spécification",
    "state-machine": "Machine d'état",
    "technical-documentation": "Documentation technique",
    "technical-seo": "SEO technique",
    "tenant-isolation": "Cloisonnement",
    traceability: "Traçabilité",
  },
};
