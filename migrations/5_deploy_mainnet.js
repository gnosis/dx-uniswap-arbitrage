var ArbitrageMainnet = artifacts.require('./ArbitrageMainnet.sol')
var SafeERC20 = artifacts.require('./SafeERC20.sol')
let _ = '        '

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    try {
      if(network !== 'mainnet') {
        console.log(_ + 'Skip Migration: Not on mainnet but on ' + network + ' instead')
        return
      }

      // Deploy SafeERC20 and link to ArbitrageMainnet.sol
      await deployer.deploy(SafeERC20);
      await deployer.link(SafeERC20, ArbitrageMainnet);
 
      // Deploy ArbitrageMainnet.sol
      await deployer.deploy(ArbitrageMainnet)
      let arbitrage = await ArbitrageMainnet.deployed()
      console.log(_ + 'ArbitrageMainnet deployed at: ' + arbitrage.address)

    } catch (error) {
      console.log(error)
    }
  })
}