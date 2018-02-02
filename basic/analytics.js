var fs = require("fs");
var Web3 = require('web3');
var localforage = require('localforage');

////////////////////////////////////////////////////////////////////////////
////////////////////////// GLOBAL VARIABLES ////////////////////////////////
////////////////////////////////////////////////////////////////////////////

var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8100'));

var accounts = []; // Account hash - Gas spent - # Transactions
var contract = "0xf176c2f03773b63a6e3659423d7380bfa276dcb3";
var accountOfCentralNode = "0XAD56CEDB7D9EE48B3B93F682A9E2D87F80221768";

var start = 22000;
var end = 22600;



module.exports = {

///////////////////////////////////////////////////////////////////////////////
/////////////////// Smart Contract - Smart Grid Functions /////////////////////
///////////////////////////////////////////////////////////////////////////////

  ////////// Get only transactions that are calls to functions of a Contract /////
  ///////////// IE a send Gas transaction will not be shown here /////////////////
  getAccountTransactionsGasSpentClearings: function(startBlockNumber, endBlockNumber) {
    // accounts = [];

    return new Promise((resolve, reject) => {

      var getBlockPromises = [];
      var blockNumberPromise = web3.eth.getBlockNumber();

      blockNumberPromise.then(res => {
        this.checkStartEndInput(startBlockNumber, endBlockNumber, res);
        startBlockNumber = start;
        endBlockNumber = end;

        // console.log("Using startBlockNumber: " + startBlockNumber);
        // console.log("Using endBlockNumber: " + endBlockNumber);

        for (var i = startBlockNumber; i <= endBlockNumber; i++) {
          var getBlock = web3.eth.getBlock(i, true);
          getBlockPromises.push(getBlock);
        }

        Promise.all(getBlockPromises).then(blocks => {
          var receiptsPromises = [];
          blocks.forEach(block => {
            // console.log("BLOCK: " + block.number + " Number of transactions: " + block.transactions.length);
            if (block != null && block.transactions != null) {

              block.transactions.forEach(e => {
                if (e.input != "0x") {
                  receiptsPromises.push(this.getTransactionReceiptFun(e.hash));
                }
              });
              
            }
          });

          Promise.all(receiptsPromises).then(res => {
            resolve(accounts);

          }).catch(err => {
            console.log("ERROR receiptsPromises: " + err);
            reject(err);
          });
        }).catch(err => {
          console.log("ERROR getBlockPromises: " + err);
          reject(err);
        });
      }).catch(err => {
        console.log("ERROR getBlockNumber: " + err);
        reject(err);
      });

    });
  },

  getNumberOfTranscationsOfAccountPerBlock: function(startBlockNumber, endBlockNumber, account) {
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
  },

  getTransactionReceiptFun: function(txHash) {
    return  web3.eth.getTransactionReceipt(txHash).then(res => {
      if (res != null) {
        this.saveAccountTransactionsSpentGas(res.from, res.gasUsed);
      }  
    }).catch(err => {
      console.log("ERROR getTransactionReceipt: " + err);
    });
  },

  saveAccountTransactionsSpentGas: function(account, gas) {
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
  },

  printsAccountsResults: function() {
    console.log("");
    for (var i = 0; i < accounts.length; i++) {
      console.log((i+1) + ")" + "Account: " + accounts[i][0] + " , gas spent: " + accounts[i][1] + " , # of transactions: " + accounts[i][2]);
    }
    console.log("");
  },

  printTransactionInfo: function(e) {
    console.log("");
    console.log("Account: " + e.from + " ,TO: " + e.to  + " , called FUNCTION: " + e.input);
    console.log("");
  },
  
  ////////////////////////// Fix START && END block /////////////////////////

  checkStartEndInput: function(startBlockNumber, endBlockNumber, endOfBlockEth) {
    if (endBlockNumber == 1 && startBlockNumber == 1) {
      startBlockNumber = start;
      endBlockNumber = end;
    } else {
      if (endBlockNumber == null) {
        endBlockNumber = endOfBlockEth;
        end = endOfBlockEth;
        if (startBlockNumber == null) {
          startBlockNumber = endBlockNumber - 1000;
          start = startBlockNumber;
        }
      } else {
        end = endBlockNumber;
        start = startBlockNumber;
        if (startBlockNumber == null || startBlockNumber > endBlockNumber) {
          startBlockNumber = endBlockNumber - 1000;
          start = startBlockNumber;
        }
      }
    }


    // console.log("START: " + start);
    // console.log("END: " + end);
    // this.saveStartEndLF(start, end);
  },

  /////////////////////////// Get Clearing Values //////////////////////////////

  getContractResults: function() {
    return new Promise((resolve, reject) => {
      var promisesAllgetClearing = [];

      promisesAllgetClearing.push(this.getClearingPrice());
      promisesAllgetClearing.push(this.getclearingQuantity());
      promisesAllgetClearing.push(this.getclearingType());

      Promise.all(promisesAllgetClearing).then(clearings => {
        resolve(clearings);

      }).catch(err => {
        reject(err);
        console.log("ERROR: " + err);
      });

    });
  },

  getClearingPrice: function() {
    return web3.eth.call({to: contract, data: "0x901a40a7"});
  },

  getclearingQuantity: function() {
    return web3.eth.call({to: contract, data: "0x14fffa15"});
  },

  getclearingType: function() {
    return web3.eth.call({to: contract, data: "0xbc3d513f"});
  },

  ///////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////// Get Storage on Previous Blocks /////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  // More info about storage at specified block here:
  // https://medium.com/aigang-network/how-to-read-ethereum-contract-storage-44252c8af925

  getClearingsThroughTime: function(startBlockNumber, endBlockNumber) {
    return new Promise((resolve, reject) => {
      
      var storagePromises = [];
      var blockNumberPromise = web3.eth.getBlockNumber();

      blockNumberPromise.then(res => {
        this.checkStartEndInput(startBlockNumber, endBlockNumber, res);
        startBlockNumber = start;
        endBlockNumber = end;

        for (var i = startBlockNumber; i < endBlockNumber; i++) {
          storagePromises.push(this.getStorageAtBlock(i));
        }

        Promise.all(storagePromises).then(res => {
          resolve(res);

        }).catch(err => {
          reject(err);
          console.log("ERROR storagePromises: " + err);
        });

      });

    });
  },

  getStorageAtBlock: function(block) {
    return new Promise((resolve, reject) => {
      var promiseGetStorageAll = [];
      promiseGetStorageAll.push(this.getStorageAtBlockPrice(block));
      promiseGetStorageAll.push(this.getStorageAtBlockQuantity(block));
      promiseGetStorageAll.push(this.getStorageAtBlockType(block));

      Promise.all(promiseGetStorageAll).then(clearings => {
        var result = [];
        result.push(block);
        
        clearings[0] = parseInt(clearings[0]);
        clearings[1] = parseInt(clearings[1]);
        clearings[2] = parseInt(clearings[2]);

        result.push(clearings);
        result = this.flatten(result);

        resolve(result);
      }).catch(err => {
        reject(err);
        console.log("ERROR promiseGetStorageAll: " + err);
      });
    });
  },

  getStorageAtBlockPrice: function(block) {
    return web3.eth.getStorageAt(contract, 6, block).catch(err => {
      return -99;
    });
  },

  getStorageAtBlockQuantity: function(block) {
    return web3.eth.getStorageAt(contract, 5, block).catch(err => {
      return -99;
    });
  },

  getStorageAtBlockType: function(block) {
    return web3.eth.getStorageAt(contract, 7,block).catch(err => {
      return -99;
    });
  },

  checkPositionStorage: function() {
    for (var i = 0; i < 10; i++) {
      web3.eth.getStorageAt(contract, i).then(res => {
        // console.log("Index: " + i +" , val: " + res);
        console.log("Index: " + i +" , val: " + parseInt(res));
      });
    }
  },

  ///////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////// EXTRA HELP FUNCTIONS ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  getAccountInfo: function(start_block, end_block, account) {
    return new Promise((resolve, reject) => {
      var promisesDif = [];
      // console.log("BEGIN");
      promisesDif.push(this.getBalance(account));
      promisesDif.push(this.getTransactionsByAccount(start_block, end_block, account));

      Promise.all(promisesDif).then(res => {
        var results = [start, end];
        results.push(res);
        resolve(results);
      }).catch(err => {
        reject(err);
        console.log("ERROR promisesDif: " + err);
      });
    });
  },
  
  printBalanceOfAccounts: function() {
    console.log("BALANCES");
    for (var i = 0; i < accounts.length; i++) {
      web3.eth.getBalance(accounts[i][0]).then(bal => {
        console.log("Account: " + accounts[i][0] + " ,balance: " + bal);
      }).catch(err => {
        console.log("ERROR: " + err);
      });
    }
  },

  getBalance: function(account) {
    return web3.eth.getBalance(account);
  },

  getTransactionsByAccount: function(startBlockNumber, endBlockNumber, myaccount) {
    return new Promise((resolve, reject) => {
      var transactionsR = [];
      var getBlockPromises = [];
      var blockNumberPromise = web3.eth.getBlockNumber();

      blockNumberPromise.then(res => {
        this.checkStartEndInput(startBlockNumber, endBlockNumber, res);
        startBlockNumber = start;
        endBlockNumber = end;

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

                if (myaccount == "*" || myaccount == fromA) {
                  transactionsR.push([e.to, e.input]);
                }

              });
              
            }
          });

          // console.log("Transactions: " + JSON.stringify(transactionsR));
          resolve(transactionsR);

        }).catch(err => {
          reject(err);
          console.log("ERROR getBlockPromises: " + err);
        });
      }).catch(err => {
        reject(err);
        console.log("ERROR getBlockNumber: " + err);
      });
    });
  },

  getPeersNumber: function() {
    return web3.eth.net.getPeerCount();
  },

  getTimeDateOfBlock: function(block) {
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
  },

  clearContract: function() {
    var myContract =  new web3.eth.Contract(ABI, contract);

    myContract

    myContract.options.from = accountOfCentralNode;
    myContract.options.gasPrice = '20000000000000';
    myContract.options.gas = 5000000;
  },

  flatten: function(arr) {
    return arr.reduce((flat, toFlatten) => {
      return flat.concat(Array.isArray(toFlatten) ? this.flatten(toFlatten) : toFlatten);
    }, []);
  },

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