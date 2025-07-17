export function ClaudeCodeConfig({ name, url }) {
  const config = {
    code: `claude mcp add -t http OpenZeppelin${name.replace(/ /g, "")} ${url}`,
  };
  return (
    <div className="config-section">
      <div className="config-content">
        <p>
          To add the MCP Server to your claude code run the following command:
        </p>
        <div className="code-window">
          <div className="code-header">
            <div className="code-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="code-filename"></div>
          </div>
          <pre className="code-content">
            <code>{config.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
