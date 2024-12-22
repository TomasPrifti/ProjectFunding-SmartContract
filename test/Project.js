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

	describe("fundProject", () => {
		it("Fund the project for the first time and check if the balance of the contract is correct", async () => {
			const { project, args, owner } = await loadFixture(deployProjectFixture);
			const etherToSend = ethers.parseEther("1.0");

			// Initial balance has to be zero.
			const currentBalance = await ethers.provider.getBalance(project.target);
			expect(currentBalance).to.equal(0);

			// Fund project.
			await project.fundProject({ value: etherToSend });

			// New balance has to be equal to the ether sent.
			const newBalance = await ethers.provider.getBalance(project.target);
			expect(newBalance).to.equal(etherToSend);
		});

		it("Fund the project and check if my capital invested is correct", async () => {
			const { project, args, owner } = await loadFixture(deployProjectFixture);
			const etherToSend = ethers.parseEther("1.0");

			// Fund project.
			await project.fundProject({ value: etherToSend });

			// My capital invested has to be equal to the ether sent.
			expect(await project.getMyCapitalInvested()).to.equal(etherToSend);
		});
	});
});
