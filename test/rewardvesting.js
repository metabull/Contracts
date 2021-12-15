const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

let Token;
let hardhatToken;
let RewardVesting;
let deployedRewardVesting;
const secondsInDay = 86400;
const currentTimeStampInSecond = Date.now() / 1000 | 0;


let totalTokenToBeDistributed = 150000000 * 10 ** 18;

describe("RewardVesting with different vesting starttime", function () {

    beforeEach(async () => {
        Token = await ethers.getContractFactory("TestToken");
        hardhatToken = await Token.deploy();
        RewardVesting = await ethers.getContractFactory("RewardVesting");
        deployedRewardVesting = await RewardVesting.deploy(hardhatToken.address);
        await hardhatToken.transfer(deployedRewardVesting.address, totalTokenToBeDistributed.toLocaleString('fullwide', { useGrouping: false }));
    });

    it("Should Not able to reintialize intialStamp", async function () {
        await deployedRewardVesting.setInitialTimestamp(currentTimeStampInSecond);
        await expect(
            deployedRewardVesting.setInitialTimestamp(currentTimeStampInSecond)
        ).to.be.revertedWith("initialized");

    })

    it("Should Not Allow to duplicate Investor", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await deployedRewardVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await expect(
            deployedRewardVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("investor already added");
    })

    it("Should Not Allow to different Size Array of  Investor and Investor amount", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await expect(
            deployedRewardVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("different arrays sizes");
    })

    it("Should not allow other account to intialize intialStamp", async function () {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await expect(
            deployedRewardVesting.connect(addr1).setInitialTimestamp(currentTimeStampInSecond)
        ).to.be.revertedWith("caller is not the owner");

    })

    it("Should not allow other account to add investor", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await expect(
            deployedRewardVesting.connect(addr1).addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("caller is not the owner");
    })

    it("Calculate token after completion of vesting period", async function () {

        const vestingTimePeriodInDays = 1491;
        const [owner, addr1] = await ethers.getSigners();
        await deployedRewardVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await deployedRewardVesting.setInitialTimestamp(Number(currentTimeStampInSecond - vestingTimePeriodInDays * secondsInDay).toLocaleString('fullwide', { useGrouping: false }));

        let withdraableToken = await deployedRewardVesting.withdrawableTokens(owner.address);
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number(totalTokenToBeDistributed / 2)).toLocaleString('fullwide', { useGrouping: false }));
        await deployedRewardVesting.withdrawTokens();
        withdraableToken = await deployedRewardVesting.withdrawableTokens(owner.address);
        expect(Number(withdraableToken)).to.equal(0);
    });

    it("Should Not Allow to claim zero token", async function () {

        const vestingTimePeriodInDays = 1491;
        const [owner, addr1] = await ethers.getSigners();
        await deployedRewardVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await deployedRewardVesting.setInitialTimestamp(Number(currentTimeStampInSecond - vestingTimePeriodInDays * secondsInDay).toLocaleString('fullwide', { useGrouping: false }));

        let withdraableToken = await deployedRewardVesting.withdrawableTokens(owner.address);
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number(totalTokenToBeDistributed / 2)).toLocaleString('fullwide', { useGrouping: false }));
        await deployedRewardVesting.withdrawTokens();
        withdraableToken = await deployedRewardVesting.withdrawableTokens(owner.address);
        expect(Number(withdraableToken)).to.equal(0);
        await expect(deployedRewardVesting.withdrawTokens()).to.be.revertedWith("no tokens available for withdrawal");
    });

});