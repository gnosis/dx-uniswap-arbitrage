const SafeERC20 = artifacts.require('./SafeERC20.sol')
const _ = '        '

module.exports = (deployer, network) => {
  deployer.then(async () => {
    const contractName = getContractName(network)
    if (contractName) {
      const ArbitrageContract = artifacts.require(contractName)
      // Deploy SafeERC20 and link to ArbitrageRinkeby.sol
      await deployer.deploy(SafeERC20);
      await deployer.link(SafeERC20, ArbitrageContract);

      // Deploy ArbitrageRinkeby.sol
      await deployer.deploy(ArbitrageContract)
      const arbitrage = await ArbitrageContract.deployed()

      console.log(_ + 'ArbitrageContract deployed at: ' + arbitrage.address)
    }
  })
}

function getContractName(network) {
  if (network === 'development-fork' || network === 'development') {
    console.log(_ + 'Skip Migration: Local deployment is already done in 2nd migration')
    return null
  } else if (network === 'rinkeby-fork' || network === 'rinkeby') {
    return 'ArbitrageRinkeby'
  } else if (network === 'kovan-fork' || network === 'kovan') {
    return 'ArbitrageKovan'
  } else if (network === 'mainnet-fork' || network === 'mainnet') {
    return 'ArbitrageMainnet'
  } else {
    throw new Error('Unknown network: ' + network)
  }
}