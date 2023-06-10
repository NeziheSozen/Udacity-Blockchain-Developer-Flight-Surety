import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

const ACCOUNT_OFFSET = 10;  // Start with an offset (keep first accounts airline only)
const ORACLES_COUNT = 30;   // Register amount of Oracles

const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;

const STATUS_CODES = [
  STATUS_CODE_UNKNOWN,
  STATUS_CODE_ON_TIME,
  STATUS_CODE_LATE_AIRLINE,
  STATUS_CODE_LATE_WEATHER,
  STATUS_CODE_LATE_TECHNICAL,
  STATUS_CODE_LATE_OTHER
];

function getRandomStatusCode() {
  return STATUS_CODES[Math.floor(Math.random() * STATUS_CODES.length)];
}

const config = Config['localhost'];
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
const flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
const flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

const oracle_accounts = [];

web3.eth.getAccounts().then(accounts => {
  if (accounts.length < ORACLES_COUNT + ACCOUNT_OFFSET) {
    throw new Error("Increase the number of accounts");
  }

  flightSuretyData.methods
    .authorizeCaller(config.appAddress)
    .send({ from: accounts[0] })
    .then(result => {
      console.log("Registered App as authorized caller.");
    })
    .catch(error => {
      console.log(error);
    });

  flightSuretyApp.methods
    .REGISTRATION_FEE()
    .call({ from: accounts[0] })
    .then(result => {
      const registrationFee = result;

      for (let idx = ACCOUNT_OFFSET; idx < ORACLES_COUNT + ACCOUNT_OFFSET; idx++) {
        flightSuretyApp.methods
          .registerOracle()
          .send({ from: accounts[idx], value: registrationFee, gas: 3000000 })
          .then(reg_result => {
            return flightSuretyApp.methods.getMyIndexes().call({ from: accounts[idx] });
          })
          .then(fetch_result => {
            const oracle = {
              address: accounts[idx],
              indexes: fetch_result
            };
            oracle_accounts.push(oracle);
            console.log("Oracle registered: " + JSON.stringify(oracle));
          })
          .catch(error => {
            console.log(error);
          });
      }
    })
    .catch(error => {
      console.log(error);
    });
});

flightSuretyApp.events.OracleRequest(
  {
    fromBlock: 0
  },
  (error, event) => {
    if (error) {
      console.log(error);
    } else {
      const index = event.returnValues.index;
      const airline = event.returnValues.airline;
      const flight = event.returnValues.flight;
      const timestamp = event.returnValues.timestamp;
      const statusCode = getRandomStatusCode();

      oracle_accounts.forEach(oracle => {
        if (oracle.indexes.includes(index)) {
          console.log("Oracle response matches a request: " + JSON.stringify(oracle));
          flightSuretyApp.methods
            .submitOracleResponse(index, airline, flight, timestamp, statusCode)
            .send({ from: oracle.address, gas: 200000 })
            .then(result => {
              console.log("Sent Oracle Response: " + JSON.stringify(oracle) + " with Status Code: " + statusCode);
            })
            .catch(error => {
              console.log(error);
            });
        }
      });
    }
  }
);

const app = express();
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  });
});

export default app;
