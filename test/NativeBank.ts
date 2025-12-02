import hre from "hardhat";
import { expect } from "chai";
import { NativeBank, Exploit } from "../typechain-types";
import { NativeBank__factory, Exploit__factory } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("NativeBank", () => {
  let NativeBankC: NativeBank;
  let signers: HardhatEthersSigner[];

  beforeEach("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    NativeBankC = await new NativeBank__factory(signers[0]).deploy();
  });

  describe("Initialized state check", () => {
    it("should return balanceOf 0 for signer 0", async () => {
      const signer0 = signers[0];
      expect(await NativeBankC.balanceOf(signer0.address)).to.equal(0n);
    });
  });

  describe("Deposit (receive)", () => {
    it("should update balanceOf after depositing native tokens", async () => {
      const signer0 = signers[0];
      const depositAmount = hre.ethers.parseEther("1.0");

      await expect(
        signer0.sendTransaction({
          to: await NativeBankC.getAddress(),
          value: depositAmount,
        })
      ).to.changeEtherBalance(signer0, -depositAmount);

      expect(await NativeBankC.balanceOf(signer0.address)).to.equal(
        depositAmount
      );
    });

    it("should accumulate balance when depositing multiple times", async () => {
      const signer0 = signers[0];
      const firstDeposit = hre.ethers.parseEther("0.5");
      const secondDeposit = hre.ethers.parseEther("1.5");

      await signer0.sendTransaction({
        to: await NativeBankC.getAddress(),
        value: firstDeposit,
      });

      await signer0.sendTransaction({
        to: await NativeBankC.getAddress(),
        value: secondDeposit,
      });

      expect(await NativeBankC.balanceOf(signer0.address)).to.equal(
        firstDeposit + secondDeposit
      );
    });

    it("should track separate balances for different users", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      const depositAmount0 = hre.ethers.parseEther("1.0");
      const depositAmount1 = hre.ethers.parseEther("2.0");

      await signer0.sendTransaction({
        to: await NativeBankC.getAddress(),
        value: depositAmount0,
      });

      await signer1.sendTransaction({
        to: await NativeBankC.getAddress(),
        value: depositAmount1,
      });

      expect(await NativeBankC.balanceOf(signer0.address)).to.equal(
        depositAmount0
      );
      expect(await NativeBankC.balanceOf(signer1.address)).to.equal(
        depositAmount1
      );
    });
  });

  describe("Withdraw", () => {
    it("should withdraw native tokens and reset balance to 0", async () => {
      const signer0 = signers[0];
      const depositAmount = hre.ethers.parseEther("1.0");

      // Deposit first
      await signer0.sendTransaction({
        to: await NativeBankC.getAddress(),
        value: depositAmount,
      });

      const balanceBefore = await hre.ethers.provider.getBalance(
        signer0.address
      );

      // Withdraw
      const tx = await NativeBankC.connect(signer0).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await hre.ethers.provider.getBalance(
        signer0.address
      );

      // Balance should be increased by depositAmount minus gas fees
      expect(balanceAfter).to.equal(balanceBefore + depositAmount - gasUsed);

      // balanceOf should be reset to 0
      expect(await NativeBankC.balanceOf(signer0.address)).to.equal(0n);
    });

    it("should revert when withdrawing with 0 balance", async () => {
      const signer0 = signers[0];
      await expect(NativeBankC.connect(signer0).withdraw()).to.be.revertedWith(
        "insufficient balance"
      );
    });

    it("should allow multiple users to withdraw independently", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      const depositAmount0 = hre.ethers.parseEther("1.0");
      const depositAmount1 = hre.ethers.parseEther("2.0");

      // Both users deposit
      await signer0.sendTransaction({
        to: await NativeBankC.getAddress(),
        value: depositAmount0,
      });
      await signer1.sendTransaction({
        to: await NativeBankC.getAddress(),
        value: depositAmount1,
      });

      // Signer0 withdraws
      await NativeBankC.connect(signer0).withdraw();
      expect(await NativeBankC.balanceOf(signer0.address)).to.equal(0n);
      expect(await NativeBankC.balanceOf(signer1.address)).to.equal(
        depositAmount1
      );

      // Signer1 withdraws
      await NativeBankC.connect(signer1).withdraw();
      expect(await NativeBankC.balanceOf(signer1.address)).to.equal(0n);
    });
  });

  describe("Reentrancy Attack", () => {
    it("should prevent reentrancy attack with ReentrancyGuard", async () => {
      const attacker = signers[1];
      const victim = signers[2];
      const victimDeposit = hre.ethers.parseEther("2.0");
      const attackerDeposit = hre.ethers.parseEther("1.0");

      // Victim deposits 2 ETH
      await victim.sendTransaction({
        to: await NativeBankC.getAddress(),
        value: victimDeposit,
      });

      // Deploy Exploit contract
      const ExploitC = await new Exploit__factory(attacker).deploy(
        await NativeBankC.getAddress()
      );

      // Attacker deposits 1 ETH and triggers exploit
      // The exploit function deposits 1 ETH and then calls withdraw()
      // When withdraw() tries to send ETH, it triggers receive() in Exploit contract
      // receive() tries to call withdraw() again, but nonReentrant modifier prevents it
      // This causes the call to fail with "failed to send native token"
      await expect(
        ExploitC.connect(attacker).exploit({ value: attackerDeposit })
      ).to.be.revertedWith("failed to send native token");

      // Since the transaction reverted, all state changes are rolled back
      // balanceOf should be 0 because the exploit function deposits and then withdraws
      // but the transaction reverts, so balanceOf should be 0 (deposit happened, but withdraw failed)
      // Actually, since the entire transaction reverts, balanceOf should be 0
      // because the deposit in exploit() function also reverts
      expect(await NativeBankC.balanceOf(await ExploitC.getAddress())).to.equal(
        0n
      );

      // NativeBank should still have only victim's deposit (2 ETH)
      // because attacker's deposit transaction reverted
      const bankBalance = await hre.ethers.provider.getBalance(
        await NativeBankC.getAddress()
      );
      expect(bankBalance).to.equal(victimDeposit);
    });

    it("should allow normal withdrawal after reentrancy guard is reset", async () => {
      const signer0 = signers[0];
      const depositAmount = hre.ethers.parseEther("1.0");

      // Deposit
      await signer0.sendTransaction({
        to: await NativeBankC.getAddress(),
        value: depositAmount,
      });

      // Normal withdrawal should work
      await NativeBankC.connect(signer0).withdraw();

      // balanceOf should be 0
      expect(await NativeBankC.balanceOf(signer0.address)).to.equal(0n);
    });
  });
});
