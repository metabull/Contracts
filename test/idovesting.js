const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

let Token;
let hardhatToken;
let IDOVesting;
let deployedIDOVesting;
const secondsInDay = 86400;
const currentTimeStampInSecond = Date.now() / 1000 | 0;
const intialClaimablePercentage = 25;
const remainingDistributionPercentage = 75;


let totalTokenToBeDistributed = 5000000 * 10 ** 18;
const vestingAmountPerDay = (totalTokenToBeDistributed * remainingDistributionPercentage) / (100 * 90)

describe("IDO with different vesting starttime", function () {

    beforeEach(async () => {
        Token = await ethers.getContractFactory("TestToken");
        hardhatToken = await Token.deploy();
        IDOVesting = await ethers.getContractFactory("IdoVesting");
        deployedIDOVesting = await IDOVesting.deploy(hardhatToken.address);
        await hardhatToken.transfer(deployedIDOVesting.address, totalTokenToBeDistributed.toLocaleString('fullwide', { useGrouping: false }));
    });

    it("Should Not able to reintialize intialStamp", async function () {
        await deployedIDOVesting.setInitialTimestamp(currentTimeStampInSecond);
        await expect(
            deployedIDOVesting.setInitialTimestamp(currentTimeStampInSecond)
        ).to.be.revertedWith("initialized");

    })

    it("Should not allow other account to intialize intialStamp", async function () {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await expect(
            deployedIDOVesting.connect(addr1).setInitialTimestamp(currentTimeStampInSecond)
        ).to.be.revertedWith("caller is not the owner");

    })

    it("Should Not Allow to claim until vesting is started", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await deployedIDOVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await expect(deployedIDOVesting.withdrawTokens()).to.be.revertedWith("initialized");
    })

    it("Should Not Allow to duplicate Investor", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await deployedIDOVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await expect(
            deployedIDOVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("investor already added");
    })

    it("Should Not Allow to different Size Array of  Investor and Investor amount", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await expect(
            deployedIDOVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("different arrays sizes");
    })

    it("Should not allow other account to add investor", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await expect(
            deployedIDOVesting.connect(addr1).addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("caller is not the owner");
    })

    it("Should not allow other account to add investor", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await expect(
            deployedIDOVesting.connect(addr1).addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("caller is not the owner");
    })

    it("calculate token for 3 months and withdraw", async function () {
        const vestingPerodAfterTGE = 90;
        const totalInvestor = 2;
        const [owner, addr1] = await ethers.getSigners();
        await deployedIDOVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await deployedIDOVesting.setInitialTimestamp(Number(currentTimeStampInSecond - vestingPerodAfterTGE * secondsInDay).toLocaleString('fullwide', { useGrouping: false }));

        let withdraableToken = await deployedIDOVesting.withdrawableTokens(owner.address);
        const distributeableTokenAfter1Day = (totalTokenToBeDistributed * intialClaimablePercentage) / (100 * totalInvestor) + vestingAmountPerDay * vestingPerodAfterTGE / totalInvestor;
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number(distributeableTokenAfter1Day).toLocaleString('fullwide', { useGrouping: false })));
        await deployedIDOVesting.withdrawTokens();

        withdraableToken = await deployedIDOVesting.withdrawableTokens(owner.address);
        expect(Number(withdraableToken)).to.equal(0);
    });

    it("Should Not Allow to claim zero token", async function () {
        const vestingPerodAfterTGE = 90;
        const totalInvestor = 2;
        const [owner, addr1] = await ethers.getSigners();
        await deployedIDOVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await deployedIDOVesting.setInitialTimestamp(Number(currentTimeStampInSecond - vestingPerodAfterTGE * secondsInDay).toLocaleString('fullwide', { useGrouping: false }));

        let withdraableToken = await deployedIDOVesting.withdrawableTokens(owner.address);
        const distributeableTokenAfter1Day = (totalTokenToBeDistributed * intialClaimablePercentage) / (100 * totalInvestor) + vestingAmountPerDay * vestingPerodAfterTGE / totalInvestor;
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number(distributeableTokenAfter1Day).toLocaleString('fullwide', { useGrouping: false })));
        await deployedIDOVesting.withdrawTokens();

        withdraableToken = await deployedIDOVesting.withdrawableTokens(owner.address);
        expect(Number(withdraableToken)).to.equal(0);
        await expect(deployedIDOVesting.withdrawTokens()).to.be.revertedWith("no tokens available for withdrawal");
    });

});