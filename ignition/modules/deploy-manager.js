
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// This deploy script can be used to deploy the Manager contract.
module.exports = buildModule("ManagerModule", (module) => {
	// Deploying Contract.
	const manager = module.contract("Manager", [
		module.getParameter("MocksUSDT"),
	]);

	console.log("Manager deployed successfully!");

	return { manager };
});
