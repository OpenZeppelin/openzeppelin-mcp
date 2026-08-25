import { CopyButton } from "@/components/CopyButton";

function AddToCursorButton({
  size = 32,
  serverName,
  url,
  currentTheme = "light",
}) {
  const configJson = {
    type: "streamable-http",
    url: url,
  };

  const encodedConfig = btoa(JSON.stringify(configJson));
  return (
    <a
      href={`cursor://anysphere.cursor-deeplink/mcp/install?name=${serverName}&config=${encodedConfig}`}
    >
      <img
        src={`https://cursor.com/deeplink/mcp-install-${
          currentTheme === "light" ? "dark" : "light"
        }.svg`}
        alt={`Add ${serverName} MCP server to Cursor`}
        height={size}
      />
    </a>
  );
}

export function CursorConfig({ serverName, url, currentTheme }) {
  const config = {
    filename: "~/.cursor/mcp.json",
    code: `{
  "mcpServers": {
    "${serverName}": {
        "type": "streamable-http",
        "url": "${url}"
    }
  }
}`,
  };

  return (
    <div className="config-section">
      <div className="config-content">
        <p>For quick setup, use the button below:</p>
        <div className="cursor-quick-install">
          <AddToCursorButton
            serverName={serverName}
            url={url}
            currentTheme={currentTheme}
          />
        </div>
        <p>For manual setup:</p>
        <ol className="installation-steps">
          <li>
            <strong>Cmd + Shift + J</strong> to open Cursor settings
          </li>
          <li>
            Select <strong>Tools & MCP</strong>
          </li>
          <li>
            Click <strong>New MCP Server</strong>
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
          <CopyButton text={config.code} />
        </div>
        <pre className="code-content">
          <code>{config.code}</code>
        </pre>
      </div>
    </div>
  );
}
