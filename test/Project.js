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

		// Calculating the expiration.
		const expirationTime = 60 * 60 * 24 * 30; // 30 days.

		// Defining constructor's parameters for the Contract.
		const args = {
			name: "Name of the project",
			description: "Description of the project",
			expiration: expirationTime,
			goal: 10_000 * 10 ** 6,
			minCapital: 100 * 10 ** 6,
			targetWallet: owner.address,
			usdtToken: usdt.target,
		};

		// Deploying a new contract everytime.
		const project = await ethers.deployContract("Project", [
			args.name,
			args.description,
			args.expiration,
			args.goal,
			args.minCapital,
			args.targetWallet,
			args.usdtToken,
		]);

		return { project, usdt, args, owner };
	}

	describe("constructor", () => {
		it("Initializes the Project correctly", async () => {
			const { project, usdt, args, owner } = await loadFixture(deployProjectFixture);

			// Calculating the right expiration from the block's timestamp when the contrat has been deployed.
			const transaction = await project.deploymentTransaction();
			const blockOfProject = await ethers.provider.getBlock(transaction.blockHash);
			const expiration = blockOfProject.timestamp + args.expiration;

			expect(await project.getName()).to.equal(args.name);
			expect(await project.getDescription()).to.equal(args.description);
			expect(await project.getExpiration()).to.equal(expiration);
			expect(await project.getGoal()).to.equal(args.goal);
			expect(await project.getMinCapital()).to.equal(args.minCapital);
			expect(await project.getTargetWallet()).to.equal(owner);
			expect(await project.getUSDTTokenAddress()).to.equal(usdt.target);
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

			// New balance has to be equal to the USDT sent.
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

			// My capital invested has to be equal to the USDT sent.
			expect(await project.getMyCapitalInvested()).to.equal(usdtToSend);
		});

		it("Fund the project and check if the event InvestedInProject and ProjectFunded are emitted", async () => {
			const { project, usdt, args, owner } = await loadFixture(deployProjectFixture);
			const usdtToSend = args.goal / 2;

			/**
			 * 1. First approve and funding.
			 * The owner has to connect and approve to the USDT Token Contract.
			 * Fund project with the half of the capital requested.
			 */
			await usdt.connect(owner).approve(project.target, usdtToSend);
			await expect(project.connect(owner).fundProject(usdtToSend)).to.emit(project, "InvestedInProject");

			/**
			 * 2. Second approve and funding.
			 * The owner has to connect and approve to the USDT Token Contract.
			 * Fund project with the half of the capital requested.
			 */
			await usdt.connect(owner).approve(project.target, usdtToSend);
			await expect(project.connect(owner).fundProject(usdtToSend)).to.emit(project, "ProjectFunded");
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
			await expect(project.connect(owner).fundProject(usdtToSend)).to.be.revertedWithCustomError(project, "Project__NotActive");
		});

		it("Testing the revert Project__NotEnoughCapitalInvested", async () => {
			const { project, usdt, args, owner } = await loadFixture(deployProjectFixture);
			const usdtToSend = ethers.parseUnits("10", 6);

			/**
			 * The owner has to connect and approve to the USDT Token Contract.
			 * Fund project with less capital than the minCapital requested in order to fail.
			 */
			await usdt.connect(owner).approve(project.target, usdtToSend);
			await expect(project.connect(owner).fundProject(usdtToSend)).to.be.revertedWithCustomError(project, "Project__NotEnoughCapitalInvested");
		});

		it("Testing the revert Project__InsufficientAmount", async () => {
			const { project, usdt, args, owner } = await loadFixture(deployProjectFixture);

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

		it("Testing the revert Project__Expired", async () => {
			const { project, usdt, args, owner } = await loadFixture(deployProjectFixture);
			//const usdtToSend = ethers.parseUnits("100", 6); // questo è bigint

			// Make the time passes.
			const expiration = await project.getExpiration();
			await time.increaseTo(expiration + 1n);
			await project.changeStatus();
			// Now the project has to be expired.

			expect(await project.isExpired()).to.be.true;
			expect(await project.getStatus()).to.equal("Expired");

			/**
			 * The owner has to connect and approve to the USDT Token Contract.
			 * Fund project with the minimum capital requested.
			 */
			await usdt.connect(owner).approve(project.target, args.minCapital);
			await expect(project.connect(owner).fundProject(args.minCapital)).to.be.revertedWithCustomError(project, "Project__Expired");
		});
	});

	describe("getUSDTBalance", () => {
		it("Testing the function getUSDTBalance", async () => {
			const { project, usdt, args, owner } = await loadFixture(deployProjectFixture);
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

	describe("isExpired", () => {
		it("Testing the function isExpired", async () => {
			const { project, usdt, args, owner } = await loadFixture(deployProjectFixture);

			// Check status of current time and expiration at the project's creation.
			const currentTime = BigInt(await time.latest());
			const expiration = await project.getExpiration();

			expect(expiration).to.be.greaterThan(currentTime);
			expect(await project.isExpired()).to.be.false;
			expect(await project.getStatus()).to.equal("Active");

			// Make the time passes.
			await time.increaseTo(expiration + 1n);
			await project.changeStatus();
			// Now the project has to be expired.

			// Check the new status.
			const newCurrentTime = BigInt(await time.latest());

			expect(expiration).to.be.lessThan(newCurrentTime);
			expect(await project.isExpired()).to.be.true;
			expect(await project.getStatus()).to.equal("Expired");
		});
	});
});
