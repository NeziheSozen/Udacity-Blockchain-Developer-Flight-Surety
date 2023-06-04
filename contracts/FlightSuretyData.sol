pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    mapping(address => uint256) private authorizedCaller; //Store list of authorized callers.

    struct Airline {
        bool isRegistered;
        bool isFunded;
    }
    mapping(address => Airline) private airlines;


    struct FlightInsurance {
        bool isInsured;
        bool isCredited;
        uint256 amount;
    }

    mapping(address => uint256) private insureeBalances;

    mapping(bytes32 => FlightInsurance) private flightInsurances;

    mapping(bytes32 => address[]) private insureesMap;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    The first Airline gets registered on contract deployment

    */
    constructor (
        address firstAirline
    )
    public
    {
        contractOwner = msg.sender;

        airlines[firstAirline].isRegistered = true;
        airlines[firstAirline].isFunded = false;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    modifier requireIsCallerAuthorized(){
        require(msg.sender == contractOwner || authorizedCaller[msg.sender] == 1, "Caller not authorized!");
        _;
    }

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;
        // All modifiers require an "_" which indicates where the function body will be added
    }


    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireIsCallerAirlineFunded(address callingAirline){
        require(airlines[callingAirline].isFunded, "Airline cannot participate in contract if not funded.");
        _;
    }

    modifier requireFlightNotInsured(address sender, address airline, string flightCode, uint256 timestamp){
        require(!isFlightInsured(sender, airline, flightCode, timestamp), "Passenger is already insured");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/


    function authorizeCaller(address contractAddress) external
    requireContractOwner
    {
        authorizedCaller[contractAddress] = 1;
    }

    function deauthorizeCaller(address contractAddress) external
    requireContractOwner
    {
        delete authorizedCaller[contractAddress];
    }

    function isAuthorizedCaller(address contractAddress) public view
    requireContractOwner
    returns (bool)
    {
        return authorizedCaller[contractAddress] == 1;
    }

    function isFlightInsured(address sender, address airline, string flightCode, uint256 timestamp) public view
    returns (bool)
    {
        FlightInsurance storage insurance = flightInsurances[getKey(sender, airline, flightCode, timestamp)];
        return insurance.isInsured;
    }


    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
    public
    view
    returns (bool)
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus
    (
        bool mode
    )
    external
    requireContractOwner
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/
    function getBalance(address addr) public view
    requireIsOperational
    requireIsCallerAuthorized
    returns (uint256){
        return address(addr).balance;
    }
    function isAirline(address airline) external view returns (bool) {
        return airlines[airline].isRegistered;
    }

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(address callingAirline, address airline) external
    requireIsOperational
    requireIsCallerAuthorized
    requireIsCallerAirlineFunded(callingAirline)
    returns (bool status)
    {
        //Fail fast
        require(!airlines[airline].isRegistered, "Airline  has been already registered.");
        airlines[airline].isRegistered = true;
        airlines[airline].isFunded = false;

        return airlines[airline].isRegistered;
    }


    function fundAirline (address airline) external
    requireIsOperational
    requireIsCallerAuthorized
    {
        airlines[airline].isFunded = true;
    }

    function insureeBalance (address sender) external
    requireIsOperational
    requireIsCallerAuthorized
    view
    returns (uint256)
    {
        return insureeBalances[sender];
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buy
    (
        address sender,
        address airline,
        string flightCode,
        uint256 timestamp,
        uint256 insuranceAmount
    )
    external
    requireIsOperational
    requireIsCallerAuthorized
    requireFlightNotInsured(sender, airline, flightCode, timestamp)
    {
        FlightInsurance storage flInsurance = flightInsurances[getKey(sender, airline, flightCode, timestamp)];
        flInsurance.isInsured = true;
        flInsurance.amount = insuranceAmount;
        saveInsuree(sender, airline, flightCode, timestamp);
    }

    function saveInsuree(address sender, address airline, string flightCode, uint256 timestamp) internal requireIsOperational {
        address [] storage insurees = insureesMap[getKey(address(0), airline, flightCode, timestamp)];
        bool insureeExists = false;
        for(uint256 i = 0; i < insurees.length; i++) {
            if(insurees[i] == sender) {
                duplicate = true;
                break;
            }
        }

        if(!insureeExists) {
            insurees.push(sender);
        }
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
    (
    address airline,
    string flightCode,
    uint256 timestamp
    )
    external
    requireIsOperational
    requireIsCallerAuthorized
    {
        address [] storage insurees = insureesMap[getKey(address(0), airline, flightCode, timestamp)];

        for(uint i = 0; i < insurees.length; i++) {
            FlightInsurance storage insurance = flightInsurances[getKey(insurees[i], airline, flightCode, timestamp)];
            if(insurance.isInsured && !insurance.isCredited) {
                insurance.isCredited = true;
                insureeBalances[insurees[i]] = insureeBalances[insurees[i]].add(insurance.amount.div(10).mul(15));
            }
        }
    }
	


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay (address sender) external requireIsOperational requireIsCallerAuthorized
							 
							 
									
								
    {
        //Fail fast 
        require(address(this).balance >= insureeBalances[sender], "Error: There is no funds in contract");
        uint256 tmp = insureeBalances[sender];
        insureeBalances[sender] = 0;
        sender.transfer(tmp);

    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund() public payable
								
							 
								  
								   
    {
    }

    function getKey(
        address insuree,
        address airline,
        string memory flight,
        uint256 timestamp
    ) pure internal returns(bytes32){
        return keccak256(abi.encodePacked(insuree, airline, flight, timestamp));
    }

    function getFlightKey
    (
        address airline,
        string memory flight,
        uint256 timestamp
    )
    pure
    internal
    returns (bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }


    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function()
    external
    payable
    {
        fund();
    }


}
