var fs = require("fs");
var Web3 = require('web3'); 

var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8100'));

var accounts = []; // Account hash - Gas spent - # Transactions

var start = 8000;
// var start = 0;

// var end = 8000;
var end = null;

var contract = "0xf176c2f03773b63a6e3659423d7380bfa276dcb3";
var numberOfBlocks = 0;

module.exports = {

  printPaok: function() {
    // console.log('PAOK');
    return 'PAOK';
  },


  getPeersNumber: function() {
    return web3.net.peerCount();
  },


  gasAccounts: function(account, gas) {
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

    // prints();
  },

  getAllTransactions: function(startBlockNumber, endBlockNumber) {
    var getBlockPromises = [];
    var blockNumberPromise = [];
    blockNumberPromise.push(web3.eth.getBlockNumber());

    Promise.all(blockNumberPromise).then(res => {
      if (endBlockNumber == null) {
        endBlockNumber = res;
        end = res;
      }

      if (startBlockNumber == null || startBlockNumber > endBlockNumber) {
        startBlockNumber = endBlockNumber/10;
        start = startBlockNumber;
      }

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
            // if ((block.number-start)%10 == 0) {
            //   getContractResults(block.number);
            // }
            

            block.transactions.forEach(e => {
              if (e.input != "0x") {
                // console.log("");
                // console.log("Account: " + e.from + " ,TO: " + e.to  + " , called FUNCTION: " + e.input);
                // console.log("");
                receiptsPromises.push(getTransactionReceiptFun(e.hash));
              }
            });

            
          }
        });

        Promise.all(receiptsPromises).then(res => {
          getContractResults();
          prints();
        }).catch(err => {
          console.log("ERROR receiptsPromises: " + err);
        });
      }).catch(err => {
        console.log("ERROR getBlockPromises: " + err);
      });
    }).catch(err => {
      console.log("ERROR getBlockNumber: " + err);
    });

  },

  getTransactionReceiptFun: function(txHash) {
    // return web3.eth.getTransactionReceipt(txHash);

    return  web3.eth.getTransactionReceipt(txHash).then(res => {
      if (res != null) {
        gasAccounts(res.from, res.gasUsed);
        // console.log("REs: " + res.blockNumber + " , End: " + end);
      }  
    }).catch(err => {
      console.log("ERROR getTransactionReceipt: " + err);
    });
  },

  prints: function() {
    // console.log("accounts.length: " + accounts.length);
    console.log("");
    for (var i = 0; i < accounts.length; i++) {
      console.log((i+1) + ")" + "Account: " + accounts[i][0] + " , gas spent: " + accounts[i][1] + " , # of transactions: " + accounts[i][2]);
    }
    console.log("");
    // console.log("");
    // console.log("");
  },

  printBalanceOfAccounts: function() {
    // var balancePromises = [];
    console.log("BALANCES");
    for (var i = 0; i < accounts.length; i++) {
      web3.eth.getBalance(accounts[i][0]).then(bal => {
        console.log("Account: " + accounts[i][0] + " ,balance: " + bal);
      }).catch(err => {
        console.log("ERROR: " + err);
      });
      // balancePromises.push(getBalanceOfAccount(accounts[i][0]));
    }

    // Promise.all(balancePromises).then(balances => {
    //   // balances.
    // })
  },

  printBalance: function(account) {
    getBalanceOfAccount(account).then(bal => {
      console.log("Account: " + account + " ,balance: " + bal);
    }).catch(err => {
      console.log("ERROR: " + err);
    });
  },

  getBalanceOfAccount: function(account) {
    return web3.eth.getBalance(account);
  },

  getContractResults: function() {
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

  getTransactionReceiptFunAccount: function(txHash, account) {

    return  web3.eth.getTransactionReceipt(txHash).then(res => {
      if (res != null && account == res.from) {
        gasAccounts(res.from, res.gasUsed);
      }  
    }).catch(err => {
      console.log("ERROR getTransactionReceipt: " + err);
    });
  },


  getTransactionsByAccount: function(myaccount, startBlockNumber, endBlockNumber) {
    var getBlockPromises = [];
    var blockNumberPromise = [];
    blockNumberPromise.push(web3.eth.getBlockNumber());

    Promise.all(blockNumberPromise).then(res => {
      if (endBlockNumber == null) {
        endBlockNumber = res;
        end = res;
      }

      if (startBlockNumber == null || startBlockNumber > endBlockNumber) {
        startBlockNumber = endBlockNumber/10;
        start = startBlockNumber;
      }

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
              if (e.input != "0x") {
                // console.log("");
                // console.log("Account: " + e.from + " ,TO: " + e.to  + " , called FUNCTION: " + e.input);
                // console.log("");
                receiptsPromises.push(getTransactionReceiptFunAccount(e.hash, myaccount));
              }
            });

            
          }
        });

        Promise.all(receiptsPromises).then(res => {
          getContractResults();
          prints();
        }).catch(err => {
          console.log("ERROR receiptsPromises: " + err);
        });
      }).catch(err => {
        console.log("ERROR getBlockPromises: " + err);
      });
    }).catch(err => {
      console.log("ERROR getBlockNumber: " + err);
    });

};


