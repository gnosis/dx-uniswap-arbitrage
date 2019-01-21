pragma solidity ^0.5.0;

contract ITokenMinimal {
    function allowance(address tokenOwner, address spender) public view returns (uint remaining);
    function balanceOf(address tokenOwner) public view returns (uint balance);
    function deposit() public payable;
    function withdraw(uint value) public;
}