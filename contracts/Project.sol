// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

error Project__NotEnoughCapitalInvested();
error Project__NotActive();

/**
 * @title A project for decentralized crowdfunding
 * @author Tomas Prifti
 * @notice This Smart Contract is used to describe a new project for a crowdfunding decentralized platform.
 */
contract Project {
	// Defining a ENUM to manage the project's status.
	enum ProjectStatus {
		ACTIVE,
		FUNDED,
		EXPIRED
	}

	// Immutable variables.
	string private i_name;
	string private i_description;
	string private i_expiration;
	uint private immutable i_goal;
	uint private immutable i_minCapital;
	address private immutable i_targetWallet;

	// Storage variables.
	ProjectStatus private s_status;
	mapping(ProjectStatus => string) private s_statusLabel;
	mapping(address => uint) private s_financiers;

	// Event used to notify that the user has invested successfully into the project.
	event InvestedInProject(address indexed financier, uint indexed capital);

	/**
	 * Constructor.
	 * 
	 * @param name Project's name.
	 * @param description Project's description.
	 * @param expiration The expiration date for the fundraising's end.
	 * @param goal The goal to achieve to successfully fund the project.
	 * @param minCapital The minimum capital requested to finance the project.
	 */
	constructor(
		string memory name,
		string memory description,
		string memory expiration,
		uint goal,
		uint minCapital
	) {
		i_name = name;
		i_description = description;
		i_expiration = expiration;
		i_goal = goal;
		i_minCapital = minCapital;
		i_targetWallet = msg.sender;
		s_status = ProjectStatus.ACTIVE;
		initProjectStatusLabel();
	}

	/**
	 * Function used to fund the project.
	 */
	function fundProject() public payable {
		if (s_status != ProjectStatus.ACTIVE) {
			revert Project__NotActive();
		}
		if (msg.value < i_minCapital) {
			revert Project__NotEnoughCapitalInvested();
		}
		s_financiers[msg.sender] = msg.value;

		emit InvestedInProject(msg.sender, msg.value);
	}

	/**
	 * Function used to understand how much capital the caller has invested.
	 * 
	 * @return The capital that the caller has invested into the project.
	 */
	function getMyCapitalInvested() public view returns(uint) {
		return s_financiers[msg.sender];
	}

	/* Getters Function */

	function getName() public view returns(string memory) {
		return i_name;
	}
	function getDescription() public view returns(string memory) {
		return i_description;
	}
	function getExpiration() public view returns(string memory) {
		return i_expiration;
	}
	function getGoal() public view returns(uint) {
		return i_goal;
	}
	function getMinCapital() public view returns(uint) {
		return i_minCapital;
	}
	function getTargetWallet() public view returns(address) {
		return i_targetWallet;
	}
	function getStatus() public view returns(string memory) {
		return s_statusLabel[s_status];
	}

	/* Private Functions */

	function initProjectStatusLabel() private {
		s_statusLabel[ProjectStatus.ACTIVE] = "Active";
		s_statusLabel[ProjectStatus.FUNDED] = "Funded";
		s_statusLabel[ProjectStatus.EXPIRED] = "Expired";
	}
}
