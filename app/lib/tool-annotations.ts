import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

/**
 * MCP tool annotations for the OpenZeppelin contract tools.
 *
 * Every tool exposed by this server is a pure generator: it takes options and
 * returns contract source code (or recipe data). It reads no external state,
 * writes nothing to disk, and produces the same output for the same input.
 * Advertising that lets MCP clients skip confirmation prompts and safely
 * cache/retry calls.
 *
 * See https://modelcontextprotocol.io/specification/2025-06-18/server/tools#tool-annotations
 */
export const READ_ONLY_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

type RegisterTool = McpServer["registerTool"];

/**
 * Wraps `server.registerTool` so every tool registered through it carries the
 * given annotations. The contracts-mcp package registers its tools without
 * annotations; this decorates them at the server boundary without forking the
 * dependency. Annotations set explicitly by a tool definition win over the
 * defaults.
 */
export function withToolAnnotations(
  server: McpServer,
  annotations: ToolAnnotations = READ_ONLY_TOOL_ANNOTATIONS
): McpServer {
  const registerTool = server.registerTool.bind(server);
  server.registerTool = ((name, config, callback) =>
    registerTool(
      name,
      {
        ...config,
        annotations: { ...annotations, ...config.annotations },
      },
      callback
    )) as RegisterTool;
  return server;
}
