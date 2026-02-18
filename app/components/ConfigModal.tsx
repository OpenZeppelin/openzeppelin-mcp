import {
  CloseIcon,
  CursorIcon,
  VSCodeIcon,
  ClaudeIcon,
  WindsurfIcon,
  GeminiIcon,
  CodexIcon,
} from "@/components/icons";
import { useState } from "react";
import { CursorConfig } from "@/components/client-config-instructions/CursorConfig";
import { VSCodeConfig } from "@/components/client-config-instructions/VSCodeConfig";
import { ClaudeCodeConfig } from "@/components/client-config-instructions/ClaudeCodeConfig";
import { CodexConfig } from "@/components/client-config-instructions/CodexConfig";
import { WindsurfConfig } from "@/components/client-config-instructions/WindsurfConfig";
import { GeminiCliConfig } from "@/components/client-config-instructions/GeminiCliConfig";

export function ConfigModal({ isOpen, onClose, mcp, currentTheme }) {
  if (!isOpen || !mcp) return null;

  const [activeTab, setActiveTab] = useState("claude-code");

  const tabs = [
    { id: "claude-code", label: "Claude Code", icon: ClaudeIcon },
    { id: "codex", label: "Codex", icon: CodexIcon },
    {
      id: "cursor",
      label: "Cursor",
      icon: CursorIcon,
    },
    { id: "windsurf", label: "Windsurf", icon: WindsurfIcon },
    { id: "vscode", label: "VS Code", icon: VSCodeIcon },
    { id: "gemini-cli", label: "Gemini CLI", icon: GeminiIcon },
  ];

  const renderConfigContent = () => {
    switch (activeTab) {
      case "cursor":
        return (
          <CursorConfig
            name={mcp.name}
            url={mcp.url}
            currentTheme={currentTheme}
          />
        );
      case "vscode":
        return <VSCodeConfig name={mcp.name} url={mcp.url} />;
      case "claude-code":
        return <ClaudeCodeConfig name={mcp.name} url={mcp.url} />;
      case "codex":
        return <CodexConfig name={mcp.name} url={mcp.url} />;
      case "windsurf":
        return (
          <WindsurfConfig
            name={mcp.name}
            url={mcp.url}
            currentTheme={currentTheme}
          />
        );
      case "gemini-cli":
        return (
          <GeminiCliConfig
            name={mcp.name}
            url={mcp.url}
            currentTheme={currentTheme}
          />
        );
      default:
        return (
          <CursorConfig
            name={mcp.name}
            url={mcp.url}
            currentTheme={currentTheme}
          />
        );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mcp.name} MCP Setup Instructions</h2>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="section-header">
                <tab.icon theme={currentTheme} />
                <h3>{tab.label}</h3>
              </div>
            </button>
          ))}
        </div>
        <div className="modal-body">
          {renderConfigContent()}
          <div className="modal-npm-link">
            {" "}
            Powered by the{" "}
            <a
              href={`https://www.npmjs.com/package/${mcp.npmMcpPackage}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {mcp.npmMcpPackage}
            </a>{" "}
            npm package.{" "}
          </div>
        </div>
      </div>
    </div>
  );
}
