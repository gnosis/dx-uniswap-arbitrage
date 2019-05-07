const fs = require('fs')
const SafeERC20 = artifacts.require('./SafeERC20.sol')
const ArbitrageLocal = artifacts.require('./ArbitrageLocal.sol')
const IUniswapFactory = artifacts.require('./IUniswapFactory.sol')
const _ = '        '
const DutchExchangeProxy = '0xa4392264a2d8c998901d10c154c91725b1bf0158'

const uniswapBytecode = require('../scripts/uniswap-bytecode.js')
const uniswapExchangeCode = uniswapBytecode.exchange
const uniswapFactoryCode = uniswapBytecode.factory

module.exports = (deployer, network, accounts) => {
  return deployer.then(async () => {
    try {
      if(network !== 'development') {
        console.log(_ + 'Skip Migration: Not on local but on ' + network + ' instead')
        return
      }

      let tx = await web3.eth.sendTransaction({from: accounts[0], data: uniswapExchangeCode})
      let txReceipt = await web3.eth.getTransactionReceipt(tx.transactionHash);
      let uniswapTemplateAddress = txReceipt.contractAddress

      tx = await web3.eth.sendTransaction({from: accounts[0], data: uniswapFactoryCode})
      txReceipt = await web3.eth.getTransactionReceipt(tx.transactionHash);
      let uniswapFactoryAddress = txReceipt.contractAddress

      console.log(_ + 'uniswapFactoryAddress deployed at: ' + uniswapFactoryAddress)

      let uniArtifact = JSON.parse(fs.readFileSync('build/contracts/IUniswapFactory.json', 'utf8'))
      uniArtifact.networks[deployer.network_id] = {
        "events": {},
        "links": {},
        "address": uniswapFactoryAddress,
        "transactionHash": tx.transactionHash
      }
      fs.writeFileSync('build/contracts/IUniswapFactory.json', JSON.stringify(uniArtifact));



      const uniswapFactory = await IUniswapFactory.at(uniswapFactoryAddress)
      await uniswapFactory.initializeFactory(uniswapTemplateAddress)

      const params = [uniswapFactory.address, DutchExchangeProxy]

      // Deploy SafeERC20 and link to ArbitrageLocal.sol
      await deployer.deploy(SafeERC20);
      await deployer.link(SafeERC20, ArbitrageLocal);

      // deploy ArbitrageLocal.sol
      const arbitrage = await deployer.deploy(ArbitrageLocal, ...params)
      console.log(_ + 'ArbitrageLocal deployed at: ' + arbitrage.address)

    } catch (error) {
      console.log(error)
    }
  })
}
