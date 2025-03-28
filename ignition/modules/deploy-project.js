const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { network } = require("hardhat");

// This deploy script can be used to deploy a single Project contract.
module.exports = buildModule("ProjectModule", (module) => {
	const chainId = network.config.chainId;

	// Defining constructor's parameters for the Contract.
	const args = {
		name: "Name of the project",
		description: "Description of the project",
		minCapital: 100 * 10 ** 6, // 100 USDT.
		owner: "0x0000000000000000000000000000000000000000",
		usdtToken: module.getParameter(`${chainId}-USDT`),
	};

	// Deploying Contract.
	const project = module.contract("Project", [
		args.name,
		args.description,
		args.minCapital,
		args.owner,
		args.usdtToken,
	]);

	console.log("Project deployed successfully!");

	return { project };
});
