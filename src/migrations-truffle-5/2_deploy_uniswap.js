var fs = require('fs')
const deadline = '1649626618' // year 2022

const uniswap = require('../../scripts/uniswap-bytecode.js');
const uniswapExchangeCode = uniswap.exchange
const uniswapFactoryCode = uniswap.factory

async function migrate({
  artifacts,
  deployer,
  network,
  accounts,
  web3,
  DutchExchangeProxy
  // initialTokenAmount,
  // gnoLockPeriodInHours
}) {
  if (network === 'development') {

    var SafeERC20 = artifacts.require('SafeERC20')
    var IUniswapFactory = artifacts.require('IUniswapFactory')
    var IUniswapExchange = artifacts.require('IUniswapExchange')
    var IToken = artifacts.require('IToken')
    var ArbitrageLocal = artifacts.require('ArbitrageLocal')

    try {
      // console.log(web3)
      let tx = await new Promise((resolve, reject) => {web3.eth.sendTransaction({from: accounts[0], data: uniswapExchangeCode, gas: 6000000}, (error, result) => {error ? reject(error) : resolve(result)})})

      let txReceipt = await new Promise((resolve, reject) => {web3.eth.getTransactionReceipt(tx, (error, result) => {error ? reject(error) : resolve(result)})})
      let uniswapTemplateAddress = txReceipt.contractAddress

      tx = await new Promise((resolve, reject) => {web3.eth.sendTransaction({from: accounts[0], data: uniswapFactoryCode, gas: 6000000}, (error, result) => {error ? reject(error) : resolve(result)})})

      txReceipt = await new Promise((resolve, reject) => {web3.eth.getTransactionReceipt(tx, (error, result) => {error ? reject(error) : resolve(result)})});
      let uniswapFactoryAddress = txReceipt.contractAddress

      console.log('uniswapFactoryAddress deployed at: ' + uniswapFactoryAddress)


      var uniArtifact = JSON.parse(fs.readFileSync('build/contracts/IUniswapFactory.json', 'utf8'))
      uniArtifact.networks[deployer.network_id] = {
        "events": {},
        "links": {},
        "address": uniswapFactoryAddress,
        "transactionHash": tx
      }
      fs.writeFileSync('build/contracts/IUniswapFactory.json', JSON.stringify(uniArtifact));


      let uniswapFactory = await IUniswapFactory.at(uniswapFactoryAddress)
      await uniswapFactory.initializeFactory(uniswapTemplateAddress)

      const params = [uniswapFactory.address, DutchExchangeProxy]

      // Deploy SafeERC20 and link to ArbitrageLocal.sol
      await deployer.deploy(SafeERC20);
      await deployer.link(SafeERC20, ArbitrageLocal);

      // deploy ArbitrageLocal.sol
      let arbitrage = await deployer.deploy(ArbitrageLocal, ...params)
      console.log('ArbitrageLocal deployed at: ' + arbitrage.address)


      // SET UP UNI TOKEN FOR TESTING PURPOSES

      var from = accounts[0]

      // create new token
      let iToken = await IToken.new()
      console.log('Uni Token Address: ' + iToken.address)
      tx = await iToken.deposit({value:1e18, from})

      // create exchange for token
      await uniswapFactory.createExchange(iToken.address)
      let uniSwapExchangeAddress = await uniswapFactory.getExchange(iToken.address)
      console.log('uniSwapExchangeAddress: ' + uniSwapExchangeAddress)

      // add liquidity to exchange
      let uniswapExchange = await IUniswapExchange.at(uniSwapExchangeAddress)
      await iToken.approve(uniswapExchange.address, 1e18.toString(10))
      tx = await uniswapExchange.addLiquidity(0, 1e18.toString(10), deadline, {value: 1e18, from})


      // get enough token to fund the dutch x
      tx = await iToken.deposit({value:10e18, from})

      // tx = await uniswapExchange.ethToTokenSwapInput('1', deadline, {value: (1e18 / 2).toString(10)})
      // console.log({tx})
      // function ethToTokenSwapInput(uint256 min_tokens, uint256 deadline) external payable returns (uint256  tokens_bought);

      let balanceOf = await iToken.balanceOf(from)
      console.log('UNI BALANCE: ' + balanceOf.toString(10))

      // fund the arbitrage contract with ether
      tx = await arbitrage.depositEther({value: 1e18})

    } catch (error) {
      console.log('there was an error!!!!!')
      console.log(error)
    }
  } else {
    console.log('Not in development, so nothing to do. Current network is %s', network)
  }
}

module.exports = migrate
