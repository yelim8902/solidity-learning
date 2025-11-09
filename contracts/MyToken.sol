// Token : smart conntact based
// BIT, ETH, XRP, KAIA : native token -> 해당 네트워크에서 수수료는 해당 토큰으로만 가능

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MyToken {
    event Transfer(address indexed from, address indexed to, uint256 value); // indexed는 topic으로 빠르게 조회 가능
    event Approval(address indexed spender, uint256 value);

    address public owner;
    address public manager;
    string public name;
    string public symbol;
    uint8 public decimals; 
    // uint8 -> 8bit unsigned int, unit16, ... , unit256
    // 1 ETH = 10^18 wei, 1 wei = 10^-18 ETH

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf; // 조회 함수라 읽어오기만 함. 트랜젝션 X
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol, uint8 _decimal, uint256 _amount){ // 문자열 앞에 memory 붙이는 이유 : 문자열은 메모리에 저장되어야 하기 때문
        owner = msg.sender;
        name = _name;
        symbol = _symbol;
        decimals = _decimal;
        _mint(_amount*10**uint256(decimals), msg.sender); // 1 MT 에서 추가발행 안 됨
    }

    // 내부에서만 호출할땐 _ 붙임
    function _mint(uint256 amount, address to) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
        
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external { // 상태변경 함수라 트랜젝션 필요
        require(balanceOf[msg.sender] >= amount, "insufficient balance"); // 잔액 부족 예외 처리
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;

        emit Transfer(msg.sender, to, amount);
    }

    /*
    token owner -> bank contract
    token owner -> router contract -> bank contract
    token owner -> router contract -> bank contract(multi contract)
    */
    modifier onlyOwner() {
        require(msg.sender == owner, "You are not authorized to mint");
        _;
    }
    modifier onlyManager() {
        require(msg.sender == manager, "You are not manager of this token");
        _;
    }

    //approve 는 권한 부여 함수 
    function approve(address spender, uint256 amount) external {
        allowance[msg.sender][spender] = amount;
        emit Approval(spender, amount);
    }
   
    //transferFrom 는 권한 사용 함수 
    function transferFrom(address from, address to, uint256 amount) external {
       address spender = msg.sender;
        require(allowance[from][spender] >= amount, "insufficient allowance"); // 권한 없으면 예외 처리
       allowance[from][spender] -= amount;
       balanceOf[from] -= amount;
       balanceOf[to] += amount;
       emit Transfer(from, to, amount);
    }

    function mint(uint256 amount, address to) external onlyManager {
        _mint(amount, to);
    } 

    function setManager(address _manager) external onlyOwner {
        manager = _manager;
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
