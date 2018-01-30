var fs = require("fs");
var Web3 = require('web3');

////////////////////////////////////////////////////////////////////////////
////////////////////////// GLOBAL VARIABLES ////////////////////////////////
////////////////////////////////////////////////////////////////////////////

var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8100'));

var accounts = []; // Account hash - Gas spent - # Transactions
var contract = "0xf176c2f03773b63a6e3659423d7380bfa276dcb3";
var accountOfCentralNode = "0XAD56CEDB7D9EE48B3B93F682A9E2D87F80221768";

var start = 1237;
var end = null;

/////////////////////////////////////////////////////////////////////////////
/////////////////////////// RUN PARTITION ///////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

getAccountTransactionsGasSpentClearings(start, end);

// getNumberOfTranscationsOfAccountPerBlock(start, end, accountOfCentralNode);
// getTransactionsByAccount(start, end, accountOfCentralNode);
// clearContract();
// getClearingsThroughTime(start, end);

///////////////////////////////////////////////////////////////////////////////
/////////////////// Smart Contract - Smart Grid Functions /////////////////////
///////////////////////////////////////////////////////////////////////////////

////////// Get only transactions that are calls to functions of a Contract /////
///////////// IE a send Gas transaction will not be shown here /////////////////
function getAccountTransactionsGasSpentClearings(startBlockNumber, endBlockNumber) {
  var getBlockPromises = [];
  var blockNumberPromise = web3.eth.getBlockNumber();

  blockNumberPromise.then(res => {
    checkStartEndInput(startBlockNumber, endBlockNumber, res);
    startBlockNumber = start;
    endBlockNumber = end;

    console.log("Using startBlockNumber: " + startBlockNumber);
    console.log("Using endBlockNumber: " + endBlockNumber);

    for (var i = startBlockNumber; i <= endBlockNumber; i++) {
      var getBlock = web3.eth.getBlock(i, true);
      getBlockPromises.push(getBlock);
    }

    Promise.all(getBlockPromises).then(blocks => {
      var receiptsPromises = [];
      blocks.forEach(block => {
        // console.log("BLOCK: " + block.number + " Number of transactions: " + block.transactions.length);
        if (block != null && block.transactions != null) {
          // if ((block.number-start)%10 == 0) {
          //   getContractResults(block.number);
          // }

          block.transactions.forEach(e => {
            if (e.input != "0x") {
              // printTransactionInfo(e);
              receiptsPromises.push(getTransactionReceiptFun(e.hash));
            }
          });
          
        }
      });

      Promise.all(receiptsPromises).then(res => {
        getContractResults();
        printsAccountsResults();
      }).catch(err => {
        console.log("ERROR receiptsPromises: " + err);
      });
    }).catch(err => {
      console.log("ERROR getBlockPromises: " + err);
    });
  }).catch(err => {
    console.log("ERROR getBlockNumber: " + err);
  });
}

function getNumberOfTranscationsOfAccountPerBlock(startBlockNumber, endBlockNumber, account) {
  var getBlockPromises = [];
  var blockNumberPromise = web3.eth.getBlockNumber();

  blockNumberPromise.then(res => {
    checkStartEndInput(startBlockNumber, endBlockNumber, res);
    startBlockNumber = start;
    endBlockNumber = end;

    console.log("Using startBlockNumber: " + startBlockNumber);
    console.log("Using endBlockNumber: " + endBlockNumber);

    for (var i = startBlockNumber; i <= endBlockNumber; i++) {
      var getBlock = web3.eth.getBlock(i, true);
      getBlockPromises.push(getBlock);
    }

    Promise.all(getBlockPromises).then(blocks => {
      var receiptsPromises = [];
      blocks.forEach(block => {

        if (block != null && block.transactions != null) {

          var numOfTran = 0;

          block.transactions.forEach(e => {
            var fromA = e.from.toUpperCase();
            account = account.toUpperCase();
            if (e.input != "0x" && fromA == account) {
              numOfTran++;
            }
          });

          console.log(block.number + "," + numOfTran);
          
        } else {
          console.log(block.number + "," + 0);          
        }


      });

    }).catch(err => {
      console.log("ERROR getBlockPromises: " + err);
    });
  }).catch(err => {
    console.log("ERROR getBlockNumber: " + err);
  });
}

function getTransactionReceiptFun(txHash) {
  return  web3.eth.getTransactionReceipt(txHash).then(res => {
    if (res != null) {
      saveAccountTransactionsSpentGas(res.from, res.gasUsed);
    }  
  }).catch(err => {
    console.log("ERROR getTransactionReceipt: " + err);
  });
}

function saveAccountTransactionsSpentGas(account, gas) {
  var found = false;

  for (var i = 0; i < accounts.length; i++) {

    var str1 = parseInt(accounts[i][0]);
    var str2 = parseInt(account);

    if (str1 == str2) {
      accounts[i][1] += gas;
      accounts[i][2] += 1;
      found = true;
      break;
    }
  }

  if (!found) {
    newAccount = new Object([account, gas, 1]);
    accounts.push(newAccount);
  }
}

function printsAccountsResults() {
  console.log("");
  for (var i = 0; i < accounts.length; i++) {
    console.log((i+1) + ")" + "Account: " + accounts[i][0] + " , gas spent: " + accounts[i][1] + " , # of transactions: " + accounts[i][2]);
  }
  console.log("");
}

function printTransactionInfo(e) {
  console.log("");
  console.log("Account: " + e.from + " ,TO: " + e.to  + " , called FUNCTION: " + e.input);
  console.log("");
}

////////////////////////// Fix START && END block /////////////////////////

function checkStartEndInput(startBlockNumber, endBlockNumber, endOfBlockEth) {
  if (endBlockNumber == null) {
    endBlockNumber = endOfBlockEth;
    end = endOfBlockEth;
    if (startBlockNumber == null) {
      startBlockNumber = endBlockNumber - 1000;
      start = startBlockNumber;
    }
  } else {
    if (startBlockNumber == null || startBlockNumber > endBlockNumber) {
      startBlockNumber = endBlockNumber - 1000;
      start = startBlockNumber;
    }
  }
}

/////////////////////////// Get Clearing Values //////////////////////////////

function getContractResults() {
  var promisesAllgetClearing = [];

  promisesAllgetClearing.push(getClearingPrice());
  promisesAllgetClearing.push(getclearingQuantity());
  promisesAllgetClearing.push(getclearingType());

  Promise.all(promisesAllgetClearing).then(clearings => {
    console.log("");
    console.log("Clearing Price: " + parseInt(clearings[0]));
    console.log("Clearing Quantity: " + parseInt(clearings[1]));
    console.log("Clearing Type: " + parseInt(clearings[2]));
    console.log("");
  }).catch(err => {
    console.log("ERROR: " + err);
  });
}

function getClearingPrice() {
  return web3.eth.call({to: contract, data: "0x901a40a7"});
}

function getclearingQuantity() {
  return web3.eth.call({to: contract, data: "0x14fffa15"});
}

function getclearingType() {
  return web3.eth.call({to: contract, data: "0xbc3d513f"});
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
////////////////////// Get Storage on Previous Blocks /////////////////////////
///////////////////////////////////////////////////////////////////////////////

function getClearingsThroughTime(startBlockNumber, endBlockNumber) {
  var blockNumberPromise = web3.eth.getBlockNumber();

  blockNumberPromise.then(res => {
    checkStartEndInput(startBlockNumber, endBlockNumber, res);
    startBlockNumber = start;
    endBlockNumber = end;

    console.log("Using startBlockNumber: " + startBlockNumber);
    console.log("Using endBlockNumber: " + endBlockNumber);
    console.log("");

    for (var i = end; i > start ; i=i-40) {
      getStorageAtBlock(i);
    }

  });
}

function getStorageAtBlock(block) {

  var promiseGetStorageAll = [];
  promiseGetStorageAll.push(getStorageAtBlockPrice(block));
  promiseGetStorageAll.push(getStorageAtBlockQuantity(block));
  promiseGetStorageAll.push(getStorageAtBlockType(block));

  Promise.all(promiseGetStorageAll).then(clearings => {
    console.log("BLOCK: " + block);
    console.log("Clearing Price: " + parseInt(clearings[0]));
    console.log("Clearing Quantity: " + parseInt(clearings[1]));
    console.log("Clearing Type: " + parseInt(clearings[2]));
    console.log("");
  }).catch(err => {
    console.log("ERROR: " + err);
  });
}

function getStorageAtBlockPrice(block) {
  return web3.eth.getStorageAt(contract, 6, block).catch(err => {
    return -99;
  });
}

function getStorageAtBlockQuantity(block) {
  return web3.eth.getStorageAt(contract, 5, block).catch(err => {
    return -99;
  });
}

function getStorageAtBlockType(block) {
  return web3.eth.getStorageAt(contract, 7,block).catch(err => {
    return -99;
  });
}

function checkPositionStorage() {
  for (var i = 0; i < 10; i++) {
    web3.eth.getStorageAt(contract, i).then(res => {
      // console.log("Index: " + i +" , val: " + res);
      console.log("Index: " + i +" , val: " + parseInt(res));
    });
  }
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
////////////////////////// EXTRA HELP FUNCTIONS ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function printBalanceOfAccounts() {
  console.log("BALANCES");
  for (var i = 0; i < accounts.length; i++) {
    web3.eth.getBalance(accounts[i][0]).then(bal => {
      console.log("Account: " + accounts[i][0] + " ,balance: " + bal);
    }).catch(err => {
      console.log("ERROR: " + err);
    });
  }
}

function printBalance(account) {
  web3.eth.getBalance(account).then(bal => {
    console.log("Account: " + account + " ,balance: " + bal);
  }).catch(err => {
    console.log("ERROR: " + err);
  });
}

function getTransactionsByAccount(startBlockNumber, endBlockNumber, myaccount) {
  var getBlockPromises = [];
  var blockNumberPromise = web3.eth.getBlockNumber();

  blockNumberPromise.then(res => {
    checkStartEndInput(startBlockNumber, endBlockNumber, res);
    startBlockNumber = start;
    endBlockNumber = end;

    console.log("Using startBlockNumber: " + startBlockNumber);
    console.log("Using endBlockNumber: " + endBlockNumber);

    for (var i = startBlockNumber; i <= endBlockNumber; i++) {
      var getBlock = web3.eth.getBlock(i, true);
      getBlockPromises.push(getBlock);
    }

    Promise.all(getBlockPromises).then(blocks => {
      var receiptsPromises = [];
      blocks.forEach(block => {

        if (block != null && block.transactions != null) {

          block.transactions.forEach(e => {
            var fromA = e.from.toUpperCase();
            myaccount = myaccount.toUpperCase();
            if (myaccount == "*" || myaccount == e.from) {
              receiptsPromises.push(getTransactionReceiptFun(e.hash));
            }

              // printTransactionInfo(e);
          });
          
        }
      });

      Promise.all(receiptsPromises).then(res => {
        getContractResults();
        printsAccountsResults();
      }).catch(err => {
        console.log("ERROR receiptsPromises: " + err);
      });
    }).catch(err => {
      console.log("ERROR getBlockPromises: " + err);
    });
  }).catch(err => {
    console.log("ERROR getBlockNumber: " + err);
  });
}

function getPeersNumber() {
  return web3.net.peerCount;
}

function getTimeDateOfBlock(block) {
  web3.eth.getBlock(block,true).then(res => {
    var date = new Date(res.timestamp*1000);
    // Hours part from the timestamp
    var hours = date.getHours();
    // Minutes part from the timestamp
    var minutes = "0" + date.getMinutes();
    // Seconds part from the timestamp
    var seconds = "0" + date.getSeconds();
    var day = date.getDate();

    // Will display time in 10:30:23 format
    var formattedTime = day + " " + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    console.log(formattedTime);
  });
}

var ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "getGenerationsLength",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "clearing",
    "outputs": [
      {
        "name": "clearingQuantity",
        "type": "int256"
      },
      {
        "name": "clearingPrice",
        "type": "int256"
      },
      {
        "name": "clearingType",
        "type": "int256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_quantity",
        "type": "int256"
      },
      {
        "name": "_price",
        "type": "int256"
      }
    ],
    "name": "generationBid",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "getClearingQuantity",
    "outputs": [
      {
        "name": "",
        "type": "int256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [],
    "name": "marketClearing",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "getConsumptionsLength",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "blockNumberNow",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_quantity",
        "type": "int256"
      },
      {
        "name": "_price",
        "type": "int256"
      }
    ],
    "name": "consumptionBid",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "market",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "getClearingPrice",
    "outputs": [
      {
        "name": "",
        "type": "int256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "getClearingType",
    "outputs": [
      {
        "name": "",
        "type": "int256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [],
    "name": "deleteMapArrays",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "constructor"
  }
];

function clearContract() {
  var myContract =  new web3.eth.Contract(ABI, contract);

  myContract

  myContract.options.from = accountOfCentralNode;
  myContract.options.gasPrice = '20000000000000';
  myContract.options.gas = 5000000;
}


      // console.log("  tx hash          : " + res.hash + "\n"
      //   + "   cumulativeGas   : " + res.cumulativeGasUsed + "\n"
      //   + "   gasUsed         : " + res.gasUsed + "\n"
      // + "   blockHash       : " + res.blockHash + "\n"
      // + "   blockNumber     : " + res.blockNumber + "\n"
      // + "   transactionIndex: " + res.transactionIndex + "\n"
      //   + "   from            : " + res.from + "\n"
      //   + "   to              : " + res.to);

      



            // console.log("  tx hash          : " + e.hash + "\n"
            //   + "   nonce           : " + e.nonce + "\n"
            //   + "   blockHash       : " + e.blockHash + "\n"
            //   + "   blockNumber     : " + e.blockNumber + "\n"
            //   + "   transactionIndex: " + e.transactionIndex + "\n"
            //   + "   from            : " + e.from + "\n" 
            //   + "   to              : " + e.to + "\n"
            //   + "   value           : " + e.value + "\n"
            //   + "   time            : " + res.timestamp + " " + new Date(res.timestamp * 1000).toGMTString() + "\n"
            //   + "   gasPrice        : " + e.gasPrice + "\n"
            //   + "   gas             : " + e.gas + "\n"
            //   + "   input           : " + e.input);