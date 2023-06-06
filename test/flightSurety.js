var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
var flight_date_now = `Flight ${Date.now()}`;
contract('Flight Surety Tests', async (accounts) => {

    var config;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    });

    /****************************************************************************************/
    /* Operations and Settings                                                              */
    /****************************************************************************************/

    it(`(multiparty) has correct initial isOperational() value`, async function () {

        // Get operating status
        let status = await config.flightSuretyApp.isOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");

    });
	  
    it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

        // Ensure that access is denied for non-Contract Owner account
        let accessDenied = false;
        try
        {
            await config.flightSuretyApp.setOperatingStatus(false, { from: config.testAddresses[2] });
        }
        catch(e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
	
    });

    it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

        let accessDenied = false;
        try
        {
            await config.flightSuretyApp.setOperatingStatus(false, {"from": accounts[2]});
        }
        catch(e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

    });
															 

    it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

        await config.flightSuretyApp.setOperatingStatus(false);
        let reverted = false;
        try
        {
            await config.flightSuretyApp.setTestingMode(true);
        }
        catch(e) {
            reverted = true;
        }
        assert.equal(reverted, true, "Access not blocked for requireIsOperational");
        await config.flightSuretyApp.setOperatingStatus(true);
    });

    it('function call is made when multi-party threshold is reached', async () => {
	
        let airline1 = accounts[6];
        let airline2 = accounts[7];
        let airline3 = accounts[8];
        let airline4 = accounts[9];

        await config.flightSuretyApp.fund.sendTransaction(config.firstAirline, {from: config.firstAirline, "value": 10});
        await config.flightSuretyApp.registerAirline.sendTransaction(airline1, {from: config.firstAirline});
        await config.flightSuretyApp.registerAirline.sendTransaction(airline2, {from: config.firstAirline});
        await config.flightSuretyApp.registerAirline.sendTransaction(airline3, {from: config.firstAirline});
        await config.flightSuretyApp.registerAirline.sendTransaction(airline4, {from: config.firstAirline});
        await config.flightSuretyApp.fund.sendTransaction(airline1, {from: config.firstAirline, "value": 10});
        await config.flightSuretyApp.fund.sendTransaction(airline2, {from: config.firstAirline, "value": 10});
        await config.flightSuretyApp.fund.sendTransaction(airline3, {from: config.firstAirline, "value": 10});
        await config.flightSuretyApp.fund.sendTransaction(airline4, {from: config.firstAirline, "value": 10});
        let startStatus = await config.flightSuretyApp.isOperational.call();
        let changeStatus = !startStatus;
        await config.flightSuretyApp.setOperatingStatus(changeStatus, {from: airline1});
        await config.flightSuretyApp.setOperatingStatus(changeStatus, {from: airline2});
        let newStatus = await config.flightSuretyApp.isOperational.call();
        assert.equal(changeStatus, newStatus, "Multi-party call failed");
        await config.flightSuretyApp.setOperatingStatus(!changeStatus, {from: airline1});
        await config.flightSuretyApp.setOperatingStatus(!changeStatus, {from: airline2});
        let newStatus2 = await config.flightSuretyApp.isOperational.call();
        assert.equal(newStatus2, !changeStatus, "Multi-party call failed");
    });

    it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {

        let newAirline = accounts[2];
        await config.flightSuretyApp.registerAirline.sendTransaction(accounts[4], {from: config.firstAirline});

        try {
            await config.flightSuretyApp.registerAirline.sendTransaction(newAirline, {from: accounts[10]});
        }
        catch(e) {}

        let result = await config.flightSuretyApp.isAirline.call(newAirline);
        assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");
    });


    it('(airline) can be funded', async () => {
        let previousAirline = config.firstAirline;
        try {
            await config.flightSuretyApp.fund.sendTransaction(previousAirline, {from: config.firstAirline, "value": 10});
        }
        catch(e) {}

        let result = await config.flightSuretyApp.getAirlineOwnership(previousAirline);
        assert.equal(result.toString() === "1", true, "Airline should not be able to register another airline if it hasn't provided funding");

    });


    it(`(flight) passenger can buy more than 1 ether on surety for a flight`, async function () {

        let flight_date_now = "DummyFlight";
        let errored = false;
        try {
            await config.flightSuretyApp.buy.sendTransaction(accounts[9], flight_date_now, { from: accounts[9], value: 100000000000000000000000});
        }
        catch(e) {
            errored = true;
        }
        assert.equal(errored, true, "Surety value has not changed");
    });



    it(`(flight) passenger can buy surety for a flight`, async function () {
        config.flightSuretyApp.buy.sendTransaction(accounts[9], flight_date_now, { from: accounts[9], value: 1000000000});
        let confirmation = await config.flightSuretyApp.flightSuretyInfo.call(flight_date_now, {"from": accounts[9]});
        console.log(confirmation.toString());
        assert.equal(confirmation, 1000000000, "Surety was not purchased successfully");

    });

    it(`(flight) passenger can not buy twice a surety for a flight`, async function () {
        let errored = false;
        try {
            await config.flightSuretyApp.buy.sendTransaction(accounts[9], flight_date_now, { from: accounts[9], value: 1000000000});
        }
        catch(e) {
            errored = true;
        }
        assert.equal(errored, true, "Surety value has not changed");

    });

});
