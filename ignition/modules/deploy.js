
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ProjectModule", (module) => {
	// Defining constructor's parameters for the Contract.
	const args = {
		name: "Name of the project",
		description: "Description of the project",
		expiration: "Expiration of the project",
		goal: 10_000 * 10 ** 6,
		minCapital: 100 * 10 ** 6,
		usdtToken: module.getParameter("MocksUSDT"),
	};

	// Deploying Contract.
	const project = module.contract("Project", [
		args.name,
		args.description,
		args.expiration,
		args.goal,
		args.minCapital,
		args.usdtToken,
	]);

	console.log("Contracts deployed successfully!");

	return { project };
});
