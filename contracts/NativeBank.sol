// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ReentrancyGuard.sol";

contract NativeBank is ReentrancyGuard {
    mapping(address => uint256) public balanceOf;

    function withdraw() external nonReentrant {
        uint256 balance = balanceOf[msg.sender];
        require(balance > 0, "insufficient balance");

        balanceOf[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "failed to send native token");
    }

    receive() external payable {
        balanceOf[msg.sender] += msg.value;
    }
}