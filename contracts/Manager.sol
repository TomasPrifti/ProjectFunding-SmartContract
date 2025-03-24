// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "./Project.sol";

/**
 * @title A manager that manage the projects for decentralized crowdfunding
 * @author Tomas Prifti
 * @notice This Smart Contract is used to describe a manager for a crowdfunding decentralized platform.
 */
contract Manager {
	// Immutable variables.
	address private immutable i_usdtTokenAddress;

	// Storage variables.
	Project[] private s_projects;

	/**
	 * Constructor.
	 *
	 * @param usdtToken The address of the USDT Token Contract.
	 */
	constructor(address usdtToken) {
		i_usdtTokenAddress = usdtToken;
	}

	/**
	 * Main function used to create a new project on the platform.
	 *
	 * @param name Project's name.
	 * @param description Project's description.
	 * @param minCapital The minimum capital requested to finance the project.
	 */
	function createProject(
		string memory name,
		string memory description,
		uint minCapital
	) public {
		Project newProject = new Project(
			name,
			description,
			minCapital,
			msg.sender,
			i_usdtTokenAddress
		);
		s_projects.push(newProject);
	}

	/* Getters Function */

	function getUSDTTokenAddress() public view returns (address) {
		return i_usdtTokenAddress;
	}

	function getAllProjects() public view returns (Project[] memory) {
		return s_projects;
	}
}
