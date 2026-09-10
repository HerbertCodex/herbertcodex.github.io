import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readSecurityHeaders, writeSecurityHeaders } from "../../scripts/security-headers.mjs";
import { startServer } from "../../scripts/serve-static.mjs";

/*
 * Quatre entrees que les revues de s-5d3y ont vues acceptees, mesurees puis
 * parquees. Aucune n'est produite par le build d'aujourd'hui ; toutes
 * traversent du code que la CI, le smoke et la porte de securite executent,
 * et trois d'entre elles font sortir un processus.
 */
function sandbox(): string {
  return mkdtempSync(join(tmpdir(), "robustesse-"));
}

/**
 * Ecrit une page que le calcul sait lire, pour que le refus mesure porte sur
 * ce que le test ajoute a cote et non sur une racine vide.
 *
 * @param root - la racine d essai
 * @param at - le chemin de la page sous cette racine
 */
function page(root: string, at: string): void {
  writeFileSync(
    join(root, at),
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>x</title></head><body></body></html>',
  );
}

const POLICY = {
  "Content-Security-Policy": "default-src 'self'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=()",
};

describe("le serveur repond a ce qu'il ne sait pas lire, au lieu de sortir", () => {
  it("rend 404 sur un chemin au pourcentage malforme, sans tomber", async () => {
    const root = sandbox();
    try {
      page(root, "index.html");
      writeFileSync(join(root, "..", "security-headers.json"), JSON.stringify(POLICY));
      const server = await startServer(root, 0);
      try {
        const { port } = server.address() as { port: number };
        const answered = await fetch(`http://127.0.0.1:${port}/%E0`);
        expect(answered.status).toBe(404);
        expect((await fetch(`http://127.0.0.1:${port}/`)).status).toBe(200);
      } finally {
        server.close();
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("refuse au demarrage une valeur qui ne peut pas etre un en-tete, plutot qu'a la premiere requete", () => {
    const root = sandbox();
    try {
      writeFileSync(
        join(root, "..", "security-headers.json"),
        JSON.stringify({ ...POLICY, "Referrer-Policy": "no-referrer\r\nX-Injected: 1" }),
      );
      expect(() => readSecurityHeaders(root)).toThrow(/Referrer-Policy/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("le calcul de la politique refuse ce qu'il ne peut pas baliser la ou il sert", () => {
  it("refuse une page dont le nom echappe a son filtre, au lieu de l'ignorer en silence", () => {
    const root = sandbox();
    try {
      page(root, "index.html");
      writeFileSync(join(root, "vieux.htm"), "<html></html>");
      expect(() => writeSecurityHeaders(root)).toThrow(/vieux\.htm/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("refuse un dossier lie sous la racine, dont les pages seraient balisees hors du dossier servi", () => {
    const root = sandbox();
    const ailleurs = sandbox();
    try {
      page(root, "index.html");
      mkdirSync(join(ailleurs, "en"), { recursive: true });
      page(ailleurs, join("en", "index.html"));
      symlinkSync(join(ailleurs, "en"), join(root, "en"), "dir");
      expect(() => writeSecurityHeaders(root)).toThrow(/en/);
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(ailleurs, { recursive: true, force: true });
    }
  });
});
