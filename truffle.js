const assert = require('assert')
const HDWalletProvider = require('truffle-hdwallet-provider')
const GAS_PRICE_GWEI = process.env.GAS_PRICE_GWEI || 5
const GAS_LIMIT = 6.5e6

const DEFAULT_MNEMONIC = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat'

// Load env vars
require('dotenv').config()

// Get the mnemonic
const privateKey = process.env.PK
let mnemonic = process.env.MNEMONIC
if (!privateKey && !mnemonic) {
  mnemonic = DEFAULT_MNEMONIC
}

const infuraProjectId = process.env.INFURA_KEY
function truffleConfig({
  mnemonic = DEFAULT_MNEMONIC,
  privateKey,
  gasPriceGWei = GAS_PRICE_GWEI,
  gas = GAS_LIMIT,
  optimizedEnabled = true,
  urlRinkeby = 'https://rinkeby.infura.io/v3/' + infuraProjectId,
  urlKovan = 'https://kovan.infura.io/v3/' + infuraProjectId,
  urlMainnet = 'https://mainnet.infura.io/v3/' + infuraProjectId,
  urlDevelopment = 'localhost',
  portDevelopment = 8545
} = {}) {
  assert(mnemonic, 'The mnemonic has not been provided');
  console.log(`Using gas limit: ${gas / 1000} K`);
  console.log(`Using gas price: ${gasPriceGWei} Gwei`);
  console.log(`Optimizer enabled: ${optimizedEnabled}`);
  console.log('Using default mnemonic: %s', mnemonic === DEFAULT_MNEMONIC);
  const gasPrice = gasPriceGWei * 1e9;

  let _getProvider
  if (privateKey) {
    console.log('Using private key')
    _getProvider = url => {
      return () => {
        assert(infuraProjectId, "Need an infura ProjectID. INFURA_KEY env var")
        return new HDWalletProvider([privateKey], url)
      }
    }
  } else {
    console.log(mnemonic === DEFAULT_MNEMONIC ? 'Using default mnemonic' : 'Using custom mnemonic')
    _getProvider = url => {
      return () => {
        assert(infuraProjectId, "Need an infura ProjectID. INFURA_KEY env var")
        return new HDWalletProvider(mnemonic, url)
      }
    }
  }

  return {
    networks: {
      development: {
        host: process.env.RPC_URL || urlDevelopment,
        port: portDevelopment,
        gas,
        gasPrice,
        network_id: '*'
      },
      mainnet: {
        provider: _getProvider(urlMainnet),
        network_id: '1',
        gas,
        gasPrice
      },
      rinkeby: {
        provider: _getProvider(urlRinkeby),
        network_id: '4',
        gas,
        gasPrice
      },
      kovan: {
        provider: _getProvider(urlKovan),
        network_id: '42',
        gas,
        gasPrice
      },
    },
    compilers: {
      solc: {
        version: '0.5.2',
        docker: process.env.SOLC_USE_DOCKER === 'true' || false,
        settings: {
          optimizer: {
            enabled: optimizedEnabled, // Default: false
            runs: 200
          }
          // evmVersion: "byzantium"  // Default: "byzantium". Others:  "homestead", ...
        }
      }
    }
  };
}

module.exports = truffleConfig({
  optimizedEnabled: true,
  mnemonic,
  privateKey
})
