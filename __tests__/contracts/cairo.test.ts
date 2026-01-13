import { GET, POST } from "@/contracts/cairo/[transport]/route";
import {
  TEST_CLIENT_INITIALIZATION_REQUEST,
  TEST_CLIENT_INITIALIZED_REQUEST,
  TEST_CLIENT_TOOLS_LIST_REQUEST,
  parseJsonData,
  createRequest,
} from "../common";
import { getTitleText, getInstructionsText } from "@/contracts/prompts";
import contractsMcpPackage from "@openzeppelin/contracts-mcp/package.json";

const CAIRO_TOOLS_NAMES = [
  "cairo-erc20",
  "cairo-erc721",
  "cairo-erc1155",
  "cairo-account",
  "cairo-multisig",
  "cairo-governor",
  "cairo-vesting",
  "cairo-custom",
];

const CAIRO_ENDPOINT = "http://localhost:3000/contracts/cairo/mcp";

it("GET Method not allowed", async () => {
  const request = createRequest(CAIRO_ENDPOINT, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const response = await GET(request);
  expect(response.ok).toBe(false);
  expect(response.status).toBe(405);
});

it("Server should initialize a client session and serve Cairo tools", async () => {
  // Initialize the client session
  const requestInitialize = createRequest(
    CAIRO_ENDPOINT,
    TEST_CLIENT_INITIALIZATION_REQUEST
  );
  const responseInitialize = await POST(requestInitialize);

  const requestInitialized = createRequest(
    CAIRO_ENDPOINT,
    TEST_CLIENT_INITIALIZED_REQUEST
  );
  const responseInitialized = await POST(requestInitialized);
  expect(responseInitialized.ok).toBe(true);

  // Assert title, version and instructions
  const responseInitializeText = parseJsonData(await responseInitialize.text());
  expect(getTitleText("Cairo")).toBe(
    responseInitializeText["result"]["serverInfo"]["name"]
  );
  expect(contractsMcpPackage.version).toBe(
    responseInitializeText["result"]["serverInfo"]["version"]
  );
  expect(getInstructionsText("Cairo")).toBe(
    responseInitializeText["result"]["capabilities"]["instructions"]
  );

  // Assert that available tools are the Cairo tools
  const requestToolsList = createRequest(
    CAIRO_ENDPOINT,
    TEST_CLIENT_TOOLS_LIST_REQUEST
  );
  const responseToolsList = await POST(requestToolsList);
  const toolsList = parseJsonData(await responseToolsList.text())["result"][
    "tools"
  ];
  const toolsNames = toolsList.map((tool) => tool.name);
  expect(toolsNames).toEqual(expect.arrayContaining(CAIRO_TOOLS_NAMES));
  expect(CAIRO_TOOLS_NAMES).toEqual(expect.arrayContaining(toolsNames));
});
