var fs = require("fs");
var Web3 = require('web3');

////////////////////////////////////////////////////////////////////////////
////////////////////////// GLOBAL VARIABLES ////////////////////////////////
////////////////////////////////////////////////////////////////////////////

var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8100'));

// DATABASE TO BE
var dbBlocks = []; // ARRAY OF BLOCKS
// var dbTrans = [];
var dbTransRec = []; // ARRAY OF TRANSACTION RECEIPTS
var dbClearings = []; // BLOCK - PRICE - QUANTITY - TYPE
var silentBugs = []; // TRANSACTION - GAS SENT - GAS SPENT
var accounts = []; // Account hash - Gas sent - # Transactions

var previous_contracts_accounts = [];

var contract_first_approach = "0xf176c2f03773b63a6e3659423d7380bfa276dcb3";

// var contract = "0x501897c4a684590ee69447974519e86811f0a47d"; // automated bid
// var contract = "0x668e966f3f4cf884ad6eda65784ceacf89ef084a"; // new automated fixed
var contract = "0x368cbd3514a671e3a6c7d5ca865576a6face12fc";
// var contract = "0xf176c2f03773b63A6e3659423D7380bFA276Dcb3";

var accountOfCentralNode = "0XAD56CEDB7D9EE48B3B93F682A9E2D87F80221768";

var start = 1;
var end = 1000;
var lastBlock = 0;



module.exports = {

///////////////////////////////////////////////////////////////////////////////
/////////////////// Smart Contract - Smart Grid Functions /////////////////////
///////////////////////////////////////////////////////////////////////////////

  ////////// Get only transactions that are calls to functions of a Contract /////
  ///////////// IE a send Gas transaction will not be shown here /////////////////
  getAccountTransactionsGasSpentClearings: function(startBlockNumber, endBlockNumber, contract_arg) {
    // if (contract_arg != "") {
    //   previous_contracts_accounts.push(contract_arg);
    //   console.log("Pushed contract_arg: " + JSON.stringify(previous_contracts_accounts));
    // }

    return new Promise((resolve, reject) => {

      var getBlockPromises = [];
      var receiptsPromises = [];
      var blockNumberPromise = web3.eth.getBlockNumber();

      blockNumberPromise.then(res => {
        this.checkStartEndInput(startBlockNumber, endBlockNumber, res);
        startBlockNumber = start;
        endBlockNumber = end;

        // console.log("Using startBlockNumber: " + startBlockNumber);
        // console.log("Using endBlockNumber: " + endBlockNumber);

        for (var i = startBlockNumber; i <= endBlockNumber; i++) {
          check = this.searchFor(i);
          // console.log("CHECK: " + check);
          
          if (check == -1) { // DOESN'T EXIST
            var getBlock = web3.eth.getBlock(i, true);
            getBlockPromises.push(getBlock);
          } else { // ALREADY SAVED

            // console.log(JSON.stringify(dbBlocks));
            var blockSaved = dbBlocks[check];
            // console.log("Get from DB. block: " + blockSaved.number);
            if (contract_arg != "") {
              this.addToHistory(contract_arg);
              blockSaved.transactions.forEach(e => {
                if ((e.input != "0x") && (e.to == contract_arg)) {
                  receiptsPromises.push(this.getTransactionReceiptFun(e));
                }
              });
            } else {
              blockSaved.transactions.forEach(e => {
                if (e.input != "0x") {
                  receiptsPromises.push(this.getTransactionReceiptFun(e));
                }
              });
            }

          }

        }

        Promise.all(getBlockPromises).then(blocks => {
          // SAVE TO DB
          dbBlocks = dbBlocks.concat(blocks);
          dbBlocks.sort(function(a, b) {
            return a.number - b.number;
          });
          // console.log("Blocks: " + JSON.stringify(dbBlocks));

          
          // console.log("");
          // console.log("length before: " + accounts.length);
          accounts = [];
          // console.log("length after: " + accounts.length);
          blocks.forEach(block => {
            // console.log("BLOCK: " + block.number + " Number of transactions: " + block.transactions.length);
            if (block != null && block.transactions != null) {
              // console.log("Block with transactions");

              if (contract_arg != "") {
                block.transactions.forEach(e => {
                  if ((e.input != "0x") && (e.to == contract_arg)) {
                    // console.log("Call with contract_arg");
                    receiptsPromises.push(this.getTransactionReceiptFun(e));
                  }
                });
              } else {
                block.transactions.forEach(e => {
                  if (e.input != "0x") {
                    // console.log("Call WITHOUT contract_arg");
                    receiptsPromises.push(this.getTransactionReceiptFun(e));
                  }
                });
              }
            }
          });

          Promise.all(receiptsPromises).then(res => {
            // SAVE TO DB
            // console.log("Transactions Receipt: " + JSON.stringify(this.flatten(dbTransRec)));
            endStartAccount = [start, end];
            endStartAccount.push(silentBugs);
            endStartAccount.push(accounts);
            // setTimeout
            // console.log("RESOLVING");
            resolve(endStartAccount);

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
    if (account != "") {
      this.addToHistory(account);
    }

    var getBlockPromises = [];
    var blockNumberPromise = web3.eth.getBlockNumber();

    blockNumberPromise.then(res => {
      checkStartEndInput(startBlockNumber, endBlockNumber, res);
      startBlockNumber = start;
      endBlockNumber = end;

      // console.log("Using startBlockNumber: " + startBlockNumber);
      // console.log("Using endBlockNumber: " + endBlockNumber);

      for (var i = startBlockNumber; i <= endBlockNumber; i++) {
        check = this.searchFor(i);
        // console.log("CHECK: " + check);
        
        if (check == -1) { // DOESN'T EXIST
          var getBlock = web3.eth.getBlock(i, true);
          getBlockPromises.push(getBlock);
        }
      }

      Promise.all(getBlockPromises).then(blocks => {
        dbBlocks = dbBlocks.concat(blocks);
        dbBlocks.sort(function(a, b) {
          return a.number - b.number;
        });

        blocks = [];
        check = this.searchFor(startBlockNumber);
        for (var j = 0; j <= (endBlockNumber - startBlockNumber); j++) {
          blocks.push(dbBlocks[check+j]);
        }

        blocks.forEach(rs => {
          console.log("Block: " + rs.number);
        });

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

  getSpentGasOfAccount: function(startBlockNumber, endBlockNumber, account) {
    var transactionsReceiptsPromises = [];
    if (account != "") {
      this.addToHistory(account);
    }

    return new Promise((resolve, reject) => {

      var getBlockPromises = [];
      var blockNumberPromise = web3.eth.getBlockNumber();

      blockNumberPromise.then(res => {
        this.checkStartEndInput(startBlockNumber, endBlockNumber, res);
        startBlockNumber = start;
        endBlockNumber = end;
        
        transactionsReceiptsPromises.push(this.getBalance(account));

        for (var i = startBlockNumber; i <= endBlockNumber; i++) {
          check = this.searchFor(i);
          
          if (check == -1) { // DOESN'T EXIST
            var getBlock = web3.eth.getBlock(i, true);
            getBlockPromises.push(getBlock);
          } else { // ALREADY SAVED
            // console.log("BLOCK FOUND: " + check);
            var blockSaved = dbBlocks[check];
            // console.log("Get from DB. block: " + blockSaved.number);
            blockSaved.transactions.forEach(e => {
              if (e.input != "0x") {
                transactionsReceiptsPromises.push(this.getTranscationInfo(e.hash));
              }
            });

          }

        }

        Promise.all(getBlockPromises).then(blocks => {
          // SAVE TO DB
          dbBlocks = dbBlocks.concat(blocks);
          dbBlocks.sort(function(a, b) {
            return a.number - b.number;
          });
          // console.log("Blocks: " + JSON.stringify(dbBlocks));

          blocks.forEach(block => {
            // console.log("BLOCK: " + block.number + " Number of transactions: " + block.transactions.length);
            if (block != null && block.transactions != null) {

              block.transactions.forEach(e => {
                if (e.input != "0x") {
                  transactionsReceiptsPromises.push(this.getTranscationInfo(e.hash));
                }
              });
              
            }
          });

          Promise.all(transactionsReceiptsPromises).then(res => {

            startEndBalanceGasSpentReceipts = [start, end];
            // push Balance of Account
            startEndBalanceGasSpentReceipts.push(res[0]);
            // Delete balance from initial array,
            // Keep only the receipts
            res.shift();
            res.sort(function(a, b) {
              return a.blockNumber - b.blockNumber;
            });

            // res.forEach(rs => {
            //   console.log("BL: " + rs.blockNumber);
            // });
            
            var gasSpentBlock = []; // Block - Gas Spent
            var totalGasSpent = 0;
            account = account.toUpperCase();

            // GET POS of start Block in the saved Blocks
            check = this.searchFor(start);
            var j = 0;
            var gasUsedInBlockOfAccount = 0;

            // dbBlocks.forEach((res, index) => {
            //   console.log(index + " : " + res.number);
            // });
            // console.log("CHECK: " + check);
            // console.log("i: " + (end-start))

            // FOR THE SPECIFIED BLOCKS
            // FOR EACH BLOCK, CHECK TRANSACTIONS THAT ARE FROM THE SPECIFIED ACCOUNT
            // SUMUP SPENT GAS OF TRANSACATIONS IN THE SAME BLOCK
            // PUSH ARRAY [BLOCK NUMBER, GAS SPENT OF ACCOUNT, GAS LIMIT OF BLOCK]
            for (var i = 0; i <= end-start; i++) {

              while( (j < res.length) && (res[j].blockNumber <= dbBlocks[check+i].number)) {

                if ((res[j].blockNumber == dbBlocks[check+i].number) && (account == res[j].from.toUpperCase())) {
                  // console.log("Account1: " + account)
                  // console.log("Account2: " + res[j].from.toUpperCase())
                  gasUsedInBlockOfAccount += res[j].gasUsed;
                }
                j++;
              }

              gasSpentBlock.push([dbBlocks[check+i].number, gasUsedInBlockOfAccount, dbBlocks[check+i].gasLimit]);
              totalGasSpent += gasUsedInBlockOfAccount;
              gasUsedInBlockOfAccount = 0;
              j = 0;
            }

            // Push Total Gas Spent
            startEndBalanceGasSpentReceipts.push(totalGasSpent);
            // Push [Block - Gas Spent] Array
            startEndBalanceGasSpentReceipts.push(gasSpentBlock);

            resolve(startEndBalanceGasSpentReceipts);

          }).catch(err => {
            console.log("ERROR transactionsReceiptsPromises: " + err);
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

  getBlockInfoMinimal: function(blockNumber) {
    return new Promise((resolve, reject) => {

      var getBlockPromises = [];
      var blockNumberPromise = web3.eth.getBlockNumber();

      blockNumberPromise.then(res => {
        
        if (blockNumber <= res) {
          check = this.searchFor(blockNumber);

          if (check == -1) {
            web3.eth.getBlock(blockNumber, true).then(bl => {
              // console.log("GET BLOCK: " + blockNumber);
              // SAVE TO DB
              dbBlocks.push(bl);
              dbBlocks.sort(function(a, b) {
                return a.number - b.number;
              });
              // console.log(JSON.stringify(dbBlocks));

              resolve(bl);

            });
            

          } else {
            // console.log("AAAAAAAAAAAAAAAAA");
            var getBlock = dbBlocks[check];
            resolve(getBlock);
          }
        } else {
          // console.log("VVVVVVVVVVVVV"); 
          web3.eth.getBlock(res, true).then(bl => {
            // console.log("IN IFFFF GET BLOCK: " + res);
            // SAVE TO DB
            dbBlocks.push(bl);
            dbBlocks.sort(function(a, b) {
              return a.number - b.number;
            });
            // console.log(JSON.stringify(dbBlocks));

            resolve(bl);
          });
        }


      });
    }).catch(err => {
      console.log("ERROR getBlockInfo: " + err);
      reject(err);
    });
  },

  getTransactionsPerBlock: function(startBlockNumber, endBlockNumber) {
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
          check = this.searchFor(i);
          // console.log("CHECK: " + check);
          
          if (check == -1) { // DOESN'T EXIST
            var getBlock = web3.eth.getBlock(i, true);
            getBlockPromises.push(getBlock);
          }

        }

        Promise.all(getBlockPromises).then(blocks => {
          // SAVE TO DB
          dbBlocks = dbBlocks.concat(blocks);

          dbBlocks.sort(function(a, b) {
            return a.number - b.number;
          });
          // console.log("Blocks: " + JSON.stringify(dbBlocks));

          var transactionsPerBlock = [];
          transactionsPerBlock.push([startBlockNumber, endBlockNumber]);

          for (var j = startBlockNumber; j <= endBlockNumber; j++) {
            rCheck = this.searchFor(j);
            if (rCheck != -1) {
              transactionsPerBlock.push([j, dbBlocks[rCheck].transactions.length]);
              // console.log("BLOCK NUMBER: " + dbBlocks[rCheck].number + " =?= " + j);
            } else {
              console.log("BLOCK: " + j + " , doesn't exist!");
            }
          }

          resolve(transactionsPerBlock);
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

  getTransactionReceiptFun: function(tx) {
    return new Promise((resolve, reject) => {
      web3.eth.getTransactionReceipt(tx.hash).then(res => {
        // dbTransRec.push(res);

        if (res != null) {
          // console.log("EXECUTING");
          check = this.searchForSilentBugs(tx.hash);
          if (check == -1) {
            if (tx.gas == res.gasUsed) {
              // console.log("FOUND NEW SILENT BUG");
              silentBugs.push([tx.hash, tx.gas, res.gasUsed]);
            }
          }

          this.saveAccountTransactionsSpentGas(res.from, res.gasUsed).then(res => {
            resolve(res);
          });
        }  
      }).catch(err => {
        console.log("ERROR getTransactionReceipt: " + err);
        reject(err);
      });
    });
  },

  saveAccountTransactionsSpentGas: function(account, gas) {
    return new Promise((resolve, reject) => {
      var found = false;

      for (var i = 0; i < accounts.length; i++) {

        var str1 = parseInt(accounts[i][0]);
        var str2 = parseInt(account);

        if (str1 == str2) {
          // console.log("+1");
          accounts[i][1] += gas;
          accounts[i][2] += 1;
          found = true;
          break;
        }
      }

      if (!found) {
        // console.log("PUSH NEW ACCOUNT");
        newAccount = new Object([account, gas, 1]);
        accounts.push(newAccount);
      }

      accounts.sort(function(a, b) {
        return a[2] - b[2];
      });

      resolve(true);
    });
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
    // console.log("TYPE of start: " + typeof startBlockNumber);
    // console.log("TYPE of end: " + typeof endBlockNumber);
    startBlockNumber = parseInt(startBlockNumber);
    endBlockNumber = parseInt(endBlockNumber);
    lastBlock = endOfBlockEth;
    // console.log("Last block: " + lastBlock);
    // console.log("startBlockNumber: " + startBlockNumber);
    // console.log("endBlockNumber: " + endBlockNumber);

    if (endBlockNumber == 1 && startBlockNumber == 1) {
      startBlockNumber = start;
      endBlockNumber = end;
    } else {
      if (!endBlockNumber) {
        // console.log("CHANGES 0");
        endBlockNumber = endOfBlockEth;
        end = endOfBlockEth;
        if (!startBlockNumber) {
          // console.log("CHANGES 0.1");
          startBlockNumber = endBlockNumber - 1000;
        }
        if (startBlockNumber <= 0) {
          // console.log("CHANGES");
          startBlockNumber = 1;
        }
        start = startBlockNumber;  
      } else {
        // console.log("CHANGES 1");
        if (endBlockNumber > endOfBlockEth) {
          // console.log("CHANGES 1.1");
          endBlockNumber = endOfBlockEth;
        }
        end = endBlockNumber;
        if ((!startBlockNumber) || (parseInt(startBlockNumber) > parseInt(endBlockNumber))) {
          // console.log("CHANGES 1.2");
          startBlockNumber = endBlockNumber - 1000;
        }
        if (startBlockNumber <= 0) {
          // console.log("CHANGES 1.3");
          startBlockNumber = 1;
        }
        start = startBlockNumber;  
      }
    }


    // console.log("START: " + start);
    // console.log("END: " + end);
    // this.saveStartEndLF(start, end);
  },

  /////////////////////////// Get Clearing Values //////////////////////////////

  getContractResults: function(contract_arg) {
    if (contract_arg != "") {
      this.addToHistory(contract_arg);
    }

    return new Promise((resolve, reject) => {
      var promisesAllgetClearing = [];

      promisesAllgetClearing.push(this.getClearingPrice(contract_arg));
      promisesAllgetClearing.push(this.getclearingQuantity(contract_arg));
      promisesAllgetClearing.push(this.getclearingType(contract_arg));

      Promise.all(promisesAllgetClearing).then(clearings => {
        resolve(clearings);

      }).catch(err => {
        reject(err);
        console.log("ERROR: " + err);
      });

    });
  },

  getClearingPrice: function(contract_arg) {
    return web3.eth.call({to: contract_arg, data: "0x901a40a7"});
  },

  getclearingQuantity: function(contract_arg) {
    return web3.eth.call({to: contract_arg, data: "0x14fffa15"});
  },

  getclearingType: function(contract_arg) {
    return web3.eth.call({to: contract_arg, data: "0xbc3d513f"});
  },

  ///////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////// Get Storage on Previous Blocks /////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  // More info about storage at specified block here:
  // https://medium.com/aigang-network/how-to-read-ethereum-contract-storage-44252c8af925

  getClearingsThroughTime: function(startBlockNumber, endBlockNumber, contract_arg) {
    if (contract_arg != "") {
      this.addToHistory(contract_arg);
    }

    return new Promise((resolve, reject) => {
      // console.log("Contract: " + contract_arg);
      contract_arg = contract_arg.toLowerCase();
      var storagePromises = [];
      var getBlocksPromises = [];
      var blockNumberPromise = web3.eth.getBlockNumber();

      blockNumberPromise.then(res => {
        this.checkStartEndInput(startBlockNumber, endBlockNumber, res);
        startBlockNumber = start;
        endBlockNumber = end;

        for (var i = startBlockNumber; i <= endBlockNumber; i++) {
          getBlocksPromises.push(this.getBlockInfoMinimal(i));
        }

        Promise.all(getBlocksPromises).then(rs => {
          // console.log("length: " + dbBlocks.length);

          for (var i = startBlockNumber; i <= endBlockNumber; i++) {
            checkCl = this.searchForInArray(dbClearings, i);
            if (checkCl == -1) {
              checkBL = this.searchFor(startBlockNumber);
              if (checkBL == -1) {
                console.log("BLOCK DINDNT FOUND");
              }
              timestamp = this.decodeTime(dbBlocks[checkBL].timestamp);
              // console.log("Push promise, timestamp: " + timestamp);
              storagePromises.push(this.getStorageAtBlock(i, contract_arg, timestamp));
            }
          }

          Promise.all(storagePromises).then(res => {
            // console.log("LENGTH: " + res.length);
            dbClearings = dbClearings.concat(res);

            dbClearings.sort(function(a, b) {
              return a[0] - b[0];
            });

            res = [];

            check = this.searchForInArray(dbClearings, startBlockNumber);
            // console.log("DBClearings");
            for (i = 0; i <= (endBlockNumber - startBlockNumber); i++) {
              if (check == -1) {
                console.log("Didnt found in dbClearings");
              } else {
                if (contract_arg == dbClearings[check+i][5]) {
                  // console.log("FOUND CONTRACT IN DB");
                  res.push(dbClearings[check+i]);
                } else {
                  console.log("DIFERRENT CONTRACTS: " + contract_arg + " - " + dbClearings[check+i][5]);
                }
                // console.log("Push clearing of block: " + dbClearings[check+i]);
              }
            }

            endStartClear = [start, end];
            // console.log(JSON.stringify(res));
            endStartClear.push(res);

            resolve(endStartClear);

          }).catch(err => {
            reject(err);
            console.log("ERROR storagePromises: " + err);
          });

        }).catch(err => {
          reject(err);
          console.log("ERROR getBlocksPromises: " + err);
        });
      });

    });
  },

  getStorageAtBlock: function(block, contract_arg, timestamp) {
    return new Promise((resolve, reject) => {
      var promiseGetStorageAll = [];

      promiseGetStorageAll.push(this.getStorageAtBlockPrice(block, contract_arg));
      promiseGetStorageAll.push(this.getStorageAtBlockQuantity(block, contract_arg));
      promiseGetStorageAll.push(this.getStorageAtBlockType(block, contract_arg));

      Promise.all(promiseGetStorageAll).then(clearings => {
        var result = [];
        result.push(block);
        result.push(timestamp);
        
        clearings[0] = parseInt(clearings[0]);
        clearings[1] = parseInt(clearings[1]);
        clearings[2] = parseInt(clearings[2]);

        result.push(clearings);
        result = this.flatten(result);
        result.push(contract_arg);

        resolve(result);
      }).catch(err => {
        reject(err);
        console.log("ERROR promiseGetStorageAll: " + err);
      });
    });
  },

  getStorageAtBlockPrice: function(block, contract_arg) {
    return web3.eth.getStorageAt(contract_arg, 6, block).catch(err => {
      console.log("ERROR getStorageAtBlockPrice: " + err);
      return -99;
    });
  },

  getStorageAtBlockQuantity: function(block, contract_arg) {
    return web3.eth.getStorageAt(contract_arg, 5, block).catch(err => {
      console.log("ERROR getStorageAtBlockQuantity: " + err);
      return -99;
    });
  },

  getStorageAtBlockType: function(block, contract_arg) {
    return web3.eth.getStorageAt(contract_arg, 7,block).catch(err => {
      console.log("ERROR getStorageAtBlockType: " + err);
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

  searchFor: function(blockNumber) {
    // console.log("A: " +JSON.stringify(dbBlocks));
    return dbBlocks.findIndex(element => {
      return element.number == blockNumber;
    });
  },

  searchForInArray: function(gasSpentBlock, blockNumber) {
    return gasSpentBlock.findIndex(element => {
      if (element) {
        return element[0] == blockNumber;
      } else {
        return -1;
      }
    });
  },

  searchForSilentBugs: function(hash) {
    return silentBugs.findIndex(element => {
      return element[0] == hash;
    });
  },

  ///////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////// EXTRA HELP FUNCTIONS ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  getAccountInfo: function(start_block, end_block, account) {
    if (account != "") {
      this.addToHistory(account);
    }

    return new Promise((resolve, reject) => {
      var promisesDif = [];
      // console.log("BEGIN");
      promisesDif.push(this.getBalance(account));
      promisesDif.push(this.getNumberOfTransactions(account));
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

  getPendingTransactions: function() {
    var subscription = web3.eth.subscribe('pendingTransactions', (error, result) => {
      if (!error)
          console.log(result);
    })
    .on("data", function(transaction){
        console.log("Pending: " + transaction);
    });
  },

  getNumberOfTransactions: function(account) {
    if (account != "") {
      this.addToHistory(account);
    }

    return new Promise((resolve, reject) => {
      web3.eth.getTransactionCount(account).then(res => {
        if (res != null) {
          // console.log("PAOK");
          resolve(res);
        }
      }).catch(err => {
        console.log("ERROR getTransactionCount: " + err);
        reject(err);
      });
      
    });
  },

  getContractDetails: function(startBlockNumber, endBlockNumber) {
    var transactionsReceiptsPromises = [];

    return new Promise((resolve, reject) => {

      var getBlockPromises = [];
      var blockNumberPromise = web3.eth.getBlockNumber();

      blockNumberPromise.then(res => {
        this.checkStartEndInput(startBlockNumber, endBlockNumber, res);
        startBlockNumber = start;
        endBlockNumber = end;


        for (var i = startBlockNumber; i <= endBlockNumber; i++) {
          check = this.searchFor(i);
          
          if (check == -1) { // DOESN'T EXIST
            var getBlock = web3.eth.getBlock(i, true);
            getBlockPromises.push(getBlock);
          } else { // ALREADY SAVED

            var blockSaved = dbBlocks[check];
            // console.log("Get from DB. block: " + blockSaved.number);
            blockSaved.transactions.forEach(e => {
              if (e.input != "0x") {
                transactionsReceiptsPromises.push(this.getTranscationInfo(e.hash));
              }
            });

          }

        }

        Promise.all(getBlockPromises).then(blocks => {
          // SAVE TO DB
          dbBlocks = dbBlocks.concat(blocks);
          // console.log("Blocks: " + JSON.stringify(dbBlocks));

          // var receiptsPromises = [];
          blocks.forEach(block => {
            // console.log("BLOCK: " + block.number + " Number of transactions: " + block.transactions.length);
            if (block != null && block.transactions != null) {

              block.transactions.forEach(e => {
                if (e.input != "0x") {
                  transactionsReceiptsPromises.push(this.getTranscationInfo(e.hash));
                }
              });
              
            }
          });

          Promise.all(transactionsReceiptsPromises).then(receipts => {
            endStartContracts = [start, end]
            var transactionsReceiptsValid = [];
            console.log("Lenght of receipts: " + receipts.length);
            receipts.forEach(rs => {
              if (rs.contractAddress) {
                console.log("Found contract");
                transactionsReceiptsValid.push(rs);
              }
            });

            endStartContracts.push(transactionsReceiptsValid);
            resolve(endStartContracts);

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

  getTranscationInfo: function(hash) {
    return new Promise((resolve, reject) => {
      web3.eth.getTransaction(hash).then(rs => {

        if (rs != null) {
          web3.eth.getTransactionReceipt(hash).then(res => {
            if (res != null) {
              // console.log("Input: " + rs.input);
              res.input = rs.input;
              resolve(res);
            }
          }).catch(err => {
            console.log("ERROR getTransactionReceipt getTranscationInfo: " + err);
            resolve([]);
          });

        }
      }).catch(err => {
        console.log("ERROR getTransaction => getTranscationInfo: " + err);
        resolve([]);
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
    return new Promise((resolve, reject) => {
      web3.eth.getBalance(account).then(res => {
        if (res != null) {
          // console.log("PAOK");
          resolve(res);
        }
      }).catch(err => {
        console.log("ERROR getBalance: " + err);
        reject(err);
      });
      
    });
  },

  getLastBlockLocally: function() {
    if (lastBlock != 0) {
      // console.log('Local');
      return new Promise((resolve, reject) => {
        resolve(lastBlock);
      });
    } else {
      // console.log('Ger Promise');
      return web3.eth.getBlockNumber();
    }
  },

  getPreviousAccounts: function() {
    // console.log("ACCOUNTS: " + JSON.stringify(previous_contracts_accounts));
    return previous_contracts_accounts;
  },

  addToHistory: function(arg) {
    acc = arg.toLowerCase();
    var found = previous_contracts_accounts.find(function(element) {
      return element == acc;
    });

    if (!found) {
      previous_contracts_accounts.push(acc);
      // console.log("Pushed arg: " + arg);
    }
  },

  getTransactionsByAccount: function(startBlockNumber, endBlockNumber, myaccount) {
    if (myaccount != "") {
      this.addToHistory(myaccount);
    }

    return new Promise((resolve, reject) => {
      var transactionsR = [];
      var getBlockPromises = [];
      var blockNumberPromise = web3.eth.getBlockNumber();
      var promiseRec = [];

      blockNumberPromise.then(res => {
        this.checkStartEndInput(startBlockNumber, endBlockNumber, res);
        startBlockNumber = start;
        endBlockNumber = end;

        for (var i = startBlockNumber; i <= endBlockNumber; i++) {
          check = this.searchFor(i);
          // console.log("CHECK: " + check);
          
          if (check == -1) { // DOESN'T EXIST
            var getBlock = web3.eth.getBlock(i, true);
            getBlockPromises.push(getBlock);
          }
        }

        Promise.all(getBlockPromises).then(blocks => {
          dbBlocks = dbBlocks.concat(blocks);
          dbBlocks.sort(function(a, b) {
            return a.number - b.number;
          });

          blocks = [];
          check = this.searchFor(startBlockNumber);
          for (var j = 0; j <= (endBlockNumber - startBlockNumber); j++) {
            blocks.push(dbBlocks[check+j]);
            dbBlocks[check+j].transactions.forEach(e => {
              fromA = e.from.toUpperCase();
              myaccount = myaccount.toUpperCase();
              if (myaccount == "*" || myaccount == fromA) {
                promiseRec.push(web3.eth.getTransactionReceipt(e.hash));
              }
            });
          }

          Promise.all(promiseRec).then(trans => {
            blocks.forEach(block => {

              if (block != null && block.transactions != null) {

                block.transactions.forEach(e => {
                  fromA = e.from.toUpperCase();
                  myaccount = myaccount.toUpperCase();

                  if (myaccount == "*" || myaccount == fromA) {
                    input = e.input.toString();
                    fun = input.slice(0,10);
                    if (input.length > 10) {
                      input = input.slice(10);
                      input = "0x".concat(input);
                      help = web3.eth.abi.decodeParameters(['int256', 'int256'], input);
                      input = "";
                      input = input.concat(help[0]);
                      input = input.concat(", ");
                      input = input.concat(help[1]);
                      input = fun.concat(", ".concat(input));
                    }

                    trans.some((el) => {
                      if (el.transactionHash == e.hash) {
                        bug = ((e.gas == el.gasUsed) ? 1 : 0);
                        obj = new Object({
                          hash: e.hash, 
                          blockNumber: e.blockNumber, 
                          bug: bug, 
                          gasUsed: el.gasUsed, 
                          to: e.to, 
                          input: input
                        });
                        transactionsR.push(obj);
                        return true;
                      }
                    });
                  }

                });
              }

            });

            resolve(transactionsR);

          }).catch(err => {
            if(err != "ReferenceError: name is not define") {
              reject(err);
              console.log("ERROR promiseRec: " + err);
            }
          });

        }).catch(err => {
          if(err != "ReferenceError: name is not define") {
            reject(err);
            console.log("ERROR getBlockPromises: " + err);
          }
        });
      }).catch(err => {
        if(err != "ReferenceError: name is not define") {
          reject(err);
          console.log("ERROR getBlockNumber: " + err);
        }
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
    // var myContract =  new web3.eth.Contract(ABI, contract);

    // myContract

    // myContract.options.from = accountOfCentralNode;
    // myContract.options.gasPrice = '20000000000000';
    // myContract.options.gas = 5000000;
  },


  decodeTime: function(timestamp) {
    var date = new Date(timestamp*1000);
    // Hours part from the timestamp
    var hours = date.getHours();
    // Minutes part from the timestamp
    var minutes = "0" + date.getMinutes();
    // Seconds part from the timestamp
    // var seconds = "0" + date.getSeconds();
    // + ':' + seconds.substr(-2)

    // Will display time in 10:30:23 format
    var formattedTime = hours + ':' + minutes.substr(-2);
    return formattedTime;
  },

  flatten: function(arr) {
    return arr.reduce((flat, toFlatten) => {
      return flat.concat(Array.isArray(toFlatten) ? this.flatten(toFlatten) : toFlatten);
    }, []);
  },

}

