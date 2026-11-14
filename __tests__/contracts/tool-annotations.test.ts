import { POST as solidityPOST } from "@/contracts/solidity/[transport]/route";
import { POST as cairoPOST } from "@/contracts/cairo/[transport]/route";
import { POST as confidentialPOST } from "@/contracts/confidential/[transport]/route";
import { POST as stellarPOST } from "@/contracts/stellar/[transport]/route";
import { POST as stylusPOST } from "@/contracts/stylus/[transport]/route";
import { POST as suiPOST } from "@/contracts/sui/[transport]/route";
import { POST as tronPOST } from "@/contracts/tron/[transport]/route";
import { POST as uniswapHooksPOST } from "@/contracts/uniswap-hooks/[transport]/route";
import {
  TEST_CLIENT_INITIALIZATION_REQUEST,
  TEST_CLIENT_INITIALIZED_REQUEST,
  TEST_CLIENT_TOOLS_LIST_REQUEST,
  parseJsonData,
  createRequest,
} from "../common";

// MCP tool annotations (spec: ToolAnnotations). Every OpenZeppelin tool here is
// a pure code/data generator: it reads no external state, writes nothing to
// disk, and returns the same result for the same arguments.
const EXPECTED_TOOL_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const SERVERS = [
  { name: "Solidity", endpoint: "http://localhost:3000/contracts/solidity/mcp", post: solidityPOST },
  { name: "Cairo", endpoint: "http://localhost:3000/contracts/cairo/mcp", post: cairoPOST },
  { name: "Confidential", endpoint: "http://localhost:3000/contracts/confidential/mcp", post: confidentialPOST },
  { name: "Stellar", endpoint: "http://localhost:3000/contracts/stellar/mcp", post: stellarPOST },
  { name: "Stylus", endpoint: "http://localhost:3000/contracts/stylus/mcp", post: stylusPOST },
  { name: "Sui", endpoint: "http://localhost:3000/contracts/sui/mcp", post: suiPOST },
  { name: "TRON", endpoint: "http://localhost:3000/contracts/tron/mcp", post: tronPOST },
  { name: "Uniswap Hooks", endpoint: "http://localhost:3000/contracts/uniswap-hooks/mcp", post: uniswapHooksPOST },
];

it.each(SERVERS)(
  "$name tools advertise MCP tool hint annotations",
  async ({ endpoint, post }) => {
    const responseInitialize = await post(
      createRequest(endpoint, TEST_CLIENT_INITIALIZATION_REQUEST)
    );
    expect(responseInitialize.ok).toBe(true);
    await post(createRequest(endpoint, TEST_CLIENT_INITIALIZED_REQUEST));

    const responseToolsList = await post(
      createRequest(endpoint, TEST_CLIENT_TOOLS_LIST_REQUEST)
    );
    const tools = parseJsonData(await responseToolsList.text())["result"]["tools"];

    expect(tools.length).toBeGreaterThan(0);
    for (const tool of tools) {
      expect({ name: tool.name, annotations: tool.annotations }).toEqual({
        name: tool.name,
        annotations: EXPECTED_TOOL_ANNOTATIONS,
      });
    }
  }
);
