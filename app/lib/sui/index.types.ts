/**
 * Types for the recipe index the server serves. Everything is derived from
 * `contracts-sui` at load time (see `loader.ts`) — the repo is the source of
 * truth; nothing here is hand-authored.
 */

/** A Move source file bundled into a recipe, verbatim from `examples/`. */
export type RecipeFile = {
  /** Repo path, e.g. `contracts/utils/examples/rate_limiter/faucet.move`. */
  path: string;
  /** The module the file declares, e.g. `openzeppelin_utils::faucet`. */
  module: string;
  /** File contents, verbatim. */
  source: string;
};

/**
 * One example file = one recipe. `kind` comes from the `use` graph: `recipe`
 * if it uses >=1 external OZ primitive (a composition worth listing), else
 * `support` (a fixture/coin a recipe bundles but not worth surfacing on its
 * own). Support files are kept in the index, not dropped.
 */
export type Recipe = {
  /** Package-relative id without extension, e.g. `utils/rate_limiter/faucet`. */
  id: string;
  /** Lead paragraph of the module doc-comment (excludes the disclaimer). */
  summary: string;
  /** `recipe` if it uses >=1 external OZ primitive; otherwise `support`. */
  kind: "recipe" | "support";
  /** External OZ package namespaces used, e.g. `["openzeppelin_utils"]`. */
  packages: string[];
  /** The scenario file plus any local sibling files it `use`s, verbatim. */
  files: RecipeFile[];
};

/** How to depend on one OZ package, taken from the package's own README. */
export type PackageInfo = {
  /** Move package namespace, e.g. `openzeppelin_utils`. */
  namespace: string;
  /** Package path within contracts-sui, e.g. `contracts/utils`. */
  path: string;
  /**
   * The dependency line to put in `Move.toml`. Taken verbatim from the README
   * when it has an install line (an `r.mvr` line for MVR packages, or a git
   * line as-is); synthesized as a git dependency only when the README has none.
   */
  installLine: string;
  /** On the Move Registry (README `## Install` uses `r.mvr`); when false, `installLine` is a git dep. */
  mvrPublished: boolean;
  /** MVR slug, e.g. `utils` / `integer-math`; only when `mvrPublished`. */
  slug: string | null;
  /** Docs URL from the catalog table, when present. */
  docsUrl: string | null;
};

/** The recipe index the server serves, loaded at runtime from contracts-sui. */
export type SuiIndex = {
  /** Provenance, `repo@tag` (the pinned release). */
  generatedFrom: string;
  /** Package install metadata keyed by namespace. */
  packages: Record<string, PackageInfo>;
  /** Every non-test example file, recipes and support alike. */
  recipes: Recipe[];
};
