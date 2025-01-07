
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("MocksModule", (module) => {
	// MockUSDT Contract Deploy.
	const usdt = module.contract("MockUSDT");

	console.log("Mocks deployed successfully!");

	return { usdt };
});
