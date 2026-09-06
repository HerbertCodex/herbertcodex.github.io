import type { Locale } from "./i18n";
import { ENGLISH } from "./content/en";
import { FRENCH } from "./content/fr";
import {
  EDUCATION,
  EXPERIENCES,
  SKILL_GROUPS,
  TERMS,
  WORKS,
  type Certification,
  type DiagramEdge,
  type DiagramEmphasis,
  type DiagramShape,
  type DiagramWords,
  type Period,
  type Provenance,
  type WorkFacts,
  type WorkLink,
  type Words,
  type WorkWords,
} from "./content/facts";

/**
 * A box of a schema, ready to draw: its place, and the word it carries here.
 */
type DiagramNode = {
  readonly id: string;
  readonly label: string;
  readonly column: number;
  readonly row: number;
  readonly emphasis?: DiagramEmphasis;
};

/**
 * The schema that stands in for the screenshot a work does not have.
 */
type Diagram = {
  readonly alt: string;
  readonly caption: string;
  readonly source: string;
  readonly nodes: readonly DiagramNode[];
  readonly edges: readonly DiagramEdge[];
};

/**
 * One work, in the language in force.
 */
export type Work = {
  readonly id: string;
  readonly provenance: Provenance;
  readonly links: readonly WorkLink[];
  readonly title: string;
  readonly problem: string;
  readonly did: string;
  readonly result?: string;
  readonly tools: readonly string[];
  readonly diagram?: Diagram;
};

/**
 * One line of professional experience, in the language in force.
 */
type Experience = {
  readonly id: string;
  readonly employer: string;
  readonly period: Period;
  readonly role: string;
  readonly summary: string;
  readonly tools: readonly string[];
};

/**
 * One diploma, in the language in force.
 */
type Diploma = {
  readonly id: string;
  readonly year: string;
  readonly ongoing: boolean;
  readonly degree: string;
  readonly institution: string;
};

/**
 * One group of skills, in the language in force.
 */
type SkillGroup = {
  readonly id: string;
  readonly name: string;
  readonly skills: readonly string[];
};

/**
 * What the journey page tells: experience, education, certifications, skills.
 */
type Journey = {
  readonly experiences: readonly Experience[];
  readonly education: readonly Diploma[];
  readonly certifications: readonly Certification[];
  readonly skills: readonly SkillGroup[];
};

/**
 * The editorial content of the site in one language.
 */
export type Content = {
  readonly works: readonly Work[];
  readonly journey: Journey;
};

function blank(value: unknown): boolean {
  return typeof value !== "string" || value.trim().length === 0;
}

function blankAmong(at: string, fields: Readonly<Record<string, unknown>>): string[] {
  return Object.entries(fields)
    .filter(([, value]) => blank(value))
    .map(([name]) => `${at}.${name}`);
}

function faultsOfList(at: string, name: string, items: readonly string[] | undefined): string[] {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return [`${at}.${name}`];
  return list.flatMap((item, rank) => (blank(item) ? [`${at}.${name}[${rank}]`] : []));
}

function faultsOfDiagram(diagram: Diagram, at: string): string[] {
  const nodes = diagram.nodes ?? [];
  const faults = blankAmong(at, { alt: diagram.alt, caption: diagram.caption, source: diagram.source });
  if (nodes.length === 0) faults.push(`${at}.nodes`);
  const drawn = new Set(nodes.map((node) => node.id));
  nodes.forEach((node, rank) => {
    if (blank(node.label)) faults.push(`${at}.nodes[${rank}].label`);
  });
  (diagram.edges ?? []).forEach((edge, rank) => {
    if (!drawn.has(edge.from) || !drawn.has(edge.to)) faults.push(`${at}.edges[${rank}]`);
  });
  return faults;
}

function faultsOfWork(work: Work, at: string): string[] {
  const faults = blankAmong(at, { id: work.id, title: work.title, problem: work.problem, did: work.did });
  if (work.result !== undefined && blank(work.result)) faults.push(`${at}.result`);
  faults.push(...faultsOfList(at, "tools", work.tools));
  if (work.diagram !== undefined) faults.push(...faultsOfDiagram(work.diagram, `${at}.diagram`));
  return faults;
}

function faultsOfJourney(journey: Journey, at: string): string[] {
  const faults: string[] = [];
  journey.experiences.forEach((row, rank) => {
    const where = `${at}.experiences[${rank}]`;
    faults.push(...blankAmong(where, { id: row.id, employer: row.employer, role: row.role, summary: row.summary }));
    if (blank(row.period?.start)) faults.push(`${where}.period.start`);
    faults.push(...faultsOfList(where, "tools", row.tools));
  });
  journey.education.forEach((row, rank) => {
    const where = `${at}.education[${rank}]`;
    faults.push(...blankAmong(where, { id: row.id, degree: row.degree, institution: row.institution, year: row.year }));
  });
  journey.certifications.forEach((row, rank) => {
    const where = `${at}.certifications[${rank}]`;
    faults.push(...blankAmong(where, { id: row.id, body: row.body, subject: row.subject, obtainedAt: row.obtainedAt }));
  });
  journey.skills.forEach((group, rank) => {
    const where = `${at}.skills[${rank}]`;
    faults.push(...blankAmong(where, { id: group.id, name: group.name }));
    faults.push(...faultsOfList(where, "skills", group.skills));
  });
  return faults;
}

/**
 * The required fields a content document leaves absent, blank or empty.
 *
 * A field is refused rather than displayed empty. On a portfolio an empty
 * section is read as a statement about the person, not about the file, and no
 * command can tell the two apart once the page is published.
 *
 * @param content - the document to inspect
 * @returns one path per field at fault, an empty list when the document is complete
 */
export function missingRequiredFields(content: Content): string[] {
  return [
    ...content.works.flatMap((work, rank) => faultsOfWork(work, `works[${rank}]`)),
    ...faultsOfJourney(content.journey, "journey"),
  ];
}

function diagramOf(shape: DiagramShape, said: DiagramWords): Diagram {
  return {
    alt: said.alt,
    caption: said.caption,
    source: said.source,
    nodes: shape.nodes.map((node) => ({ ...node, label: said.labels[node.id] })),
    edges: shape.edges,
  };
}

function workOf(facts: WorkFacts, said: WorkWords, named: (term: string) => string): Work {
  const shape = facts.diagram;
  const drawn = said.diagram;
  return {
    id: facts.id,
    provenance: facts.provenance,
    links: facts.links,
    title: said.title,
    problem: said.problem,
    did: said.did,
    result: said.result,
    tools: facts.tools.map(named),
    diagram: shape === undefined || drawn === undefined ? undefined : diagramOf(shape, drawn),
  };
}

function documentOf(words: Words): Content {
  const named = (term: string): string => words.terms[term] ?? TERMS[term];
  return {
    works: WORKS.map((facts) => workOf(facts, words.works[facts.id], named)),
    journey: {
      experiences: EXPERIENCES.map((facts) => ({
        ...facts,
        ...words.experiences[facts.id],
        tools: facts.tools.map(named),
      })),
      education: EDUCATION.map((facts) => ({ ...facts, ...words.education[facts.id] })),
      certifications: words.certifications,
      skills: SKILL_GROUPS.map((facts) => ({
        id: facts.id,
        name: words.skills[facts.id].name,
        skills: facts.skills.map(named),
      })),
    },
  };
}

const DOCUMENTS: Readonly<Record<Locale, Content>> = { fr: documentOf(FRENCH), en: documentOf(ENGLISH) };

/*
 * Le refus est prononce au chargement du module, pas a l'affichage : attendre
 * le rendu reviendrait a publier la section vide et a la decouvrir sur le
 * site. Un champ obligatoire vide fait donc echouer l'import, et `test_unit`
 * refuse a chaque poussee.
 *
 * Mesure le 2026-09-06, legende de schema videe : la suite unitaire sort en 1
 * et nomme fr.works[0].diagram.caption, tandis que `build` sort en 0 — aucune
 * page n'importe encore ce module, donc le prerendu ne l'evalue jamais. Le
 * refus a la construction s'ajoutera des que la page des realisations
 * consommera le contenu ; il n'est pas acquis aujourd'hui, et l'ecrire ici
 * comme s'il l'etait serait une assurance fausse.
 */
const INCOMPLETE = Object.entries(DOCUMENTS).flatMap(([locale, document]) =>
  missingRequiredFields(document).map((field) => `${locale}.${field}`),
);
if (INCOMPLETE.length > 0) {
  throw new Error(`le contenu éditorial laisse des champs obligatoires vides : ${INCOMPLETE.join(", ")}`);
}

/**
 * The editorial content of one language.
 *
 * @param locale - the language in force
 * @returns the works and the journey, in that language
 */
export function contentFor(locale: Locale): Content {
  return DOCUMENTS[locale];
}
