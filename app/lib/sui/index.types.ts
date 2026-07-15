/**
 * Types for the generated recipe index (`index.data.ts`).
 *
 * Everything here is *derived* from `contracts-sui` at sync time — the repo is
 * the single source of truth. Nothing in the index is hand-authored: recipe
 * source is verbatim, dependency wiring comes from each example's `use`
 * statements, and package install metadata comes from the packages' own
 * READMEs (`## Install` blocks + the catalog tables).
 */

/** A single Move source file bundled into a recipe, verbatim from `examples/`. */
export type RecipeFile = {
  /** Path within the contracts-sui repo, e.g. `contracts/utils/examples/rate_limiter/faucet.move`. */
  path: string;
  /** The Move module declared by the file, e.g. `openzeppelin_utils::faucet`. */
  module: string;
  /** File contents, verbatim. */
  source: string;
};

/**
 * One example file = one recipe.
 *
 * `kind` is derived from the `use` graph: a file that depends on at least one
 * external OpenZeppelin primitive is a `recipe` (a composition worth listing);
 * a file that uses none (only sibling includes / the Sui framework) is a
 * `support` file — a throwaway coin or fixture that a recipe bundles but that
 * is not itself a composition to surface. Support files are kept in the index
 * (nothing is dropped) so the retrieval layer can decide what to list.
 */
export type Recipe = {
  /** Package-relative id without extension, e.g. `utils/rate_limiter/faucet`. */
  id: string;
  /** First line of the module doc-comment. */
  title: string;
  /** Lead paragraph of the module doc-comment (the what/why); excludes the disclaimer. */
  summary: string;
  /** `recipe` if it uses >=1 external OZ primitive; otherwise `support`. */
  kind: "recipe" | "support";
  /** External OZ package namespaces this recipe depends on, e.g. `["openzeppelin_utils"]`. */
  packages: string[];
  /** The scenario file plus any local sibling files it `use`s, verbatim. */
  files: RecipeFile[];
};

/**
 * Install metadata for one OZ package, taken from the package's own README —
 * the source of truth for how to depend on it.
 *
 * If the README has a `## Install` block, we relay its dependency line verbatim
 * and record the mechanism (`mvr` / `git` / `local`). If it has none, the
 * package is not on the Move Registry (`mvrPublished: false`) and we synthesize a
 * git dependency pinned to the release ref so it is still installable. We never
 * override a line the README states.
 */
export type PackageInfo = {
  /** Move package namespace, e.g. `openzeppelin_utils`. */
  namespace: string;
  /** Path of the package within contracts-sui, e.g. `contracts/utils`. */
  path: string;
  /** The dependency line: verbatim from the README `## Install` block, or a synthesized git dep when not on MVR. */
  installLine: string;
  /** `mvr` when the README publishes an `r.mvr` line; `git` (synthesized) otherwise. */
  installMechanism: "mvr" | "git";
  /**
   * Whether the package is published on the Move Registry — i.e. its README
   * `## Install` block uses `r.mvr`. When false, the package is not on MVR and
   * is depended on via a git dependency instead.
   */
  mvrPublished: boolean;
  /** MVR slug, e.g. `utils` / `integer-math`; only when the mechanism is `mvr`. */
  slug: string | null;
  /** Docs URL from the catalog table, when present. */
  docsUrl: string | null;
};

/** The generated, pinned snapshot the server serves from. */
export type SuiIndex = {
  /** The requested ref, e.g. `main`. */
  ref: string;
  /** Provenance: repo + resolved commit SHA the snapshot was generated from. */
  generatedFrom: string;
  /** Package install metadata keyed by namespace. */
  packages: Record<string, PackageInfo>;
  /** Every non-test example file, recipes and support alike. */
  recipes: Recipe[];
};
