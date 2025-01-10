const {
	loadFixture,
	time,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Manager", () => {

	/**
	 * Function used to deploy a new Contract.
	 * 
	 * @returns {Object}
	 */
	async function deployManagerFixture() {
		// Contracts are deployed using the first signer/account by default.
		const [owner, otherAccount] = await ethers.getSigners();

		// MockUSDT Contract Deploy.
		const usdt = await ethers.deployContract("MockUSDT");

		// Deploying a new contract everytime.
		const manager = await ethers.deployContract("Manager", [
			usdt.target,
		]);

		return { manager, usdt, owner };
	}

	describe("constructor", () => {
		it("Initializes the Manager correctly", async () => {
			const { manager, usdt, args, owner } = await loadFixture(deployManagerFixture);

			expect(await manager.getUSDTTokenAddress()).to.equal(usdt.target);
		});
	});

});
