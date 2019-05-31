pragma solidity ^0.5.0;

interface IFrtToken {

  function unlockTokens() external returns (uint, uint);
  function lockTokens(uint) external returns (uint);
  function withdrawUnlockedTokens() external;

}
