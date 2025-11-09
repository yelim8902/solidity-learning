// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// staking 
// deposit(MyToken), withdraw(MyToken)
// 마이토큰을 예치하고 출금할 수 있는 서비스를 만들 것임

// 두가지 컨트렉트 만듦

// MyToken : token contract (mint, transfer, approve)
// -> token balance 관리
// -> the balance of TinyBank contract

// TinyBank : bank contract (deposit, withdraw) = vault
// -> users token management
// 1) user가 마이토큰을 예치 -> mytoken의 transfer 함수 호출(user -> TinyBank로 mytoken 전송)


//mytoken contract와 연동하기 위해 interface 생성
interface IMyToken {
    
    function transfer(address to, uint256 amount) external;
    function transferFrom(address from, address to, uint256 amount) external;
    
}


contract TinyBank {
    // 예치할 토큰을 먼저 배포하고, 그 주소를 생성자에 전달하여 저장
    IMyToken public stakingToken;

    constructor(IMyToken _stakingToken) {
        //_stakingToken 주소를 받아서 stakingToken 변수에 저장
        stakingToken = _stakingToken;
    }

    
}
