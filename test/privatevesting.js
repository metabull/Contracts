const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

let Token;
let hardhatToken;
let PrivateVesting;
let deployedPrivateVesting;
const secondsInDay = 86400;
const currentTimeStampInSecond = Date.now() / 1000 | 0;

let totalTokenToBeDistributed = 80000000 * 10 ** 18;

describe("PrivateVesting with different vesting starttime", function () {

    beforeEach(async () => {
        Token = await ethers.getContractFactory("TestToken");
        hardhatToken = await Token.deploy();
        PrivateVesting = await ethers.getContractFactory("PrivateSaleVesting");
        deployedPrivateVesting = await PrivateVesting.deploy(hardhatToken.address);
        await hardhatToken.transfer(deployedPrivateVesting.address, totalTokenToBeDistributed.toLocaleString('fullwide', { useGrouping: false }));
    });

    it("Should Not able to reintialize intialStamp", async function () {
        await deployedPrivateVesting.setInitialTimestamp(currentTimeStampInSecond);
        await expect(
            deployedPrivateVesting.setInitialTimestamp(currentTimeStampInSecond)
        ).to.be.revertedWith("initialized");

    })

    it("Should Not Allow to claim until vesting is started", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await deployedPrivateVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await expect(deployedPrivateVesting.withdrawTokens()).to.be.revertedWith("initialized");
    })

    it("Should not allow other account to intialize intialStamp", async function () {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await expect(
            deployedPrivateVesting.connect(addr1).setInitialTimestamp(currentTimeStampInSecond)
        ).to.be.revertedWith("caller is not the owner");

    })

    it("Should Not Allow to duplicate Investor", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await deployedPrivateVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await expect(
            deployedPrivateVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("investor already added");
    })

    it("Should Not Allow to different Size Array of  Investor and Investor amount", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await expect(
            deployedPrivateVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("different arrays sizes");
    })

    it("Should not allow other account to add investor", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await expect(
            deployedPrivateVesting.connect(addr1).addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("caller is not the owner");
    })


    it("calculate token for 1 year", async function () {
        const vestingTimePeriodInDays = 365;
        const totalInvestor = 2;
        const [owner, addr1] = await ethers.getSigners();
        await deployedPrivateVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await deployedPrivateVesting.setInitialTimestamp(Number(currentTimeStampInSecond - (vestingTimePeriodInDays * secondsInDay)).toLocaleString('fullwide', { useGrouping: false }));

        let withdraableToken = await deployedPrivateVesting.withdrawableTokens(addr1.address);
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number((totalTokenToBeDistributed * vestingTimePeriodInDays) / (365 * totalInvestor)).toLocaleString('fullwide', { useGrouping: false })));
        await deployedPrivateVesting.connect(addr1).withdrawTokens();
        let tokenBalance = await hardhatToken.balanceOf(addr1.address);
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number(tokenBalance).toLocaleString('fullwide', { useGrouping: false })));
        withdraableToken = await deployedPrivateVesting.withdrawableTokens(addr1.address);
        expect(Number(withdraableToken)).to.equal(0);
        let balanceOnVesting = await hardhatToken.balanceOf(deployedPrivateVesting.address);
        expect((Number(totalTokenToBeDistributed) - Number(tokenBalance)).toLocaleString('fullwide', { useGrouping: false })).to.equal(Number(balanceOnVesting).toLocaleString('fullwide', { useGrouping: false }));
        await deployedPrivateVesting.connect(owner).withdrawTokens();
        balanceOnVesting = await hardhatToken.balanceOf(deployedPrivateVesting.address);
        expect(Number(balanceOnVesting)).to.equal(0);
    });

    it("Should Not Allow to claim zero token", async function () {
        const vestingTimePeriodInDays = 365;
        const totalInvestor = 2;
        const [owner, addr1] = await ethers.getSigners();
        await deployedPrivateVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await deployedPrivateVesting.setInitialTimestamp(Number(currentTimeStampInSecond - (vestingTimePeriodInDays * secondsInDay)).toLocaleString('fullwide', { useGrouping: false }));

        let withdraableToken = await deployedPrivateVesting.withdrawableTokens(addr1.address);
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number((totalTokenToBeDistributed * vestingTimePeriodInDays) / (365 * totalInvestor)).toLocaleString('fullwide', { useGrouping: false })));
        await deployedPrivateVesting.connect(addr1).withdrawTokens();
        let tokenBalance = await hardhatToken.balanceOf(addr1.address);
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number(tokenBalance).toLocaleString('fullwide', { useGrouping: false })));
        withdraableToken = await deployedPrivateVesting.withdrawableTokens(addr1.address);
        expect(Number(withdraableToken)).to.equal(0);
        let balanceOnVesting = await hardhatToken.balanceOf(deployedPrivateVesting.address);
        expect((Number(totalTokenToBeDistributed) - Number(tokenBalance)).toLocaleString('fullwide', { useGrouping: false })).to.equal(Number(balanceOnVesting).toLocaleString('fullwide', { useGrouping: false }));
        await deployedPrivateVesting.connect(owner).withdrawTokens();
        balanceOnVesting = await hardhatToken.balanceOf(deployedPrivateVesting.address);
        expect(Number(balanceOnVesting)).to.equal(0);
        await expect(deployedPrivateVesting.withdrawTokens()).to.be.revertedWith("no tokens available for withdrawal");
    });

});