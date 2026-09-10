import { For, Show, createUniqueId, type JSX } from "solid-js";
import SectionHead from "~/shared/SectionHead";
import { contentFor, type Journey } from "~/shared/content";
import { useI18n } from "~/shared/i18n";
import { resumeOf, type Resume } from "~/shared/resume";
import "./JourneySection.css";

type JourneySectionProps = {
  readonly from: number;
  readonly anchor: string;
  readonly journey?: Journey;
  readonly resume?: Resume;
};

type SectionProps = {
  readonly rank: number;
  readonly name: string;
  readonly headingId: string;
  readonly count: number;
  readonly children: JSX.Element;
};

type Period = (start: string, end: string | null) => string;

type RowProps = {
  readonly when: string;
  readonly name: string;
  readonly detail: string;
  readonly mark?: string;
  readonly tools?: readonly string[];
};

function asMonth(value: string): string {
  return `${value.slice(5, 7)}/${value.slice(0, 4)}`;
}

function Section(props: SectionProps) {
  return (
    <section class="block" aria-labelledby={props.headingId}>
      <SectionHead rank={props.rank} name={props.name} headingId={props.headingId} count={props.count} />
      {props.children}
    </section>
  );
}

/**
 * A list of rows, built from a list of anything by the way to read one.
 *
 * The three lists of the journey wrote the same four-line scaffold around their
 * own mapping, and `duplication` refused it rightly: the scaffold is what they
 * share, the mapping is what distinguishes them.
 *
 * @param props - the items, and how one becomes a row
 * @returns the ordered list of rows
 */
function Rows<T>(props: { readonly of: readonly T[]; readonly as: (item: T) => RowProps }) {
  return (
    <ol class="rows">
      <For each={props.of}>{(item) => <Row {...props.as(item)} />}</For>
    </ol>
  );
}

/**
 * The roles held, most recent first, as the content declares them.
 *
 * @param props - the journey to read, and how to write a period
 * @returns the rows of the experience section
 */
function Experiences(props: { readonly journey: Journey; readonly period: Period; readonly current: string }) {
  return (
    <Rows
      of={props.journey.experiences}
      as={(row) => ({
        when: props.period(row.period.start, row.period.end),
        name: row.employer,
        detail: `${row.role}. ${row.summary}`,
        mark: row.period.end === null ? props.current : undefined,
        tools: row.tools,
      })}
    />
  );
}

/**
 * The diplomas obtained, and the one being obtained.
 *
 * @param props - the journey to read, and how to mark an ongoing diploma
 * @returns the rows of the education section
 */
function Education(props: { readonly journey: Journey; readonly ongoing: string }) {
  return (
    <Rows
      of={props.journey.education}
      as={(row) => ({
        when: row.year,
        name: row.degree,
        detail: row.institution,
        mark: row.ongoing ? props.ongoing : undefined,
      })}
    />
  );
}

/**
 * The skills, by group, each group naming itself.
 *
 * @param props - the groups to show, already emptied of the ones holding nothing
 * @returns the body of the skills section
 */
function Skills(props: { readonly groups: Journey["skills"] }) {
  return (
    <div class="skills">
      <For each={props.groups}>
        {(group) => (
          <div class="skill">
            <h3>{group.name}</h3>
            <div class="used">
              <For each={group.skills}>{(skill) => <span>{skill}</span>}</For>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}

/**
 * How many section heads the journey draws for a given journey.
 *
 * The page needs it to number what comes AFTER: the certifications appear only
 * when there is one, so the rank of the contact section cannot be written down
 * once and for all.
 *
 * @param journey - the journey to be shown
 * @returns the number of sections, certifications counted only when present
 */
export function journeyHeadCount(journey: Journey): number {
  return journey.certifications.length > 0 ? 4 : 3;
}

function Row(props: RowProps) {
  return (
    <li class="row" classList={{ current: props.mark !== undefined }}>
      <span class="when">{props.when}</span>
      <span class="rail" aria-hidden="true" />
      <div>
        <strong>{props.name}</strong>
        <Show when={props.mark}>{(mark) => <span class="ongoing">{mark()}</span>}</Show>
        <p>{props.detail}</p>
      </div>
      <Show when={props.tools}>
        {(tools) => (
          <div class="used">
            <For each={tools()}>{(tool) => <span>{tool}</span>}</For>
          </div>
        )}
      </Show>
    </li>
  );
}

/**
 * The sections presenting experience, education, certifications and skills.
 *
 * The journey and the résumé are received rather than read when they are
 * given, and read from the content and the repository otherwise. Four of the
 * rules this page owes — the role still held, the diploma being obtained, a
 * certification, a group left without a single skill — describe states no
 * real datum carries today, and a rule nothing executes is a rule nobody
 * knows is broken.
 *
 * @param props - the rank to start numbering at, the anchor the menu points
 *   to, and optionally the journey to show and the résumé to offer
 * @returns the journey sections, in the language in force
 */
export default function JourneySection(props: JourneySectionProps) {
  const { locale, t } = useI18n();
  const journey = () => props.journey ?? contentFor(locale()).journey;
  const groups = () => journey().skills.filter((group) => group.skills.length > 0);
  const certifications = () => journey().certifications;
  const resume = () => props.resume ?? resumeOf(locale());
  const period = (start: string, end: string | null) =>
    `${asMonth(start)}–${end === null ? t("journey.present") : asMonth(end)}`;

  const named = { education: createUniqueId(), certifications: createUniqueId(), skills: createUniqueId() };

  return (
    <div class="journey">
      <Section
        rank={props.from}
        name={t("journey.sections.experience")}
        headingId={props.anchor}
        count={journey().experiences.length}
      >
        <Experiences journey={journey()} period={period} current={t("journey.current")} />
      </Section>

      <Section
        rank={props.from + 1}
        name={t("journey.sections.education")}
        headingId={named.education}
        count={journey().education.length}
      >
        <Education journey={journey()} ongoing={t("journey.ongoing")} />
      </Section>

      <Show when={certifications().length > 0}>
        <Section
          rank={props.from + 2}
          name={t("journey.sections.certifications")}
          headingId={named.certifications}
          count={certifications().length}
        >
          <Rows of={certifications()} as={(row) => ({ when: row.obtainedAt, name: row.body, detail: row.subject })} />
        </Section>
      </Show>

      <Section
        rank={props.from + journeyHeadCount(journey()) - 1}
        name={t("journey.sections.skills")}
        headingId={named.skills}
        count={groups().reduce((total, group) => total + group.skills.length, 0)}
      >
        <Skills groups={groups()} />
      </Section>

      <Show when={resume()}>
        {(found) => (
          <div class="links">
            <a href={found().href} download="">
              {t("journey.resume")}
            </a>
          </div>
        )}
      </Show>
    </div>
  );
}
