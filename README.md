# OpenZeppelin MCP Servers Repository

Model Context Protocol servers repository for OpenZeppelin products.

## Usage

This repository contains the code for the Model Context Protocol (MCP) servers repository for OpenZeppelin products.

For configuration instructions, visit [mcp.openzeppelin.com](https://mcp.openzeppelin.com).

## Provided Servers

The following MCP servers are provided:

- Solidity Contracts
- Cairo Contracts
- Stellar Contracts
- Stylus Contracts
- OpenZeppelin Uniswap Hooks

These servers are hosted versions of the [OpenZeppelin Contracts MCP](https://github.com/OpenZeppelin/contracts-wizard/blob/master/packages/mcp/README.md) package, which can also be run locally by following the instructions in the linked readme.

## Local Development

### Prerequisites

- Node.js v22.x
- Bun
- Git

### Run locally

1. Clone the repository:

```bash
git clone https://github.com/openzeppelin/openzeppelin-mcp.git
cd openzeppelin-mcp
```

2. Install dependencies:

```bash
bun install
```

3. Start development server:

```bash
bun run dev
```

### Tests

```bash
bun run test
```

## Production

### Build for Production

1. Build production bundle:

```bash
bun run build
```

2. Start production server:

```bash
bun run start
```

### Docker

1. Build image:

```bash
docker build --build-arg GA4_API_SECRET="$GA4_API_SECRET" --build-arg NEXT_PUBLIC_GA4_MEASUREMENT_ID="$NEXT_PUBLIC_GA4_MEASUREMENT_ID" -t openzeppelin-mcp .
```

2. Run container:

```bash
docker run -it -p 3000:3000 openzeppelin-mcp
```
