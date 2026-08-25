import { GET, POST } from "@/contracts/tron/[transport]/route";
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

const TRON_TOOLS_NAMES = [
  "tron-trc20",
  "tron-trc721",
  "tron-trc1155",
  "tron-governor",
  "tron-custom",
];

const TRON_ENDPOINT = "http://localhost:3000/contracts/tron/mcp";

it("GET Method not allowed", async () => {
  const request = createRequest(TRON_ENDPOINT, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const response = await GET(request);
  expect(response.ok).toBe(false);
  expect(response.status).toBe(405);
});

it("Server should initialize a client session and serve TRON tools", async () => {
  const requestInitialize = createRequest(
    TRON_ENDPOINT,
    TEST_CLIENT_INITIALIZATION_REQUEST
  );
  const responseInitialize = await POST(requestInitialize);

  const requestInitialized = createRequest(
    TRON_ENDPOINT,
    TEST_CLIENT_INITIALIZED_REQUEST
  );
  const responseInitialized = await POST(requestInitialized);
  expect(responseInitialized.ok).toBe(true);

  const responseInitializeText = parseJsonData(await responseInitialize.text());
  expect(getTitleText("TRON")).toBe(
    responseInitializeText["result"]["serverInfo"]["name"]
  );
  expect(contractsMcpPackage.version).toBe(
    responseInitializeText["result"]["serverInfo"]["version"]
  );
  expect(getInstructionsText("TRON")).toBe(
    responseInitializeText["result"]["capabilities"]["instructions"]
  );

  const requestToolsList = createRequest(
    TRON_ENDPOINT,
    TEST_CLIENT_TOOLS_LIST_REQUEST
  );
  const responseToolsList = await POST(requestToolsList);
  const toolsList = parseJsonData(await responseToolsList.text())["result"][
    "tools"
  ];
  const toolsNames = toolsList.map((tool) => tool.name);
  expect(toolsNames).toEqual(expect.arrayContaining(TRON_TOOLS_NAMES));
  expect(TRON_TOOLS_NAMES).toEqual(expect.arrayContaining(toolsNames));

  const trc20 = toolsList.find((tool) => tool.name === "tron-trc20");
  expect(trc20?._meta?.ui?.resourceUri).toBe(
    "ui://openzeppelin/tron-trc20.html"
  );
});

it("Server should serve MCP App HTML for tron-trc20", async () => {
  await POST(createRequest(TRON_ENDPOINT, TEST_CLIENT_INITIALIZATION_REQUEST));
  await POST(
    createRequest(TRON_ENDPOINT, TEST_CLIENT_INITIALIZED_REQUEST)
  );

  const requestRead = createRequest(
    TRON_ENDPOINT,
    createResourcesReadRequest("ui://openzeppelin/tron-trc20.html")
  );
  const responseRead = await POST(requestRead);
  expect(responseRead.ok).toBe(true);
  const payload = parseJsonData(await responseRead.text());
  const contents = payload["result"]["contents"];
  expect(contents[0].uri).toBe("ui://openzeppelin/tron-trc20.html");
  expect(contents[0].mimeType).toContain("text/html");
  expect(contents[0].text).toContain("<!DOCTYPE html>");
  expect(contents[0].text).toContain("<script>");
});
