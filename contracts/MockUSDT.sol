// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title A Mock Contract used to interact with the ERC20 Interface.
 * @author Tomas Prifti
 * @notice This Smart Contract is used to simulate a real USDT Contract.
 */
contract MockUSDT is ERC20 {
	
	/**
	 * Constructor.
	 */	
	constructor() ERC20("Tether USD", "USDT") {
		_mint(msg.sender, 1_000 * 10 ** decimals()); // 6 decimals.
	}
}
