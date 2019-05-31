pragma solidity ^0.5.0;

import "./IUniswapExchange.sol";
import "./IUniswapFactory.sol";
import "./IDutchExchange.sol";
import "./IFrtToken.sol";
import "./ITokenMinimal.sol";
import "./SafeERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/// @title Uniswap Arbitrage - Executes arbitrage transactions between Uniswap and DutchX.
/// @author Billy Rennekamp - <billy@gnosis.pm>
contract Arbitrage is Ownable {

    uint constant max = uint(-1);

    IUniswapFactory public uniFactory;
    IDutchExchange public dutchXProxy;

    event Profit(uint profit, bool wasDutchOpportunity);

    /// @dev Payable fallback function has nothing inside so it won't run out of gas with gas limited transfers
    function() external payable {}

    /// @dev Only owner can deposit contract Ether into the DutchX as WETH
    function depositEther() public payable onlyOwner {

        require(address(this).balance > 0, "Balance must be greater than 0 to deposit");
        uint balance = address(this).balance;

        // // Deposit balance to WETH
        address weth = dutchXProxy.ethToken();
        ITokenMinimal(weth).deposit.value(balance)();

        uint wethBalance = ITokenMinimal(weth).balanceOf(address(this));
        uint allowance = ITokenMinimal(weth).allowance(address(this), address(dutchXProxy));

        if (allowance < wethBalance) {
            if (allowance != 0) {
                SafeERC20.safeApprove(weth, address(dutchXProxy), 0);
            }
            // Approve max amount of WETH to be transferred by dutchX
            // Keeping it max will have same or similar costs to making it exact over and over again
            SafeERC20.safeApprove(weth, address(dutchXProxy), max);
        }

        // Deposit new amount on dutchX, confirm there's at least the amount we just deposited
        uint newBalance = dutchXProxy.deposit(weth, balance);
        require(newBalance >= balance, "Deposit WETH to DutchX didn't work.");
    }

    /// @dev Only owner can withdraw WETH from DutchX, convert to Ether and transfer to owner
    /// @param amount The amount of Ether to withdraw
    function withdrawEtherThenTransfer(uint amount) external onlyOwner {
        _withdrawEther(amount);
        address(uint160(owner())).transfer(amount);
    }

    /// @dev Only owner can transfer any Ether currently in the contract to the owner address.
    /// @param amount The amount of Ether to withdraw
    function transferEther(uint amount) external onlyOwner {
        // If amount is zero, deposit the entire contract balance.
        address(uint160(owner())).transfer(amount == 0 ? address(this).balance : amount);
    }

    /// @dev Only owner function to withdraw WETH from the DutchX, convert it to Ether and keep it in contract
    /// @param amount The amount of WETH to withdraw and convert.
    function withdrawEther(uint amount) external onlyOwner {
        _withdrawEther(amount);
    }

    /// @dev Internal function to withdraw WETH from the DutchX, convert it to Ether and keep it in contract
    /// @param amount The amount of WETH to withdraw and convert.
    function _withdrawEther(uint amount) internal {
        address weth = dutchXProxy.ethToken();
        dutchXProxy.withdraw(weth, amount);
        ITokenMinimal(weth).withdraw(amount);
    }

    /// @dev Only owner can withdraw a token from the DutchX
    /// @param token The token address that is being withdrawn.
    /// @param amount The amount of token to withdraw. Can be larger than available balance and maximum will be withdrawn.
    /// @return Returns the amount actually withdrawn from the DutchX
    function withdrawToken(address token, uint amount) external onlyOwner returns (uint) {
        return dutchXProxy.withdraw(token, amount);
    }

    /// @dev Only owner can transfer tokens to the owner that belong to this contract
    /// @param token The token address that is being transferred.
    /// @param amount The amount of token to transfer.
    function transferToken(address token, uint amount) external onlyOwner {
        SafeERC20.safeTransfer(token, owner(), amount);
    }

    /// @dev Only owner can unlock MGN tokens
    function unlockFrt() external onlyOwner returns (uint totalAmountUnlocked, uint withdrawalTime) {
      IFrtToken frtToken = dutchXProxy.frtToken();
      return frtToken.unlockTokens();
    }

    /// @dev Only owner can lock MGN tokens
    /// @param amount  The amount of token to lock
    function lockFrt(uint amount) external onlyOwner returns (uint totalAmountLocked) {
      IFrtToken frtToken = dutchXProxy.frtToken();
      return frtToken.lockTokens(amount);
    }

    /// @dev Only owner can withdraw unlocked tokens
    function withdrawFrt() external onlyOwner {
      IFrtToken frtToken = dutchXProxy.frtToken();
      frtToken.withdrawUnlockedTokens();
    }

    /// @dev Only owner can approve tokens to be used by the DutchX
    /// @param token The token address to be approved for use
    /// @param spender The address that should be approved
    /// @param allowance The amount of tokens that should be approved
    function approveToken(address token, address spender, uint allowance) external onlyOwner {
        SafeERC20.safeApprove(token, spender, allowance);
    }

    /// @dev Only owner can deposit token to the DutchX
    /// @param token The token address that is being deposited.
    /// @param amount The amount of token to deposit.
    function depositToken(address token, uint amount) external onlyOwner {
        _depositToken(token, amount);
    }

    /// @dev Internal function to deposit token to the DutchX
    /// @param token The token address that is being deposited.
    /// @param amount The amount of token to deposit.
    function _depositToken(address token, uint amount) internal returns(uint deposited) {
        uint balance = ITokenMinimal(token).balanceOf(address(this));
        uint min = balance < amount ? balance : amount;
        require(min > 0, "Balance of token insufficient");

        uint allowance = ITokenMinimal(token).allowance(address(this), address(dutchXProxy));
        if (allowance < min) {
            if (allowance != 0) {
                SafeERC20.safeApprove(token, address(dutchXProxy), 0);
            }
            SafeERC20.safeApprove(token, address(dutchXProxy), max);
        }

        // Confirm that the balance of the token on the DutchX is at least how much was deposited
        uint newBalance = dutchXProxy.deposit(token, min);
        require(newBalance >= min, "deposit didn't work");
        return min;
    }

    /// @dev Executes a trade opportunity on dutchX. Assumes that there is a balance of WETH already on the dutchX
    /// @param arbToken Address of the token that should be arbitraged.
    /// @param amount Amount of Ether to use in arbitrage.
    /// @return Returns if transaction can be executed.
    function dutchOpportunity(address arbToken, uint256 amount) external onlyOwner {

        address etherToken = dutchXProxy.ethToken();

        // The order of parameters for getAuctionIndex don't matter
        uint256 dutchAuctionIndex = dutchXProxy.getAuctionIndex(arbToken, etherToken);

        // postBuyOrder(sellToken, buyToken, amount)
        // results in a decrease of the amount the user owns of the second token
        // which means the buyToken is what the buyer wants to get rid of.
        // "The buy token is what the buyer provides, the seller token is what the seller provides."
        dutchXProxy.postBuyOrder(arbToken, etherToken, dutchAuctionIndex, amount);

        (uint tokensBought, ) = dutchXProxy.claimBuyerFunds(arbToken, etherToken, address(this), dutchAuctionIndex);
        dutchXProxy.withdraw(arbToken, tokensBought);

        address uniswapExchange = uniFactory.getExchange(arbToken);

        uint allowance = ITokenMinimal(arbToken).allowance(address(this), address(uniswapExchange));
        if (allowance < tokensBought) {
            if (allowance != 0) {
                SafeERC20.safeApprove(arbToken, address(uniswapExchange), 0);
            }
            // Approve Uniswap to transfer arbToken on contract's behalf
            // Keeping it max will have same or similar costs to making it exact over and over again
            SafeERC20.safeApprove(arbToken, address(uniswapExchange), max);
        }

        // tokenToEthSwapInput(inputToken, minimumReturn, timeToLive)
        // minimumReturn is enough to make a profit (excluding gas)
        // timeToLive is now because transaction is atomic
        uint256 etherReturned = IUniswapExchange(uniswapExchange).tokenToEthSwapInput(tokensBought, 1, block.timestamp);

        // gas costs were excluded because worse case scenario the tx fails and gas costs were spent up to here anyway
        // best worst case scenario the profit from the trade alleviates part of the gas costs even if still no total profit
        require(etherReturned >= amount, "no profit");
        emit Profit(etherReturned, true);

        // Ether is deposited as WETH
        depositEther();
    }

    /// @dev Executes a trade opportunity on uniswap.
    /// @param arbToken Address of the token that should be arbitraged.
    /// @param amount Amount of Ether to use in arbitrage.
    /// @return Returns if transaction can be executed.
    function uniswapOpportunity(address arbToken, uint256 amount) external onlyOwner {

        // WETH must be converted to Eth for Uniswap trade
        // (Uniswap allows ERC20:ERC20 but most liquidity is on ETH:ERC20 markets)
        _withdrawEther(amount);
        require(address(this).balance >= amount, "buying from uniswap takes real Ether");

        // ethToTokenSwapInput(minTokens, deadline)
        // minTokens is 1 because it will revert without a profit regardless
        // deadline is now since trade is atomic
        // solium-disable-next-line security/no-block-members
        uint256 tokensBought = IUniswapExchange(uniFactory.getExchange(arbToken)).ethToTokenSwapInput.value(amount)(1, block.timestamp);

        // tokens need to be approved for the dutchX before they are deposited
        tokensBought = _depositToken(arbToken, tokensBought);

        address etherToken = dutchXProxy.ethToken();

        // The order of parameters for getAuctionIndex don't matter
        uint256 dutchAuctionIndex = dutchXProxy.getAuctionIndex(arbToken, etherToken);

        // spend max amount of tokens currently on the dutch x (might be combined from previous remainders)
        // max is automatically reduced to maximum available tokens because there may be
        // token remainders from previous auctions which closed after previous arbitrage opportunities
        dutchXProxy.postBuyOrder(etherToken, arbToken, dutchAuctionIndex, max);
        // solium-disable-next-line no-unused-vars
        (uint etherReturned, ) = dutchXProxy.claimBuyerFunds(etherToken, arbToken, address(this), dutchAuctionIndex);

        // gas costs were excluded because worse case scenario the tx fails and gas costs were spent up to here anyway
        // best worst case scenario the profit from the trade alleviates part of the gas costs even if still no total profit
        require(etherReturned >= amount, "no profit");
        emit Profit(etherReturned, false);
        // Ether returned is already in dutchX balance where Ether is assumed to be stored when not being used.
    }

}
