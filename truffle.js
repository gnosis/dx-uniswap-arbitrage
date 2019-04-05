require('dotenv').config()
const HDWalletProvider = require('truffle-hdwallet-provider')

var NonceTrackerSubprovider = require("web3-provider-engine/subproviders/nonce-tracker")

module.exports = {
  compilers: {
    solc: {
      version: "0.5.3"
    }
  },
  networks: {
    development: {
      provider() {
        var wallet = new HDWalletProvider(
          process.env.GANACHE_MNEMONIC,
          'http://localhost:8545/'
        )
        var nonceTracker = new NonceTrackerSubprovider()
        wallet.engine._providers.unshift(nonceTracker)
        nonceTracker.setEngine(wallet.engine)
        return wallet
      },
      host: 'localhost',
      port: 9545,
      network_id: '*'
    },
    ganache: {
      provider() {
        var wallet = new HDWalletProvider(
          process.env.GANACHE_MNEMONIC,
          'http://localhost:7545'
        )
        var nonceTracker = new NonceTrackerSubprovider()
        wallet.engine._providers.unshift(nonceTracker)
        nonceTracker.setEngine(wallet.engine)
        return wallet
      },
      host: 'localhost',
      port: 7545,
      network_id: 5777,
      gas: 10000000,
      gasPrice: 1000000000
    },
    mainnet: {
      provider() {
        // using wallet at index 1 ----------------------------------------------------------------------------------------v
        var wallet = new HDWalletProvider(
          process.env.MAINNET_MNEMONIC,
          'https://mainnet.infura.io/v3/' + process.env.INFURA_API_KEY,
          1
        )
        var nonceTracker = new NonceTrackerSubprovider()
        wallet.engine._providers.unshift(nonceTracker)
        nonceTracker.setEngine(wallet.engine)
        return wallet
      },
      network_id: 1
      // gas: 5561260
    },
    kovan: {
      provider() {
        // using wallet at index 1 ----------------------------------------------------------------------------------------v
        var wallet = new HDWalletProvider(
          process.env.TESTNET_MNEMONIC,
          'https://kovan.infura.io/v3/' + process.env.INFURA_API_KEY,
          1
        )
        var nonceTracker = new NonceTrackerSubprovider()
        wallet.engine._providers.unshift(nonceTracker)
        nonceTracker.setEngine(wallet.engine)
        return wallet
      },
      network_id: 42
      // gas: 5561260
    },
    rinkeby: {
      provider() {
        var wallet = new HDWalletProvider(
          process.env.TESTNET_MNEMONIC,
          'https://node.rinkeby.gnosisdev.com'
          // 'https://rinkeby.infura.io/v3/' + process.env.INFURA_API_KEY
        )
        var nonceTracker = new NonceTrackerSubprovider()
        wallet.engine._providers.unshift(nonceTracker)
        nonceTracker.setEngine(wallet.engine)
        return wallet
      },
      network_id: 4,
      // confirmations: 3,
      // websockets: true,
      // gas: 4700000,
      gasPrice: 20000000000 // 20 GWEI
    },
    ropsten: {
      provider() {
        var wallet = new HDWalletProvider(
          process.env.TESTNET_MNEMONIC,
          'https://ropsten.infura.io/v3/' + process.env.INFURA_API_KEY
        )
        var nonceTracker = new NonceTrackerSubprovider()
        wallet.engine._providers.unshift(nonceTracker)
        nonceTracker.setEngine(wallet.engine)
        return wallet
      },
      network_id: 2
      // gas: 4700000
    },
    sokol: {
      provider() {
        var wallet = new HDWalletProvider(
          process.env.TESTNET_MNEMONIC,
          'https://sokol.poa.network'
        )
        var nonceTracker = new NonceTrackerSubprovider()
        wallet.engine._providers.unshift(nonceTracker)
        nonceTracker.setEngine(wallet.engine)
        return wallet
      },
      gasPrice: 1000000000,
      network_id: 77
    },
    poa: {
      provider() {
        var wallet = new HDWalletProvider(
          process.env.TESTNET_MNEMONIC,
          'https://core.poa.network'
        )
        var nonceTracker = new NonceTrackerSubprovider()
        wallet.engine._providers.unshift(nonceTracker)
        nonceTracker.setEngine(wallet.engine)
        return wallet
      },
      gasPrice: 1000000000,
      network_id: 99
    }
  }
}
