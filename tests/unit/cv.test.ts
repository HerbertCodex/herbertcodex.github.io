import { existsSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOCALES } from "~/shared/i18n";
import { RESUME_FOLDER, resumeOf } from "~/shared/resume";

function filesPublished(): string[] {
  return existsSync(RESUME_FOLDER) ? readdirSync(RESUME_FOLDER).sort() : [];
}

describe("le CV proposé au téléchargement", () => {
  it("n'a d'adresse que pour une langue dont le dépôt porte le fichier", () => {
    const published = { fr: "cv-fr.pdf" } as const;

    expect(resumeOf("fr", published)?.href).toBe("/cv/cv-fr.pdf");
    expect(resumeOf("fr", published)?.file).toBe(`${RESUME_FOLDER}/cv-fr.pdf`);
    expect(resumeOf("en", published), "une langue sans fichier reçoit une adresse").toBeUndefined();
    expect(resumeOf("en", {}), "une adresse sortie d'un dépôt qui ne publie rien").toBeUndefined();
  });

  it("annonce exactement les fichiers que le dépôt porte, dans les deux sens", () => {
    const declared = LOCALES.map((locale) => resumeOf(locale)).filter((resume) => resume !== undefined);

    for (const resume of declared) {
      expect(existsSync(resume.file), `${resume.file} est annoncé et absent du dépôt`).toBe(true);
    }
    expect(
      declared.map((resume) => resume.file.slice(RESUME_FOLDER.length + 1)).sort(),
      `un fichier de ${RESUME_FOLDER} n'est annoncé dans aucune langue`,
    ).toEqual(filesPublished());
  });
});
