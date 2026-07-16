/**
 * Pure parsers + index builder over `contracts-sui` sources. No IO, no network,
 * no dependencies — the runtime loader feeds these in-memory file contents and
 * unit tests feed fixtures. The repo is the single source of truth; everything
 * here only *derives* (classify `use`, read doc-comments, read README install).
 */

import type { PackageInfo, Recipe, RecipeFile, SuiIndex } from "./index.types";

/** Directory of a `/`-separated path (no node:path dependency). */
function dirname(path: string): string {
  const i = path.lastIndexOf("/");
  return i < 0 ? "." : path.slice(0, i);
}

/** Extract the `openzeppelin_x::mod` module a file declares, or null. Accepts
 *  both the Move 2024 label form (`module a::b;`) and the block form (`module a::b {`). */
export function parseModule(source: string): string | null {
  const m = source.match(/^\s*module\s+(openzeppelin_[a-z0-9_]+::[a-z0-9_]+)\s*[;{]/m);
  return m ? m[1] : null;
}

/**
 * Extract the `summary` — the lead paragraph of a module's `///` doc-comment —
 * as one coherent string. Reads the first `///` block and joins its first
 * paragraph, stopping at the first blank line or `#` heading (so the disclaimer
 * and later sections are excluded). Whole-sentence-safe: it never cuts at a line
 * wrap, so wrapped first sentences stay intact.
 */
export function parseSummary(source: string): string {
  const lines = source.split("\n");
  const doc: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("///")) {
      doc.push(t.replace(/^\/\/\/\s?/, ""));
    } else if (doc.length > 0) {
      break; // doc-comment block ended (reached `module`, attribute, or code)
    }
  }
  const para: string[] = [];
  for (const d of doc) {
    const t = d.trim();
    if (t === "" || t.startsWith("#")) break; // end of the lead paragraph
    para.push(t);
  }
  return para.join(" ");
}

/** All distinct `use openzeppelin_x::mod` targets in a file, in source order. */
export function parseOzUses(source: string): Array<{ namespace: string; module: string }> {
  const re = /use\s+(openzeppelin_[a-z0-9_]+)::([a-z0-9_]+)/g;
  const seen = new Set<string>();
  const out: Array<{ namespace: string; module: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const key = `${m[1]}::${m[2]}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ namespace: m[1], module: m[2] });
    }
  }
  return out;
}

/**
 * Recipe id: `<package>/<path under examples/>` without extension, where
 * `<package>` is the directory that holds `examples/`. Works for any layout —
 * `contracts/utils/examples/rate_limiter/faucet.move` -> `utils/rate_limiter/faucet`,
 * `collections/examples/deque/ring.move` -> `collections/deque/ring`.
 */
export function recipeIdFromPath(path: string): string {
  const norm = path.replace(/\\/g, "/").replace(/\.move$/, "");
  const i = norm.indexOf("/examples/");
  if (i < 0) return norm;
  const pkg = norm.slice(0, i).split("/").pop()!;
  return `${pkg}/${norm.slice(i + "/examples/".length)}`;
}

/**
 * Extract the package's `<namespace> = { … }` dependency line from a README's
 * `## Install` section (up to the next `##` heading), verbatim. Returns null
 * when there is no `## Install` section or no matching line. We never synthesize.
 */
export function parseInstallLine(readme: string, namespace: string): string | null {
  const after = readme.split(/##\s+Install\b/i)[1];
  if (after === undefined) return null;
  const section = after.split(/\n##\s/)[0];
  // Namespaces are always `openzeppelin_*` (no regex metacharacters).
  const m = section.match(new RegExp(`${namespace}\\s*=\\s*\\{[^}]*\\}`));
  return m ? m[0].trim() : null;
}

/** A git dependency line pinned to a ref, for packages not on MVR. */
function synthesizeGitDep(namespace: string, path: string, repoGitUrl: string, rev: string): string {
  return `${namespace} = { git = "${repoGitUrl}", subdir = "${path}", rev = "${rev}" }`;
}

/** Extract the MVR slug from an install line / MVR cell (`@openzeppelin-move/<slug>`). */
export function parseSlug(text: string | null): string | null {
  if (!text) return null;
  const m = text.match(/@openzeppelin-move\/([a-z0-9-]+)/);
  return m ? m[1] : null;
}

/**
 * Parse a catalog table (`| Package | MVR | Move package | Docs | Highlights |`)
 * for each package's `path` and docs URL — the only things the registry needs
 * from the catalog (namespace + install come from the package itself). `baseDir`
 * prefixes the package path, since the Package column is relative to the README.
 */
export function parseCatalog(readme: string, baseDir: string): Array<{ path: string; docsUrl: string | null }> {
  const out: Array<{ path: string; docsUrl: string | null }> = [];
  for (const line of readme.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 6) continue; // [ "", Package, MVR, Move package, Docs, Highlights, "" ]
    const dirMatch = cells[1].match(/\[`([^`]+?)\/?`\]/); // [`access/`](access/)
    if (!dirMatch) continue; // header / separator row
    const dir = dirMatch[1].replace(/\/$/, "");
    const docsUrl = cells[4].match(/\((https?:\/\/[^)]+)\)/)?.[1] ?? null;
    out.push({ path: `${baseDir}/${dir}`, docsUrl });
  }
  return out;
}

/** The package's Move namespace from its `Move.toml` `[package] name`. */
function parsePackageName(moveToml: string): string | null {
  const m = moveToml.match(/name\s*=\s*"([^"]+)"/);
  return m ? m[1] : null;
}

/** Package = any directory carrying a `Move.toml` (excluding examples). Sorted. */
export function findPackageDirs(allFiles: string[]): string[] {
  return allFiles
    .filter((f) => f.endsWith("/Move.toml"))
    .map((f) => dirname(f))
    .filter((d) => d !== "." && !d.includes("/examples/"))
    .sort();
}

export type SourceFile = { path: string; source: string };

/**
 * Build the full index from in-memory example files + README contents. Pure and
 * deterministic: outputs are sorted, so the same inputs yield identical bytes.
 */
export function buildIndex(
  exampleFiles: SourceFile[],
  packageInputs: Array<{ path: string; moveToml: string; readme: string | null }>,
  catalogReadmes: Record<string, string>,
  opts: { generatedFrom: string; repoGitUrl: string; gitRev: string }
): SuiIndex {
  const { generatedFrom, repoGitUrl, gitRev } = opts;

  // Per-scenario-dir module index: sibling `use`s resolve within the same dir.
  const modulesByDir = new Map<string, Map<string, SourceFile>>();
  for (const f of exampleFiles) {
    const mod = parseModule(f.source);
    if (!mod) continue;
    const dir = dirname(f.path);
    if (!modulesByDir.has(dir)) modulesByDir.set(dir, new Map());
    modulesByDir.get(dir)!.set(mod, f);
  }

  const recipes: Recipe[] = [];
  for (const f of exampleFiles) {
    if (!parseModule(f.source)) continue;
    const dirModules = modulesByDir.get(dirname(f.path)) ?? new Map<string, SourceFile>();

    // Local-include closure (transitive sibling `use`s) + union of external namespaces.
    const bundled = new Map<string, SourceFile>();
    const externals = new Set<string>();
    const queue: SourceFile[] = [f];
    for (let qi = 0; qi < queue.length; qi++) {
      const cur = queue[qi];
      if (bundled.has(cur.path)) continue;
      bundled.set(cur.path, cur);
      for (const u of parseOzUses(cur.source)) {
        const sibling = dirModules.get(`${u.namespace}::${u.module}`);
        if (sibling) {
          if (!bundled.has(sibling.path)) queue.push(sibling);
        } else {
          externals.add(u.namespace);
        }
      }
    }

    const files: RecipeFile[] = [...bundled.values()]
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((bf) => ({ path: bf.path, module: parseModule(bf.source)!, source: bf.source }));
    recipes.push({
      id: recipeIdFromPath(f.path),
      summary: parseSummary(f.source),
      kind: externals.size > 0 ? "recipe" : "support",
      packages: [...externals].sort(),
      files,
    });
  }
  recipes.sort((a, b) => a.id.localeCompare(b.id));

  // Docs come from the catalog table (when the package is listed there), keyed by path.
  const docsByPath = new Map<string, string | null>();
  for (const [readmePath, content] of Object.entries(catalogReadmes)) {
    const baseDir = dirname(readmePath); // a package root: "contracts", "math", or "collections"
    for (const row of parseCatalog(content, baseDir)) docsByPath.set(row.path, row.docsUrl);
  }

  // Package registry: every discovered package (a dir with a Move.toml) is
  // included, whether or not it appears in a catalog. Namespace comes from the
  // Move.toml. A package is on MVR iff its README publishes an `r.mvr` install
  // line; otherwise it gets a git dep pinned to `gitRev`.
  const packages: Record<string, PackageInfo> = {};
  for (const pkg of [...packageInputs].sort((a, b) => a.path.localeCompare(b.path))) {
    const namespace = parsePackageName(pkg.moveToml);
    if (!namespace) continue;
    const readmeLine = pkg.readme ? parseInstallLine(pkg.readme, namespace) : null;
    const mvrPublished = readmeLine !== null && /r\.mvr/.test(readmeLine);
    packages[namespace] = {
      namespace,
      path: pkg.path,
      installLine: readmeLine ?? synthesizeGitDep(namespace, pkg.path, repoGitUrl, gitRev),
      mvrPublished,
      slug: mvrPublished ? parseSlug(readmeLine) : null,
      docsUrl: docsByPath.get(pkg.path) ?? null,
    };
  }

  return { generatedFrom, packages, recipes };
}
