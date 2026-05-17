import { CopyButton } from "@/components/CopyButton";

export function GeminiCliConfig({ name, url, currentTheme }) {
  const config = {
    filename: "~/.gemini/settings.json",
    code: `{
  //other settings...

  "mcpServers": {
    "OpenZeppelin${name.replace(/ /g, "")}": {
        "httpUrl": "${url}"
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
            Open your Gemini settings JSON located in{" "}
            <code>~/.gemini/settings.json</code>
            where <code>~</code> is your home directory.
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
