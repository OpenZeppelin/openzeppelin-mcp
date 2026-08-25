import { getServerName } from "@/components/client-config-instructions/server-name";

it("derives a PascalCase identifier from the display name", () => {
  expect(getServerName({ name: "Solidity Contracts" })).toBe(
    "OpenZeppelinSolidityContracts"
  );
  expect(getServerName({ name: "Uniswap Hooks" })).toBe(
    "OpenZeppelinUniswapHooks"
  );
});

it("prefers configName so acronym styling stays out of config keys", () => {
  expect(
    getServerName({ name: "TRON Contracts", configName: "Tron Contracts" })
  ).toBe("OpenZeppelinTronContracts");
});
