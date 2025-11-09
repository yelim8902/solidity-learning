import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types/MyToken";
import { MyToken__factory } from "../typechain-types/factories/MyToken__factory";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { MINTING_AMOUNT, DECIMALS } from "./constant";

describe("My Token", () => {
  let myTokenC: MyToken;
  let signers: HardhatEthersSigner[];
  beforeEach("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    myTokenC = await new MyToken__factory(signers[0]).deploy(
      "MyToken",
      "MT",
      18,
      100
    );
  });

  describe("Basic state value check", () => {
    it("should return name ", async () => {
      expect(await myTokenC.name()).to.equal("MyToken");
    });
    it("should return symbol ", async () => {
      expect(await myTokenC.symbol()).to.equal("MT");
    });
    it("should return decimals ", async () => {
      expect(await myTokenC.decimals()).to.equal(DECIMALS);
    });
    it("should return 100MT totalSupply ", async () => {
      expect(await myTokenC.totalSupply()).to.equal(
        MINTING_AMOUNT * 10n ** DECIMALS
      );
    });
  });

  // 1MT = 10^18
  describe("Mint", () => {
    it("should return 1MT balance for signer 0", async () => {
      const signer0 = signers[0];
      expect(await myTokenC.balanceOf(signer0.address)).to.equal(
        MINTING_AMOUNT * 10n ** DECIMALS
      );
    });

    it("should return or revert when minting infinitly", async () => {
      const signer2 = signers[2];
      const mintingAgainAmount = hre.ethers.parseUnits("100", Number(DECIMALS));
      await myTokenC.connect(signer2).mint(mintingAgainAmount, signer2.address);
      console.log(
        hre.ethers
          .formatUnits(
            await myTokenC.balanceOf(signer2.address),
            Number(DECIMALS)
          )
          .toString() + "MT"
      );
    });
  });

  describe("Transfer", () => {
    it("should have 0.5MT", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      await expect(
        myTokenC.transfer(signer1.address, hre.ethers.parseEther("0.5"))
      )
        .to.emit(myTokenC, "Transfer")
        .withArgs(
          signer0.address,
          signer1.address,
          hre.ethers.parseEther("0.5")
        );

      // 블록체인은 가스비가 드는 디비라서 데이터를 직접 온체인에 저장X, 필요한 정보만 레시피 저장 후 쿼리 사용

      expect(await myTokenC.balanceOf(signer1.address)).to.equal(
        BigInt(0.5 * 10 ** 18)
      );
      const filter = myTokenC.filters.Transfer(signer0.address);
      const logs = await myTokenC.queryFilter(filter, 0, "latest");
    });

    it("should be reverted with insufficient balance error", async () => {
      const signer1 = signers[1];
      await expect(
        myTokenC.transfer(
          signer1.address,
          hre.ethers.parseEther((MINTING_AMOUNT + 1n).toString())
        )
      ).to.be.revertedWith("insufficient balance");
    });
  });

  describe("TransferFrom", () => {
    it("should emit Approval event", async () => {
      const signer1 = signers[1];
      await expect(
        myTokenC.approve(signer1.address, hre.ethers.parseUnits("10", DECIMALS))
      )
        .to.emit(myTokenC, "Approval")
        .withArgs(signer1.address, hre.ethers.parseUnits("10", DECIMALS));
    });
    it("should be reverted with insufficient allowance error", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      await expect(
        myTokenC
          .connect(signer1)
          .transferFrom(
            signer0.address,
            signer1.address,
            hre.ethers.parseUnits("1", DECIMALS)
          )
      ).to.be.revertedWith("insufficient allowance");
    });
  });

  describe("Approve and TransferFrom - Homework", () => {
    it("should approve signer1 and transferFrom signer0 to signer1", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];

      // 1. approve: signer0이 signer1에게 1MT 전송 권한 부여
      await myTokenC
        .connect(signer0)
        .approve(signer1.address, hre.ethers.parseEther("1"));

      // allowance 확인
      expect(
        await myTokenC.allowance(signer0.address, signer1.address)
      ).to.equal(hre.ethers.parseEther("1"));

      // 2. transferFrom: signer1이 signer0의 MT토큰을 자신의 주소(signer1)에게 전송
      await myTokenC
        .connect(signer1)
        .transferFrom(
          signer0.address,
          signer1.address,
          hre.ethers.parseEther("1")
        );

      // 3. balance 확인
      expect(await myTokenC.balanceOf(signer0.address)).to.equal(
        hre.ethers.parseEther("99")
      );
      expect(await myTokenC.balanceOf(signer1.address)).to.equal(
        hre.ethers.parseEther("1")
      );
    });
  });
});
