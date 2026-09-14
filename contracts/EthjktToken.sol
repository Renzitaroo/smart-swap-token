// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ETHJKT Token (ETHJKT)
 * @author ETHJKT Community
 * @notice ERC-20 token pair implementation for RENZIE TRADE AMM DEX platform.
 * @dev Inherits OpenZeppelin ERC20 standard implementation.
 *      Initial supply of 1,000,000 ETHJKT is minted to deployer address upon deployment.
 *      Public mint() function is available for testnet faucet and liquidity testing.
 */
contract EthjktToken is ERC20 {
    /**
     * @notice Constructor initializing token name and symbol, and minting initial supply.
     */
    constructor() ERC20("Ethjkt Token", "ETHJKT") {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    /**
     * @notice Testnet Faucet Mint function.
     * @dev Allows anyone to mint tokens on Sepolia testnet for pool testing & swap experiments.
     * @param jumlah The amount of token units (in wei / 10**18) to mint to msg.sender.
     */
    function mint(uint256 jumlah) external {
        _mint(msg.sender, jumlah);
    }
}
