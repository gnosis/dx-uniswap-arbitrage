## Arbitrage DutchX/Uniswap
Contract that arbitrages between:
* DutchX protocol: [http://dutchx.readthedocs.io/en/latest/](http://dutchx.readthedocs.io/en/latest/)
* Uniswap protocol: [https://uniswap.io/](https://uniswap.io/)

## Setup
```
# Install dependencies
yarn

# Compile contracts and inject networks
yarn restore

# Check out the contract addresses
yarn networks
```

Create a file `.env` using [.env.example](.env.example) as your template.

```bash
# Create env file
cp .env.example .env
```
## Run
```
yarn lint:watch
```

## Test
```
truffle develop
yarn test
```

## Deploy
```
# Local: Run ganache (rpc) in one tab, and then migrate
yarn rpc
yarn migrate

# Rinkeby
yarn migrate --network development

# Mainnet
yarn mainnet --network mainnet
```
