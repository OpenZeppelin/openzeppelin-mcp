// https://modelcontextprotocol.io/specification/2025-03-26/basic/lifecycle#initialization
export const TEST_CLIENT_INITIALIZATION_REQUEST = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: "test-id",
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: {
        roots: {
          listChanged: true,
        },
        sampling: {},
      },
      clientInfo: {
        name: "ExampleClient",
        version: "1.0.0",
      },
    },
  }),
};

export const TEST_CLIENT_INITIALIZED_REQUEST = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    method: "notifications/initialized",
  }),
};

export const TEST_CLIENT_TOOLS_LIST_REQUEST = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: "test-id",
    method: "tools/list",
    params: {},
  }),
};

export function parseJsonData(responseText: string): JSON {
  const dataLine = responseText
    .split("\n")
    .find((line) => line.startsWith("data: "));
  const jsonString = dataLine.substring(5);
  return JSON.parse(jsonString);
}

export function createRequest(endPoint, requestConfig: {
  method: string;
  headers: Record<string, string>;
  body?: string;
}): Request {
  return new Request(endPoint, {
    method: requestConfig.method,
    headers: requestConfig.headers,
    body: requestConfig.body,
  });
}