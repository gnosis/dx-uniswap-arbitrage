const fs = require('fs')
const _ = '        '

const IUniswapFactory = artifacts.require('IUniswapFactory')
const IUniswapExchange = artifacts.require('IUniswapExchange')
const IToken = artifacts.require('IToken')
const SafeERC20 = artifacts.require('SafeERC20')
const ArbitrageLocal = artifacts.require('ArbitrageLocal')
const DutchExchangeProxy = '0xa4392264a2d8c998901d10c154c91725b1bf0158'

const uniswapBytecode = require('../scripts/uniswap-bytecode.js')
const uniswapExchangeCode = uniswapBytecode.exchange
const uniswapFactoryCode = uniswapBytecode.factory

const deadline = '1649626618' // year 2022

module.exports = (deployer, network, accounts) => {
  return deployer.then(async () => {
    try {
      if (network !== 'development') {
        console.log(_ + 'Skip Migration: Not on local but on ' + network + ' instead')
        return
      }
      const { uniswapFactory } = await deploy({ deployer, accounts })
      await setup({ deployer, accounts, uniswapFactory })
    } catch (error) {
      console.log(error)
    }
  })
}


async function deploy({ deployer, accounts }) {
  let tx = await web3.eth.sendTransaction({
    from: accounts[0],
    data: uniswapExchangeCode,
    gas: 6.5e6,
    gasPrice:  1 * 1e9 // GWEI
  })
  let txReceipt = await web3.eth.getTransactionReceipt(tx.transactionHash);
  let uniswapTemplateAddress = txReceipt.contractAddress
  tx = await web3.eth.sendTransaction({
    from: accounts[0],
    data: uniswapFactoryCode,
    gas: 6.5e6,
    gasPrice:  1 * 1e9 // GWEI
  })
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

  return { uniswapFactory }
}


async function setup({ deployer, accounts, uniswapFactory }) {
  const from = accounts[0]

  let iToken = await IToken.new()
  console.log(_ + 'Uni Token Address: ' + iToken.address)

  let tx = await iToken.deposit({ value: 1e18, from })

  await uniswapFactory.createExchange(iToken.address)

  let uniSwapExchangeAddress = await uniswapFactory.getExchange(iToken.address)

  console.log(_ + 'uniSwapExchangeAddress: ' + uniSwapExchangeAddress)

  let uniswapExchange = await IUniswapExchange.at(uniSwapExchangeAddress)

  await iToken.approve(uniswapExchange.address, 1e18.toString(10))

  tx = await uniswapExchange.addLiquidity(0, 1e18.toString(10), deadline, { value: 1e18, from })

  // let balanceOf = await uniswapExchange.balanceOf(from)
  // console.log(balanceOf.toString(10))


  // let tokensBought = await uniswapExchange.getEthToTokenInputPrice((1e18 / 2).toString(10))
  // console.log(_ + 'tokensBought:' + tokensBought.toString())
  // function getEthToTokenInputPrice(uint256 eth_sold) external view returns (uint256 tokens_bought);

  tx = await iToken.deposit({ value: 1e18, from })

  // tx = await uniswapExchange.ethToTokenSwapInput('1', deadline, {value: (1e18 / 2).toString(10)})
  // console.log({tx})
  // function ethToTokenSwapInput(uint256 min_tokens, uint256 deadline) external payable returns (uint256  tokens_bought);

  let balanceOf = await iToken.balanceOf(from)
  console.log(_ + 'UNI BALANCE: ' + balanceOf.toString(10))
}