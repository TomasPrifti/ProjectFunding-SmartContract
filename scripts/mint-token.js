const { ethers, network } = require("hardhat");
const fs = require('fs');

main().catch(error => console.error(error));

async function main() {
	const chainId = network.config.chainId;

	// Retrieve the MockUSDT contract address.
	const contractAddressInfo = JSON.parse(fs.readFileSync(`ignition/deployments/chain-${chainId}/deployed_addresses.json`, "utf8"));
	const contractAddress = contractAddressInfo["MocksModule#MockUSDT"] ?? '';

	// MockUSDT Contract Deploy.
	const usdt = await ethers.getContractAt("MockUSDT", contractAddress)
	const [owner, otherAccount] = await ethers.getSigners();

	// Minting some Token for the other Account.
	await usdt.connect(otherAccount).mintToken();
}
