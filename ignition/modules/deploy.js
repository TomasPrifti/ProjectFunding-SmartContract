
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ProjectModule", (module) => {
	// Defining constructor's parameters for the Contract.
	const args = {
		name: "Name of the project",
		description: "Description of the project",
		expiration: "Expiration of the project",
		goal: 1000,
		minCapital: 10,
	};

	// Deploying Contract.
	const project = module.contract("Project", [
		args.name,
		args.description,
		args.expiration,
		args.goal,
		args.minCapital,
	]);

	return { project };
});
