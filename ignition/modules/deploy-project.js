
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// This deploy script can be used to deploy a single Project contract.
module.exports = buildModule("ProjectModule", (module) => {
	// Defining constructor's parameters for the Contract.
	const args = {
		name: "Name of the project",
		description: "Description of the project",
		expiration: 60 * 60 * 24 * 30, // 30 days.
		goal: 10_000 * 10 ** 6, // 10.000 USDT.
		minCapital: 100 * 10 ** 6, // 100 USDT.
		targetWallet: "0x0000000000000000000000000000000000000000",
		usdtToken: module.getParameter("MocksUSDT"),
	};

	// Deploying Contract.
	const project = module.contract("Project", [
		args.name,
		args.description,
		args.expiration,
		args.goal,
		args.minCapital,
		args.targetWallet,
		args.usdtToken,
	]);

	console.log("Project deployed successfully!");

	return { project };
});
