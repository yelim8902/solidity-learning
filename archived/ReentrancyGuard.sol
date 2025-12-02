// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ReentrancyGuard {
    bool private locked;

    modifier nonReentrant() {
        require(!locked, "ReentrancyGuard: reentrant call");
        locked = true;
        _;
        locked = false;
    }
}

