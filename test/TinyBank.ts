import hre from "hardhat";
import { expect } from "chai";

describe("TinyBank", () => {
  let tinyBankC: TinyBank;
  let signers: HardhatEthersSigner[];
  beforeEach("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    tinyBankC = await new TinyBank__factory(signers[0]).deploy();
  });
});
