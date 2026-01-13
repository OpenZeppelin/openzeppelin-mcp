import { GET, POST } from "@/contracts/stylus/[transport]/route";
import {
  TEST_CLIENT_INITIALIZATION_REQUEST,
  TEST_CLIENT_INITIALIZED_REQUEST,
  TEST_CLIENT_TOOLS_LIST_REQUEST,
  parseJsonData,
  createRequest,
} from "../common";
import { getTitleText, getInstructionsText } from "@/contracts/prompts";
import contractsMcpPackage from "@openzeppelin/contracts-mcp/package.json";

const STYLUS_TOOLS_NAMES = ["stylus-erc20", "stylus-erc721", "stylus-erc1155"];

const STYLUS_ENDPOINT = "http://localhost:3000/contracts/stylus/mcp";

it("GET Method not allowed", async () => {
  const request = createRequest(STYLUS_ENDPOINT, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const response = await GET(request);
  expect(response.ok).toBe(false);
  expect(response.status).toBe(405);
});

it("Server should initialize a client session and serve Stylus tools", async () => {
  // Initialize the client session
  const requestInitialize = createRequest(
    STYLUS_ENDPOINT,
    TEST_CLIENT_INITIALIZATION_REQUEST
  );
  const responseInitialize = await POST(requestInitialize);

  const requestInitialized = createRequest(
    STYLUS_ENDPOINT,
    TEST_CLIENT_INITIALIZED_REQUEST
  );
  const responseInitialized = await POST(requestInitialized);
  expect(responseInitialized.ok).toBe(true);

  // Assert title, version and instructions
  const responseInitializeText = parseJsonData(await responseInitialize.text());
  expect(getTitleText("Stylus")).toBe(
    responseInitializeText["result"]["serverInfo"]["name"]
  );
  expect(contractsMcpPackage.version).toBe(
    responseInitializeText["result"]["serverInfo"]["version"]
  );
  expect(getInstructionsText("Stylus")).toBe(
    responseInitializeText["result"]["capabilities"]["instructions"]
  );

  // Assert that available tools are the Stylus tools
  const requestToolsList = createRequest(
    STYLUS_ENDPOINT,
    TEST_CLIENT_TOOLS_LIST_REQUEST
  );
  const responseToolsList = await POST(requestToolsList);
  const toolsList = parseJsonData(await responseToolsList.text())["result"][
    "tools"
  ];
  const toolsNames = toolsList.map((tool) => tool.name);
  expect(toolsNames).toEqual(expect.arrayContaining(STYLUS_TOOLS_NAMES));
  expect(STYLUS_TOOLS_NAMES).toEqual(expect.arrayContaining(toolsNames));
});
