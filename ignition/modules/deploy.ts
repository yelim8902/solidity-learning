import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MyTokenDeploy", (m) => {
  const myTokenC = m.contract("MyToken", ["MyToken", "MT", 18, 100]);

  // TinyBank requires at least 3 unique manager addresses
  // Assignment example doesn't show managers, but TinyBank constructor requires them
  // Set via environment variables or use default placeholder addresses
  const manager1 =
    process.env.MANAGER1 || "0x1111111111111111111111111111111111111111";
  const manager2 =
    process.env.MANAGER2 || "0x2222222222222222222222222222222222222222";
  const manager3 =
    process.env.MANAGER3 || "0x3333333333333333333333333333333333333333";

  const managers = [manager1, manager2, manager3];

  const tinyBankC = m.contract("TinyBank", [myTokenC, managers]);

  m.call(myTokenC, "setManager", [tinyBankC]);

  return { myTokenC, tinyBankC };
});
