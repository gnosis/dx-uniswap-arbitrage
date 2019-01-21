var ArbitrageRinkeby = artifacts.require('./ArbitrageRinkeby.sol')

// const MockContract = artifacts.require('./MockContract.sol');
const IToken = artifacts.require('./interface/IToken.sol');
const IDutchExchange = artifacts.require('./interface/IDutchExchange.sol');
const IUniswapFactory = artifacts.require('./interface/IUniswapFactory.sol');
const IUniswapExchange = artifacts.require('./interface/IUniswapExchange.sol');

// var BigNumber = require('bignumber.js')
let gasPrice = 1000000000 // 1GWEI

const _ = '        '
const emptyAdd = '0x' + '0'.repeat(40)
// const deadline = '1749626618' // year 2022
module.exports = async function(callback) {
  let arbitrage, tx
  let from = '0xEe4E56947c799127FB37392bf9333BDEF356865F'
  console.log(_ + 'my address ' + from)
    try {
      var OMG = '0x00df91984582e6e96288307e9c2f20b38c8fece9'
      var RDN = '0x3615757011112560521536258c1e7325ae3b48ae'
      var dutchProxy = '0xaAEb2035FF394fdB2C879190f95e7676f1A9444B'
      var uniFactoryAddress = '0xf5D915570BC477f9B8D6C0E980aA81757A3AaC36'

      let dutchExchange = await IDutchExchange.at(dutchProxy);
      uniswapFactory = await IUniswapFactory.at(uniFactoryAddress)

      let omgToken = await IToken.at(OMG)
      let rdnToken = await IToken.at(RDN)

      // Deploy ArbitrageRinkeby.sol
      arbitrage = await ArbitrageRinkeby.deployed()
      // arbitrage = await ArbitrageRinkeby.new()


      // let arbitrageDutch = await arbitrage.dutchXProxy()
      // console.log({arbitrageDutch})

      // let ethToken = await dutchExchange.ethToken()
      // console.log({ethToken})

      // let wethToken = await IToken.at(ethToken)

      // tx = await wethToken.deposit({value: 1e17})

      // tx = await arbitrage.depositEther({value: 1e17})
      // console.log({tx})

      // tx = await uniswapFactory.createExchange(RDN)
      // console.log('uniswapFactory.createExchange', tx)

      let uniswapExchangeAddress = await uniswapFactory.getExchange(rdnToken.address)
      console.log(_ + 'uniswapExchangeAddress: ' + uniswapExchangeAddress)

      let uniswapExchange = await IUniswapExchange.at(uniswapExchangeAddress)
      

      // tokenReserve = await rdnToken.balanceOf(uniswapExchangeAddress)
      // console.log({tokenReserve})




      // tx = await uniswapExchange.tokenToEthSwapInput("436299294941339884531", "1", deadline)
      // // function tokenToEthSwapInput(uint256 tokens_sold, uint256 min_eth, uint256 deadline) external returns (uint256  eth_bought);

      // console.log('tokenToEthSwapInput', tx.receipt.status)
      // // function ethToTokenSwapInput(uint256 min_tokens, uint256 deadline) external payable returns (uint256  tokens_bought);

      var blockNumber = await web3.eth.getBlockNumber();
      var block = await web3.eth.getBlock(blockNumber);
      var timestamp = block.timestamp
      console.log(_, {timestamp})

      var deadline = timestamp + (10*60*60*1000)
      console.log(_, {deadline})


      liquidityTotalSupply = await uniswapExchange.totalSupply()
      console.log(_ + 'liquidityTotalSupply: ' + liquidityTotalSupply.toString(10))

      myLiquidity = await uniswapExchange.balanceOf(from)
      console.log(_ + 'myLiquidity: ' + myLiquidity.toString(10))



      let uniswapETHbalance = web3.utils.toBN(await web3.eth.getBalance(uniswapExchangeAddress))
      console.log(_ + 'uniswapETHbalance: ' + uniswapETHbalance.toString(10))


      let uniswapRDNbalance = await rdnToken.balanceOf(uniswapExchangeAddress)
      console.log(_ + 'uniswapRDNbalance: ' + uniswapRDNbalance.toString(10))

    
    
      let myETHbalance = web3.utils.toBN(await web3.eth.getBalance(from))
      console.log(_ + 'myETHbalance: ' + myETHbalance.toString(10))
      console.log(_ + 'myETHbalance: ' + web3.utils.fromWei(myETHbalance.toString(10)).toString(10))

      let myRDNbalance = await rdnToken.balanceOf(from)
      console.log(_ + 'myRDNbalance: ' + myRDNbalance.toString(10))


      let uniswapPrice = (new BigNumber(uniswapETHbalance)).div(uniswapRDNbalance))
      console.log(_ + 'uniswapPrice: ' + uniswapPrice.toString(10))


      let maxAmount = myETHbalance.mul(uniswapPrice, 0)
      console.log(_ + 'maxAmount: ' + maxAmount.toString(10))

      if (maxAmount.gt(myETHbalance)) {
        maxAmount = myETHbalance
      }
      console.log(_ + 'maxAmount: ' + maxAmount.toString(10))

      maxAmount = maxAmount.sub(1e18 / 2)

      console.log(_ + 'maxAmount: ' + maxAmount.toString(10))

      let tokenAmount = (maxAmount.mul(uniswapRDNbalance).divRound(uniswapETHbalance.plus(1)).mul(10))
      console.log(_ + tokenAmount.toString(10) + ' tokenAmount')

      allowance = (await rdnToken.allowance(from, uniswapExchangeAddress))
      console.log(_ + allowance.toString(10) + ' allowance')

      if (allowance.lt(tokenAmount.toString(10))) {
        console.log(_ + 'allowance is lt than tokenAmount')
        tx = await rdnToken.approve(uniswapExchangeAddress, tokenAmount.toString(10))
        // console.log(tx.logs[0].args)
        var newAllowance = (await rdnToken.allowance(from, uniswapExchangeAddress))
        console.log(_ + newAllowance.toString(10) + ' newAllowance')

      }

      if (uniswapRDNbalance.eq(0)) {
        console.log(_ + 'uniswapRDNbalance is 0')
        tx = await uniswapExchange.addLiquidity('1', (1e10).toString(10), deadline, {value: (1e10).toString(10)})
        // function addLiquidity(uint256 min_liquidity, uint256 max_tokens, uint256 deadline) external payable returns (uint256);
    } else {
        tx = await uniswapExchange.addLiquidity('1', tokenAmount.toString(10), deadline, {value: maxAmount.toString(10)})
        // function addLiquidity(uint256 min_liquidity, uint256 max_tokens, uint256 deadline) external payable returns (uint256);
    }
      console.log(_ + 'uniswapExchange.addLiquidity', tx.receipt.status)

      // let tokensBought = await uniswapExchange.getEthToTokenInputPrice((1e18 / 2).toString(10))
      // console.log(_ + 'potential tokensBought for .5 ETH:' + tokensBought.toString())

      // let balanceOf = await iToken.balanceOf(from)
      // console.log(_ + 'OMG BALANCE: ' + balanceOf.toString(10))


       uniswapRDNbalance = await rdnToken.balanceOf(uniswapExchangeAddress)
      console.log(_ + 'uniswapRDNbalance: ' + uniswapRDNbalance.toString(10))
       uniswapETHbalance = web3.utils.toBN(await web3.eth.getBalance(uniswapExchangeAddress))
      console.log(_ + 'uniswapETHbalance: ' + uniswapETHbalance.toString(10))


      callback()
    } catch (error) {
      console.log(error)
      callback(error)
    }

}
