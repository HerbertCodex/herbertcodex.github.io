import { Title } from "@solidjs/meta";
import { For, Show, createUniqueId, type JSX } from "solid-js";
import { contentFor, type Journey } from "~/shared/content";
import { useI18n } from "~/shared/i18n";
import { resumeOf, type Resume } from "~/shared/resume";
import "./JourneyPage.css";

type JourneyPageProps = {
  readonly journey?: Journey;
  readonly resume?: Resume;
};

type SectionProps = {
  readonly rank: number;
  readonly name: string;
  readonly count: number;
  readonly children: JSX.Element;
};

type RowProps = {
  readonly when: string;
  readonly name: string;
  readonly detail: string;
  readonly mark?: string;
  readonly tools?: readonly string[];
};

function twoDigits(count: number): string {
  return String(count).padStart(2, "0");
}

function asMonth(value: string): string {
  return `${value.slice(5, 7)}/${value.slice(0, 4)}`;
}

function Section(props: SectionProps) {
  const named = createUniqueId();
  return (
    <section class="block" aria-labelledby={named}>
      <div class="section-head">
        <span class="num">{twoDigits(props.rank)}</span>
        <h2 id={named}>{props.name}</h2>
        <span class="count">{twoDigits(props.count)}</span>
      </div>
      {props.children}
    </section>
  );
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
 * The page presenting experience, education, certifications and skills.
 *
 * The journey and the résumé are received rather than read when they are
 * given, and read from the content and the repository otherwise. Four of the
 * rules this page owes — the role still held, the diploma being obtained, a
 * certification, a group left without a single skill — describe states no
 * real datum carries today, and a rule nothing executes is a rule nobody
 * knows is broken.
 *
 * @param props - the journey to show, and the résumé to offer, both optional
 * @returns the journey page, in the language in force
 */
export default function JourneyPage(props: JourneyPageProps) {
  const { locale, t } = useI18n();
  const journey = () => props.journey ?? contentFor(locale()).journey;
  const groups = () => journey().skills.filter((group) => group.skills.length > 0);
  const certifications = () => journey().certifications;
  const resume = () => props.resume ?? resumeOf(locale());
  const period = (start: string, end: string | null) =>
    `${asMonth(start)}–${end === null ? t("journey.present") : asMonth(end)}`;

  return (
    <main class="journey">
      <Title>{t("journey.title")}</Title>
      <h1>{t("journey.heading")}</h1>

      <Section rank={1} name={t("journey.sections.experience")} count={journey().experiences.length}>
        <ol class="rows">
          <For each={journey().experiences}>
            {(row) => (
              <Row
                when={period(row.period.start, row.period.end)}
                name={row.employer}
                detail={`${row.role}. ${row.summary}`}
                mark={row.period.end === null ? t("journey.current") : undefined}
                tools={row.tools}
              />
            )}
          </For>
        </ol>
      </Section>

      <Section rank={2} name={t("journey.sections.education")} count={journey().education.length}>
        <ol class="rows">
          <For each={journey().education}>
            {(row) => (
              <Row
                when={row.year}
                name={row.degree}
                detail={row.institution}
                mark={row.ongoing ? t("journey.ongoing") : undefined}
              />
            )}
          </For>
        </ol>
      </Section>

      <Show when={certifications().length > 0}>
        <Section rank={3} name={t("journey.sections.certifications")} count={certifications().length}>
          <ol class="rows">
            <For each={certifications()}>
              {(row) => <Row when={row.obtainedAt} name={row.body} detail={row.subject} />}
            </For>
          </ol>
        </Section>
      </Show>

      <Section
        rank={certifications().length > 0 ? 4 : 3}
        name={t("journey.sections.skills")}
        count={groups().reduce((total, group) => total + group.skills.length, 0)}
      >
        <div class="skills">
          <For each={groups()}>
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
    </main>
  );
}
