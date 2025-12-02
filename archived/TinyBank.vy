# @version ^0.3.0

# staking
# deposit(MyToken), withdraw(MyToken)

# Reward
# - reward token: MyToken
# - reward resources: 1 MT/block minting
# - reward strategy: staked[user]/totalStaked distribution ratio

# @version ^0.3.0

# staking
# deposit(MyToken), withdraw(MyToken)

# Reward
# - reward token: MyToken
# - reward resources: 1 MT/block minting
# - reward strategy: staked[user]/totalStaked distribution ratio

event Staked:
    _to: indexed(address)
    _amount: uint256

event Withdrawal:
    _from: indexed(address)
    _amount: uint256

# MyToken interface
interface IMyToken:
    def transfer(_to: address, _amount: uint256) -> bool: nonpayable
    def transferFrom(_from: address, _to: address, _amount: uint256) -> bool: nonpayable
    def mint(_amount: uint256, _owner: address): nonpayable

stakingToken: public(IMyToken)
lastClaimedBlock: public(HashMap[address, uint256])
defaultRewardPerBlock: constant(uint256) = 1000000000000000000  # 1 MT/block
rewardPerBlock: public(uint256)
managers: public(address[100])
managerCount: public(uint256)
isManager: public(HashMap[address, bool])
confirmations: HashMap[address, bool]

staked: public(HashMap[address, uint256])
totalStaked: public(uint256)

owner: public(address)
manager: public(address)

@external
def __init__(_stakingToken: address, _managers: address[100]):
    self.stakingToken = IMyToken(_stakingToken)
    self.rewardPerBlock = defaultRewardPerBlock
    self.owner = msg.sender
    self.manager = msg.sender
    
    count: uint256 = 0
    for i in range(100):
        if _managers[i] != empty(address):
            count += 1
    
    assert count >= 3, "Need at least three managers"
    self.managerCount = count
    
    idx: uint256 = 0
    for i in range(100):
        managerAddress: address = _managers[i]
        if managerAddress != empty(address):
            assert not self.isManager[managerAddress], "Manager already added"
            self.managers[idx] = managerAddress
            self.isManager[managerAddress] = True
            idx += 1

@internal
def _updateReward(_to: address):
    # Only update reward if user has staked tokens
    if self.staked[_to] > 0:
        # Get the last claimed block, or use current block if never claimed (genesis staking)
        lastBlock: uint256 = self.lastClaimedBlock[_to]
        if lastBlock == 0:
            # Genesis staking - no reward distribution
            lastBlock = block.number
        
        blocks: uint256 = block.number - lastBlock
        if blocks > 0 and self.totalStaked > 0:
            reward: uint256 = (blocks * self.rewardPerBlock * self.staked[_to]) / self.totalStaked
            if reward > 0:
                self.stakingToken.mint(reward, _to)
    
    # Update last claimed block to current block
    self.lastClaimedBlock[_to] = block.number

@internal
def _allConfirmed() -> bool:
    for i in range(100):
        if i >= self.managerCount:
            break
        if not self.confirmations[self.managers[i]]:
            return False
    return True

@internal
def _resetConfirmations():
    for i in range(100):
        if i >= self.managerCount:
            break
        self.confirmations[self.managers[i]] = False

@external
def confirm():
    assert self.isManager[msg.sender], "You are not a manager"
    self.confirmations[msg.sender] = True

@external
@view
def hasConfirmed(_manager: address) -> bool:
    return self.confirmations[_manager]

@external
def setRewardPerBlock(_amount: uint256):
    assert self.isManager[msg.sender], "You are not a manager"
    assert self._allConfirmed(), "Not all confirmed yet"
    self.rewardPerBlock = _amount
    self._resetConfirmations()

@external
def stake(_amount: uint256):
    # Update reward before staking (uses current staked amount)
    # This handles reward calculation for existing stakes
    self._updateReward(msg.sender)
    assert _amount > 0, "cannot stake 0 amount"
    
    # Transfer tokens from user to contract
    self.stakingToken.transferFrom(msg.sender, self, _amount)
    
    # Update staking state
    self.staked[msg.sender] += _amount
    self.totalStaked += _amount
    
    # Set lastClaimedBlock if this is first stake (genesis staking)
    # Genesis staking should not receive reward for blocks before staking
    if self.lastClaimedBlock[msg.sender] == 0:
        self.lastClaimedBlock[msg.sender] = block.number
    
    log Staked(msg.sender, _amount)

@external
def withdraw(_amount: uint256):
    # Update reward before withdrawal (uses current staked amount)
    self._updateReward(msg.sender)
    assert self.staked[msg.sender] >= _amount, "insufficient staked amount"
    
    # Transfer tokens from contract to user
    self.stakingToken.transfer(msg.sender, _amount)
    
    # Update staking state
    self.staked[msg.sender] -= _amount
    self.totalStaked -= _amount
    
    log Withdrawal(msg.sender, _amount)

