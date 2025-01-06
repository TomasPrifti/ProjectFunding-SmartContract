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

		// MockUSDT Contract Deploy.
		const usdt = await ethers.deployContract("MockUSDT");

		// Defining constructor's parameters for the Contract.
		const args = {
			name: "Name of the project",
			description: "Description of the project",
			expiration: "Expiration of the project",
			goal: 10_000 * 10 ** 6,
			minCapital: 100 * 10 ** 6,
			usdtToken: usdt.target,
		};

		// Deploying a new contract everytime.
		const project = await ethers.deployContract("Project", [
			args.name,
			args.description,
			args.expiration,
			args.goal,
			args.minCapital,
			args.usdtToken,
		]);

		return { project, usdt, args, owner };
	}

	describe("constructor", () => {
		it("Initializes the Project correctly", async () => {
			const { project, usdt, args, owner } = await loadFixture(deployProjectFixture);

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
			const { project, usdt, args, owner } = await loadFixture(deployProjectFixture);
			const usdtToSend = ethers.parseUnits("100", 6);

			// Initial balance has to be zero.
			const initialBalance = await usdt.balanceOf(project.target);
			expect(initialBalance).to.equal(0);

			// The owner has to connect and approve to the USDT Token Contract.
			await usdt.connect(owner).approve(project.target, usdtToSend);

			// Fund project.
			await project.connect(owner).fundProject(usdtToSend);

			// New balance has to be equal to the ether sent.
			const newBalance = await usdt.balanceOf(project.target);
			expect(newBalance).to.equal(usdtToSend);
		});

		it("Fund the project and check if my capital invested is correct", async () => {
			const { project, usdt, args, owner } = await loadFixture(deployProjectFixture);
			const usdtToSend = ethers.parseUnits("100", 6);

			// The owner has to connect and approve to the USDT Token Contract.
			await usdt.connect(owner).approve(project.target, usdtToSend);

			// Fund project.
			await project.connect(owner).fundProject(usdtToSend);

			// My capital invested has to be equal to the ether sent.
			expect(await project.getMyCapitalInvested()).to.equal(usdtToSend);
		});

		it("Testing the revert Project__NotActive", async () => {
			const { project, usdt, args, owner } = await loadFixture(deployProjectFixture);
			const usdtToSend = ethers.parseUnits("5000", 6);

			/**
			 * 1. First approve and funding.
			 * The owner has to connect and approve to the USDT Token Contract.
			 * Fund project with the half of the capital requested.
			 * Check if project is still "Active".
			 */
			await usdt.connect(owner).approve(project.target, usdtToSend);
			await project.connect(owner).fundProject(usdtToSend);
			expect(await project.getStatus()).to.equal("Active");

			/**
			 * 2. Second approve and funding.
			 * The owner has to connect and approve to the USDT Token Contract.
			 * Fund project with the half of the capital requested.
			 * Check if project is "Funded".
			 */
			await usdt.connect(owner).approve(project.target, usdtToSend);
			await project.connect(owner).fundProject(usdtToSend);
			expect(await project.getStatus()).to.equal("Funded");

			/**
			 * 3. Third approve and funding.
			 * The owner has to connect and approve to the USDT Token Contract.
			 * Fund project with the half of the capital requested.
			 * Check if project revert the operation.
			 */
			await usdt.connect(owner).approve(project.target, usdtToSend);
			expect(project.connect(owner).fundProject(usdtToSend)).to.be.revertedWith("Project__NotActive");
		});
	});
});
