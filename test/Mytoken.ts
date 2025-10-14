import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types/MyToken";
import { MyToken__factory } from "../typechain-types/factories/MyToken__factory";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("mytoken deploy", () => {
  let myTokenC: MyToken;
  let signers: HardhatEthersSigner[];
  before("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    const deployer = signers[0];
    myTokenC = await new MyToken__factory(deployer).deploy("MyToken", "MT", 18);
    expect(await myTokenC.name()).to.equal("MyToken");
    expect(await myTokenC.symbol()).to.equal("MT");
    expect(await myTokenC.decimals()).to.equal(18);
  });
  it("should return name ", async () => {
    expect(await myTokenC.name()).to.equal("MyToken");
  });
  it("should return symbol ", async () => {
    expect(await myTokenC.symbol()).to.equal("MT");
  });
  it("should return decimals ", async () => {
    expect(await myTokenC.decimals()).to.equal(18);
  });
  it("should return 1MT totalSupply ", async () => {
    expect(await myTokenC.totalSupply()).to.equal(1n * 10n ** 18n);
  });
  // 1MT = 10^18
  it("should return 1MT balance for signer 0", async () => {
    const signer0 = signers[0];
    expect(await myTokenC.balanceOf(signer0.address)).to.equal(1n * 10n ** 18n);
  });
  it("should have 0.5MT", async () => {
    const signer1 = signers[1];
    await myTokenC.transfer(signer1.address, hre.ethers.parseEther("0.5"));
    expect(await myTokenC.balanceOf(signer1.address)).to.equal(
      BigInt(0.5 * 10 ** 18)
    );
  });
});
