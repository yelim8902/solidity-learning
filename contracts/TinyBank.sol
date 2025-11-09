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


//Reward
// - reward token : MyToken
// - reward resources : 1 MT/block minting
// - reward strategy : staked[user]/totalStaked distribution ratio

// signer0 block 0 staking
// signer1 block 5 staking
// 0-- 1-- 2-- 3-- 4-- 5-- 
// |                   |
// signer0 10MT        signer1 10MT



//mytoken contract와 연동하기 위해 interface 생성
interface IMyToken {
    
    function transfer(address to, uint256 amount) external;
    function transferFrom(address from, address to, uint256 amount) external;
    function mint(uint256 amount, address owner) external;
    
}   


contract TinyBank {

    event Staked(address to, uint256 amount);
    event Withdrawal(address from, uint256 amount);

    // 예치할 토큰을 먼저 배포하고, 그 주소를 생성자에 전달하여 저장
    IMyToken public stakingToken;

    mapping(address => uint256) public lastClaimedBlock;
    uint256 rewardPerBlock = 1 * 10 ** 18; // 1 MT/block

    mapping(address => uint256) public staked;
    uint256 public totalStaked; // 총 예치된 토큰 양

    constructor(IMyToken _stakingToken) {
        //_stakingToken 주소를 받아서 stakingToken 변수에 저장
        stakingToken = _stakingToken;
    }

    // reward 분배 함수 : 블록 넘버 차이만큼 보상 분배 
    // Who, When, How much?
    // genesis staking -> reward 분배 X
    function updateReward(address to) internal {
        if (staked[to] > 0) {
            uint256 blocks = block.number - lastClaimedBlock[to];
            uint256 reward = (blocks * rewardPerBlock * staked[to]) / totalStaked;
            stakingToken.mint(reward, to);
            }
            lastClaimedBlock[to] = block.number;
    }

    function stake(uint256 _amount) external {
        //IMyToken.transfer(msg.sender, address(this), _amount); 이건 TinyBank contract에서 mytoken을 예치하는 것이라서 안 됨
        require(_amount >= 0, "cannot stake 0 amount");
        updateReward(msg.sender);
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        staked[msg.sender] += _amount;
        totalStaked += _amount;
        emit Staked(msg.sender, _amount);
    }
    function withdraw(uint256 _amount) external {
        require(staked[msg.sender] >= _amount, "insufficient staked amount");
        updateReward(msg.sender);
        stakingToken.transfer(msg.sender, _amount);
        staked[msg.sender] -= _amount;
        totalStaked -= _amount;
        emit Withdrawal(msg.sender, _amount);
    }


}
