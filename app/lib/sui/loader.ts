/**
 * Runtime loader for the Sui recipe index. Instead of committing a generated
 * snapshot, the server derives the index on demand from `contracts-sui` itself
 * (the single source of truth) and caches it in-process. One tarball fetch, no
 * cron, no drift-check, no committed copy. Node runtime only (fetch + zlib).
 *
 * Content is pinned to a committed contracts-sui release tag, used both for the
 * tarball we parse and for the `rev` of the git dependencies we synthesize. A
 * pinned tag, rather than `main`, means:
 *  - reviewed: the server only serves released code, and bumping it is a
 *    committed, reviewable diff (like every other server's data bump here);
 *  - consistent: examples and the `rev` that installs them come from one ref,
 *    so a recipe can never reference an API its pinned dependency lacks;
 *  - reproducible: the process-lifetime cache is exact, since tag tarballs are
 *    immutable — `generatedFrom` names the precise content every replica serves.
 * Bump `SUI_CONTENT_REF` on each contracts-sui release. `SUI_CONTRACTS_REF`
 * overrides it for local testing against a branch or a newer tag.
 */

import { gunzipSync } from "node:zlib";
import { buildIndex, findPackageDirs, type SourceFile } from "./parse";
import type { SuiIndex } from "./index.types";

const REPO = "https://github.com/OpenZeppelin/contracts-sui";
// The only top-level folders that hold packages in contracts-sui.
const ROOTS = ["contracts", "math", "collections"];
// Pinned contracts-sui release. Bump on each release; override for testing.
export const SUI_CONTENT_REF = process.env.SUI_CONTRACTS_REF || "v1.4.0";
const TARBALL = `https://codeload.github.com/OpenZeppelin/contracts-sui/tar.gz/${SUI_CONTENT_REF}`;
// GitHub rejects/throttles requests without a User-Agent; send one on every call.
const USER_AGENT = "openzeppelin-mcp";

/**
 * Minimal ustar reader: file contents keyed by repo-relative path (top-level
 * `contracts-sui-<ref>/` stripped). contracts-sui's tarball uses plain ustar
 * with short paths, so `prefix + name` is all that's needed — no GNU/pax long
 * names. Non-file entries (dirs, the pax global header) fall through untouched.
 */
export function untar(buf: Buffer): Map<string, string> {
  const files = new Map<string, string>();
  const readStr = (start: number, len: number): string => {
    const slice = buf.subarray(start, start + len);
    const end = slice.indexOf(0);
    return slice.subarray(0, end < 0 ? len : end).toString("utf8");
  };
  let off = 0;
  while (off + 512 <= buf.length) {
    const name = readStr(off, 100);
    if (name === "") break; // end-of-archive (zero blocks)
    const prefix = readStr(off + 345, 155);
    const size = parseInt(readStr(off + 124, 12).trim() || "0", 8);
    const type = String.fromCharCode(buf[off + 156]);
    const data = buf.subarray(off + 512, off + 512 + size);
    off += 512 + Math.ceil(size / 512) * 512;
    if (type === "0" || type === "\0") {
      const full = prefix ? `${prefix}/${name}` : name;
      files.set(full.replace(/^[^/]+\//, ""), data.toString("utf8"));
    }
  }
  return files;
}

async function build(): Promise<SuiIndex> {
  const res = await fetch(TARBALL, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Failed to fetch ${TARBALL}: ${res.status} ${res.statusText}`);
  const files = untar(gunzipSync(Buffer.from(await res.arrayBuffer())));

  // Only look inside the package roots — ignore the rest of the repo.
  const paths = [...files.keys()].filter((p) => ROOTS.some((r) => p.startsWith(`${r}/`)));
  const packageDirs = findPackageDirs(paths);

  const exampleFiles: SourceFile[] = paths
    .filter(
      (p) =>
        p.endsWith(".move") &&
        !p.includes("/tests/") &&
        packageDirs.some((d) => p.startsWith(`${d}/examples/`))
    )
    .map((p) => ({ path: p, source: files.get(p)! }));

  // Every discovered package (a dir with a Move.toml) becomes a registry entry,
  // whether or not it appears in a catalog table.
  const packages = packageDirs.map((d) => ({
    path: d,
    moveToml: files.get(`${d}/Move.toml`) ?? "",
    readme: files.get(`${d}/README.md`) ?? null,
  }));

  // Catalog tables (for docs URLs) live in each root's README.
  const catalogReadmes: Record<string, string> = {};
  for (const r of ROOTS) {
    const rp = `${r}/README.md`;
    if (files.has(rp)) catalogReadmes[rp] = files.get(rp)!;
  }

  return buildIndex(exampleFiles, packages, catalogReadmes, {
    generatedFrom: `${REPO}@${SUI_CONTENT_REF}`,
    repoGitUrl: `${REPO}.git`,
    gitRev: SUI_CONTENT_REF,
  });
}

let cache: Promise<SuiIndex> | null = null;

/** Load the index, fetching + parsing once and caching in-process. */
export function loadSuiIndex(): Promise<SuiIndex> {
  if (!cache) {
    // On failure, clear the cache so a later call retries instead of caching the rejection.
    cache = build().catch((err) => {
      cache = null;
      throw err;
    });
  }
  return cache;
}
