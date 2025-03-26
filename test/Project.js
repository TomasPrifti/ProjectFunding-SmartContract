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

		it("Fund the project and check if the financiers are correct", async () => {
			const { project, usdt, args, owner, otherAccount } = await loadFixture(deployProjectFixture);
			const usdtToSend = ethers.parseUnits("100", 6);

			// Retrieving the financiers.
			let financiers = await project.getFinanciers();
			expect(financiers.length).to.equal(0);

			/**
			 * The users have to connect and approve to the USDT Token Contract.
			 * Then fund the project.
			 */

			// First user.
			await usdt.connect(owner).approve(project.target, usdtToSend);
			await project.connect(owner).fundProject(usdtToSend);

			// Retrieving the financiers.
			financiers = await project.getFinanciers();

			// Checking all the address associated with the financiers.
			expect(financiers.length).to.equal(1);
			expect(financiers[0]).to.equal(owner);

			// Second user.
			await usdt.connect(otherAccount).approve(project.target, usdtToSend);
			await project.connect(otherAccount).fundProject(usdtToSend);

			// Retrieving the financiers.
			financiers = await project.getFinanciers();

			// Checking all the address associated with the financiers.
			expect(financiers.length).to.equal(2);
			expect(financiers[0]).to.equal(owner);
			expect(financiers[1]).to.equal(otherAccount);
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

	describe("revokeTransaction", () => {
		it("Revoke a transaction and check if successfully revoked", async () => {
			const { project, usdt, args, owner, otherAccount } = await loadFixture(deployProjectFixture);
			const usdtToSend = ethers.parseUnits("100", 6);
			let transaction;

			// Creation of a new transaction.
			await project.connect(owner).createTransaction(otherAccount, usdtToSend);
			await expect(project.connect(owner).createTransaction(otherAccount, usdtToSend)).to.emit(project, "TransactionCreated");

			// Retrieving the first transaction.
			transaction = await project.getTransaction(0);

			// Checking the status of the transaction already created.
			expect(transaction.status).to.equal(0);
			expect(await project.TransactionStatusLabel(transaction.status)).to.equal("Pending");

			// Revoking the transaction.
			await expect(project.connect(owner).revokeTransaction(0)).to.emit(project, "TransactionRevoked");

			// Retrieving again the first transaction.
			transaction = await project.getTransaction(0);

			// Checking the status of the transaction already revoked.
			expect(transaction.status).to.equal(2);
			expect(await project.TransactionStatusLabel(transaction.status)).to.equal("Revoked");
		});

		it("Try to revoke a transaction that doesn't exist", async () => {
			const { project, usdt, args, owner, otherAccount } = await loadFixture(deployProjectFixture);

			await expect(project.connect(owner).revokeTransaction(0)).to.be.revertedWithCustomError(project, "Project__TransactionNotExist");
		});

		it("Try to revoke a transaction that is not pending", async () => {
			const { project, usdt, args, owner, otherAccount } = await loadFixture(deployProjectFixture);
			const usdtToSend = ethers.parseUnits("100", 6);

			// Creation of a new transaction.
			await project.connect(owner).createTransaction(otherAccount, usdtToSend);

			// Revoking the transaction.
			await project.connect(owner).revokeTransaction(0);
			
			// Retrieving the first transaction.
			const transaction = await project.getTransaction(0);

			// Checking the status of the transaction already revoked.
			expect(transaction.status).to.equal(2);
			expect(await project.TransactionStatusLabel(transaction.status)).to.equal("Revoked");

			// Try to revoke again the same transaction.
			await expect(project.connect(owner).revokeTransaction(0)).to.be.revertedWithCustomError(project, "Project__TransactionNotPending");
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

	describe("getTransactionCount", () => {
		it("Testing the function getTransactionCount", async () => {
			const { project, usdt, args, owner, otherAccount } = await loadFixture(deployProjectFixture);
			const usdtToSend = ethers.parseUnits("100", 6);

			// Initial count has to be zero.
			expect(await project.getTransactionCount()).to.equal(0);

			// Creation of a new transaction.
			await expect(project.connect(owner).createTransaction(otherAccount, usdtToSend)).to.emit(project, "TransactionCreated");

			// Initial count has to be one.
			expect(await project.getTransactionCount()).to.equal(1);

			// Creation of a new transaction.
			await expect(project.connect(owner).createTransaction(otherAccount, usdtToSend)).to.emit(project, "TransactionCreated");

			// Initial count has to be two.
			expect(await project.getTransactionCount()).to.equal(2);
		});
	});

	describe("getTransaction", () => {
		it("Testing the function getTransaction", async () => {
			const { project, usdt, args, owner, otherAccount } = await loadFixture(deployProjectFixture);
			const usdtToSend = ethers.parseUnits("100", 6);

			// Creation of a new transaction.
			await expect(project.connect(owner).createTransaction(otherAccount, usdtToSend)).to.emit(project, "TransactionCreated");

			// Retrieving the first transaction.
			const transaction = await project.getTransaction(0);

			// Checking all the information of the transaction already created.
			expect(transaction.to).to.equal(otherAccount);
			expect(transaction.value).to.equal(usdtToSend);
			expect(transaction.executed).to.false;
			expect(transaction.numConfirmations).to.equal(0);
			expect(transaction.status).to.equal(0);
			expect(await project.TransactionStatusLabel(transaction.status)).to.equal("Pending");
		});
	});

	describe("TransactionStatusLabel", () => {
		it("Testing the function TransactionStatusLabel", async () => {
			const { project, usdt, args, owner, otherAccount } = await loadFixture(deployProjectFixture);

			// Checking all the labels that can be obtained by the function.
			expect(await project.TransactionStatusLabel(0)).to.equal("Pending");
			expect(await project.TransactionStatusLabel(1)).to.equal("Executed");
			expect(await project.TransactionStatusLabel(2)).to.equal("Revoked");
		});
	});
});
