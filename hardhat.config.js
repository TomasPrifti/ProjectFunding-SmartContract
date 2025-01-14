require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: "0.8.28",
	defaultNetwork: "hardhat",
	networks: {
		hardhat: {
			chainId: 31337,
		},
		localhost: {
			chainId: 31337,
		},
		sepolia: {
			url: process.env.SEPOLIA_RPC_URL,
			accounts: process.env.PRIVATE_KEY !== '' ? [process.env.PRIVATE_KEY] : [],
			saveDeployments: true,
			chainId: 11155111,
		},
		mainnet: {
			url: process.env.MAINNET_RPC_URL,
			accounts: process.env.PRIVATE_KEY !== '' ? [process.env.PRIVATE_KEY] : [],
			saveDeployments: true,
			chainId: 1,
		},
	},
};
