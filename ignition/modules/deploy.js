
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ProjectModule", (module) => {
	const project = module.contract("Project", [
		"Name of the project",
		"Description of the project",
		"Expiration of the project",
		1000,
		10,
	]);

	return { project };
});
