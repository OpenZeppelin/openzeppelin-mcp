export function WindsurfConfig({ name, url, currentTheme }) {
  const config = {
    filename: "~/.codeium/windsurf/mcp_config.json",
    code: `{
  "mcpServers": {
    "OpenZeppelin${name.replace(/ /g, "")}": {
        "serverUrl": "${url}"
    }
  }
}`,
  };

  return (
    <div className="config-section">
      <div className="config-content">
        <p>For manual setup:</p>
        <ol className="installation-steps">
          <li>
            <strong>Cmd + ,</strong> to open Windsurf settings
          </li>
          <li>
            Go to <strong>MCP Servers</strong>
          </li>
          <li>
            Click <strong>Open MCP Marketplace</strong>
          </li>
          <li>
            Click the Settings icon
          </li>
          <li>
            Add the MCP to your <code>mcpServers</code> config
          </li>
        </ol>
      </div>
      <div className="code-window">
        <div className="code-header">
          <div className="code-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="code-filename">{config.filename}</div>
        </div>
        <pre className="code-content">
          <code>{config.code}</code>
        </pre>
      </div>
    </div>
  );
}
