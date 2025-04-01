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
	const [owner, secondAccount, thirdAccount] = await ethers.getSigners();

	// Minting some Token for the second Account.
	await usdt.connect(secondAccount).mintToken();

	// Minting some Token for the third Account.
	await usdt.connect(thirdAccount).mintToken();
}
