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
    it("should return staked 0 amount of signer 0", async () => {
      const signer0 = signers[0];
      expect(await TinyBankC.staked(signer0.address)).equal(0n);
    });
  });

  describe("Staking", () => {
    it("should return staked amount", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", Number(DECIMALS));
      await MyTokenC.approve(await TinyBankC.getAddress(), stakingAmount);
      await TinyBankC.stake(stakingAmount);
      expect(await TinyBankC.staked(signer0.address)).equal(stakingAmount);
      expect(await TinyBankC.totalStaked()).equal(stakingAmount);
      expect(await MyTokenC.balanceOf(await TinyBankC.getAddress())).equal(
        await TinyBankC.totalStaked()
      );
    });
  });

  describe("Withdrawal", () => {
    it("should return 0 staked after withdrawing total token amount", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", Number(DECIMALS));
      await MyTokenC.approve(await TinyBankC.getAddress(), stakingAmount);
      await TinyBankC.stake(stakingAmount);
      await TinyBankC.withdraw(stakingAmount);
      expect(await TinyBankC.staked(signer0.address)).equal(0n);
    });
  });
  describe("Reward", () => {
    it("should return reward 1MT blocks", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", Number(DECIMALS));
      await MyTokenC.approve(await TinyBankC.getAddress(), stakingAmount);
      await TinyBankC.stake(stakingAmount);

      const BLOCKS = 5;
      const transferAmount = hre.ethers.parseUnits("1", Number(DECIMALS));
      for (let i = 0; i < BLOCKS; i++) {
        await MyTokenC.transfer(signer0.address, transferAmount);
      }

      await TinyBankC.withdraw(stakingAmount);
      expect(await MyTokenC.balanceOf(signer0.address)).equal(
        hre.ethers.parseUnits(
          (BigInt(BLOCKS) + MINTING_AMOUNT + 1n).toString(),
          Number(DECIMALS)
        )
      );
    });
  });
});
