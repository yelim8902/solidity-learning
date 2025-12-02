# @version ^0.3.0

# Token: smart contract based
# BIT, ETH, XRP, KAIA: native token

# @version ^0.3.0

# Token: smart contract based
# BIT, ETH, XRP, KAIA: native token

event Transfer:
    _from: indexed(address)
    _to: indexed(address)
    _value: uint256

event Approval:
    _owner: indexed(address)
    _spender: indexed(address)
    _value: uint256

name: public(String[64])
symbol: public(String[32])
decimals: public(uint8)
totalSupply: public(uint256)
balanceOf: public(HashMap[address, uint256])
allowance: public(HashMap[address, HashMap[address, uint256]])

owner: public(address)
manager: public(address)

@external
def __init__(_name: String[64], _symbol: String[32], _decimal: uint8, _amount: uint256):
    self.name = _name
    self.symbol = _symbol
    self.decimals = _decimal
    self.owner = msg.sender
    self.manager = msg.sender
    
    # Mint initial supply
    amount: uint256 = _amount * 10 ** convert(_decimal, uint256)
    self.totalSupply = amount
    self.balanceOf[msg.sender] = amount
    log Transfer(empty(address), msg.sender, amount)

@internal
def _mint(_amount: uint256, _to: address):
    self.totalSupply += _amount
    self.balanceOf[_to] += _amount
    log Transfer(empty(address), _to, _amount)

@external
def transfer(_to: address, _amount: uint256) -> bool:
    assert self.balanceOf[msg.sender] >= _amount, "insufficient balance"
    self.balanceOf[msg.sender] -= _amount
    self.balanceOf[_to] += _amount
    log Transfer(msg.sender, _to, _amount)
    return True

@external
def approve(_spender: address, _amount: uint256) -> bool:
    self.allowance[msg.sender][_spender] = _amount
    log Approval(msg.sender, _spender, _amount)
    return True

@external
def transferFrom(_from: address, _to: address, _amount: uint256) -> bool:
    assert self.allowance[_from][msg.sender] >= _amount, "insufficient allowance"
    self.allowance[_from][msg.sender] -= _amount
    self.balanceOf[_from] -= _amount
    self.balanceOf[_to] += _amount
    log Transfer(_from, _to, _amount)
    return True

@external
def mint(_amount: uint256, _to: address):
    assert msg.sender == self.manager, "You are not authorized to mint"
    self._mint(_amount, _to)

@external
def setManager(_manager: address):
    assert msg.sender == self.owner, "You are not authorized"
    self.manager = _manager

