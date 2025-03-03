const { ethers, network } = require("hardhat");
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();
main().catch(error => console.error(error));

/* Main Function */

async function main() {
	if (!process.env.UPDATE_FRONT_END || process.env.FRONT_END_ADDRESSES_FILE === '' || process.env.FRONT_END_ABI_FILE === '') {
		console.error("Cannot update Front-End...");
		return;
	}

	const MockUSDT = await ethers.getContractFactory("MockUSDT");
	const chainId = network.config.chainId;

	// Updating MockUSDT address.
	const currentParameters = JSON.parse(fs.readFileSync("ignition/parameters.json", "utf8"));
	const currentAddresses = JSON.parse(fs.readFileSync(process.env.FRONT_END_ADDRESSES_FILE, "utf8"));

	console.log("Updating MockUSDT Address...");
	console.log("Writing on file...");
	const contractAddressInfo = JSON.parse(fs.readFileSync(`ignition/deployments/chain-${chainId}/deployed_addresses.json`, "utf8"));
	const contractAddress = contractAddressInfo["MocksModule#MockUSDT"] ?? '';
	currentParameters["$global"][`${chainId}-USDT`] = contractAddress;
	currentAddresses[chainId]["USDT"] = contractAddress;
	fs.writeFileSync("ignition/parameters.json", JSON.stringify(currentParameters));
	fs.writeFileSync(process.env.FRONT_END_ADDRESSES_FILE, JSON.stringify(currentAddresses));
	console.log("Writing successfully!");

	// Updating MockUSDT ABI File.
	console.log("\nUpdating MockUSDT ABI File...");
	const currentABIs = JSON.parse(fs.readFileSync(process.env.FRONT_END_ABI_FILE, "utf8"));

	console.log("Writing on file...");
	currentABIs[chainId]["USDT"] = MockUSDT.interface.fragments;
	fs.writeFileSync(process.env.FRONT_END_ABI_FILE, JSON.stringify(currentABIs));
	console.log("Writing successfully!");
};
