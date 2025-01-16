const { network } = require("hardhat");
const fs = require('fs');

main().catch(error => console.error(error));

/* Main Function */

async function main() {
	// Updating MockUSDT address.
	const currentParameters = JSON.parse(fs.readFileSync("ignition/parameters.json", "utf8"));
	
	console.log("Updating MockUSDT Address...");
	console.log("Writing on file...");
	const contractAddressInfo = JSON.parse(fs.readFileSync(`ignition/deployments/chain-${network.config.chainId}/deployed_addresses.json`, "utf8"));
	const contractAddress = contractAddressInfo["MocksModule#MockUSDT"] ?? '';
	currentParameters["$global"]["MockUSDT"] = contractAddress;
	fs.writeFileSync("ignition/parameters.json", JSON.stringify(currentParameters));
	console.log("Writing successfully!");
};
