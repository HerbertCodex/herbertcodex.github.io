import { For, Show } from "solid-js";
import { useI18n } from "~/shared/i18n";
import type { Work } from "~/shared/content";
import "./WorkCard.css";

type Diagram = NonNullable<Work["diagram"]>;

type Box = Diagram["nodes"][number];

type Wire = { readonly d: string; readonly kind: "flow" | "feedback" };

type Line = { readonly term: string; readonly text: string; readonly tone: string };

/*
 * La grille du schema, en unites du viewBox. Les trois colonnes et les deux
 * rangees sont les seules places disponibles : un schema de flux se lit parce
 * que toutes les boites sont alignees, et laisser le contenu poser des
 * coordonnees libres rendrait chaque schema legerement different des autres.
 */
const COLUMN_X = [15, 145, 290];
const ROW_Y = [40, 125];
const BOX_W = 80;
const BOX_H = 36;
const CAP_Y = 23;
const PACKET_R = 5;
const VIEW_BOX = "0 0 420 200";

const FILL: Readonly<Record<string, string>> = { subject: "node-fill", gate: "node-accent" };

/*
 * Le decalage de depart de chaque point qui circule. Lances ensemble, ils
 * forment une pulsation ; decales, ils se lisent comme un trafic.
 */
const STAGGER = ["", "packet-2", "packet-3", "packet-slow"];

function placeOf(box: Box) {
  const x = COLUMN_X[box.column];
  const y = ROW_Y[box.row];
  return { x, y, cx: x + BOX_W / 2, cy: y + BOX_H / 2 };
}

function pathOf(from: Box, to: Box): string {
  const a = placeOf(from);
  const b = placeOf(to);
  if (from.row === to.row) {
    return `M ${b.cx > a.cx ? a.x + BOX_W : a.x} ${a.cy} H ${b.cx > a.cx ? b.x : b.x + BOX_W}`;
  }
  const leaves = b.cy > a.cy ? a.y + BOX_H : a.y;
  if (from.column === to.column) {
    return `M ${a.cx} ${leaves} V ${b.cy > a.cy ? b.y : b.y + BOX_H}`;
  }
  return `M ${a.cx} ${leaves} V ${b.cy} H ${b.cx > a.cx ? b.x : b.x + BOX_W}`;
}

/*
 * Une arete dont une extremite ne designe aucune boite est ecartee plutot que
 * tracee au hasard : un trait partant du coin superieur gauche se lit comme un
 * flux, alors qu'il ne dit rien. Le contenu refuse deja ce cas au chargement ;
 * ceci est le refus cote rendu, la ou la valeur arrive.
 */
function wiresOf(diagram: Diagram): Wire[] {
  const placed = new Map(diagram.nodes.map((box) => [box.id, box]));
  return diagram.edges.flatMap((edge) => {
    const from = placed.get(edge.from);
    const to = placed.get(edge.to);
    return from === undefined || to === undefined ? [] : [{ d: pathOf(from, to), kind: edge.kind }];
  });
}

function Schema(props: { readonly diagram: Diagram }) {
  const wires = () => wiresOf(props.diagram);
  return (
    <figure class="diagram">
      <svg viewBox={VIEW_BOX} role="img" aria-label={props.diagram.alt}>
        <For each={wires()}>{(wire) => <path class={wire.kind === "flow" ? "edge" : "edge-dash"} d={wire.d} />}</For>
        <For each={props.diagram.nodes}>
          {(box) => (
            <>
              <rect
                class={FILL[box.emphasis ?? ""] ?? "node"}
                x={placeOf(box).x}
                y={placeOf(box).y}
                width={BOX_W}
                height={BOX_H}
              />
              <text
                class={box.emphasis === undefined ? "cap" : "cap cap-invert"}
                x={placeOf(box).cx}
                y={placeOf(box).y + CAP_Y}
                text-anchor="middle"
              >
                {box.label}
              </text>
            </>
          )}
        </For>
        <For each={wires().filter((wire) => wire.kind === "flow")}>
          {(wire, rank) => (
            <circle
              class={`packet ${STAGGER[rank() % STAGGER.length]}`.trim()}
              r={PACKET_R}
              style={{ "offset-path": `path('${wire.d}')` }}
            />
          )}
        </For>
      </svg>
      <figcaption>
        <span>{props.diagram.caption}</span>
        <span>{props.diagram.source}</span>
      </figcaption>
    </figure>
  );
}

type WorkCardProps = {
  readonly work: Work;
};

/**
 * One work: the schema of what it does, then what it was and what came of it.
 *
 * The result line exists only when a real result does. An absent result is
 * rendered as an absent line rather than as an empty one, because on a
 * portfolio an empty line reads as a statement about the person.
 *
 * @param props - the work to present, in the language in force
 * @returns the work, its provenance, its story and whatever is consultable
 */
export default function WorkCard(props: WorkCardProps) {
  const { t } = useI18n();
  const provenance = () => {
    const from = props.work.provenance;
    if (from.kind === "employer") return t("works.inHouse", { employer: from.employer });
    return from.openSource ? t("works.openSource") : t("works.personal");
  };
  const story = (): Line[] => [
    { term: t("works.problem"), text: props.work.problem, tone: "" },
    { term: t("works.did"), text: props.work.did, tone: "" },
    ...(props.work.result === undefined ? [] : [{ term: t("works.result"), text: props.work.result, tone: "result" }]),
  ];
  return (
    <article class="work">
      <Show when={props.work.diagram}>{(diagram) => <Schema diagram={diagram()} />}</Show>
      <div>
        <span class="kind">{provenance()}</span>
        <h2>{props.work.title}</h2>
        <dl class="story">
          <For each={story()}>
            {(line) => (
              <>
                <dt>{line.term}</dt>
                <dd class={line.tone}>{line.text}</dd>
              </>
            )}
          </For>
        </dl>
        <p class="tools">
          <For each={props.work.tools}>{(tool) => <span>{tool}</span>}</For>
        </p>
        <Show when={props.work.links.length > 0}>
          <div class="links">
            <For each={props.work.links}>
              {(link) => <a href={link.href}>{link.kind === "code" ? t("works.code") : t("works.demo")}</a>}
            </For>
          </div>
        </Show>
      </div>
    </article>
  );
}
