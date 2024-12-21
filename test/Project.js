const {
	loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Project", () => {

	/**
	 * Function used to deploy a new Contract.
	 * 
	 * @returns {Object}
	 */
	async function deployProjectFixture() {
		// Contracts are deployed using the first signer/account by default.
		const [owner, otherAccount] = await ethers.getSigners();

		// Defining constructor's parameters for the Contract.
		const args = {
			name: "Name of the project",
			description: "Description of the project",
			expiration: "Expiration of the project",
			goal: 1000,
			minCapital: 10,
		};

		// Deploying a new contract everytime.
		const project = await ethers.deployContract("Project", [
			args.name,
			args.description,
			args.expiration,
			args.goal,
			args.minCapital,
		]);

		return { project, args, owner };
	}

	describe("constructor", () => {
		it("Initializes the Project correctly", async () => {
			const { project, args, owner } = await loadFixture(deployProjectFixture);

			expect(await project.getName()).to.equal(args.name);
			expect(await project.getDescription()).to.equal(args.description);
			expect(await project.getExpiration()).to.equal(args.expiration);
			expect(await project.getGoal()).to.equal(args.goal);
			expect(await project.getMinCapital()).to.equal(args.minCapital);
			expect(await project.getTargetWallet()).to.equal(owner);
			expect(await project.getStatus()).to.equal("Active");
		});
	});
});
