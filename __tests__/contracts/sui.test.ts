import { GET, POST } from "@/contracts/sui/[transport]/route";
import {
  TEST_CLIENT_INITIALIZATION_REQUEST,
  TEST_CLIENT_INITIALIZED_REQUEST,
  TEST_CLIENT_TOOLS_LIST_REQUEST,
  parseJsonData,
  createRequest,
} from "../common";
import { getTitleText } from "@/contracts/prompts";
import { SUI_INSTRUCTIONS } from "@/lib/sui/register";
import contractsMcpPackage from "@openzeppelin/contracts-mcp/package.json";

const SUI_TOOLS_NAMES = [
  "sui-list-recipes",
  "sui-get-recipe",
  "sui-scaffold-package",
  "sui-get-dependencies",
];

const SUI_ENDPOINT = "http://localhost:3000/contracts/sui/mcp";

it("GET Method not allowed", async () => {
  const request = createRequest(SUI_ENDPOINT, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const response = await GET(request);
  expect(response.ok).toBe(false);
  expect(response.status).toBe(405);
});

it("Server should initialize a client session and serve Sui tools", async () => {
  // Initialize the client session
  const requestInitialize = createRequest(
    SUI_ENDPOINT,
    TEST_CLIENT_INITIALIZATION_REQUEST
  );
  const responseInitialize = await POST(requestInitialize);

  const requestInitialized = createRequest(
    SUI_ENDPOINT,
    TEST_CLIENT_INITIALIZED_REQUEST
  );
  const responseInitialized = await POST(requestInitialized);
  expect(responseInitialized.ok).toBe(true);

  // Assert title, version and instructions
  const responseInitializeText = parseJsonData(await responseInitialize.text());
  expect(getTitleText("Sui")).toBe(
    responseInitializeText["result"]["serverInfo"]["name"]
  );
  expect(contractsMcpPackage.version).toBe(
    responseInitializeText["result"]["serverInfo"]["version"]
  );
  expect(SUI_INSTRUCTIONS).toBe(
    responseInitializeText["result"]["capabilities"]["instructions"]
  );

  // Assert that available tools are the Sui tools
  const requestToolsList = createRequest(
    SUI_ENDPOINT,
    TEST_CLIENT_TOOLS_LIST_REQUEST
  );
  const responseToolsList = await POST(requestToolsList);
  const toolsList = parseJsonData(await responseToolsList.text())["result"][
    "tools"
  ];
  const toolsNames = toolsList.map((tool) => tool.name);
  expect(toolsNames).toEqual(expect.arrayContaining(SUI_TOOLS_NAMES));
  expect(SUI_TOOLS_NAMES).toEqual(expect.arrayContaining(toolsNames));
});
