import {
  parseModule,
  parseSummary,
  parseOzUses,
  recipeIdFromPath,
  parseInstallLine,
  parseSlug,
  parseCatalog,
  findPackageDirs,
  buildIndex,
  type SourceFile,
} from "./parse";

describe("parseModule", () => {
  it("extracts the openzeppelin module a file declares", () => {
    expect(parseModule("module openzeppelin_utils::faucet;")).toBe("openzeppelin_utils::faucet");
  });
  it("ignores leading doc-comments and whitespace", () => {
    expect(parseModule("/// doc\n\nmodule openzeppelin_math::example_amm_quote;\n")).toBe(
      "openzeppelin_math::example_amm_quote"
    );
  });
  it("returns null when there is no module declaration", () => {
    expect(parseModule("use sui::coin;")).toBeNull();
  });
});

describe("parseSummary", () => {
  it("joins the lead paragraph, excluding the disclaimer", () => {
    const source = [
      "/// A per-user faucet that composes two limiters.",
      "///",
      "/// A later paragraph that is not the summary.",
      "///",
      "/// # Disclaimer",
      "///",
      "/// This module is an unaudited example.",
      "module openzeppelin_utils::faucet;",
    ].join("\n");
    expect(parseSummary(source)).toBe("A per-user faucet that composes two limiters.");
  });
  it("keeps a first sentence that wraps across lines intact (no mid-sentence cut)", () => {
    const source = [
      "/// A backloaded (quadratic) vesting curve for `vesting_wallet` - a worked example of",
      "/// a custom schedule that ships only the curve logic.",
      "///",
      "/// More detail below.",
      "module openzeppelin_finance::example_vesting_quadratic;",
    ].join("\n");
    expect(parseSummary(source)).toBe(
      "A backloaded (quadratic) vesting curve for `vesting_wallet` - a worked example of a custom schedule that ships only the curve logic."
    );
  });
  it("returns empty when the doc-comment opens with a heading", () => {
    const s = "/// # Heading immediately\n/// body\nmodule openzeppelin_access::x;";
    expect(parseSummary(s)).toBe("");
  });
});

describe("parseOzUses", () => {
  it("collects distinct openzeppelin use targets in source order", () => {
    const src = [
      "use openzeppelin_utils::rare_coin::RARE_COIN;",
      "use openzeppelin_utils::rate_limiter::{Self, RateLimiter};",
      "use sui::coin::Coin;",
      "use openzeppelin_utils::rate_limiter::Foo;", // duplicate module → deduped
    ].join("\n");
    expect(parseOzUses(src)).toEqual([
      { namespace: "openzeppelin_utils", module: "rare_coin" },
      { namespace: "openzeppelin_utils", module: "rate_limiter" },
    ]);
  });
  it("ignores non-openzeppelin uses", () => {
    expect(parseOzUses("use sui::clock::Clock;")).toEqual([]);
  });
});

describe("recipeIdFromPath", () => {
  it("drops the contracts root and examples segment", () => {
    expect(recipeIdFromPath("contracts/utils/examples/rate_limiter/faucet.move")).toBe(
      "utils/rate_limiter/faucet"
    );
  });
  it("drops the math root and examples segment", () => {
    expect(recipeIdFromPath("math/core/examples/integer_math/amm_quote.move")).toBe(
      "core/integer_math/amm_quote"
    );
  });
  it("handles a package at the repo root (e.g. collections)", () => {
    expect(recipeIdFromPath("collections/examples/deque/ring.move")).toBe("collections/deque/ring");
  });
});

describe("parseInstallLine / parseSlug", () => {
  const readme = [
    "## Install",
    "",
    "```toml",
    "[dependencies]",
    'openzeppelin_math = { r.mvr = "@openzeppelin-move/integer-math" }',
    "```",
  ].join("\n");

  it("extracts the exact r.mvr dependency line from the README", () => {
    expect(parseInstallLine(readme, "openzeppelin_math")).toBe(
      'openzeppelin_math = { r.mvr = "@openzeppelin-move/integer-math" }'
    );
  });
  it("returns null when the package is not in the README", () => {
    expect(parseInstallLine(readme, "openzeppelin_access")).toBeNull();
  });
  it("extracts the MVR slug", () => {
    expect(parseSlug('{ r.mvr = "@openzeppelin-move/fixed-point-math" }')).toBe("fixed-point-math");
    expect(parseSlug("-")).toBeNull();
    expect(parseSlug(null)).toBeNull();
  });
  it("extracts a git dependency line verbatim, not just r.mvr", () => {
    const line = 'openzeppelin_foo = { git = "https://x.git", subdir = "contracts/foo", rev = "v1.4.0" }';
    expect(parseInstallLine(`## Install\n\`\`\`toml\n${line}\n\`\`\``, "openzeppelin_foo")).toBe(line);
  });
  it("only matches inside the ## Install section", () => {
    const readme = 'openzeppelin_utils = { r.mvr = "@openzeppelin-move/utils" }\n\n## Install\n\n(moved elsewhere)';
    expect(parseInstallLine(readme, "openzeppelin_utils")).toBeNull();
  });
});

describe("parseCatalog", () => {
  const readme = [
    "| Package | MVR | Move package | Docs | Highlights |",
    "|---------|-----|--------------|------|-----------|",
    "| [`access/`](access/) | [`@openzeppelin-move/access`](https://moveregistry.com/x) | `openzeppelin_access` | [docs](https://docs.openzeppelin.com/a) | ... |",
    "| [`allowance/`](allowance/) | - | `openzeppelin_allowance` | [docs](https://docs.openzeppelin.com/b) | ... |",
  ].join("\n");

  it("extracts path and docs URL for each package row", () => {
    const rows = parseCatalog(readme, "contracts");
    expect(rows[0]).toEqual({ path: "contracts/access", docsUrl: "https://docs.openzeppelin.com/a" });
    expect(rows[1]).toEqual({ path: "contracts/allowance", docsUrl: "https://docs.openzeppelin.com/b" });
  });
});

describe("findPackageDirs", () => {
  it("treats every directory with a Move.toml as a package, excluding examples", () => {
    const files = [
      "contracts/access/Move.toml",
      "contracts/access/sources/access.move",
      "math/core/Move.toml",
      "contracts/access/examples/foo/Move.toml", // example package manifest → excluded
      "README.md",
      "Move.toml", // repo-root manifest (if any) → excluded
    ];
    expect(findPackageDirs(files)).toEqual(["contracts/access", "math/core"]);
  });
});

describe("buildIndex", () => {
  const faucet: SourceFile = {
    path: "contracts/utils/examples/rate_limiter/faucet.move",
    source: [
      "/// A per-user faucet.",
      "///",
      "/// Composes a limiter over a coin.",
      "module openzeppelin_utils::faucet;",
      "use openzeppelin_utils::rare_coin::RARE_COIN;",
      "use openzeppelin_utils::rate_limiter::RateLimiter;",
    ].join("\n"),
  };
  const rareCoin: SourceFile = {
    path: "contracts/utils/examples/rate_limiter/rare_coin.move",
    source: ["/// A throwaway coin.", "module openzeppelin_utils::rare_coin;", "use sui::coin;"].join("\n"),
  };
  const packages = [
    {
      path: "contracts/utils",
      moveToml: '[package]\nname = "openzeppelin_utils"',
      readme: '## Install\nopenzeppelin_utils = { r.mvr = "@openzeppelin-move/utils" }',
    },
    // allowance has no `## Install` block → not on MVR → git dep
    {
      path: "contracts/allowance",
      moveToml: '[package]\nname = "openzeppelin_allowance"',
      readme: "# Allowance\n\nSome docs, but no install block.",
    },
    // a discovered package that is NOT in the catalog table below
    { path: "contracts/widget", moveToml: '[package]\nname = "openzeppelin_widget"', readme: null },
  ];
  const catalogReadmes = {
    "contracts/README.md":
      "| Package | MVR | Move package | Docs | Highlights |\n" +
      "| [`utils/`](utils/) | [`@openzeppelin-move/utils`](https://x) | `openzeppelin_utils` | [docs](https://d) | ... |\n" +
      "| [`allowance/`](allowance/) | — | `openzeppelin_allowance` | [docs](https://a) | ... |",
  };

  const index = buildIndex([faucet, rareCoin], packages, catalogReadmes, {
    generatedFrom: "repo@main",
    repoGitUrl: "https://github.com/OpenZeppelin/contracts-sui.git",
    gitRev: "v1.4.0",
  });

  it("classifies a file using an external primitive as a recipe", () => {
    const r = index.recipes.find((x) => x.id === "utils/rate_limiter/faucet")!;
    expect(r.kind).toBe("recipe");
    expect(r.packages).toEqual(["openzeppelin_utils"]);
  });
  it("bundles the local sibling include (rare_coin) into the recipe, sorted by path", () => {
    const r = index.recipes.find((x) => x.id === "utils/rate_limiter/faucet")!;
    expect(r.files.map((f) => f.path)).toEqual([
      "contracts/utils/examples/rate_limiter/faucet.move",
      "contracts/utils/examples/rate_limiter/rare_coin.move",
    ]);
  });
  it("classifies a file with no external primitive as a support file", () => {
    const r = index.recipes.find((x) => x.id === "utils/rate_limiter/rare_coin")!;
    expect(r.kind).toBe("support");
    expect(r.packages).toEqual([]);
    expect(r.files).toHaveLength(1);
  });
  it("does not count a local sibling as an external package", () => {
    const r = index.recipes.find((x) => x.id === "utils/rate_limiter/faucet")!;
    expect(r.packages).not.toContain("openzeppelin_utils::rare_coin");
    expect(r.packages).toHaveLength(1);
  });
  it("takes a published package's install line verbatim from its README (mvr)", () => {
    expect(index.packages["openzeppelin_utils"]).toEqual({
      namespace: "openzeppelin_utils",
      path: "contracts/utils",
      installLine: 'openzeppelin_utils = { r.mvr = "@openzeppelin-move/utils" }',
      mvrPublished: true,
      slug: "utils",
      docsUrl: "https://d",
    });
  });
  it("synthesizes a git dep pinned to gitRev when the README has no install block", () => {
    expect(index.packages["openzeppelin_allowance"]).toEqual({
      namespace: "openzeppelin_allowance",
      path: "contracts/allowance",
      installLine:
        'openzeppelin_allowance = { git = "https://github.com/OpenZeppelin/contracts-sui.git", subdir = "contracts/allowance", rev = "v1.4.0" }',
      mvrPublished: false,
      slug: null,
      docsUrl: "https://a",
    });
  });
  it("registers a discovered package even when it is absent from the catalog table", () => {
    expect(index.packages["openzeppelin_widget"]).toEqual({
      namespace: "openzeppelin_widget",
      path: "contracts/widget",
      installLine:
        'openzeppelin_widget = { git = "https://github.com/OpenZeppelin/contracts-sui.git", subdir = "contracts/widget", rev = "v1.4.0" }',
      mvrPublished: false,
      slug: null,
      docsUrl: null,
    });
  });
  it("sorts recipes deterministically by id", () => {
    const ids = index.recipes.map((r) => r.id);
    expect(ids).toEqual([...ids].sort());
  });
});
