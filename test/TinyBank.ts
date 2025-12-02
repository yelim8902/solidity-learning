import hre from "hardhat";
import { expect } from "chai";
import { MINTING_AMOUNT, DECIMALS } from "./constant";
import { Contract, ContractFactory } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TinyBank (Vyper)", () => {
  let MyTokenC: Contract;
  let TinyBankC: Contract;
  let signers: HardhatEthersSigner[];
  let managers: string[];

  beforeEach("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    managers = [signers[0].address, signers[1].address, signers[2].address];

    // Load Vyper contract artifacts
    const myTokenArtifact = await hre.artifacts.readArtifact("MyToken");
    const tinyBankArtifact = await hre.artifacts.readArtifact("TinyBank");

    const MyTokenFactory = await hre.ethers.getContractFactoryFromArtifact(
      myTokenArtifact
    );
    const TinyBankFactory = await hre.ethers.getContractFactoryFromArtifact(
      tinyBankArtifact
    );

    MyTokenC = await MyTokenFactory.connect(signers[0]).deploy(
      "MyToken",
      "MT",
      Number(DECIMALS),
      MINTING_AMOUNT
    );

    // Convert managers array to fixed-size array (pad with zero addresses)
    const managersArray: string[] = new Array(100).fill(
      "0x0000000000000000000000000000000000000000"
    );
    for (let i = 0; i < managers.length; i++) {
      managersArray[i] = managers[i];
    }

    TinyBankC = await TinyBankFactory.connect(signers[0]).deploy(
      await MyTokenC.getAddress(),
      managersArray
    );
    await MyTokenC.setManager(await TinyBankC.getAddress());
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

    it("should emit Staked event", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", Number(DECIMALS));
      await MyTokenC.approve(await TinyBankC.getAddress(), stakingAmount);

      await expect(TinyBankC.stake(stakingAmount))
        .to.emit(TinyBankC, "Staked")
        .withArgs(signer0.address, stakingAmount);
    });

    it("should emit Staked event for multiple stakes", async () => {
      const signer0 = signers[0];
      const stakingAmount1 = hre.ethers.parseUnits("30", Number(DECIMALS));
      const stakingAmount2 = hre.ethers.parseUnits("20", Number(DECIMALS));

      await MyTokenC.approve(
        await TinyBankC.getAddress(),
        stakingAmount1 + stakingAmount2
      );

      await expect(TinyBankC.stake(stakingAmount1))
        .to.emit(TinyBankC, "Staked")
        .withArgs(signer0.address, stakingAmount1);

      await expect(TinyBankC.stake(stakingAmount2))
        .to.emit(TinyBankC, "Staked")
        .withArgs(signer0.address, stakingAmount2);
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

    it("should emit Withdrawal event", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", Number(DECIMALS));
      const withdrawAmount = hre.ethers.parseUnits("30", Number(DECIMALS));

      await MyTokenC.approve(await TinyBankC.getAddress(), stakingAmount);
      await TinyBankC.stake(stakingAmount);

      await expect(TinyBankC.withdraw(withdrawAmount))
        .to.emit(TinyBankC, "Withdrawal")
        .withArgs(signer0.address, withdrawAmount);
    });

    it("should emit Withdrawal event for partial withdrawal", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", Number(DECIMALS));
      const withdrawAmount1 = hre.ethers.parseUnits("20", Number(DECIMALS));
      const withdrawAmount2 = hre.ethers.parseUnits("30", Number(DECIMALS));

      await MyTokenC.approve(await TinyBankC.getAddress(), stakingAmount);
      await TinyBankC.stake(stakingAmount);

      await expect(TinyBankC.withdraw(withdrawAmount1))
        .to.emit(TinyBankC, "Withdrawal")
        .withArgs(signer0.address, withdrawAmount1);

      await expect(TinyBankC.withdraw(withdrawAmount2))
        .to.emit(TinyBankC, "Withdrawal")
        .withArgs(signer0.address, withdrawAmount2);
    });

    it("should emit both Staked and Withdrawal events", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", Number(DECIMALS));
      const withdrawAmount = hre.ethers.parseUnits("30", Number(DECIMALS));

      await MyTokenC.approve(await TinyBankC.getAddress(), stakingAmount);

      await expect(TinyBankC.stake(stakingAmount))
        .to.emit(TinyBankC, "Staked")
        .withArgs(signer0.address, stakingAmount);

      await expect(TinyBankC.withdraw(withdrawAmount))
        .to.emit(TinyBankC, "Withdrawal")
        .withArgs(signer0.address, withdrawAmount);
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

    it("should not give reward for genesis staking", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", Number(DECIMALS));
      const balanceBefore = await MyTokenC.balanceOf(signer0.address);

      await MyTokenC.approve(await TinyBankC.getAddress(), stakingAmount);
      await TinyBankC.stake(stakingAmount);

      // Genesis staking should set lastClaimedBlock to current block
      // So no reward should be given immediately
      const balanceAfterStake = await MyTokenC.balanceOf(signer0.address);
      expect(balanceAfterStake).to.equal(balanceBefore - stakingAmount);
    });

    it("should calculate reward correctly for multiple users", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      const stakingAmount0 = hre.ethers.parseUnits("50", Number(DECIMALS));
      const stakingAmount1 = hre.ethers.parseUnits("50", Number(DECIMALS));

      // Transfer tokens to signer1 first
      await MyTokenC.transfer(signer1.address, stakingAmount1);

      // Signer0 stakes first
      await MyTokenC.approve(await TinyBankC.getAddress(), stakingAmount0);
      await TinyBankC.stake(stakingAmount0);

      // Mine some blocks
      await hre.network.provider.send("evm_mine");
      await hre.network.provider.send("evm_mine");

      // Signer1 stakes (should get reward based on their share)
      await MyTokenC.connect(signer1).approve(
        await TinyBankC.getAddress(),
        stakingAmount1
      );
      await TinyBankC.connect(signer1).stake(stakingAmount1);

      // Mine more blocks
      await hre.network.provider.send("evm_mine");
      await hre.network.provider.send("evm_mine");

      // Both withdraw and check rewards
      const balance0Before = await MyTokenC.balanceOf(signer0.address);
      const balance1Before = await MyTokenC.balanceOf(signer1.address);

      await TinyBankC.withdraw(stakingAmount0);
      await TinyBankC.connect(signer1).withdraw(stakingAmount1);

      const balance0After = await MyTokenC.balanceOf(signer0.address);
      const balance1After = await MyTokenC.balanceOf(signer1.address);

      // Both should receive rewards (signer0 more because staked longer)
      expect(balance0After).to.be.gt(balance0Before);
      expect(balance1After).to.be.gt(balance1Before);
    });

    it("should update lastClaimedBlock correctly", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", Number(DECIMALS));

      await MyTokenC.approve(await TinyBankC.getAddress(), stakingAmount);

      // First stake - lastClaimedBlock should be set
      await TinyBankC.stake(stakingAmount);
      const blockAfterStake = await hre.ethers.provider.getBlockNumber();
      expect(await TinyBankC.lastClaimedBlock(signer0.address)).to.equal(
        blockAfterStake
      );

      // Mine blocks
      await hre.network.provider.send("evm_mine");
      await hre.network.provider.send("evm_mine");

      // Withdraw - should update lastClaimedBlock
      await TinyBankC.withdraw(stakingAmount);
      const blockAfterWithdraw = await hre.ethers.provider.getBlockNumber();
      expect(await TinyBankC.lastClaimedBlock(signer0.address)).to.equal(
        blockAfterWithdraw
      );
    });
    it("should revert when changing rewardPerBlock not by hacker", async () => {
      const hacker = signers[4];
      const rewardToChange = hre.ethers.parseUnits("10000", Number(DECIMALS));
      await expect(
        TinyBankC.connect(hacker).setRewardPerBlock(rewardToChange)
      ).to.be.revertedWith("You are not a manager");
    });
    it("should revert when not all managers confirmed", async () => {
      const rewardToChange = hre.ethers.parseUnits("2", Number(DECIMALS));
      await TinyBankC.connect(signers[0]).confirm();
      await expect(
        TinyBankC.connect(signers[0]).setRewardPerBlock(rewardToChange)
      ).to.be.revertedWith("Not all confirmed yet");
    });
    it("should allow rewardPerBlock change after all managers confirm", async () => {
      const firstReward = hre.ethers.parseUnits("3", Number(DECIMALS));
      const secondReward = hre.ethers.parseUnits("5", Number(DECIMALS));
      await TinyBankC.connect(signers[0]).confirm();
      await TinyBankC.connect(signers[1]).confirm();
      await TinyBankC.connect(signers[2]).confirm();
      await TinyBankC.connect(signers[0]).setRewardPerBlock(firstReward);
      expect(await TinyBankC.rewardPerBlock()).to.equal(firstReward);
      expect(await TinyBankC.hasConfirmed(signers[0].address)).to.equal(false);
      expect(await TinyBankC.hasConfirmed(signers[1].address)).to.equal(false);
      expect(await TinyBankC.hasConfirmed(signers[2].address)).to.equal(false);
      await TinyBankC.connect(signers[0]).confirm();
      await TinyBankC.connect(signers[1]).confirm();
      await TinyBankC.connect(signers[2]).confirm();
      await TinyBankC.connect(signers[1]).setRewardPerBlock(secondReward);
      expect(await TinyBankC.rewardPerBlock()).to.equal(secondReward);
    });
    it("should revert confirm from non manager", async () => {
      const stranger = signers[4];
      await expect(TinyBankC.connect(stranger).confirm()).to.be.revertedWith(
        "You are not a manager"
      );
    });
  });
});
