/**
 * MCP server names are used as config keys, so they must stay identifier-style
 * PascalCase. Cards whose display name carries acronym styling (e.g. "TRON
 * Contracts") set `configName` to override it for config output only.
 */
export function getServerName({ name, configName }) {
  return `OpenZeppelin${(configName ?? name).replace(/ /g, "")}`;
}
