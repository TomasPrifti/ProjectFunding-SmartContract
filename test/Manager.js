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
			const { manager, usdt, owner } = await loadFixture(deployManagerFixture);

			expect(await manager.getUSDTTokenAddress()).to.equal(usdt.target);
		});
	});

	describe("createProject", () => {
		it("Create a new project and verify its information", async () => {
			const { manager, usdt, owner } = await loadFixture(deployManagerFixture);

			// Defining constructor's parameters for the contract to create.
			const args = {
				name: "Name of the project",
				description: "Description of the project",
				minCapital: 100 * 10 ** 6, // 100 USDT.
			};

			// Create a new Project.
			const transaction = await manager.createProject(
				args.name,
				args.description,
				args.minCapital,
			);
			const allProjects = await manager.getAllProjects();
			const newProject = await ethers.getContractAt('Project', allProjects[0]);

			// Checking all the project's information.
			expect(await newProject.getName()).to.equal(args.name);
			expect(await newProject.getDescription()).to.equal(args.description);
			expect(await newProject.getMinCapital()).to.equal(args.minCapital);
			expect(await newProject.getUSDTTokenAddress()).to.equal(await manager.getUSDTTokenAddress());
		});
	});

	describe("getAllProjects", () => {
		it("Create new projects and verify the amount managed", async () => {
			const { manager, usdt, owner } = await loadFixture(deployManagerFixture);

			// Defining constructor's parameters for the contract to create.
			const args = {
				name: "Name of the project",
				description: "Description of the project",
				minCapital: 100 * 10 ** 6, // 100 USDT.
			};
			let allProjects;
			let transaction;

			// No project has been created yet.
			allProjects = await manager.getAllProjects();
			expect(allProjects.length).to.be.equal(0);

			// Create the first Project.
			transaction = await manager.createProject(
				args.name,
				args.description,
				args.minCapital,
			);

			// Only one project has been created.
			allProjects = await manager.getAllProjects();
			expect(allProjects.length).to.be.equal(1);

			// Create the second Project.
			transaction = await manager.createProject(
				args.name,
				args.description,
				args.minCapital,
			);

			// Two projects have been created.
			allProjects = await manager.getAllProjects();
			expect(allProjects.length).to.be.equal(2);
		});
	});
});
