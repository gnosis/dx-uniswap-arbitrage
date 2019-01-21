var ArbitrageLocal = artifacts.require('./ArbitrageLocal.sol')

const MockContract = artifacts.require('./MockContract.sol');
const IToken = artifacts.require('./interface/IToken.sol');
const IDutchExchange = artifacts.require('./interface/IDutchExchange.sol');
const IUniswapFactory = artifacts.require('./interface/IUniswapFactory.sol');
const IUniswapExchange = artifacts.require('./interface/IUniswapExchange.sol');

var BigNumber = require('bignumber.js')
let gasPrice = 1000000000 // 1GWEI

const _ = '        '
const emptyAdd = '0x' + '0'.repeat(40)
console.log('"?????')
contract('Debug', function(accounts) {
  let arbitrage

  it('should pass', async () => {
    try {
      var unitoken = '0xd54b47F8e6A1b97F3A84f63c867286272b273b7C'
      var dutchProxy = '0xa4392264a2d8c998901d10c154c91725b1bf0158'

      let dutchExchange = await IDutchExchange.at(dutchProxy);

      console.log('ethtoken', await dutchExchange.ethToken())

      uniswapFactory = await IUniswapFactory.at('0x4e71920b7330515faf5EA0c690f1aD06a85fB60c')
      // Deploy ArbitrageLocal.sol
      console.log("Deploy ...")
      arbitrage = await ArbitrageLocal.new(uniswapFactory.address, dutchProxy)
      console.log('arbitrage is ', arbitrage.address)
      console.log('dutchProxy address', await arbitrage.dutchXProxy())
      console.log("Deposit Ether ...")


    
      var result = await arbitrage.depositEther({ value: 1e18 })
      console.log(result.logs.map(l => {
        return Object.keys(l.args).map(k => typeof l.args[k] === 'object' ? l.args[k].toString(10) : l.args[k])
      }))
      // console.log("Execute opportunity ...")
      // tx = await arbitrage.uniswapOpportunity('0x8273e4B8ED6c78e252a9fCa5563Adfcc75C91b2A', '990000000000001')
      // console.log(tx.receipt.rawLogs)
      // 373083712375058828
      // 284345144034671943

      // 440000000000000001
      // var exchange = await uniswapFactory.getExchange(unitoken)
      // var uniswapExchange = await IUniswapExchange.at(exchange)
      // var EthAmount = await uniswapExchange.getTokenToEthOutputPrice('330000000000000001')
      // console.log('TokenToEth', EthAmount.toString(10))

      // console.log('Ether Spent on Opp', '283791165594153088')
      // tx = await arbitrage.dutchOpportunity.call(unitoken, '374289831206257697')
      // console.log('return', tx.toString(10))

      // We force failure to print events
      // assert(false)
    } catch (error) {
      console.log(error)
    }
  })

})
