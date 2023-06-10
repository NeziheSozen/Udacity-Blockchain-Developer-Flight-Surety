# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`
`truffle compile`

## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

To use the dapp:

`truffle migrate`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder

## Libraries and Why I used:
Truffle v5.0.2: I use Truffle v5.0.2 to simplify the development, testing, and deployment of Ethereum smart contracts.

Ganache v2.7.1: I use Ganache v2.7.1 to emulate a local Ethereum network for development and testing purposes.

Solidity - 0.8.4: I use Solidity - 0.8.4 to write smart contracts on the Ethereum platform with its contract-oriented programming language.

Node v12.22.9: I use Node v12.22.9 as the runtime environment for executing scripts and interacting with the Ethereum network.

Web3.js v1.7.4: I use Web3.js v1.7.4 to interact with the Ethereum blockchain and develop decentralized applications using JavaScript.


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)
