var ArbitrageLocal = artifacts.require('./ArbitrageLocal.sol')

const MockContract = artifacts.require('./MockContract.sol');
const SafeERC20 = artifacts.require('./SafeERC20.sol');
const IToken = artifacts.require('./IToken.sol');
const IDutchExchange = artifacts.require('./IDutchExchange.sol');
const IUniswapFactory = artifacts.require('./IUniswapFactory.sol');
const IUniswapExchange = artifacts.require('./IUniswapExchange.sol');

const abi = require('ethereumjs-abi')
var BigNumber = require('bignumber.js')

const _ = '        '
const emptyAdd = '0x' + '0'.repeat(40)
const gasPriceWeb3 = web3.utils.toBN(20000000000)
const gasPrice =     web3.utils.toBN(20000000000)


contract('ArbitrageLocal', function(accounts) {

  let arbitrage, iToken, iDutchExchange, mockDutchExchange, iUniswapFactory, mockUniswapFactory, iUniswapExchange, mockUniswapExchange
  let balanceLast, gasSpent, balanceNext, shouldBe, tx

  const oneWei = 1
  const oneEth = web3.utils.toBN(1e18)

  before(async () => {
      try {
        let totalGas = new BigNumber(0)

        // Create Mocks
        mockEthToken = await MockContract.new()
        let tx = await web3.eth.getTransactionReceipt(mockEthToken.transactionHash)
        totalGas = totalGas.plus(tx.gasUsed)
        console.log(_ + tx.gasUsed + ' - Deploy mockEthToken')

        mockDutchExchange = await MockContract.new()
        tx = await web3.eth.getTransactionReceipt(mockDutchExchange.transactionHash)
        totalGas = totalGas.plus(tx.gasUsed)
        console.log(_ + tx.gasUsed + ' - Deploy mockDutchExchange')
        mockUniswapFactory = await MockContract.new()
        tx = await web3.eth.getTransactionReceipt(mockUniswapFactory.transactionHash)
        totalGas = totalGas.plus(tx.gasUsed)
        console.log(_ + tx.gasUsed + ' - Deploy mockUniswapFactory')

        mockUniswapExchange = await MockContract.new()
        tx = await web3.eth.getTransactionReceipt(mockUniswapExchange.transactionHash)
        totalGas = totalGas.plus(tx.gasUsed)
        console.log(_ + tx.gasUsed + ' - Deploy mockUniswapExchange')

        // Deploy interfaces for building mock methods
        iToken = await IToken.at(mockEthToken.address)
        iDutchExchange = await IDutchExchange.at(mockDutchExchange.address);
        iUniswapFactory = await IUniswapFactory.at(mockUniswapFactory.address);
        iUniswapExchange = await IUniswapExchange.at(mockUniswapExchange.address);

        // Deploy and link safeERC20 library
        const safeERC20 = await SafeERC20.new()
        await ArbitrageLocal.link('SafeERC20', safeERC20.address);

        // Deploy ArbitrageLocal.sol
        arbitrage = await ArbitrageLocal.new(iUniswapFactory.address, iDutchExchange.address)
        tx = await web3.eth.getTransactionReceipt(arbitrage.transactionHash)
        totalGas = totalGas.plus(tx.gasUsed)
        console.log(_ + tx.gasUsed + ' - Deploy arbitrage')

        console.log(_ + '-----------------------')
        console.log(_ + totalGas.toFormat(0) + ' - Total Gas')


        await setMocks(accounts)

        // done()
      } catch (error) {
        console.error(error)
        // done(false)
      }
  })


    it('should not revert when depositEther()', async () => {
      let nonce = await web3.eth.getTransactionCount(accounts[0]);

      await arbitrage.depositEther({value: oneWei, nonce})
    })

    it('should revert when not owner & depositEther()', async () => {
      let err
      try {
        await arbitrage.depositEther({value: oneWei, from: accounts[1]})
      } catch(error) {
        err = error
      }
      assert(err, 'depositEther as non-owner did not fail')
    })

    it('should revert when no value & depositEther()', async () => {
      let err
      try {
        await arbitrage.depositEther()
      } catch(error) {
        err = error
      }
      assert(err, 'depositEther with no value did not fail')
    })

    it('should not revert and update balances when withdrawEtherThenTransfer()', async () => {
      let nonce = await web3.eth.getTransactionCount(accounts[0]);

      balanceLast = web3.utils.toBN(await web3.eth.getBalance(accounts[0]))
      const sendEtherToContract = await web3.eth.sendTransaction({
        from: accounts[0],
        to: arbitrage.address,
        value: oneEth.toString(10),
        nonce
      });
      assert(sendEtherToContract.status, sendEtherToContract.status + ' wasn\'t true')
      gasSpent = web3.utils.toBN(sendEtherToContract.cumulativeGasUsed.toString(10)).mul(gasPriceWeb3)
      balanceNext = web3.utils.toBN(await web3.eth.getBalance(accounts[0]))

      shouldBe = balanceLast.sub(gasSpent).sub(oneEth) // oneEth should be removed

      assert(balanceNext.toString(10) == shouldBe.toString(10), balanceNext + ' wasn\'t equal to ' + shouldBe + ' (1)')
      balanceLast = balanceNext

      nonce = await web3.eth.getTransactionCount(accounts[0]);
      tx = await arbitrage.withdrawEtherThenTransfer(oneEth.toString(10), {nonce})
      gasSpent = web3.utils.toBN(tx.receipt.cumulativeGasUsed).mul(gasPrice)

      balanceNext = web3.utils.toBN(await web3.eth.getBalance(accounts[0]))
      shouldBe = balanceLast.sub(gasSpent).add(oneEth) // oneEth should be returned
      assert(balanceNext.toString(10) == shouldBe.toString(10), balanceNext + ' wasn\'t equal to ' + shouldBe + ' (2)')
      balanceLast = balanceNext
      assert(tx.receipt.status, tx.receipt.status + ' wasn\'t true')
    })

    it('should not revert and update blances when transferEther()', async () => {
      let nonce = await web3.eth.getTransactionCount(accounts[0]);

      balanceLast = web3.utils.toBN(await web3.eth.getBalance(accounts[0]))
      const sendEtherToContract = await web3.eth.sendTransaction({
        from: accounts[0],
        to: arbitrage.address,
        value: oneEth.toString(10),
        nonce
      });
      assert(sendEtherToContract.status, sendEtherToContract.status + ' wasn\'t true')
      gasSpent = web3.utils.toBN(sendEtherToContract.cumulativeGasUsed.toString(10)).mul(gasPriceWeb3)
      balanceNext = web3.utils.toBN(await web3.eth.getBalance(accounts[0]))
      shouldBe = balanceLast.sub(gasSpent).sub(oneEth) // oneEth should be removed
      assert(balanceNext.toString(10) == shouldBe.toString(10), balanceNext + ' wasn\'t equal to ' + shouldBe)
      balanceLast = balanceNext

      nonce = await web3.eth.getTransactionCount(accounts[0]);

      tx = await arbitrage.transferEther(oneEth.toString(10), {nonce})
      gasSpent = web3.utils.toBN(tx.receipt.cumulativeGasUsed).mul(gasPrice)
      balanceNext = web3.utils.toBN(await web3.eth.getBalance(accounts[0]))
      shouldBe = balanceLast.sub(gasSpent).add(oneEth) // oneEth should be returned
      assert(balanceNext.toString(10) == shouldBe.toString(10), balanceNext + ' wasn\'t equal to ' + shouldBe)
      balanceLast = balanceNext
      assert(tx.receipt.status, tx.receipt.status + ' wasn\'t true')
    })

    it('should not revert when withdrawEther()', async () => {
      let nonce = await web3.eth.getTransactionCount(accounts[0]);

      await arbitrage.withdrawEther('1', {nonce})
    })

    it('should revert when not owner & withdrawEther()', async () => {
      let nonce = await web3.eth.getTransactionCount(accounts[0]);

      let err
      try {
        await arbitrage.withdrawEther('1', {from: accounts[1], nonce})
      } catch(error) {
        err = error
      }
      assert(err, 'withdrawEther as non-owner did not fail')
    })

    it('should not revert when withdrawToken()', async () => {
      let nonce = await web3.eth.getTransactionCount(accounts[0]);

      await arbitrage.withdrawToken(iToken.address, '1', {nonce})
    })

    it('should revert when not owner & withdrawToken()', async () => {
      let nonce = await web3.eth.getTransactionCount(accounts[0]);

      let err
      try {
        await arbitrage.withdrawToken(iToken.address, '1', {from: accounts[1], nonce})
      } catch(error) {
        err = error
      }
      assert(err, 'withdrawToken as non-owner did not fail')
    })

    it('should not revert when claimBuyerFunds()', async () => {
      let nonce = await web3.eth.getTransactionCount(accounts[0]);

      await arbitrage.claimBuyerFunds(iToken.address, 0, {nonce})
    })

    it('should revert when not owner & claimBuyerFunds()', async () => {
      let nonce = await web3.eth.getTransactionCount(accounts[0]);

      let err
      try {
        await arbitrage.claimBuyerFunds(iToken.address, 0, {from: accounts[1], nonce})
      } catch(error) {
        err = error
      }
      assert(err, 'claimBuyerFunds as non-owner did not fail')
    })

    it('should not revert when transferToken()', async () => {
      let nonce = await web3.eth.getTransactionCount(accounts[0]);

      await arbitrage.transferToken(iToken.address, 0, {nonce})
    })

    it('should revert when not owner & transferToken()', async () => {
      let nonce = await web3.eth.getTransactionCount(accounts[0]);

      let err
      try {
        await arbitrage.transferToken(iToken.address, 0, {from: accounts[1], nonce})
      } catch(error) {
        err = error
      }
      assert(err, 'transferToken as non-owner did not fail')
    })

    it('should not revert when depositToken()', async () => {
      let nonce = await web3.eth.getTransactionCount(accounts[0]);

      await arbitrage.depositToken(iToken.address, oneWei, {nonce})
    })

    it('should revert when not owner & depositToken()', async () => {
      let nonce = await web3.eth.getTransactionCount(accounts[0]);

      let err
      try {
        await arbitrage.depositToken(iToken.address, {from: accounts[1], nonce})
      } catch(error) {
        err = error
      }
      assert(err, 'depositToken as non-owner did not fail')
    })

    it('should not revert when dutchOpportunity()', async () => {
      let nonce = await web3.eth.getTransactionCount(accounts[0]);

      // needs to be a balnce on the contract so when it deposits the imaginary arbitrage results
      // there is something to be "deposited"
      const sendEtherToContract = await web3.eth.sendTransaction({
        from: accounts[0],
        to: arbitrage.address,
        value: oneWei.toString(10),
        nonce
      });
      assert(sendEtherToContract.status, sendEtherToContract.status + ' wasn\'t true')
      nonce = await web3.eth.getTransactionCount(accounts[0]);

      await arbitrage.dutchOpportunity(iToken.address, oneWei, {nonce})
    })

    it('should revert when not owner & dutchOpportunity()', async () => {
      let nonce = await web3.eth.getTransactionCount(accounts[0]);

      let err
      try {
        await arbitrage.dutchOpportunity(iToken.address, oneWei, {from: accounts[1], nonce})
      } catch(error) {
        err = error
      }
      assert(err, 'dutchOpportunity as non-owner did not fail')
    })

    it('should not revert when uniswapOpportunity()', async () => {
      let nonce = await web3.eth.getTransactionCount(accounts[0]);

      const sendEtherToContract = await web3.eth.sendTransaction({
        from: accounts[0],
        to: arbitrage.address,
        value: oneWei.toString(10),
        nonce
      });
      assert(sendEtherToContract.status, sendEtherToContract.status + ' wasn\'t true')
      nonce = await web3.eth.getTransactionCount(accounts[0]);

      await arbitrage.uniswapOpportunity(iToken.address, oneWei, {nonce})
    })

    it('should revert when not owner & uniswapOpportunity()', async () => {
      let nonce = await web3.eth.getTransactionCount(accounts[0]);

      let err
      try {
        await arbitrage.uniswapOpportunity(iToken.address, oneWei, {from: accounts[1], nonce})
      } catch(error) {
        err = error
      }
      assert(err, 'uniswapOpportunity as non-owner did not fail')
    })

    async function setMocks(accounts) {
      let nonce = await web3.eth.getTransactionCount(accounts[0]);

      const iToken_withdraw = iToken.contract.methods.withdraw(0).encodeABI()
      await mockEthToken.givenMethodReturnBool(iToken_withdraw, true, {nonce})

      const deposit = iToken.contract.methods.deposit().encodeABI()
      await mockEthToken.givenMethodReturn(deposit, [])

      const balanceOf = iToken.contract.methods.balanceOf(emptyAdd).encodeABI()
      await mockEthToken.givenMethodReturnUint(balanceOf, '1')

      const allowance = iToken.contract.methods.allowance(emptyAdd, emptyAdd).encodeABI()
      await mockEthToken.givenMethodReturnUint(allowance, '0')

      const approve = iToken.contract.methods.approve(emptyAdd, 0).encodeABI()
      await mockEthToken.givenMethodReturnBool(approve, true)

      const transfer = iToken.contract.methods.transfer(emptyAdd, 0).encodeABI()
      await mockEthToken.givenMethodReturnBool(transfer, true)

      const transferFrom = iToken.contract.methods.transferFrom(emptyAdd, emptyAdd, 0).encodeABI()
      await mockEthToken.givenMethodReturnBool(transferFrom, true)


      const postBuyOrder = iDutchExchange.contract.methods.postBuyOrder(emptyAdd, emptyAdd, 0, 0).encodeABI()
      await mockDutchExchange.givenMethodReturnUint(postBuyOrder, '0')

      const getAuctionIndex = iDutchExchange.contract.methods.getAuctionIndex(emptyAdd, emptyAdd).encodeABI()
      await mockDutchExchange.givenMethodReturnUint(getAuctionIndex, '0')

      const ethToken = iDutchExchange.contract.methods.ethToken().encodeABI()
      await mockDutchExchange.givenMethodReturnAddress(ethToken, mockEthToken.address)

      const dutchDeposit = iDutchExchange.contract.methods.deposit(emptyAdd, 0).encodeABI()
      await mockDutchExchange.givenMethodReturnUint(dutchDeposit, oneWei)

      const iDutchExchange_withdraw = iDutchExchange.contract.methods.withdraw(emptyAdd, 0).encodeABI()
      await mockDutchExchange.givenMethodReturnUint(iDutchExchange_withdraw, 0)

      const claimBuyerFunds = iDutchExchange.contract.methods.claimBuyerFunds(emptyAdd, emptyAdd, emptyAdd, 0).encodeABI()
      const claimBuyerFundsReturn = abi.rawEncode(['uint', 'uint'], [2, 1])
      await mockDutchExchange.givenMethodReturn(claimBuyerFunds, claimBuyerFundsReturn)


      const tokenToEthSwapInput = iUniswapExchange.contract.methods.tokenToEthSwapInput(0, 0, 0).encodeABI()
      await mockUniswapExchange.givenMethodReturnUint(tokenToEthSwapInput, 1)

      const ethToTokenSwapInput = iUniswapExchange.contract.methods.ethToTokenSwapInput(0, 0).encodeABI()
      await mockUniswapExchange.givenMethodReturnUint(ethToTokenSwapInput, 1)

      const getExchange = iUniswapFactory.contract.methods.getExchange(emptyAdd).encodeABI()
      await mockUniswapFactory.givenMethodReturnUint(getExchange, iUniswapExchange.address)

    }

})

function getBlockNumber() {
  return new Promise((resolve, reject) => {
    web3.eth.getBlockNumber((error, result) => {
      if (error) reject(error)
      resolve(result)
    })
  })
}

function increaseBlocks(blocks) {
  return new Promise((resolve, reject) => {
    increaseBlock().then(() => {
      blocks -= 1
      if (blocks == 0) {
        resolve()
      } else {
        increaseBlocks(blocks).then(resolve)
      }
    })
  })
}

function increaseBlock() {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync(
      {
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: 12345
      },
      (err, result) => {
        if (err) reject(err)
        resolve(result)
      }
    )
  })
}

function decodeEventString(hexVal) {
  return hexVal
    .match(/.{1,2}/g)
    .map(a =>
      a
        .toLowerCase()
        .split('')
        .reduce(
          (result, ch) => result * 16 + '0123456789abcdefgh'.indexOf(ch),
          0
        )
    )
    .map(a => String.fromCharCode(a))
    .join('')
}
