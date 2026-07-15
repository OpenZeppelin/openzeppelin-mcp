import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { loadSuiIndex } from "./loader";
import type { PackageInfo, SuiIndex } from "./index.types";

/**
 * The Sui server is a thin, deterministic **data layer** over the
 * `contracts-sui` `examples/` and package metadata. It returns composition
 * recipes built on OpenZeppelin's audited Sui Move primitives and the metadata
 * for depending on those primitives. It is not the Wizard and does no assembly:
 * turning recipes into a buildable project (Move.toml wiring, re-homing example
 * modules, dependency-version reconciliation, scaffolding) is the job of the
 * OpenZeppelin Sui skills, which the server points callers to. All data is
 * loaded at runtime from contracts-sui (see `loader.ts`) and cached.
 *
 * Tools are registered on the low-level server with plain JSON-Schema inputs and
 * hand-read arguments — no schema-library dependency.
 */

// Assembly is out of scope for this server — it is the skills' job.
export const ASSEMBLY_NOTE =
  "Data, not a compile-ready package: these are library-authored example modules under the " +
  "library's own address. Use the `setup-sui-contracts` skill to build a project from them, " +
  "and `review-sui-contracts` to review an integration.";

// Server `instructions`: the data tools, and the skills that assemble on top.
export const SUI_INSTRUCTIONS =
  "Data-layer MCP for OpenZeppelin's Sui Move primitives. Retrieval, not generation — you pick the recipe.\n" +
  "Tools: `sui-list-recipes` (discover) → `sui-get-recipe` (full source + packages) / " +
  "`sui-get-package` (how to depend + docs).\n" +
  "Assembly (Move.toml, re-homing, scaffolding) is the OpenZeppelin Sui skills' job — prefer " +
  "`setup-sui-contracts` / `develop-secure-contracts` / `review-sui-contracts` when available.";

// === Index helpers (pure reads over the loaded index) ===

/** Links derived from the index provenance (`repo@ref`): audits + per-file source URL. */
function links(index: SuiIndex) {
  const [base, ref] = index.generatedFrom.split("@");
  return {
    audits: `${base}/tree/${ref}/audits`,
    sourceUrl: (path: string) => `${base}/blob/${ref}/${path}`,
  };
}

/** Match a package filter against a namespace (accepts namespace, MVR slug, or short name). */
function matchesPackage(index: SuiIndex, ns: string, filter: string): boolean {
  const short = ns.replace(/^openzeppelin_/, "");
  return ns === filter || short === filter || index.packages[ns]?.slug === filter;
}

function resolvePackage(index: SuiIndex, filter: string): PackageInfo | undefined {
  const ns = Object.keys(index.packages).find((n) => matchesPackage(index, n, filter));
  return ns ? index.packages[ns] : undefined;
}

type ToolResult = { content: Array<{ type: "text"; text: string }>; isError?: boolean };

function text(value: string, isError = false): ToolResult {
  return { content: [{ type: "text", text: value }], isError };
}

function json(value: unknown): ToolResult {
  return text(JSON.stringify(value, null, 2));
}

// === Tool definitions (plain JSON Schema — no schema-library dependency) ===

const TOOLS = [
  {
    name: "sui-list-recipes",
    description:
      "Discovery entry point. Lists available composition recipes (id, summary, " +
      "packages used, and whether all its packages are published on the Move Registry) " +
      "without file bodies. Optional " +
      "`package` filters to one package (namespace, MVR slug, or short name). Pick a recipe " +
      "by its summary, then `sui-get-recipe`.",
    inputSchema: {
      type: "object",
      properties: {
        package: {
          type: "string",
          description: "Filter to one package, e.g. `access`, `utils`, `integer-math`.",
        },
      },
    },
  },
  {
    name: "sui-get-recipe",
    description:
      "Returns a full recipe by `id`: the scenario file plus any local support files, " +
      "verbatim, with the packages it uses (and how each is installed), links (docs / audits " +
      "/ source), and assembly notes. Data only — wiring into a buildable project is the " +
      "`setup-sui-contracts` skill's job.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Recipe id, e.g. `access/access_control/reward_treasury`." },
      },
      required: ["id"],
    },
  },
  {
    name: "sui-get-package",
    description:
      "Returns metadata for one OZ package (namespace, MVR slug, docs, audits, source) and " +
      "the dependency line from its README — `r.mvr` when it is published on the Move Registry, " +
      "or a git dependency when it is not. Data only: reconciling versions and writing " +
      "the final Move.toml is the `setup-sui-contracts` skill's job.",
    inputSchema: {
      type: "object",
      properties: {
        package: {
          type: "string",
          description: "A package: namespace (`openzeppelin_utils`), MVR slug (`utils`), or short name.",
        },
      },
      required: ["package"],
    },
  },
];

// === Tool handlers ===

function listRecipes(index: SuiIndex, args: { package?: string }): ToolResult {
  const pkg = args.package;
  // An unknown filter errors (like sui-get-package); an empty result is then
  // only ever a valid package that happens to have no recipes.
  if (pkg && !resolvePackage(index, pkg)) {
    const known = Object.keys(index.packages).join(", ");
    return text(`Unknown package: ${pkg}\nKnown packages: ${known}`, true);
  }
  const recipes = index.recipes
    .filter((r) => r.kind === "recipe")
    .filter((r) => !pkg || r.packages.some((ns) => matchesPackage(index, ns, pkg)))
    .map((r) => ({
      id: r.id,
      summary: r.summary,
      packages: r.packages,
      mvrPublished: r.packages.every((ns) => index.packages[ns]?.mvrPublished),
    }));
  return json({
    recipes,
    buildWith:
      "Use `sui-get-recipe` to read one; use the `setup-sui-contracts` skill to wire it into a buildable project.",
  });
}

function getRecipe(index: SuiIndex, args: { id?: string }): ToolResult {
  const r = args.id ? index.recipes.find((x) => x.id === args.id) : undefined;
  if (!r) {
    const ids = index.recipes.filter((x) => x.kind === "recipe").map((x) => x.id);
    return text(`Unknown recipe id: ${args.id}\nValid ids:\n${ids.join("\n")}`, true);
  }
  const { audits, sourceUrl } = links(index);
  const packages = r.packages
    .map((ns) => index.packages[ns])
    .filter((p): p is PackageInfo => Boolean(p))
    .map((p) => ({
      namespace: p.namespace,
      installLine: p.installLine,
      mvrPublished: p.mvrPublished,
      docs: p.docsUrl,
    }));
  return json({
    id: r.id,
    summary: r.summary,
    packages,
    files: r.files.map((f) => ({ path: f.path, module: f.module, source: f.source })),
    links: { audits, source: r.files.map((f) => sourceUrl(f.path)) },
    assemblyNote: ASSEMBLY_NOTE,
  });
}

function getPackage(index: SuiIndex, args: { package?: string }): ToolResult {
  const p = args.package ? resolvePackage(index, args.package) : undefined;
  if (!p) {
    const known = Object.keys(index.packages).join(", ");
    return text(`Unknown package: ${args.package}\nKnown packages: ${known}`, true);
  }
  const { audits, sourceUrl } = links(index);
  return json({
    namespace: p.namespace,
    slug: p.slug,
    installLine: p.installLine,
    mvrPublished: p.mvrPublished,
    links: { docs: p.docsUrl, audits, source: sourceUrl(p.path) },
    note:
      "Install line taken verbatim from the package README. Wiring it into a buildable " +
      "Move.toml is the `setup-sui-contracts` skill's job.",
  });
}

export function registerSuiTools(server: McpServer): void {
  const low = server.server;

  low.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  low.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;
    const args = (request.params.arguments ?? {}) as Record<string, unknown>;

    let index: SuiIndex;
    try {
      index = await loadSuiIndex();
    } catch (err) {
      return text(
        `Failed to load recipe data from contracts-sui: ${err instanceof Error ? err.message : String(err)}`,
        true
      );
    }

    switch (name) {
      case "sui-list-recipes":
        return listRecipes(index, args as { package?: string });
      case "sui-get-recipe":
        return getRecipe(index, args as { id?: string });
      case "sui-get-package":
        return getPackage(index, args as { package?: string });
      default:
        return text(`Unknown tool: ${name}`, true);
    }
  });
}
