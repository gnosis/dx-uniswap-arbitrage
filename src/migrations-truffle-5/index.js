const deployUniswap = require('./2_deploy_uniswap')

module.exports = async params => {
  await deployUniswap(params)
}
