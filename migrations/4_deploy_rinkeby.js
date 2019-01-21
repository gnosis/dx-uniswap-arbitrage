var ArbitrageRinkeby = artifacts.require('./ArbitrageRinkeby.sol')
var SafeERC20 = artifacts.require('./SafeERC20.sol')
let _ = '        '

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    try {
      if(network !== 'rinkeby-fork' && network !== 'rinkeby') {
        console.log(_ + 'Skip Migration: Not on rinkeby but on ' + network + ' instead')
        return
      }
 
      // Deploy SafeERC20 and link to ArbitrageRinkeby.sol
      await deployer.deploy(SafeERC20);
      await deployer.link(SafeERC20, ArbitrageRinkeby);

      // Deploy ArbitrageRinkeby.sol
      await deployer.deploy(ArbitrageRinkeby)
      let arbitrage = await ArbitrageRinkeby.deployed()
      console.log(_ + 'ArbitrageRinkeby deployed at: ' + arbitrage.address)

    } catch (error) {
      console.log(error)
    }
  })
}