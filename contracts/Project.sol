// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

error Project__NotEnoughCapitalInvested();
error Project__InsufficientAmount();

error Project__IsOwner();
error Project__NotOwner();

error Project__TransactionNotExist();
error Project__TransactionNotPending();
error Project__TransactionAlreadyExecuted();
error Project__TransactionAlreadyConfirmed();
error Project__TransactionNotEnoughConfirmations();
error Project__TransactionNotEnoughCapital();

/**
 * @title A project for decentralized crowdfunding
 * @author Tomas Prifti
 * @notice This Smart Contract is used to describe a new project for a crowdfunding decentralized platform.
 */
contract Project {
	// Defining a ENUM to manage the project's status.
	enum TransactionStatus {
		PENDING,
		EXECUTED,
		REVOKED
	}

	// Defining the structure of the Transaction.
	struct Transaction {
		address to;
		uint value;
		bool executed;
		uint numConfirmations;
		TransactionStatus status;
	}

	// Immutable variables.
	string private i_name;
	string private i_description;
	uint private immutable i_minCapital;
	address private immutable i_owner;
	address private immutable i_usdtTokenAddress;

	// Storage variables.
	uint private s_capitalLocked;
	mapping(TransactionStatus => string) s_statusLabel;

	address[] private s_financiersAddresses;
	mapping(address => bool) private s_financiersExist;
	mapping(address => uint) private s_financiersCapitalInvested;

	Transaction[] private s_transactions;
	mapping(uint256 => mapping(address => bool)) private s_isConfirmed;

	/* Events */

	// Event used to notify that the user has invested successfully into the project.
	event InvestedInProject(address indexed financier, uint indexed capital);
	// Event used to notify that the owner has created successfully a new transaction.
	event TransactionCreated(
		address owner,
		address indexed contractAddress,
		uint indexed txIndex,
		address indexed target,
		uint amount
	);
	// Event used to notify that the transaction has been signed successfully.
	event TransactionSigned(
		address owner,
		address indexed contractAddress,
		uint indexed txIndex
	);
	// Event used to notify that the transaction has been executed successfully.
	event TransactionExecuted(
		address owner,
		address indexed contractAddress,
		uint indexed txIndex,
		address indexed target,
		uint amount
	);
	// Event used to notify that the transaction has been revoked successfully.
	event TransactionRevoked(
		address owner,
		address indexed contractAddress,
		uint indexed txIndex
	);

	/* Modifiers */

	modifier onlyOwner() {
		if (i_owner != msg.sender) {
			revert Project__NotOwner();
		}
		_;
	}

	/**
	 * Constructor.
	 *
	 * @param name Project's name.
	 * @param description Project's description.
	 * @param minCapital The minimum capital requested to finance the project.
	 * @param owner The address of the owner.
	 * @param usdtToken The address of the USDT Token Contract.
	 */
	constructor(
		string memory name,
		string memory description,
		uint minCapital,
		address owner,
		address usdtToken
	) {
		i_name = name;
		i_description = description;
		i_minCapital = minCapital;
		i_owner = owner;
		i_usdtTokenAddress = usdtToken;

		s_capitalLocked = 0;
	}

	/**
	 * Function used to fund the project.
	 *
	 * @param amount The amount of USDT sent by the caller.
	 */
	function fundProject(uint amount) public {
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
		SafeERC20.safeTransferFrom(usdt, msg.sender, address(this), amount);

		// Saving the amount invested and save the financier.
		s_financiersCapitalInvested[msg.sender] += amount;
		if (!s_financiersExist[msg.sender]) {
			s_financiersExist[msg.sender] = true;
			s_financiersAddresses.push(msg.sender);
		}

		emit InvestedInProject(msg.sender, amount);
	}

	/**
	 * Function used to create a new transaction only by the owner.
	 *
	 * @param target The target address where to send the funds.
	 * @param amount The desired amount to send.
	 */
	function createTransaction(address target, uint amount) public onlyOwner {
		if (amount <= 0) {
			revert Project__InsufficientAmount();
		}

		IERC20 usdt = IERC20(i_usdtTokenAddress);

		if (usdt.balanceOf(address(this)) - s_capitalLocked < amount) {
			revert Project__TransactionNotEnoughCapital();
		}

		uint256 txIndex = s_transactions.length;

		s_transactions.push(
			Transaction({
				to: target,
				value: amount,
				executed: false,
				numConfirmations: 0,
				status: TransactionStatus.PENDING
			})
		);

		s_capitalLocked += amount;

		emit TransactionCreated(
			i_owner,
			address(this),
			txIndex,
			target,
			amount
		);
	}

	/**
	 * Function used to sign a specific transaction already created by the owner.
	 *
	 * @param txIndex The index of the transaction to sign.
	 */
	function signTransaction(uint256 txIndex) public {
		if (i_owner == msg.sender) {
			revert Project__IsOwner();
		}
		if (txIndex >= s_transactions.length) {
			revert Project__TransactionNotExist();
		}

		Transaction storage transaction = s_transactions[txIndex];

		if (transaction.executed) {
			revert Project__TransactionAlreadyExecuted();
		}
		if (s_isConfirmed[txIndex][msg.sender]) {
			revert Project__TransactionAlreadyConfirmed();
		}
		if (transaction.status != TransactionStatus.PENDING) {
			revert Project__TransactionNotPending();
		}

		transaction.numConfirmations += 1;
		s_isConfirmed[txIndex][msg.sender] = true;

		emit TransactionSigned(i_owner, address(this), txIndex);
	}

	/**
	 * Function used to execute a specific transaction already confirmed by the financiers.
	 *
	 * @param txIndex The index of the transaction to execute.
	 */
	function executeTransaction(uint256 txIndex) public onlyOwner {
		if (txIndex >= s_transactions.length) {
			revert Project__TransactionNotExist();
		}

		Transaction storage transaction = s_transactions[txIndex];

		if (transaction.executed) {
			revert Project__TransactionAlreadyExecuted();
		}
		if (transaction.status != TransactionStatus.PENDING) {
			revert Project__TransactionNotPending();
		}

		// Exclude the owner from the counter if exist.
		uint requiredConfirmations = s_financiersAddresses.length;
		if (s_financiersExist[i_owner]) {
			requiredConfirmations -= 1;
		}

		if (transaction.numConfirmations < requiredConfirmations) {
			revert Project__TransactionNotEnoughConfirmations();
		}

		IERC20 usdt = IERC20(i_usdtTokenAddress);

		if (usdt.balanceOf(address(this)) < transaction.value) {
			revert Project__TransactionNotEnoughCapital();
		}

		// Transfer from the Contract to the TargetWallet.
		usdt.transfer(transaction.to, transaction.value);

		s_capitalLocked -= transaction.value;
		transaction.executed = true;
		transaction.status = TransactionStatus.EXECUTED;

		emit TransactionExecuted(
			i_owner,
			address(this),
			txIndex,
			transaction.to,
			transaction.value
		);
	}

	/**
	 * Function used to revoke a specific transaction already created by the owner.
	 *
	 * @param txIndex The index of the transaction to retrieve.
	 */
	function revokeTransaction(uint256 txIndex) public onlyOwner {
		if (txIndex >= s_transactions.length) {
			revert Project__TransactionNotExist();
		}

		Transaction storage transaction = s_transactions[txIndex];

		if (transaction.status != TransactionStatus.PENDING) {
			revert Project__TransactionNotPending();
		}

		transaction.status = TransactionStatus.REVOKED;
		s_capitalLocked -= transaction.value;

		emit TransactionRevoked(i_owner, address(this), txIndex);
	}

	/**
	 * Function used to understand how much capital the caller has invested.
	 *
	 * @return The capital that the caller has invested into the project.
	 */
	function getMyCapitalInvested() public view returns (uint) {
		return s_financiersCapitalInvested[msg.sender];
	}

	/**
	 * Function used to obtain the current capital invested into the project.
	 *
	 * @return The capital invested into the project.
	 */
	function getUSDTBalance() public view returns (uint) {
		IERC20 usdt = IERC20(i_usdtTokenAddress);
		return usdt.balanceOf(address(this));
	}

	/**
	 * Function used to obtain the number of the transactions created.
	 *
	 * @return The number of the transactions created.
	 */
	function getTransactionCount() public view returns (uint256) {
		return s_transactions.length;
	}

	/**
	 * Function used to obtain a specific transaction given its index.
	 *
	 * @param txIndex The index of the transaction to retrieve.
	 *
	 * @return The transaction requested.
	 */
	function getTransaction(
		uint256 txIndex
	) public view returns (Transaction memory) {
		if (txIndex >= s_transactions.length) {
			revert Project__TransactionNotExist();
		}
		return s_transactions[txIndex];
	}

	/**
	 * Function used to obtain a label given the status of a transaction.
	 *
	 * @param status The status of the transaction.
	 *
	 * @return The label corresponding to the status.
	 */
	function TransactionStatusLabel(
		TransactionStatus status
	) public pure returns (string memory) {
		string memory output = "Error";

		if (status == TransactionStatus.PENDING) {
			output = "Pending";
		}
		if (status == TransactionStatus.EXECUTED) {
			output = "Executed";
		}
		if (status == TransactionStatus.REVOKED) {
			output = "Revoked";
		}

		return output;
	}

	/**
	 * Function used to check if the caller has signed a specific transaction given its index.
	 *
	 * @param txIndex The index of the transaction to check.
	 *
	 * @return True if the caller has signed the transaction, false otherwise.
	 */
	function isTransactionSignedByMe(
		uint256 txIndex
	) public view returns (bool) {
		return s_isConfirmed[txIndex][msg.sender];
	}

	/* Getters Function */

	function getName() public view returns (string memory) {
		return i_name;
	}

	function getDescription() public view returns (string memory) {
		return i_description;
	}

	function getMinCapital() public view returns (uint) {
		return i_minCapital;
	}

	function getOwner() public view returns (address) {
		return i_owner;
	}

	function getUSDTTokenAddress() public view returns (address) {
		return i_usdtTokenAddress;
	}

	function getCapitalLocked() public view returns (uint) {
		return s_capitalLocked;
	}

	function getFinanciers() public view returns (address[] memory) {
		return s_financiersAddresses;
	}
}
