const fs = require('fs')

const IToken = artifacts.require('./IToken.sol')
const IUniswapFactory = artifacts.require('./IUniswapFactory.sol')
const IUniswapExchange = artifacts.require('./IUniswapExchange.sol')
let _ = '        '

const IUniswapFactoryArtifacts = require('../build/contracts/IUniswapFactory.json')
const deadline = '1649626618' // year 2022
module.exports = (deployer, network, accounts) => {
  return deployer
  .then(async () => {
    try {
      if(network !== 'development') {
        console.log(_ + 'Skip Migration: Not on local but on ' + network + ' instead')
        return
      }

      const uniswapFactoryAddress = IUniswapFactoryArtifacts.networks[deployer.network_id].address
      const uniswapFactory = await IUniswapFactory.at(uniswapFactoryAddress)
      const from = accounts[0]

      let iToken = await IToken.new()
      console.log(_ + 'Uni Token Address: ' + iToken.address)

      var tx = await iToken.deposit({value:1e18, from})

      await uniswapFactory.createExchange(iToken.address)

      let uniSwapExchangeAddress = await uniswapFactory.getExchange(iToken.address)

      console.log(_ + 'uniSwapExchangeAddress: ' + uniSwapExchangeAddress)

      let uniswapExchange = await IUniswapExchange.at(uniSwapExchangeAddress)

      await iToken.approve(uniswapExchange.address, 1e18.toString(10))

      tx = await uniswapExchange.addLiquidity(0, 1e18.toString(10), deadline, {value: 1e18, from})

      // let balanceOf = await uniswapExchange.balanceOf(from)
      // console.log(balanceOf.toString(10))


      // let tokensBought = await uniswapExchange.getEthToTokenInputPrice((1e18 / 2).toString(10))
      // console.log(_ + 'tokensBought:' + tokensBought.toString())
      // function getEthToTokenInputPrice(uint256 eth_sold) external view returns (uint256 tokens_bought);

      tx = await iToken.deposit({value:1e18, from})

      // tx = await uniswapExchange.ethToTokenSwapInput('1', deadline, {value: (1e18 / 2).toString(10)})
      // console.log({tx})
      // function ethToTokenSwapInput(uint256 min_tokens, uint256 deadline) external payable returns (uint256  tokens_bought);

      let balanceOf = await iToken.balanceOf(from)
      console.log(_ + 'UNI BALANCE: ' + balanceOf.toString(10))


    } catch (error) {
      console.log(error)
    }
  })
}
