const {
	loadFixture,
	time,
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

		// Minting some Token for the other Account.
		await usdt.connect(otherAccount).mintToken();

		// Defining constructor's parameters for the Contract.
		const args = {
			name: "Name of the project",
			description: "Description of the project",
			minCapital: 100 * 10 ** 6,
			owner: owner.address,
			usdtToken: usdt.target,
		};

		// Deploying a new contract everytime.
		const project = await ethers.deployContract("Project", [
			args.name,
			args.description,
			args.minCapital,
			args.owner,
			args.usdtToken,
		]);

		return { project, usdt, args, owner, otherAccount };
	}

	describe("constructor", () => {
		it("Initializes the Project correctly", async () => {
			const { project, usdt, args, owner, otherAccount } = await loadFixture(deployProjectFixture);

			expect(await project.getName()).to.equal(args.name);
			expect(await project.getDescription()).to.equal(args.description);
			expect(await project.getMinCapital()).to.equal(args.minCapital);
			expect(await project.getOwner()).to.equal(owner);
			expect(await project.getUSDTTokenAddress()).to.equal(usdt.target);
		});
	});

	describe("fundProject", () => {
		it("Fund the project for the first time and check if the balance of the contract is correct", async () => {
			const { project, usdt, args, owner, otherAccount } = await loadFixture(deployProjectFixture);
			const usdtToSend = ethers.parseUnits("100", 6);

			// Initial balance has to be zero.
			const initialBalance = await usdt.balanceOf(project.target);
			expect(initialBalance).to.equal(0);

			// The owner has to connect and approve to the USDT Token Contract.
			await usdt.connect(owner).approve(project.target, usdtToSend);

			// Fund project.
			await project.connect(owner).fundProject(usdtToSend);

			// New balance has to be equal to the USDT sent.
			const newBalance = await usdt.balanceOf(project.target);
			expect(newBalance).to.equal(usdtToSend);
		});

		it("Fund the project and check if my capital invested is correct", async () => {
			const { project, usdt, args, owner, otherAccount } = await loadFixture(deployProjectFixture);
			const usdtToSend = ethers.parseUnits("100", 6);

			// The owner has to connect and approve to the USDT Token Contract.
			await usdt.connect(owner).approve(project.target, usdtToSend);

			// Fund project.
			await project.connect(owner).fundProject(usdtToSend);

			// My capital invested has to be equal to the USDT sent.
			expect(await project.getMyCapitalInvested()).to.equal(usdtToSend);
		});

		it("Fund the project and check if the event InvestedInProject is emitted", async () => {
			const { project, usdt, args, owner, otherAccount } = await loadFixture(deployProjectFixture);
			const usdtToSend = ethers.parseUnits("100", 6);

			/**
			 * Approve and funding.
			 * The owner has to connect and approve to the USDT Token Contract.
			 * Fund project with some USDT.
			 */
			await usdt.connect(owner).approve(project.target, usdtToSend);
			await expect(project.connect(owner).fundProject(usdtToSend)).to.emit(project, "InvestedInProject");
		});

		it("Testing the revert Project__NotEnoughCapitalInvested", async () => {
			const { project, usdt, args, owner, otherAccount } = await loadFixture(deployProjectFixture);
			const usdtToSend = ethers.parseUnits("10", 6);

			/**
			 * The owner has to connect and approve to the USDT Token Contract.
			 * Fund project with less capital than the minCapital requested in order to fail.
			 */
			await usdt.connect(owner).approve(project.target, usdtToSend);
			await expect(project.connect(owner).fundProject(usdtToSend)).to.be.revertedWithCustomError(project, "Project__NotEnoughCapitalInvested");
		});

		it("Testing the revert Project__InsufficientAmount", async () => {
			const { project, usdt, args, owner, otherAccount } = await loadFixture(deployProjectFixture);

			// Owner balance.
			const ownerBalance = await usdt.balanceOf(owner.address);
			const usdtToSend = ownerBalance * 2n;

			/**
			 * The owner has to connect and approve to the USDT Token Contract.
			 * Fund project with double of owner balance in order to fail.
			 */
			await usdt.connect(owner).approve(project.target, usdtToSend);
			await expect(project.connect(owner).fundProject(usdtToSend)).to.be.revertedWithCustomError(project, "Project__InsufficientAmount");
		});
	});

	describe("getUSDTBalance", () => {
		it("Testing the function getUSDTBalance", async () => {
			const { project, usdt, args, owner, otherAccount } = await loadFixture(deployProjectFixture);
			const usdtToSend = ethers.parseUnits("100", 6);

			// Initial balance has to be zero.
			expect(await usdt.balanceOf(project.target)).to.equal(0);
			expect(await project.getUSDTBalance()).to.equal(0);

			// The owner has to connect and approve to the USDT Token Contract.
			await usdt.connect(owner).approve(project.target, usdtToSend);

			// Fund project.
			await project.connect(owner).fundProject(usdtToSend);

			// New balance has to be equal to the USDT sent.
			expect(await usdt.balanceOf(project.target)).to.equal(usdtToSend);
			expect(await project.getUSDTBalance()).to.equal(usdtToSend);
		});
	});
});
