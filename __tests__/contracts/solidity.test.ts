import { GET, POST } from "@/contracts/solidity/[transport]/route";
import {
  TEST_CLIENT_INITIALIZATION_REQUEST,
  TEST_CLIENT_INITIALIZED_REQUEST,
  TEST_CLIENT_TOOLS_LIST_REQUEST,
  createResourcesReadRequest,
  parseJsonData,
  createRequest,
} from "../common";
import { getTitleText, getInstructionsText } from "@/contracts/prompts";
import contractsMcpPackage from "@openzeppelin/contracts-mcp/package.json";

const SOLIDITY_TOOLS_NAMES = [
  "solidity-erc20",
  "solidity-erc721",
  "solidity-erc1155",
  "solidity-stablecoin",
  "solidity-rwa",
  "solidity-account",
  "solidity-governor",
  "solidity-custom",
];

const SOLIDITY_ENDPOINT = "http://localhost:3000/contracts/solidity/mcp";

it("GET Method not allowed", async () => {
  const request = createRequest(SOLIDITY_ENDPOINT, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const response = await GET(request);
  expect(response.ok).toBe(false);
  expect(response.status).toBe(405);
});

it("Server should initialize a client session and serve Solidity tools", async () => {
  // Initialize the client session
  const requestInitialize = createRequest(
    SOLIDITY_ENDPOINT,
    TEST_CLIENT_INITIALIZATION_REQUEST
  );
  const responseInitialize = await POST(requestInitialize);

  const requestInitialized = createRequest(
    SOLIDITY_ENDPOINT,
    TEST_CLIENT_INITIALIZED_REQUEST
  );
  const responseInitialized = await POST(requestInitialized);
  expect(responseInitialized.ok).toBe(true);

  // Assert title, version and instructions
  const responseInitializeText = parseJsonData(await responseInitialize.text());
  expect(getTitleText("Solidity")).toBe(
    responseInitializeText["result"]["serverInfo"]["name"]
  );
  expect(contractsMcpPackage.version).toBe(
    responseInitializeText["result"]["serverInfo"]["version"]
  );
  expect(getInstructionsText("Solidity")).toBe(
    responseInitializeText["result"]["capabilities"]["instructions"]
  );

  // Assert that available tools are the Solidity tools
  const requestToolsList = createRequest(
    SOLIDITY_ENDPOINT,
    TEST_CLIENT_TOOLS_LIST_REQUEST
  );
  const responseToolsList = await POST(requestToolsList);
  const toolsList = parseJsonData(await responseToolsList.text())["result"][
    "tools"
  ];
  const toolsNames = toolsList.map((tool) => tool.name);
  expect(toolsNames).toEqual(expect.arrayContaining(SOLIDITY_TOOLS_NAMES));
  expect(SOLIDITY_TOOLS_NAMES).toEqual(expect.arrayContaining(toolsNames));

  const erc20 = toolsList.find((tool) => tool.name === "solidity-erc20");
  expect(erc20?._meta?.ui?.resourceUri).toBe(
    "ui://openzeppelin/solidity-erc20.html"
  );
});

it("Server should serve MCP App HTML for solidity-erc20", async () => {
  const requestInitialize = createRequest(
    SOLIDITY_ENDPOINT,
    TEST_CLIENT_INITIALIZATION_REQUEST
  );
  await POST(requestInitialize);
  await POST(
    createRequest(SOLIDITY_ENDPOINT, TEST_CLIENT_INITIALIZED_REQUEST)
  );

  const requestRead = createRequest(
    SOLIDITY_ENDPOINT,
    createResourcesReadRequest("ui://openzeppelin/solidity-erc20.html")
  );
  const responseRead = await POST(requestRead);
  expect(responseRead.ok).toBe(true);
  const payload = parseJsonData(await responseRead.text());
  const contents = payload["result"]["contents"];
  expect(contents[0].uri).toBe("ui://openzeppelin/solidity-erc20.html");
  expect(contents[0].mimeType).toContain("text/html");
  expect(contents[0].text).toContain("<!DOCTYPE html>");
  expect(contents[0].text).toContain("<script>");
});
