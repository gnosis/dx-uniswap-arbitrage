
// File: openzeppelin-solidity/contracts/utils/Address.sol

pragma solidity ^0.5.0;

/**
 * Utility library of inline functions on addresses
 */
library Address {
    /**
     * Returns whether the target address is a contract
     * @dev This function will return false if invoked during the constructor of a contract,
     * as the code is not actually created until after the constructor finishes.
     * @param account address of the account to check
     * @return whether the target address is a contract
     */
    function isContract(address account) internal view returns (bool) {
        uint256 size;
        // XXX Currently there is no better way to check if there is a contract in an address
        // than to check the size of the code at that address.
        // See https://ethereum.stackexchange.com/a/14016/36603
        // for more details about how this works.
        // TODO Check this again before the Serenity release, because all addresses will be
        // contracts then.
        // solhint-disable-next-line no-inline-assembly
        assembly { size := extcodesize(account) }
        return size > 0;
    }
}

// File: openzeppelin-solidity/contracts/token/ERC20/IERC20.sol

pragma solidity ^0.5.0;

/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(address from, address to, uint256 value) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address who) external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);
}

// File: contracts/SafeERC20.sol

/*

SafeERC20 by daostack.
The code is based on a fix by SECBIT Team.

USE WITH CAUTION & NO WARRANTY

REFERENCE & RELATED READING
- https://github.com/ethereum/solidity/issues/4116
- https://medium.com/@chris_77367/explaining-unexpected-reverts-starting-with-solidity-0-4-22-3ada6e82308c
- https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca
- https://gist.github.com/BrendanChou/88a2eeb80947ff00bcf58ffdafeaeb61

*/
pragma solidity ^0.5.0;



library SafeERC20 {
    using Address for address;

    bytes4 constant private TRANSFER_SELECTOR = bytes4(keccak256(bytes("transfer(address,uint256)")));
    bytes4 constant private TRANSFERFROM_SELECTOR = bytes4(keccak256(bytes("transferFrom(address,address,uint256)")));
    bytes4 constant private APPROVE_SELECTOR = bytes4(keccak256(bytes("approve(address,uint256)")));

    function safeTransfer(address _erc20Addr, address _to, uint256 _value) internal {

        // Must be a contract addr first!
        require(_erc20Addr.isContract(), "ERC20 is not a contract");

        (bool success, bytes memory returnValue) =
        // solhint-disable-next-line avoid-low-level-calls
        _erc20Addr.call(abi.encodeWithSelector(TRANSFER_SELECTOR, _to, _value));
        // call return false when something wrong
        require(success, "safeTransfer must succeed");
        //check return value
        require(returnValue.length == 0 || (returnValue.length == 32 && (returnValue[31] != 0)), "safeTransfer must return nothing or true");
    }

    function safeTransferFrom(address _erc20Addr, address _from, address _to, uint256 _value) internal {

        // Must be a contract addr first!
        require(_erc20Addr.isContract(), "ERC20 is not a contract");

        (bool success, bytes memory returnValue) =
        // solhint-disable-next-line avoid-low-level-calls
        _erc20Addr.call(abi.encodeWithSelector(TRANSFERFROM_SELECTOR, _from, _to, _value));
        // call return false when something wrong
        require(success, "safeTransferFrom must succeed");
        //check return value
        require(returnValue.length == 0 || (returnValue.length == 32 && (returnValue[31] != 0)), "safeTransferFrom must return nothing or true");
    }

    function safeApprove(address _erc20Addr, address _spender, uint256 _value) internal {

        // Must be a contract addr first!
        require(_erc20Addr.isContract(), "ERC20 is not a contract");

        // vvv
        // This section has been commented out because it is not a necesarry safeguard
        // vvv
        /*        
        // safeApprove should only be called when setting an initial allowance,
        // or when resetting it to zero.
        require((_value == 0) || (IERC20(_erc20Addr).allowance(address(this), _spender) == 0), "safeApprove should only be called when setting an initial allowance, or when resetting it to zero.");
        */

        (bool success, bytes memory returnValue) =
        // solhint-disable-next-line avoid-low-level-calls
        _erc20Addr.call(abi.encodeWithSelector(APPROVE_SELECTOR, _spender, _value));
        // call return false when something wrong
        require(success, "safeApprove must succeed");
        //check return value
        require(returnValue.length == 0 || (returnValue.length == 32 && (returnValue[31] != 0)),  "safeApprove must return nothing or true");
    }
}
