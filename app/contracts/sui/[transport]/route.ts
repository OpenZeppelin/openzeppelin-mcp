import { createMcpHandler } from "mcp-handler";
import { registerSuiTools, SUI_INSTRUCTIONS } from "@/lib/sui/register";
import { getTitleText } from "@/contracts/prompts";
import { SUI_CONTENT_REF } from "@/lib/sui/loader";
import { gaAnalyticsWrapper } from "@/libraries/ga-analytics-wrapper";

const LANGUAGE = "Sui";

const serverOptions = {
  serverInfo: {
    name: getTitleText(LANGUAGE),
    // The data comes from contracts-sui at runtime, not from an npm package —
    // report the pinned contracts-sui release the server is actually serving.
    version: SUI_CONTENT_REF.replace(/^v/, ""),
  },
  capabilities: {
    tools: {
      listChanged: true,
    },
    resources: {},
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
