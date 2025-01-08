// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error Project__NotEnoughCapitalInvested();
error Project__NotActive();
error Project__InsufficientAmount();
error Project__Expired();

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
	uint private immutable i_expiration;
	uint private immutable i_goal;
	uint private immutable i_minCapital;
	address private immutable i_targetWallet;
	address private immutable i_usdtTokenAddress;

	// Storage variables.
	ProjectStatus private s_status;
	mapping(ProjectStatus => string) private s_statusLabel;
	mapping(address => uint) private s_financiers;

	// Event used to notify that the user has invested successfully into the project.
	event InvestedInProject(address indexed financier, uint indexed capital);
	// Event used to notify that the project has been funded successfully.
	event ProjectFunded(address indexed contractAddress);

	/**
	 * Constructor.
	 * 
	 * @param name Project's name.
	 * @param description Project's description.
	 * @param expiration The expiration UNIX Timestamp for the fundraising's end.
	 * @param goal The goal to achieve to successfully fund the project.
	 * @param minCapital The minimum capital requested to finance the project.
	 */
	constructor(
		string memory name,
		string memory description,
		uint expiration,
		uint goal,
		uint minCapital,
		address usdtToken
	) {
		i_name = name;
		i_description = description;
		i_expiration = block.timestamp + expiration;
		i_goal = goal;
		i_minCapital = minCapital;
		i_usdtTokenAddress = usdtToken;

		i_targetWallet = msg.sender;
		s_status = ProjectStatus.ACTIVE;
		initProjectStatusLabel();
	}

	/**
	 * Function used to fund the project.
	 */
	function fundProject(uint amount) public {
		if (block.timestamp > i_expiration) {
			revert Project__Expired();
		}
		if (s_status != ProjectStatus.ACTIVE) {
			revert Project__NotActive();
		}
		if (amount < i_minCapital) {
			revert Project__NotEnoughCapitalInvested();
		}

		IERC20 usdt = IERC20(i_usdtTokenAddress);

		// Manually check of the owner balance and the allowance.
		uint256 balance = usdt.balanceOf(msg.sender);
		uint256 allowance = usdt.allowance(msg.sender, address(this));
		if (balance < amount || allowance < amount) {
			revert Project__InsufficientAmount();
		}

		// Transfer USDT from the caller of this contract.
		bool success = usdt.transferFrom(msg.sender, address(this), amount);
		if (!success) {
			revert Project__InsufficientAmount();
		}

		// Saving the amount financied and emit the event.
		s_financiers[msg.sender] += amount;
		emit InvestedInProject(msg.sender, amount);

		// Check if the goal is reached.
		if (usdt.balanceOf(address(this)) >= i_goal) {
			s_status = ProjectStatus.FUNDED;
			emit ProjectFunded(address(this));
		}
	}

	/**
	 * Function used to understand how much capital the caller has invested.
	 * 
	 * @return The capital that the caller has invested into the project.
	 */
	function getMyCapitalInvested() public view returns(uint) {
		return s_financiers[msg.sender];
	}

	/**
	 * Function used to obtain the current capital invested into the project.
	 * 
	 * @return The capital invested into the project.
	 */
	function getUSDTBalance() public view returns(uint) {
		IERC20 usdt = IERC20(i_usdtTokenAddress);
		return usdt.balanceOf(address(this));
	}

	/**
	 * Function used to check if the project is expired.
	 * 
	 * @return True if the project is already expired, false otherwise.
	 */
	function isExpired() public view returns(bool) {
		return block.timestamp > i_expiration;
	}

	/**
	 * Function used to change the project's status.
	 * 
	 * @return True if the project is already expired, false otherwise.
	 */
	function changeStatus() public returns(bool) {
		bool state = block.timestamp > i_expiration;
		if (state) {
			s_status = ProjectStatus.EXPIRED;
		}
		return state;
	}	

	/* Getters Function */

	function getName() public view returns(string memory) {
		return i_name;
	}
	function getDescription() public view returns(string memory) {
		return i_description;
	}
	function getExpiration() public view returns(uint) {
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
