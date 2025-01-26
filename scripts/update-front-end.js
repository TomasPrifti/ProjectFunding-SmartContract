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

	console.log("Updating Front-End...");

	const manager = await ethers.getContractFactory("Manager");
	const project = await ethers.getContractFactory("Project");
	const chainId = network.config.chainId;

	// Updating Addresses File.
	console.log("\nUpdating Addresses File...");
	const currentAddresses = JSON.parse(fs.readFileSync(process.env.FRONT_END_ADDRESSES_FILE, "utf8"));

	console.log("Writing on file...");
	const contractAddressInfo = JSON.parse(fs.readFileSync(`ignition/deployments/chain-${chainId}/deployed_addresses.json`, "utf8"));
	const contractAddress = contractAddressInfo["ManagerModule#Manager"] ?? '';
	currentAddresses[chainId]["Manager"] = contractAddress;
	fs.writeFileSync(process.env.FRONT_END_ADDRESSES_FILE, JSON.stringify(currentAddresses));
	console.log("Writing successfully!");

	// Updating ABI File.
	console.log("\nUpdating ABI File...");
	const currentABIs = JSON.parse(fs.readFileSync(process.env.FRONT_END_ABI_FILE, "utf8"));
	
	console.log("Writing on file...");
	currentABIs[chainId]["Manager"] = manager.interface.fragments;
	currentABIs[chainId]["Project"] = project.interface.fragments;
	fs.writeFileSync(process.env.FRONT_END_ABI_FILE, JSON.stringify(currentABIs));
	console.log("Writing successfully!");
};
