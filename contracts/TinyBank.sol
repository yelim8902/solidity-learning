// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ManagedAccess.sol";

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


contract TinyBank is ManagedAccess {

    event Staked(address to, uint256 amount);
    event Withdrawal(address from, uint256 amount);

    // 예치할 토큰을 먼저 배포하고, 그 주소를 생성자에 전달하여 저장
    IMyToken public stakingToken;

    mapping(address => uint256) public lastClaimedBlock;
    uint256 defaultRewardPerBlock = 1 * 10 ** 18; // 1 MT/block
    uint256 public rewardPerBlock;
    address[] public managers;
    mapping(address => bool) public isManager;
    mapping(address => bool) private confirmations;

    mapping(address => uint256) public staked;
    uint256 public totalStaked; // 총 예치된 토큰 양
    constructor(IMyToken _stakingToken, address[] memory _managers) ManagedAccess(msg.sender, msg.sender) {
        //_stakingToken 주소를 받아서 stakingToken 변수에 저장
        stakingToken = _stakingToken;
        rewardPerBlock = defaultRewardPerBlock;
        require(_managers.length >= 3, "Need at least three managers");
        for (uint256 i = 0; i < _managers.length; i++) {
            address managerAddress = _managers[i];
            require(managerAddress != address(0), "Manager cannot be zero address");
            require(!isManager[managerAddress], "Manager already added");
            managers.push(managerAddress);
            isManager[managerAddress] = true;
        }
    }

    // reward 분배 함수 : 블록 넘버 차이만큼 보상 분배 
    // Who, When, How much?
    // genesis staking -> reward 분배 X
    modifier updateReward(address to) {
        if (staked[to] > 0) {
            uint256 blocks = block.number - lastClaimedBlock[to];
            uint256 reward = (blocks * rewardPerBlock * staked[to]) / totalStaked;
            stakingToken.mint(reward, to);
        }
        lastClaimedBlock[to] = block.number;
        _; // caller's code will be executed after this line
    }

    modifier onlyAllConfirmed() {
        require(isManager[msg.sender], "You are not a manager");
        require(_allConfirmed(), "Not all confirmed yet");
        _;
        _resetConfirmations();
    }

    modifier onlyRegisteredManager() {
        require(isManager[msg.sender], "You are not a manager");
        _;
    }

    function confirm() external onlyRegisteredManager {
        confirmations[msg.sender] = true;
    }

    function hasConfirmed(address manager) external view returns (bool) {
        return confirmations[manager];
    }

    function setRewardPerBlock(uint256 _amount) external onlyAllConfirmed {
        rewardPerBlock = _amount;
    }

    function stake(uint256 _amount) external updateReward(msg.sender) {
        //IMyToken.transfer(msg.sender, address(this), _amount); 이건 TinyBank contract에서 mytoken을 예치하는 것이라서 안 됨
        require(_amount >= 0, "cannot stake 0 amount");
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        staked[msg.sender] += _amount;
        totalStaked += _amount;
        emit Staked(msg.sender, _amount);
    }
    function withdraw(uint256 _amount) external updateReward(msg.sender) {
        require(staked[msg.sender] >= _amount, "insufficient staked amount");
        stakingToken.transfer(msg.sender, _amount);
        staked[msg.sender] -= _amount;
        totalStaked -= _amount;
        emit Withdrawal(msg.sender, _amount);
    }

    function _allConfirmed() private view returns (bool) {
        for (uint256 i = 0; i < managers.length; i++) {
            if (!confirmations[managers[i]]) {
                return false;
            }
        }
        return true;
    }

    function _resetConfirmations() private {
        for (uint256 i = 0; i < managers.length; i++) {
            confirmations[managers[i]] = false;
        }
    }


}
