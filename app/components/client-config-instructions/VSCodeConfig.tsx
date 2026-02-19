import { CopyButton } from "@/components/CopyButton";

function AddToVSCode({ size = 32, name, url }) {
  const jsonConfig = {
    name: name,
    type: "http",
    url: url,
  };
  const encodedConfig = encodeURIComponent(JSON.stringify(jsonConfig));

  return (
    <a
      href={`vscode:mcp/install?${encodedConfig}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        src="https://img.shields.io/badge/Visual%20Studio%20Code-0078d7.svg?style=for-the-badge&logo=visual-studio-code&logoColor=white"
        alt={`Add ${name} MCP server to VS Code`}
        height={size}
      />
    </a>
  );
}

export function VSCodeConfig({ name, url }) {
  const config = {
    filename: ".vscode/mcp.json",
    code: `{
  "servers": {
    "OpenZeppelin${name.replace(/ /g, "")}": {
        "type": "http",
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
          <AddToVSCode
            name={`0penZeppelin${name.replace(/ /g, "")}`}
            url={url}
          />
        </div>
        <p>For manual setup:</p>
        <ol className="installation-steps">
          <li>
            Follow VS Code documentation to{" "}
            <strong>
              <a
                href="https://code.visualstudio.com/docs/copilot/chat/mcp-servers#_add-an-mcp-server-to-your-workspace"
                target="_blank"
                rel="noopener noreferrer"
              >
                Add an MCP server to your workspace
              </a>
            </strong>
            {" "}using the given configuration
          </li>
          <li>
            Start the MCP server according to{" "}
            <strong>
              <a
                href="https://code.visualstudio.com/docs/copilot/chat/mcp-servers#_manage-mcp-servers"
                target="_blank"
                rel="noopener noreferrer"
              >
                Manage MCP servers
              </a>
            </strong>
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
