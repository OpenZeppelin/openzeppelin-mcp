import { CursorIcon } from "@/components/icons";

function AddToCursorButton({ size = 32, name, url, currentTheme = "light" }) {
  const configJson = {
    type: "streamable-http",
    url: url,
  };

  const encodedConfig = btoa(JSON.stringify(configJson));
  return (
    <a
      href={`https://cursor.com/install-mcp?name=${name}&config=${encodedConfig}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        src={`https://cursor.com/deeplink/mcp-install-${
          currentTheme === "light" ? "dark" : "light"
        }.svg`}
        alt={`Add ${name} MCP server to Cursor`}
        height={size}
      />
    </a>
  );
}

export function CursorConfig({ name, url, currentTheme }) {
  const config = {
    filename: "~/.cursor/mcp.json",
    code: `{
  "mcpServers": {
    "OpenZeppelin${name.replace(/ /g, "")}": {
        "type": "streamable-http",
        "url": "${url}"
    }
  }
}`,
  };

  return (
    <div className="config-section">
      <div className="section-header">
        <CursorIcon />
        <h2>Cursor</h2>
      </div>
      <div className="config-content">
        <p>For quick setup, use the button below:</p>
        <div className="cursor-quick-install">
          <AddToCursorButton
            name={`OpenZeppelin${name.replace(/ /g, "")}`}
            url={url}
            currentTheme={currentTheme}
          />
        </div>
        <p>For manual setup:</p>
        <ol className="installation-steps">
          <li>
            <strong>Cmd + Shift + J</strong> to open Cursor Settings
          </li>
          <li>
            Select <strong>Tools & Integrations</strong>
          </li>
          <li>
            Click <strong>New MCP Server</strong>
          </li>
          <li>
            Add to your <code>mcpServers</code> config
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
