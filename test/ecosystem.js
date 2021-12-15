const { expect } = require("chai");
const { ethers } = require("hardhat");

let Token;
let hardhatToken;
let EcoSystemDevelopmentVesting;
let deployedEcoSystemDevelopmentVesting;
const secondsInDay = 86400;
const currentTimeStampInSecond = Date.now() / 1000 | 0;


let totalTokenToBeDistributed = 100000000 * 10 ** 18;
describe("EcoSystemDevelopmentVesting with different vesting starttime", function () {

    beforeEach(async () => {
        Token = await ethers.getContractFactory("TestToken");
        hardhatToken = await Token.deploy();
        EcoSystemDevelopmentVesting = await ethers.getContractFactory("EcoSystemDevelopmentVesting");
        deployedEcoSystemDevelopmentVesting = await EcoSystemDevelopmentVesting.deploy(hardhatToken.address);
        await hardhatToken.transfer(deployedEcoSystemDevelopmentVesting.address, totalTokenToBeDistributed.toLocaleString('fullwide', { useGrouping: false }));
    });

    it("Should Not able to reintialize intialStamp", async function () {
        await deployedEcoSystemDevelopmentVesting.setInitialTimestamp(currentTimeStampInSecond);
        await expect(
            deployedEcoSystemDevelopmentVesting.setInitialTimestamp(currentTimeStampInSecond)
        ).to.be.revertedWith("initialized");

    })


    it("Should not allow other account to intialize intialStamp", async function () {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await expect(
            deployedEcoSystemDevelopmentVesting.connect(addr1).setInitialTimestamp(currentTimeStampInSecond)
        ).to.be.revertedWith("caller is not the owner");

    })

    it("Should Not Allow to duplicate Investor", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await deployedEcoSystemDevelopmentVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await expect(
            deployedEcoSystemDevelopmentVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("investor already added");
    })

    it("Should Not Allow to different Size Array of  Investor and Investor amount", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await expect(
            deployedEcoSystemDevelopmentVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("different arrays sizes");
    })

    it("Should Not Allow to claim until vesting is started", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await deployedEcoSystemDevelopmentVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await expect(deployedEcoSystemDevelopmentVesting.withdrawTokens()).to.be.revertedWith("initialized");
    })

    it("Should not allow other account to add investor", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await expect(
            deployedEcoSystemDevelopmentVesting.connect(addr1).addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })])
        ).to.be.revertedWith("caller is not the owner");
    })
    it("Calculate token before intialCliff and withdrawable should be zero", async function () {

        const vestingTimePeriodInDays = 10;
        const [owner, addr1] = await ethers.getSigners();
        await deployedEcoSystemDevelopmentVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await deployedEcoSystemDevelopmentVesting.setInitialTimestamp(Number(currentTimeStampInSecond - vestingTimePeriodInDays * secondsInDay).toLocaleString('fullwide', { useGrouping: false }));

        let withdraableToken = await deployedEcoSystemDevelopmentVesting.withdrawableTokens(owner.address);
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number(0)).toLocaleString('fullwide', { useGrouping: false }));
    });


    it("Calculate token after 395 day and allow claim", async function () {

        const vestingTimePeriodInDays = 395;
        const [owner, addr1] = await ethers.getSigners();
        await deployedEcoSystemDevelopmentVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await deployedEcoSystemDevelopmentVesting.setInitialTimestamp(Number(currentTimeStampInSecond - vestingTimePeriodInDays * secondsInDay).toLocaleString('fullwide', { useGrouping: false }));

        let withdraableToken = await deployedEcoSystemDevelopmentVesting.withdrawableTokens(owner.address);
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number(totalTokenToBeDistributed / 2)).toLocaleString('fullwide', { useGrouping: false }));
        await deployedEcoSystemDevelopmentVesting.withdrawTokens();
        withdraableToken = await deployedEcoSystemDevelopmentVesting.withdrawableTokens(owner.address);
        expect(Number(withdraableToken)).to.equal(0);
    });

    it("Calculate token after completion of vesting period", async function () {

        const vestingTimePeriodInDays = 500;
        const [owner, addr1] = await ethers.getSigners();
        await deployedEcoSystemDevelopmentVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await deployedEcoSystemDevelopmentVesting.setInitialTimestamp(Number(currentTimeStampInSecond - vestingTimePeriodInDays * secondsInDay).toLocaleString('fullwide', { useGrouping: false }));

        let withdraableToken = await deployedEcoSystemDevelopmentVesting.withdrawableTokens(owner.address);
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number(totalTokenToBeDistributed / 2)).toLocaleString('fullwide', { useGrouping: false }));
        await deployedEcoSystemDevelopmentVesting.withdrawTokens();
        withdraableToken = await deployedEcoSystemDevelopmentVesting.withdrawableTokens(owner.address);
        expect(Number(withdraableToken)).to.equal(0);
    });

    it("Should Not Allow to claim zero token", async function () {
        const vestingTimePeriodInDays = 500;
        const [owner, addr1] = await ethers.getSigners();
        await deployedEcoSystemDevelopmentVesting.addInvestors([owner.address, addr1.address], [Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false }), Number(totalTokenToBeDistributed / 2).toLocaleString('fullwide', { useGrouping: false })]);

        await deployedEcoSystemDevelopmentVesting.setInitialTimestamp(Number(currentTimeStampInSecond - vestingTimePeriodInDays * secondsInDay).toLocaleString('fullwide', { useGrouping: false }));

        let withdraableToken = await deployedEcoSystemDevelopmentVesting.withdrawableTokens(owner.address);
        expect((Number(withdraableToken).toLocaleString('fullwide', { useGrouping: false }))).to.equal((Number(totalTokenToBeDistributed / 2)).toLocaleString('fullwide', { useGrouping: false }));
        await deployedEcoSystemDevelopmentVesting.withdrawTokens();
        withdraableToken = await deployedEcoSystemDevelopmentVesting.withdrawableTokens(owner.address);
        expect(Number(withdraableToken)).to.equal(0);
        await expect(deployedEcoSystemDevelopmentVesting.withdrawTokens()).to.be.revertedWith("no tokens available for withdrawal");
    })
});