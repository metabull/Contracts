const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

let Token;
let hardhatToken;
let TeamVesting;
let deployedTeamVesting;
const secondsInDay = 86400;
const currentTimeStampInSecond = Date.now() / 1000 | 0;


let totalTokenToBeDistributed = 165000000 * 10 ** 18;

describe("TeamVesting with different vesting starttime", function () {

    beforeEach(async () => {
        Token = await ethers.getContractFactory("TestToken");
        hardhatToken = await Token.deploy();
        TeamVesting = await ethers.getContractFactory("TeamVesting");
        deployedTeamVesting = await TeamVesting.deploy(hardhatToken.address);
        await hardhatToken.transfer(deployedTeamVesting.address, totalTokenToBeDistributed.toLocaleString('fullwide', { useGrouping: false }));
    });

    it("Should Not able to reintialize intialStamp", async function () {
        await deployedTeamVesting.setInitialTimestamp(currentTimeStampInSecond);
        await expect(
            deployedTeamVesting.setInitialTimestamp(currentTimeStampInSecond)
        ).to.be.revertedWith("initialized");

    })

    it("Should Not Allow to duplicate Investor", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await deployedTeamVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await expect(
            deployedTeamVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("investor already added");
    })

    it("Should Not Allow to different Size Array of  Investor and Investor amount", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await expect(
            deployedTeamVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("different arrays sizes");
    })

    it("Should not allow other account to intialize intialStamp", async function () {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await expect(
            deployedTeamVesting.connect(addr1).setInitialTimestamp(currentTimeStampInSecond)
        ).to.be.revertedWith("caller is not the owner");

    })

    it("Should not allow other account to add investor", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await expect(
            deployedTeamVesting.connect(addr1).addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("caller is not the owner");
    })


    it("Calculate token after 1461 day and allow claim", async function () {

        const vestingTimePeriodInDays = 1461;
        const [owner, addr1] = await ethers.getSigners();
        await deployedTeamVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await deployedTeamVesting.setInitialTimestamp(Number(currentTimeStampInSecond - vestingTimePeriodInDays * secondsInDay).toLocaleString('fullwide', { useGrouping: false }));

        let withdraableToken = await deployedTeamVesting.withdrawableTokens(owner.address);
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number(totalTokenToBeDistributed / 2)).toLocaleString('fullwide', { useGrouping: false }));
        await deployedTeamVesting.withdrawTokens();
        withdraableToken = await deployedTeamVesting.withdrawableTokens(owner.address);
        expect(Number(withdraableToken)).to.equal(0);
    });

    it("Should Not Allow to claim zero token", async function () {

        const vestingTimePeriodInDays = 1461;
        const [owner, addr1] = await ethers.getSigners();
        await deployedTeamVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await deployedTeamVesting.setInitialTimestamp(Number(currentTimeStampInSecond - vestingTimePeriodInDays * secondsInDay).toLocaleString('fullwide', { useGrouping: false }));

        let withdraableToken = await deployedTeamVesting.withdrawableTokens(owner.address);
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number(totalTokenToBeDistributed / 2)).toLocaleString('fullwide', { useGrouping: false }));
        await deployedTeamVesting.withdrawTokens();
        withdraableToken = await deployedTeamVesting.withdrawableTokens(owner.address);
        expect(Number(withdraableToken)).to.equal(0);
        await expect(deployedTeamVesting.withdrawTokens()).to.be.revertedWith("no tokens available for withdrawal");
    });

});