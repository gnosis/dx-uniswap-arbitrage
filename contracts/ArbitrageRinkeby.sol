pragma solidity ^0.5.0;
import "./Arbitrage.sol";
/// @title Uniswap Arbitrage Module - Executes arbitrage transactions between Uniswap and DutchX.
/// @author Billy Rennekamp - <billy@gnosis.pm>
contract ArbitrageRinkeby is Arbitrage {
    constructor() public {
        uniFactory = IUniswapFactory(0xf5D915570BC477f9B8D6C0E980aA81757A3AaC36); 
        dutchXProxy = IDutchExchange(0xaAEb2035FF394fdB2C879190f95e7676f1A9444B);
    }
}