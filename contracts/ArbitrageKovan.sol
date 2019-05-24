pragma solidity ^0.5.0;
import "./Arbitrage.sol";
/// @title Uniswap Arbitrage Module - Executes arbitrage transactions between Uniswap and DutchX.
/// @author Billy Rennekamp - <billy@gnosis.pm>
contract ArbitrageKovan is Arbitrage {
    constructor() public {
        uniFactory = IUniswapFactory(0x2CF4E258f420ddFc0757321e7fE555E6150c2533);
        dutchXProxy = IDutchExchange(0x775ea749a82A87f12199019E5166980F305f4C8F);
    }
}