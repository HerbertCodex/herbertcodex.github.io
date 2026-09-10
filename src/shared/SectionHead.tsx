import { Show } from "solid-js";

type SectionHeadProps = {
  readonly rank: number;
  readonly name: string;
  readonly headingId: string;
  readonly count?: number;
};

/**
 * Two digits, so a number never changes width from one section to the next.
 *
 * @param count - the number to write
 * @returns the number on two digits, padded with a leading zero
 */
function twoDigits(count: number): string {
  return String(count).padStart(2, "0");
}

/**
 * The head of a section: its number, its name, and how many things it holds.
 *
 * It lives in `shared` rather than in the first feature that needed it because
 * the three features that draw one would otherwise write the same markup three
 * times, and `src/app.css` already owns the vocabulary it uses — the mockup
 * declares `.section-head`, `.num` and `.count` outside any section.
 *
 * The number is given rather than computed here: the page decides the order of
 * its sections, and a component that counted its own rank would be wrong the
 * day a section appears before it.
 *
 * @param props - the rank, the name, the id the name answers to, and a count
 * @returns the section head
 */
export default function SectionHead(props: SectionHeadProps) {
  return (
    <div class="section-head">
      <span class="num">{twoDigits(props.rank)}</span>
      <h2 id={props.headingId}>{props.name}</h2>
      <Show when={props.count !== undefined}>
        <span class="count">{twoDigits(props.count ?? 0)}</span>
      </Show>
    </div>
  );
}
