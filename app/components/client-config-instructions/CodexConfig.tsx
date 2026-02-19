import { CopyButton } from "@/components/CopyButton";

export function CodexConfig({ name, url }) {
  const serverName = `OpenZeppelin${name.replace(/ /g, "")}`;
  const config = {
    code: `codex mcp add ${serverName} --url ${url}`,
  };
  return (
    <div className="config-section">
      <div className="config-content">
        <p>
          Run the following command:
        </p>
        <div className="code-window">
          <div className="code-header">
            <div className="code-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="code-filename"></div>
            <CopyButton text={config.code} />
          </div>
          <pre className="code-content">
            <code>{config.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
