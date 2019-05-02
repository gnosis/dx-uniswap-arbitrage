pragma solidity ^0.5.0;
import "./Arbitrage.sol";
/// @title Uniswap Arbitrage Module - Executes arbitrage transactions between Uniswap and DutchX.
/// @author Billy Rennekamp - <billy@gnosis.pm>
contract ArbitrageMainnet is Arbitrage {
    constructor() public {
        uniFactory = IUniswapFactory(0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95);
        dutchXProxy = IDutchExchange(0xb9812E2fA995EC53B5b6DF34d21f9304762C5497);
    }
}