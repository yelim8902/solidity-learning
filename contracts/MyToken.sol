// Token : smart conntact based
// BIT, ETH, XRP, KAIA : native token -> 해당 네트워크에서 수수료는 해당 토큰으로만 가능

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MyToken {
    string public name;
    string public symbol;
    uint8 public decimals; // uint8 -> 8bit unsigned int, unit16, ... , unit256
    // 1 ETH = 10^18 wei, 1 wei = 10^-18 ETH

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf; // 조회 함수라 읽어오기만 함. 트랜젝션 X


    constructor(string memory _name, string memory _symbol, uint8 _decimal){ // 문자열 앞에 memory 붙이는 이유 : 문자열은 메모리에 저장되어야 하기 때문
        name = _name;
        symbol = _symbol;
        decimals = _decimal;
        _mint(1*10**uint256(decimals), msg.sender); // 1 MT 에서 추가발행 안 됨
    }

    // 내부에서만 호출할땐 _ 붙임
    function _mint(uint256 amount, address owner) internal {
        totalSupply += amount;
        balanceOf[owner] += amount;
        
    }

    function transfer(address to, uint256 amount) external { // 상태변경 함수라 트랜젝션 필요
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
    }






    // function totalSupply() external view returns (uint256) { //외부에서만 호출, 필드를 보기만 할거임
    //     return totalSupply;
    // }

    // function balanceOf(address _owner) external view returns (uint256) {
    //     return balanceOf[_owner];
    // }

    // function name() external view returns (string memory) {
    //     return name;
    // }

    // function symbol() external view returns (string memory) {
    //     return symbol;
    // }

    // function decimals() external view returns (uint8) {
    //     return decimals;
    // }
}
