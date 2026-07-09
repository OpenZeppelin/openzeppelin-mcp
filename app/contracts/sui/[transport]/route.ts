import { createMcpHandler } from "mcp-handler";
import { registerSuiTools, SUI_INSTRUCTIONS } from "@/lib/sui/register";
import { getTitleText } from "@/contracts/prompts";
import contractsMcpPackage from "@openzeppelin/contracts-mcp/package.json";
import { gaAnalyticsWrapper } from "@/libraries/ga-analytics-wrapper";

const LANGUAGE = "Sui";

const serverOptions = {
  serverInfo: {
    name: getTitleText(LANGUAGE),
    version: contractsMcpPackage.version,
  },
  capabilities: {
    tools: {
      listChanged: true,
    },
    instructions: SUI_INSTRUCTIONS,
  },
};

const serverConfig = {
  basePath: "/contracts/sui",
  verboseLogs: true,
  maxDuration: 60,
};

const mcpHandler = createMcpHandler(
  async (server) => {
    registerSuiTools(server);
  },
  serverOptions,
  serverConfig
);

const handler = gaAnalyticsWrapper(mcpHandler);

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
