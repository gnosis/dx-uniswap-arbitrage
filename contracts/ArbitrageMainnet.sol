pragma solidity ^0.5.0;
import "./Arbitrage.sol";
/// @title Uniswap Arbitrage Module - Executes arbitrage transactions between Uniswap and DutchX.
/// @author Billy Rennekamp - <billy@gnosis.pm>
contract ArbitrageMainnet is Arbitrage {
    constructor() public {
        uniFactory = IUniswapFactory(0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95); 
        dutchXProxy = IDutchExchange(0xaf1745c0f8117384Dfa5FFf40f824057c70F2ed3);
    }
}