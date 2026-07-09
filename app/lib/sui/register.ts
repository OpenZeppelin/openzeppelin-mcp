import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * The Sui server is a thin, deterministic retrieval server over the
 * `contracts-sui` `examples/`. It returns composition recipes built on
 * OpenZeppelin's audited Sui Move primitives. It is not the Wizard: there is no
 * generation, no embeddings, and no in-server LLM — intent→recipe selection is
 * the calling agent's job.
 */

// The primitives are audited; the recipes (the `examples/`) are not. This caveat
// must be unavoidable in every read/scaffold output.
export const UNAUDITED_CAVEAT =
  "The recipes are unaudited illustrations of audited OpenZeppelin Sui Move " +
  "primitives. The underlying packages are audited; the example compositions are not. " +
  "Review them before any production use.";

// Server `instructions` (MCP capability): the flow and the caveat.
export const SUI_INSTRUCTIONS =
  "An MCP server that returns composition recipes built on OpenZeppelin's audited " +
  "Sui Move primitives. Retrieval, not generation: intent→recipe selection is your job.\n" +
  "Flow: discover with `sui-list-recipes` → pick a recipe by its summary → " +
  "`sui-scaffold-package` for a new project, or `sui-get-recipe` + `sui-get-dependencies` " +
  "to drop a recipe into an existing project.\n" +
  UNAUDITED_CAVEAT;

// The tools are registered as stubs for now: the server is routable and
// listable, but the handlers return a placeholder until the retrieval and
// package-wiring logic is implemented.
const NOT_IMPLEMENTED_YET = "This tool is not implemented yet.";

function stubResult() {
  return {
    content: [
      {
        type: "text" as const,
        text: `${NOT_IMPLEMENTED_YET}\n\n${UNAUDITED_CAVEAT}`,
      },
    ],
  };
}

export function registerSuiTools(server: McpServer): void {
  server.tool(
    "sui-list-recipes",
    "Discovery entry point. Lists available recipes (id, title, summary, packages " +
      "used, servable) without file bodies. Optional `package` filters to one MVR slug. " +
      "Select a recipe by its summary, then fetch or scaffold it.",
    async () => stubResult()
  );

  server.tool(
    "sui-get-recipe",
    "Returns a full recipe by `id`: the scenario file plus any local support files, " +
      "verbatim from `examples/`, with links and the unaudited caveat. Use to read a " +
      "recipe or drop its source into an existing project.",
    async () => stubResult()
  );

  server.tool(
    "sui-scaffold-package",
    "Returns a complete, buildable Move package for the given `recipeIds`: a Move.toml " +
      "with `r.mvr` deps pinned for the union of required packages, sources/*.move, and a " +
      "README carrying the unaudited caveat and links. Use for a new project.",
    async () => stubResult()
  );

  server.tool(
    "sui-get-dependencies",
    "Returns just the `[dependencies]` block (`dep = { r.mvr = \"@openzeppelin-move/<slug>\" }`, " +
      "pinned) for the union of packages required by the given `recipeIds`/`packages`, to " +
      "merge into an existing Move.toml.",
    async () => stubResult()
  );
}
