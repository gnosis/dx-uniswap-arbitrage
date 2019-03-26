pragma solidity ^0.5.0;

// NOTE:
//  This file porpouse is just to make sure truffle compiles all of depending
//  contracts when we are in development.
//
//  For other environments, we just use the compiled contracts from the NPM
//  package

import "./SafeERC20.sol";
import "./ArbitrageLocal.sol";
import "./IUniswapFactory.sol";
import "./IUniswapExchange.sol";

contract ArbitrageDependencies {}