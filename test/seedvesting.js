const { expect } = require("chai");
const { ethers } = require("hardhat");

let Token;
let hardhatToken;
let SeedVesting;
let deployedSeedVesting;
const secondsInDay = 86400;
const currentTimeStampInSecond = Date.now() / 1000 | 0;
const intialClaimablePercentage = 5;
const remainingDistributionPercentage = 95;


let totalTokenToBeDistributed = 30000000 * 10 ** 18;
const vestingAmountPerDay = (totalTokenToBeDistributed * remainingDistributionPercentage) / (100 * 365)

describe("SeedVesting", function () {

    beforeEach(async () => {
        Token = await ethers.getContractFactory("TestToken");
        hardhatToken = await Token.deploy();
        SeedVesting = await ethers.getContractFactory("SeedVesting");
        deployedSeedVesting = await SeedVesting.deploy(hardhatToken.address);
        await hardhatToken.transfer(deployedSeedVesting.address, totalTokenToBeDistributed.toLocaleString('fullwide', { useGrouping: false }));
    });

    it("Should Not able to reintialize intialStamp", async function () {
        await deployedSeedVesting.setInitialTimestamp(currentTimeStampInSecond);
        await expect(
            deployedSeedVesting.setInitialTimestamp(currentTimeStampInSecond)
        ).to.be.revertedWith("initialized");

    })

    it("Should Not Allow to duplicate Investor", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await deployedSeedVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await expect(
            deployedSeedVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("investor already added");
    })

    it("Should Not Allow to different Size Array of  Investor and Investor amount", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await expect(
            deployedSeedVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("different arrays sizes");
    })

    it("Should Not Allow to claim until vesting is started", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await deployedSeedVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await expect(deployedSeedVesting.withdrawTokens()).to.be.revertedWith("initialized");
    })

    it("Should not allow other account to intialize intialStamp", async function () {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await expect(
            deployedSeedVesting.connect(addr1).setInitialTimestamp(currentTimeStampInSecond)
        ).to.be.revertedWith("caller is not the owner");

    })

    it("Should not allow other account to add investor", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await expect(
            deployedSeedVesting.connect(addr1).addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("caller is not the owner");
    })


    it("calculate token for 1 year", async function () {
        const vestingPerodAfterTGE = 365;
        const totalInvestor = 2;
        const [owner, addr1] = await ethers.getSigners();
        await deployedSeedVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await deployedSeedVesting.setInitialTimestamp(Number(currentTimeStampInSecond - vestingPerodAfterTGE * secondsInDay).toLocaleString('fullwide', { useGrouping: false }));

        let withdraableToken = await deployedSeedVesting.withdrawableTokens(owner.address);
        const distributeableTokenAfter1Day = (totalTokenToBeDistributed * intialClaimablePercentage) / (100 * totalInvestor) + vestingAmountPerDay * vestingPerodAfterTGE / totalInvestor;
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number(distributeableTokenAfter1Day).toLocaleString('fullwide', { useGrouping: false })));
        await deployedSeedVesting.withdrawTokens();

        withdraableToken = await deployedSeedVesting.withdrawableTokens(owner.address);
        expect(Number(withdraableToken)).to.equal(0);
    });

    it("calculate token after completion of vesting period", async function () {
        const vestingPerodAfterTGE = 365;
        const extraDaysAfterVestingPeriod = 20;
        const totalInvestor = 2;
        const [owner, addr1] = await ethers.getSigners();
        await deployedSeedVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await deployedSeedVesting.setInitialTimestamp(Number(currentTimeStampInSecond - vestingPerodAfterTGE * secondsInDay - extraDaysAfterVestingPeriod * secondsInDay).toLocaleString('fullwide', { useGrouping: false }));

        let withdraableToken = await deployedSeedVesting.withdrawableTokens(owner.address);
        const distributeableTokenAfter1Day = (totalTokenToBeDistributed * intialClaimablePercentage) / (100 * totalInvestor) + vestingAmountPerDay * vestingPerodAfterTGE / totalInvestor;
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number(distributeableTokenAfter1Day).toLocaleString('fullwide', { useGrouping: false })));
        await deployedSeedVesting.withdrawTokens();

        withdraableToken = await deployedSeedVesting.withdrawableTokens(owner.address);
        expect(Number(withdraableToken)).to.equal(0);
    });

    it("Should Not Allow to claim zero token", async function () {
        const vestingPerodAfterTGE = 365;
        const extraDaysAfterVestingPeriod = 20;
        const totalInvestor = 2;
        const [owner, addr1] = await ethers.getSigners();
        await deployedSeedVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await deployedSeedVesting.setInitialTimestamp(Number(currentTimeStampInSecond - vestingPerodAfterTGE * secondsInDay - extraDaysAfterVestingPeriod * secondsInDay).toLocaleString('fullwide', { useGrouping: false }));

        let withdraableToken = await deployedSeedVesting.withdrawableTokens(owner.address);
        const distributeableTokenAfter1Day = (totalTokenToBeDistributed * intialClaimablePercentage) / (100 * totalInvestor) + vestingAmountPerDay * vestingPerodAfterTGE / totalInvestor;
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number(distributeableTokenAfter1Day).toLocaleString('fullwide', { useGrouping: false })));
        await deployedSeedVesting.withdrawTokens();

        withdraableToken = await deployedSeedVesting.withdrawableTokens(owner.address);
        expect(Number(withdraableToken)).to.equal(0);
        await expect(deployedSeedVesting.withdrawTokens()).to.be.revertedWith("no tokens available for withdrawal");
    });

});