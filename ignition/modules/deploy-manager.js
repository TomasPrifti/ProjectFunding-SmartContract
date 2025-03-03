const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { network } = require("hardhat");

// This deploy script can be used to deploy the Manager contract.
module.exports = buildModule("ManagerModule", (module) => {
	const chainId = network.config.chainId;

	// Deploying Contract.
	const manager = module.contract("Manager", [
		module.getParameter(`${chainId}-USDT`),
	]);

	console.log("Manager deployed successfully!");

	return { manager };
});
