import hre from "hardhat";
import { expect } from "chai";
import { MINTING_AMOUNT, DECIMALS } from "./constant";
import { MyToken, TinyBank } from "../typechain-types";
import { MyToken__factory, TinyBank__factory } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TinyBank", () => {
  let MyTokenC: MyToken;
  let TinyBankC: TinyBank;
  let signers: HardhatEthersSigner[];

  beforeEach("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    MyTokenC = await new MyToken__factory(signers[0]).deploy(
      "MyToken",
      "MT",
      Number(DECIMALS),
      MINTING_AMOUNT
    );
    TinyBankC = await new TinyBank__factory(signers[0]).deploy(
      await MyTokenC.getAddress()
    );
  });

  describe("Initialized state check", () => {
    it("should return totalStaked 0", async () => {
      expect(await TinyBankC.totalStaked()).to.equal(0n);
    });
  });
});
