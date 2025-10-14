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
    expect(await myTokenC.name()).equal("MyToken");
  });
  it("should return symbol ", async () => {
    expect(await myTokenC.symbol()).equal("MT");
  });
  it("should return decimals ", async () => {
    expect(await myTokenC.decimals()).equal(18);
  });
  it("should return 0 totalSupply ", async () => {
    expect(await myTokenC.totalSupply()).equal(0);
  });
  it("should return 0 balance for signer 0", async () => {
    const signer0 = signers[0];
    expect(await myTokenC.balanceOf(signer0.address)).equal(0);
  });
});
