/*
 * Ce que le contenu porte est separe en deux : ce qui ne se traduit pas, ici,
 * et les mots, dans un fichier par langue. Un employeur, une periode, une
 * adresse, la forme d'un schema, la liste des technologies d'une mission n'ont
 * pas de version francaise et de version anglaise ; les ecrire deux fois, c'est
 * accepter qu'une date soit corrigee d'un cote et pas de l'autre. La porte
 * `duplication` l'a d'ailleurs refuse avant que ce fichier existe : les dix
 * technologies d'une ligne de parcours etaient le meme bloc dans les deux
 * langues.
 *
 * Une technologie est donc designee par un identifiant. `TERMS` donne le nom
 * de celles qui s'ecrivent pareil partout — un nom de produit ne se traduit
 * pas — et chaque langue ne traduit que le reste.
 */

type WorkId = "agent-pipeline" | "decodevoyage" | "assistants-llm" | "paiement";

type ExperienceId = "modjo" | "everest" | "cie" | "synelia";

type DiplomaId = "master-miage";

type SkillGroupId = "llm" | "platform" | "security" | "development" | "data" | "devops" | "interfaces" | "methods";

type DiagramNodePlace = {
  readonly id: string;
  readonly column: number;
  readonly row: number;
  readonly emphasis?: DiagramEmphasis;
};

type ExperienceFacts = {
  readonly id: ExperienceId;
  readonly employer: string;
  readonly period: Period;
  readonly tools: readonly string[];
};

type DiplomaFacts = {
  readonly id: DiplomaId;
  readonly year: string;
  readonly ongoing: boolean;
};

type SkillGroupFacts = {
  readonly id: SkillGroupId;
  readonly skills: readonly string[];
};

type ExperienceWords = {
  readonly role: string;
  readonly summary: string;
};

type DiplomaWords = {
  readonly degree: string;
  readonly institution: string;
};

type SkillGroupWords = {
  readonly name: string;
};

/**
 * Where a work comes from, which decides the provenance banner it carries.
 */
export type Provenance =
  | { readonly kind: "personal"; readonly openSource: boolean }
  | { readonly kind: "employer"; readonly employer: string };

/**
 * Something a work can be consulted through, when anything is consultable.
 */
export type WorkLink = { readonly kind: "code" | "demo"; readonly href: string };

/**
 * The weight a box carries in a schema: the subject it is about, or the gate on its path.
 */
export type DiagramEmphasis = "subject" | "gate";

/**
 * An arrow of a schema: a flow going forward, or the feedback that returns.
 */
export type DiagramEdge = {
  readonly from: string;
  readonly to: string;
  readonly kind: "flow" | "feedback";
};

/**
 * The shape of a schema, which is the same whatever the language.
 */
export type DiagramShape = {
  readonly nodes: readonly DiagramNodePlace[];
  readonly edges: readonly DiagramEdge[];
};

/**
 * The words one language gives a schema, one per box included.
 */
export type DiagramWords = {
  readonly alt: string;
  readonly caption: string;
  readonly source: string;
  readonly labels: Readonly<Record<string, string>>;
};

/**
 * What a work is, apart from the words that tell it.
 */
export type WorkFacts = {
  readonly id: WorkId;
  readonly provenance: Provenance;
  readonly links: readonly WorkLink[];
  readonly tools: readonly string[];
  readonly diagram?: DiagramShape;
};

/**
 * The words one language gives a work.
 */
export type WorkWords = {
  readonly title: string;
  readonly problem: string;
  readonly did: string;
  readonly result?: string;
  readonly diagram?: DiagramWords;
};

/**
 * The months a line of experience spans, its end absent while it lasts.
 */
export type Period = { readonly start: string; readonly end: string | null };

/**
 * A certification, of which the site publishes none until one is obtained.
 */
export type Certification = {
  readonly id: string;
  readonly body: string;
  readonly subject: string;
  readonly obtainedAt: string;
};

/**
 * Everything one language says, and the only thing a translation adds.
 *
 * The keys are closed: a work declared in the facts with no words in one
 * language is a compile error, not a section discovered empty in the browser.
 */
export type Words = {
  readonly works: Readonly<Record<WorkId, WorkWords>>;
  readonly experiences: Readonly<Record<ExperienceId, ExperienceWords>>;
  readonly education: Readonly<Record<DiplomaId, DiplomaWords>>;
  readonly certifications: readonly Certification[];
  readonly skills: Readonly<Record<SkillGroupId, SkillGroupWords>>;
  readonly terms: Readonly<Record<string, string>>;
};

/**
 * The technologies whose name is the same in every language.
 *
 * A language file only names the ones it changes, so a product name is
 * written once and cannot be corrected in one language alone.
 */
export const TERMS: Readonly<Record<string, string>> = {
  angular: "Angular",
  "anthropic-claude": "Anthropic Claude",
  docker: "Docker",
  flutter: "Flutter",
  "function-calling": "Function calling",
  jwt: "JWT",
  kafka: "Kafka",
  microservices: "Microservices",
  mcp: "MCP",
  mongodb: "MongoDB",
  ndjson: "NDJSON",
  nextjs: "Next.js",
  nodejs: "Node.js",
  openai: "OpenAI",
  postgresql: "PostgreSQL",
  "prompt-engineering": "Prompt engineering",
  rbac: "RBAC",
  react: "React",
  redis: "Redis",
  stripe: "Stripe",
  typescript: "TypeScript",
  uml: "UML",
};

/**
 * The works, in the order they are shown, which is chosen and never computed.
 */
export const WORKS: readonly WorkFacts[] = [
  {
    id: "agent-pipeline",
    provenance: { kind: "personal", openSource: true },
    links: [{ kind: "code", href: "https://github.com/HerbertCodex/agent-pipeline" }],
    tools: ["nodejs", "state-machine", "ndjson", "mcp", "quality-gates", "traceability", "automated-tests"],
    diagram: {
      nodes: [
        { id: "product", column: 0, row: 0 },
        { id: "code", column: 1, row: 0, emphasis: "subject" },
        { id: "review", column: 2, row: 0 },
        { id: "gates", column: 1, row: 1, emphasis: "gate" },
        { id: "closure", column: 2, row: 1 },
      ],
      edges: [
        { from: "product", to: "code", kind: "flow" },
        { from: "code", to: "review", kind: "flow" },
        { from: "code", to: "gates", kind: "flow" },
        { from: "review", to: "closure", kind: "flow" },
        { from: "gates", to: "closure", kind: "feedback" },
      ],
    },
  },
  {
    id: "decodevoyage",
    provenance: { kind: "personal", openSource: false },
    links: [{ kind: "demo", href: "https://decodevoyage.com" }],
    tools: ["specification", "technical-seo", "gdpr", "code-review", "technical-documentation"],
    diagram: {
      nodes: [
        { id: "spec", column: 0, row: 0 },
        { id: "agents", column: 1, row: 0, emphasis: "subject" },
        { id: "code", column: 2, row: 0 },
        { id: "review", column: 1, row: 1, emphasis: "gate" },
      ],
      edges: [
        { from: "spec", to: "agents", kind: "flow" },
        { from: "agents", to: "code", kind: "flow" },
        { from: "code", to: "review", kind: "flow" },
        { from: "review", to: "agents", kind: "feedback" },
      ],
    },
  },
  {
    id: "assistants-llm",
    provenance: { kind: "employer", employer: "Modjo GAIA · OloSuite" },
    links: [],
    tools: ["anthropic-claude", "openai", "rbac", "gdpr", "nextjs", "function-calling", "react", "typescript"],
    diagram: {
      nodes: [
        { id: "asker", column: 0, row: 0 },
        { id: "agent", column: 1, row: 0, emphasis: "subject" },
        { id: "answer", column: 2, row: 0 },
        { id: "rights", column: 1, row: 1, emphasis: "gate" },
        { id: "records", column: 2, row: 1 },
      ],
      edges: [
        { from: "asker", to: "agent", kind: "flow" },
        { from: "agent", to: "rights", kind: "flow" },
        { from: "rights", to: "records", kind: "flow" },
        { from: "records", to: "answer", kind: "flow" },
        { from: "agent", to: "answer", kind: "feedback" },
      ],
    },
  },
  {
    id: "paiement",
    provenance: { kind: "employer", employer: "Everest Consulting" },
    links: [],
    tools: ["kafka", "redis", "postgresql", "mongodb", "stripe"],
    diagram: {
      nodes: [
        { id: "buyer", column: 0, row: 0 },
        { id: "api", column: 1, row: 0, emphasis: "subject" },
        { id: "cache", column: 2, row: 0 },
        { id: "queue", column: 1, row: 1, emphasis: "gate" },
        { id: "store", column: 2, row: 1 },
      ],
      edges: [
        { from: "buyer", to: "api", kind: "flow" },
        { from: "api", to: "queue", kind: "flow" },
        { from: "queue", to: "store", kind: "flow" },
        { from: "api", to: "cache", kind: "feedback" },
      ],
    },
  },
];

/**
 * The lines of professional experience, the most recent first.
 */
export const EXPERIENCES: readonly ExperienceFacts[] = [
  {
    id: "modjo",
    employer: "Modjo GAIA · OloSuite",
    period: { start: "2025-05", end: "2026-08" },
    tools: [
      "anthropic-claude",
      "openai",
      "nextjs",
      "react",
      "typescript",
      "rbac",
      "gdpr",
      "prompt-engineering",
      "tenant-isolation",
      "inference-cost",
    ],
  },
  {
    id: "everest",
    employer: "Everest Consulting",
    period: { start: "2023-11", end: "2024-08" },
    tools: ["kafka", "redis", "postgresql", "mongodb", "stripe", "jwt", "microservices", "rbac"],
  },
  {
    id: "cie",
    employer: "Compagnie Ivoirienne d'Électricité",
    period: { start: "2023-08", end: "2023-10" },
    tools: ["angular", "postgresql", "docker", "uml"],
  },
  {
    id: "synelia",
    employer: "Synelia Group",
    period: { start: "2022-05", end: "2022-11" },
    tools: ["angular", "flutter", "rest-api"],
  },
];

/*
 * La licence MIAGE du CV n'est pas ici : son etablissement n'est pas connu, et
 * la regle du perimetre refuse une formation affichee avec une valeur
 * approchee. « Abidjan » est une ville, pas un etablissement. Le manque est
 * remonte a l'operateur plutot que comble.
 */
/**
 * The diplomas, the most recent first.
 */
export const EDUCATION: readonly DiplomaFacts[] = [{ id: "master-miage", year: "2026", ongoing: false }];

/*
 * Chaque competence citee ici est portee par une realisation presentee ou par
 * une ligne de parcours listee : les identifiants sont les memes, donc
 * l'adossement se verifie sans rapprocher deux chaines de caracteres. Les dix-
 * huit competences que la decision 0010 laisse sans mission ne figurent pas.
 */
/**
 * The groups the skills are shown in, in the order they are shown.
 */
export const SKILL_GROUPS: readonly SkillGroupFacts[] = [
  { id: "llm", skills: ["anthropic-claude", "openai", "prompt-engineering", "function-calling"] },
  { id: "platform", skills: ["mcp", "state-machine", "quality-gates", "traceability"] },
  { id: "security", skills: ["rbac", "tenant-isolation", "gdpr", "inference-cost"] },
  { id: "development", skills: ["typescript", "nodejs", "rest-api", "microservices"] },
  { id: "data", skills: ["postgresql", "mongodb", "redis"] },
  { id: "devops", skills: ["docker"] },
  { id: "interfaces", skills: ["react", "nextjs", "angular"] },
  { id: "methods", skills: ["automated-tests", "technical-documentation", "code-review", "specification"] },
];
