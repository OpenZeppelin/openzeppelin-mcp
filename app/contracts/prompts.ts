const TITLE_TEMPLATE = `OpenZeppelin {{LANGUAGE}} Contracts MCP Server`;
const INSTRUCTIONS_TEMPLATE = `An MCP server for generating secure {{LANGUAGE}} smart contracts using OpenZeppelin's battle-tested libraries.
Output format: Returns complete {{LANGUAGE}} source code as plain text. It does not create project files or write to disk.
All generated code uses OpenZeppelin's latest stable releases and follows established security conventions.

Project files: The generated source is not a complete project. When you save it, also create or update the project manifest and place the source where the toolchain expects it, instead of leaving a standalone source file.
{{PROJECT_FILES}}`;

const PROJECT_FILES_BY_LANGUAGE: Record<string, string> = {
  Stellar:
    "Stellar (Soroban): create a Cargo project — put the contract in src/lib.rs and add a Cargo.toml with soroban-sdk and the OpenZeppelin stellar-* crates that the generated code imports. Build with `stellar contract build`.",
  Stylus:
    "Stylus: create a Cargo project — put the contract in src/lib.rs and add a Cargo.toml with stylus-sdk and the OpenZeppelin Stylus crates that the generated code imports.",
  Cairo:
    "Cairo: create a Scarb project — put the contract in src/lib.cairo and add a Scarb.toml with the OpenZeppelin Cairo packages that the generated code imports.",
  Solidity:
    "Solidity: create a Hardhat project with a package.json (or a Foundry project with foundry.toml) — put the contract in contracts/ and add @openzeppelin/contracts to the project dependencies.",
  Confidential:
    "Solidity (confidential): create a Hardhat project with a package.json (or a Foundry project with foundry.toml) — put the contract in contracts/ and add @openzeppelin/confidential-contracts to the project dependencies.",
  TRON:
    "TRON (Solidity): create a project with a package.json (TronBox or Hardhat) — put the contract in contracts/ and add @openzeppelin/contracts to the project dependencies.",
  "Uniswap Hooks":
    "Solidity (Uniswap Hooks): create a Hardhat project with a package.json (or a Foundry project with foundry.toml) — put the contract in contracts/ and add @openzeppelin/uniswap-hooks to the project dependencies.",
};

function getProjectFilesText(language: string): string {
  return (
    PROJECT_FILES_BY_LANGUAGE[language] ??
    `Create the project manifest and directory layout expected by the ${language} toolchain, and add the dependencies that the generated code imports.`
  );
}

export function getTitleText(language: string): string {
  return TITLE_TEMPLATE.replace(/\{\{LANGUAGE\}\}/g, language);
}
export function getInstructionsText(language: string): string {
  return INSTRUCTIONS_TEMPLATE.replace(/\{\{LANGUAGE\}\}/g, language).replace(
    /\{\{PROJECT_FILES\}\}/g,
    getProjectFilesText(language)
  );
}
