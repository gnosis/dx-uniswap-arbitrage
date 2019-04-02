pragma solidity ^0.5.0;
import "@gnosis.pm/util-contracts/contracts/EtherToken.sol";
contract IToken is EtherToken {
    string public constant symbol = "UNI";
    string public constant name = "UNI Token";
}
