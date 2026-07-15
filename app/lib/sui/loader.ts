/**
 * Runtime loader for the Sui recipe index. Instead of committing a generated
 * snapshot, the server derives the index on demand from `contracts-sui` itself
 * (the single source of truth) and caches it in-process. One tarball fetch, no
 * cron, no drift-check, no committed copy. Node runtime only (fetch + zlib).
 *
 * Two refs, on purpose:
 *  - CONTENT (examples, docs, AI metadata, catalog/READMEs) is read from `main`
 *    — the code doesn't differ across refs, but the best examples/docs/metadata
 *    live on `main`.
 *  - INSTALL pins (the git-dep `rev` for packages not on MVR) always point at
 *    the latest GitHub *release*, so scaffolds depend on released code.
 */

import { gunzipSync } from "node:zlib";
import { buildIndex, findPackageDirs, type SourceFile } from "./parse";
import type { SuiIndex } from "./index.types";

const REPO = "https://github.com/OpenZeppelin/contracts-sui";
// The only top-level folders that hold packages in contracts-sui.
const ROOTS = ["contracts", "math", "collections"];
const CONTENT_REF = process.env.SUI_CONTRACTS_REF || "main";
// Install pin used only when the latest-release lookup is unavailable (e.g. the
// GitHub API rate-limits). Never fall back to a moving branch for install revs;
// bump to the latest release tag on release.
const FALLBACK_RELEASE = "v1.4.0";
const TARBALL = `https://codeload.github.com/OpenZeppelin/contracts-sui/tar.gz/${CONTENT_REF}`;
const RELEASES_API = "https://api.github.com/repos/OpenZeppelin/contracts-sui/releases/latest";
// GitHub rejects/throttles requests without a User-Agent; send one on every call.
const USER_AGENT = "openzeppelin-mcp";

/** Tag of the latest GitHub release — the install pin for git dependencies. */
async function latestReleaseTag(): Promise<string | null> {
  try {
    const res = await fetch(RELEASES_API, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": USER_AGENT,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { tag_name?: string };
    return json.tag_name ?? null;
  } catch {
    return null;
  }
}

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
  // Content from `main`; install pin from the latest GitHub release (or an
  // explicit SUI_INSTALL_REF), falling back to a pinned release tag — never a
  // moving branch — when the release lookup is unavailable.
  const [res, releaseTag] = await Promise.all([
    fetch(TARBALL, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(20_000) }),
    process.env.SUI_INSTALL_REF ? Promise.resolve(process.env.SUI_INSTALL_REF) : latestReleaseTag(),
  ]);
  if (!res.ok) throw new Error(`Failed to fetch ${TARBALL}: ${res.status} ${res.statusText}`);
  const gitRev = releaseTag ?? FALLBACK_RELEASE;
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
    generatedFrom: `${REPO}@${CONTENT_REF}`,
    repoGitUrl: `${REPO}.git`,
    gitRev,
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
