pragma solidity ^0.5.0;
import "./Arbitrage.sol";
/// @title Uniswap Arbitrage Module - Executes arbitrage transactions between Uniswap and DutchX.
/// @author Billy Rennekamp - <billy@gnosis.pm>
contract ArbitrageLocal is Arbitrage {
    /// @dev Constructor function sets initial storage of contract.
    /// @param _uniFactory The uniswap factory deployed address.
    /// @param _dutchXProxy The dutchX proxy deployed address.
    constructor(IUniswapFactory _uniFactory, IDutchExchange _dutchXProxy) public {
        uniFactory = _uniFactory;
        dutchXProxy = _dutchXProxy;
    }
}
