/**
 * The starter's pointer to the SolidStart documentation.
 *
 * It was the same ten lines in the home route and the not-found route, which
 * is what the duplication gate refused on its first run. One unit, two
 * callers: the note is here until the portfolio has its own content to put
 * in its place.
 *
 * @returns the paragraph linking to the framework documentation
 */
export default function StarterNote() {
  return (
    <p>
      Visit{" "}
      <a href="https://start.solidjs.com" target="_blank" rel="noreferrer">
        start.solidjs.com
      </a>{" "}
      to learn how to build SolidStart apps.
    </p>
  );
}
