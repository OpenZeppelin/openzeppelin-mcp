import { GET, POST } from "@/contracts/confidential/[transport]/route";
import {
  TEST_CLIENT_INITIALIZATION_REQUEST,
  TEST_CLIENT_INITIALIZED_REQUEST,
  TEST_CLIENT_TOOLS_LIST_REQUEST,
  parseJsonData,
  createRequest,
} from "../common";
import { getTitleText, getInstructionsText } from "@/contracts/prompts";
import contractsMcpPackage from "@openzeppelin/contracts-mcp/package.json";

const CONFIDENTIAL_TOOLS_NAMES = ["erc7984"];

const CONFIDENTIAL_ENDPOINT =
  "http://localhost:3000/contracts/confidential/mcp";

it("GET Method not allowed", async () => {
  const request = createRequest(CONFIDENTIAL_ENDPOINT, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const response = await GET(request);
  expect(response.ok).toBe(false);
  expect(response.status).toBe(405);
});

it("Server should initialize a client session and serve Confidential tools", async () => {
  // Initialize the client session
  const requestInitialize = createRequest(
    CONFIDENTIAL_ENDPOINT,
    TEST_CLIENT_INITIALIZATION_REQUEST
  );
  const responseInitialize = await POST(requestInitialize);

  const requestInitialized = createRequest(
    CONFIDENTIAL_ENDPOINT,
    TEST_CLIENT_INITIALIZED_REQUEST
  );
  const responseInitialized = await POST(requestInitialized);
  expect(responseInitialized.ok).toBe(true);

  // Assert title, version and instructions
  const responseInitializeText = parseJsonData(await responseInitialize.text());
  expect(getTitleText("Confidential")).toBe(
    responseInitializeText["result"]["serverInfo"]["name"]
  );
  expect(contractsMcpPackage.version).toBe(
    responseInitializeText["result"]["serverInfo"]["version"]
  );
  expect(getInstructionsText("Confidential")).toBe(
    responseInitializeText["result"]["capabilities"]["instructions"]
  );

  // Assert that available tools are the Confidential tools
  const requestToolsList = createRequest(
    CONFIDENTIAL_ENDPOINT,
    TEST_CLIENT_TOOLS_LIST_REQUEST
  );
  const responseToolsList = await POST(requestToolsList);
  const toolsList = parseJsonData(await responseToolsList.text())["result"][
    "tools"
  ];
  const toolsNames = toolsList.map((tool) => tool.name);
  expect(toolsNames).toEqual(expect.arrayContaining(CONFIDENTIAL_TOOLS_NAMES));
  expect(CONFIDENTIAL_TOOLS_NAMES).toEqual(expect.arrayContaining(toolsNames));
});
