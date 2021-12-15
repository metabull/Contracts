const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

let Token;
let hardhatToken;
let LiquidityVesting;
let deployedLiquidityVesting;
const secondsInDay = 86400;
const currentTimeStampInSecond = Date.now() / 1000 | 0;
const intialClaimablePercentage = 50;
const remainingDistributionPercentage = 50;


let totalTokenToBeDistributed = 40000000 * 10 ** 18;
const vestingAmountPerDay = (totalTokenToBeDistributed * remainingDistributionPercentage) / (100 * 365)

describe("LiquidityVesting with different vesting starttime", function () {

    beforeEach(async () => {
        Token = await ethers.getContractFactory("TestToken");
        hardhatToken = await Token.deploy();
        LiquidityVesting = await ethers.getContractFactory("LiquidityVesting");
        deployedLiquidityVesting = await LiquidityVesting.deploy(hardhatToken.address);
        await hardhatToken.transfer(deployedLiquidityVesting.address, totalTokenToBeDistributed.toLocaleString('fullwide', { useGrouping: false }));
    });

    it("Should Not able to reintialize intialStamp", async function () {
        await deployedLiquidityVesting.setInitialTimestamp(currentTimeStampInSecond);
        await expect(
            deployedLiquidityVesting.setInitialTimestamp(currentTimeStampInSecond)
        ).to.be.revertedWith("initialized");

    })

    it("Should Not Allow to duplicate Investor", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await deployedLiquidityVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await expect(
            deployedLiquidityVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("investor already added");
    })

    it("Should Not Allow to different Size Array of  Investor and Investor amount", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await expect(
            deployedLiquidityVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("different arrays sizes");
    })

    it("Should Not Allow to claim until vesting is started", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await deployedLiquidityVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await expect(deployedLiquidityVesting.withdrawTokens()).to.be.revertedWith("initialized");
    })

    it("Should not allow other account to intialize intialStamp", async function () {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await expect(
            deployedLiquidityVesting.connect(addr1).setInitialTimestamp(currentTimeStampInSecond)
        ).to.be.revertedWith("caller is not the owner");

    })

    it("Should not allow other account to add investor", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await expect(
            deployedLiquidityVesting.connect(addr1).addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("caller is not the owner");
    })
    

    it("calculate token for 1 year", async function () {
        const vestingPerodAfterTGE = 365;
        const totalInvestor = 2;
        const [owner, addr1] = await ethers.getSigners();
        await deployedLiquidityVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await deployedLiquidityVesting.setInitialTimestamp(Number(currentTimeStampInSecond - vestingPerodAfterTGE * secondsInDay).toLocaleString('fullwide', { useGrouping: false }));

        let withdraableToken = await deployedLiquidityVesting.withdrawableTokens(owner.address);
        const distributeableTokenAfter1Day = (totalTokenToBeDistributed * intialClaimablePercentage) / (100 * totalInvestor) + vestingAmountPerDay * vestingPerodAfterTGE / totalInvestor;
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number(distributeableTokenAfter1Day).toLocaleString('fullwide', { useGrouping: false })));
        await deployedLiquidityVesting.withdrawTokens();

        withdraableToken = await deployedLiquidityVesting.withdrawableTokens(owner.address);
        expect(Number(withdraableToken)).to.equal(0);
    });

    it("calculate token after completion of vesting period", async function () {
        const vestingPerodAfterTGE = 365;
        const extraDaysAfterVestingPeriod = 20;
        const totalInvestor = 2;
        const [owner, addr1] = await ethers.getSigners();
        await deployedLiquidityVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await deployedLiquidityVesting.setInitialTimestamp(Number(currentTimeStampInSecond - vestingPerodAfterTGE * secondsInDay - extraDaysAfterVestingPeriod * secondsInDay).toLocaleString('fullwide', { useGrouping: false }));

        let withdraableToken = await deployedLiquidityVesting.withdrawableTokens(owner.address);
        const distributeableTokenAfter1Day = (totalTokenToBeDistributed * intialClaimablePercentage) / (100 * totalInvestor) + vestingAmountPerDay * vestingPerodAfterTGE / totalInvestor;
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number(distributeableTokenAfter1Day).toLocaleString('fullwide', { useGrouping: false })));
        await deployedLiquidityVesting.withdrawTokens();

        withdraableToken = await deployedLiquidityVesting.withdrawableTokens(owner.address);
        expect(Number(withdraableToken)).to.equal(0);
    });

    it("Should Not Allow to claim zero token", async function () {
        const vestingPerodAfterTGE = 365;
        const extraDaysAfterVestingPeriod = 20;
        const totalInvestor = 2;
        const [owner, addr1] = await ethers.getSigners();
        await deployedLiquidityVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await deployedLiquidityVesting.setInitialTimestamp(Number(currentTimeStampInSecond - vestingPerodAfterTGE * secondsInDay - extraDaysAfterVestingPeriod * secondsInDay).toLocaleString('fullwide', { useGrouping: false }));

        let withdraableToken = await deployedLiquidityVesting.withdrawableTokens(owner.address);
        const distributeableTokenAfter1Day = (totalTokenToBeDistributed * intialClaimablePercentage) / (100 * totalInvestor) + vestingAmountPerDay * vestingPerodAfterTGE / totalInvestor;
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number(distributeableTokenAfter1Day).toLocaleString('fullwide', { useGrouping: false })));
        await deployedLiquidityVesting.withdrawTokens();

        withdraableToken = await deployedLiquidityVesting.withdrawableTokens(owner.address);
        expect(Number(withdraableToken)).to.equal(0);
        await expect(deployedLiquidityVesting.withdrawTokens()).to.be.revertedWith("no tokens available for withdrawal");
    });

});