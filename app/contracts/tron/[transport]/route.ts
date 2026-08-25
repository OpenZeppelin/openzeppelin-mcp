import { createMcpHandler } from "mcp-handler";
import { registerTronTools } from "@openzeppelin/contracts-mcp";
import { getTitleText } from "@/contracts/prompts";
import { getInstructionsText } from "@/contracts/prompts";
import contractsMcpPackage from "@openzeppelin/contracts-mcp/package.json";
import { gaAnalyticsWrapper } from "@/libraries/ga-analytics-wrapper";

const LANGUAGE = "TRON";

const serverOptions = {
  serverInfo: {
    name: getTitleText(LANGUAGE),
    version: contractsMcpPackage.version,
  },
  capabilities: {
    tools: {
      listChanged: true,
    },
    resources: {},
    instructions: getInstructionsText(LANGUAGE),
  },
};

const serverConfig = {
  basePath: "/contracts/tron",
  verboseLogs: true,
  maxDuration: 60,
};

const mcpHandler = createMcpHandler(
  async (server) => {
    registerTronTools(server);
  },
  serverOptions,
  serverConfig
);

const handler = gaAnalyticsWrapper(mcpHandler);

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
