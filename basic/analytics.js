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
var dbTransInfo = []; // ARRAY OF TRANSACTION RECEIPTS
var dbClearings = []; // BLOCK - PRICE - QUANTITY - TYPE
var silentBugs = []; // TRANSACTION - GAS SENT - GAS SPENT
var accounts = []; // Account hash - Gas sent - # Transactions

var previous_contracts_accounts = []; //history of contracts-accounts searched

var contract = "0x368cbd3514a671e3a6c7d5ca865576a6face12fc";
// var contract = "0xf176c2f03773b63A6e3659423D7380bFA276Dcb3";

var account1 = '0xad56cedb7d9ee48b3b93f682a9e2d87f80221768';
var account2 = '0x3d7979d2d4f1e4b56d4c70f8259b52504e84d655';
var account3 = '0xcdeca34ae13ce333bb120bec9aea6b7eedb94284';

var accountOfCentralNode = "0XAD56CEDB7D9EE48B3B93F682A9E2D87F80221768";

var start = 1;
var end = 1000;
var lastBlock = 0;



module.exports = {

///////////////////////////////////////////////////////////////////////////////
/////////////////// Smart Contract - Smart Grid Functions /////////////////////
///////////////////////////////////////////////////////////////////////////////

  syncStep: function(startBlockNumber, endBlockNumber, type) {
    return new Promise((resolve, reject) => {
      var blockNumberPromise = web3.eth.getBlockNumber();

      blockNumberPromise.then(res => {
        this.checkStartEndInput(startBlockNumber, endBlockNumber, res);
        startBlockNumber = start;
        endBlockNumber = end;

        var steps = this.getSteps(startBlockNumber, endBlockNumber);

        var stepCalls = [];
        if (type == 1) {
          for (var i = 0; i < steps.length - 1; i++) {
            ((i) => {
              if (i < steps.length -2) {
                stepCalls.push(() => this.sync(steps[i], steps[i+1]-1));
              } else {
                stepCalls.push(() => this.sync(steps[i], steps[i+1]));
              }
            })(i);
          }
        } else {
          for (var i = 0; i < steps.length - 1; i++) {
            ((i) => {
              if (i < steps.length -2) {
                stepCalls.push(() => this.syncBl(steps[i], steps[i+1]-1));
              } else {
                stepCalls.push(() => this.syncBl(steps[i], steps[i+1]));
              }
            })(i);
          }
        }

        const mySeriesPromise = stepCalls.reduce(
          (acc, crnt) => acc.then(() => crnt()),
          Promise.resolve()
        );

        mySeriesPromise.then(r => {
          endStartAccount = [start, end];
          resolve(endStartAccount);
        });

      }).catch(err => {
        console.log("ERROR sync: " + err);
        reject(err);
      });

    });
  },

  sync: function(startBlockNumber, endBlockNumber) {
    return new Promise((resolve, reject) => {


      this.syncBlocks(startBlockNumber, endBlockNumber).then((rs, err) => {
        this.syncTsReceipts(startBlockNumber, endBlockNumber).then(rsT => {

          console.log("IN PROMISE CALL: " + startBlockNumber + " - " + endBlockNumber);
          console.log("DB BLOCKS LENGTH: " + dbBlocks.length);
          console.log("DB Trans Receipts LENGTH: " + dbTransInfo.length);
          console.log(" ");

          resolve(true);
        }).catch(err => {
          console.log("ERROR syncTsReceipts Call: " + err);
          reject(err);
        });
      }).catch(err => {
        console.log("ERROR syncBlocks Call: " + err);
        reject(err);
        // resolve([]);
      });

    });
  },

  syncBl: function(startBlockNumber, endBlockNumber) {
    return new Promise((resolve, reject) => {

      this.syncBlocks(startBlockNumber, endBlockNumber).then(rs => {
        console.log("IN PROMISE CALL: " + startBlockNumber + " - " + endBlockNumber);
        console.log("DB BLOCKS LENGTH: " + dbBlocks.length);
        console.log(" ");

        resolve(true);
      });

    });
  },

  syncBlocks: function(startBlockNumber, endBlockNumber) {
   return new Promise((resolve, reject) => {

      var getBlockPromises = [];

      for (var i = startBlockNumber; i <= endBlockNumber; i++) {
        check = this.searchFor(i);
        // console.log("CHECK: " + check);
        
        if (check == -1) { // DOESN'T EXIST
          var getBlock = this.getBlockInfoMinimalNoChecks(i);
          getBlockPromises.push(getBlock);
        } else {
          console.log("BLOCK: " + i + " EXISTS ALREADY");
        }

      }

      Promise.all(getBlockPromises).then(blocks => {
        // SAVE TO DB
        dbBlocks = dbBlocks.concat(blocks);
        dbBlocks.sort(function(a, b) {
          return a.number - b.number;
        });

        resolve(dbBlocks);
      }).catch(err => {
        console.log("ERROR syncBlocks: " + err);
        reject(err);

        // resolve([]);
      });
    });
  },

  syncTsReceipts: function(startBlockNumber, endBlockNumber) {
    return new Promise((resolve, reject) => {
      var transactionsReceiptsPromises = [];

      check = this.searchFor(startBlockNumber);
      if (check == -1) {
        console.log("DIDN'T found block");
      } else {
        for (var i = 0; i <= endBlockNumber - startBlockNumber; i++) {
          // console.log("CHECK: " + check);
          bl = dbBlocks[check+i];
          if (bl != null && bl.transactions != null) {
            // console.log("Block with transactions");
            var ts = null;
            bl.transactions.forEach(e => {
              ts = this.searchTsInfoDbElement(e);
              // console.log("TS DB: " + ts);
              if (ts == null) {
                if (e.input != "0x") {
                  transactionsReceiptsPromises.push(this.getTranscationInfo(e));
                }
              } else {
                console.log("TS EXISTS ALREADY");
              }
            });
          }
        }
      }

      Promise.all(transactionsReceiptsPromises).then(tsR => {
        dbTransInfo.sort(function(a, b) {
          return a.blockNumber - b.blockNumber;
        });
        // console.log("RESOLVE TSREC");
        if (dbTransInfo) {
          resolve(dbTransInfo);
        } else {
          reject(dbTransInfo);
        }
      }).catch(err => {
        console.log("ERROR syncTsReceipts: " + err);
        reject(err);

        // resolve([]);
      });

    });
  },

  getSteps: function(startBlockNumber, endBlockNumber) {
    var startStep = startBlockNumber;

    var step = [startStep];
    while ((endBlockNumber - startStep) > 1000) {
      startStep = startStep + 1000;
      step.push(startStep);
    }
    step.push(endBlockNumber);
    return step;
  },

  sortDB() {
    dbBlocks.sort(function(a, b) {
      return a.number - b.number;
    });

    dbTransInfo.sort(function(a, b) {
      return a.blockNumber - b.blockNumber;
    });
  },

  syncContractVars: function(startBlockNumber, endBlockNumber, contract) {
    return new Promise((resolve, reject) => {
      var blockNumberPromise = web3.eth.getBlockNumber();

      blockNumberPromise.then(res => {
        this.checkStartEndInput(startBlockNumber, endBlockNumber, res);
        startBlockNumber = start;
        endBlockNumber = end;

        var steps = this.getSteps(startBlockNumber, endBlockNumber);

        var stepCalls = [];
        for (var i = 0; i < steps.length - 1; i++) {
          ((i) => {
            if (i < steps.length -2) {
              stepCalls.push(() => this.syncGetVarsStep(steps[i], steps[i+1]-1, contract));
            } else {
              stepCalls.push(() => this.syncGetVarsStep(steps[i], steps[i+1], contract));
            }
          })(i);
        }

        const mySeriesPromise = stepCalls.reduce(
          (acc, crnt) => acc.then(() => crnt()),
          Promise.resolve()
        );

        mySeriesPromise.then(r => {
          endStartAccount = [start, end];
          resolve(endStartAccount);
        });

      }).catch(err => {
        console.log("ERROR syncContractVars: " + err);
        reject(err);
      });

    });
  },

  syncGetVarsStep: function(startBlockNumber, endBlockNumber, contract_arg) {
   return new Promise((resolve, reject) => {

      var getContractVarPromises = [];

      for (var i = startBlockNumber; i <= endBlockNumber; i++) {
        checkCl = this.searchForInArray(dbClearings, i);
        if (checkCl == -1) {
          checkBL = this.searchFor(i);
          if (checkBL == -1) {
            console.log("BLOCK DINDNT FOUND");
          }
          // console.log("Push promise, timestamp: " + dbBlocks[checkBL].number + " & " + dbBlocks[checkBL].timestamp);
          // var timestamp = this.decodeTime(dbBlocks[checkBL].timestamp);
          // console.log("AFTER, timestamp: " + timestamp);
          getContractVarPromises.push(this.getStorageAtBlock(i, contract_arg, dbBlocks[checkBL].timestamp));
        }

      }

      Promise.all(getContractVarPromises).then(blocks => {

        // SAVE TO DB
        dbClearings = dbClearings.concat(blocks);

        dbClearings.sort(function(a, b) {
          return a[0] - b[0];
        });

        console.log("IN PROMISE CALL syncGetVarsStep: " + startBlockNumber + " - " + endBlockNumber);
        console.log("DB dbClearings LENGTH: " + dbClearings.length);
        console.log(" ");

        resolve(dbClearings);
      }).catch(err => {
        console.log("ERROR syncGetVarsStep: " + err);
        reject(err);
      });
    });
  },

  ////////// Get only transactions that are calls to functions of a Contract /////
  ///////////// IE a send Gas transaction will not be shown here /////////////////
  getAccountTransactionsGasSpentClearings: function(startBlockNumber, endBlockNumber, contract_arg, nickname) {
    console.time("Main Experiment");

    return new Promise((resolve, reject) => {
      var receiptsPromises = [];

      accounts = [];
      silentBugs = [];
      this.syncStep(startBlockNumber, endBlockNumber, 1).then(rs => {
        startBlockNumber = start;
        endBlockNumber = end;

        this.sortDB();
      
        var check = this.searchFor(startBlockNumber);
        console.log("FROM - TO BLOCK: " + startBlockNumber + " - " + endBlockNumber);
        var ts = null;
        if (contract_arg != "") {

          for (var j = 0; j <= (endBlockNumber - startBlockNumber); j++) {
            bl = dbBlocks[check+j];
            if (bl != null && bl.transactions != null) {
              // console.log("Block with transactions");
              var onj = new Object({hex: contract_arg, name: (nickname ? nickname : contract_arg)});
              this.addToHistory(onj);
              // console.log("Call with contract_arg");
              
              bl.transactions.forEach(e => {
                ts = this.searchTsInfoDbElement(e);
                // if (ts == null) {
                //   console.log("ERROR - DIDINT FOUND TS RECEIPT");
                //   // if ((e.input != "0x") && (e.to == contract_arg)) {
                //   //   receiptsPromises.push(this.getTransactionReceiptFun(e));
                //   // }
                // } else {
                if (ts.to) {
                  if (ts.to.toUpperCase() == contract_arg.toUpperCase()) {
                    receiptsPromises.push(this.createTableFromTxReceipt(ts));
                  }
                }
                // }
              });
            }
          }
        } else {
          for (var j = 0; j <= (endBlockNumber - startBlockNumber); j++) {
            bl = dbBlocks[check+j];
            if (bl != null && bl.transactions != null) {
              bl.transactions.forEach(e => {
                ts = this.searchTsInfoDbElement(e);
                // if (ts == null) {
                //   console.log("ERROR - DIDINT FOUND TS RECEIPT");
                //   // if (e.input != "0x") {
                //   //   receiptsPromises.push(this.getTransactionReceiptFun(e));
                //   // }
                // } else {
                //   // console.log("GETTING FROM DB");
                receiptsPromises.push(this.createTableFromTxReceipt(ts));
                // }
              });
            }
          }
        }

        Promise.all(receiptsPromises).then(res => {
          // SAVE TO DB
          // console.log("Transactions Receipt: " + JSON.stringify(this.flatten(dbTransRec)));
          endStartAccount = [start, end];
          endStartAccount.push(silentBugs);
          endStartAccount.push(accounts);
          // setTimeout
          // console.log("RESOLVING");
          console.timeEnd("Main Experiment");
          resolve(endStartAccount);

        }).catch(err => {
          console.log("ERROR receiptsPromises: " + err);
          reject(err);
        });
      }).catch(err => {
        console.log("ERROR syncStep: " + err);
        reject(err);
      });
    });
  },

  getTransactions: function(startBlockNumber, endBlockNumber, contract_arg, nickname) {
    console.time("getTransactions");

    return new Promise((resolve, reject) => {
      var receiptsPromises = [];

      accounts = [];
      silentBugs = [];
      this.syncStep(startBlockNumber, endBlockNumber, 1).then(rs => {
        startBlockNumber = start;
        endBlockNumber = end;

        this.sortDB();
      
        var check = this.searchFor(startBlockNumber);
        console.log("FROM - TO BLOCK: " + startBlockNumber + " - " + endBlockNumber);
        var ts = null;
        if (contract_arg != "") {

          for (var j = 0; j <= (endBlockNumber - startBlockNumber); j++) {
            bl = dbBlocks[check+j];
            if (bl != null && bl.transactions != null) {
              // console.log("Block with transactions");
              var onj = new Object({hex: contract_arg, name: (nickname ? nickname : contract_arg)});
              this.addToHistory(onj);
              // console.log("Call with contract_arg");
              
              bl.transactions.forEach(e => {
                // console.log("TS: " + e.hash);
                ts = this.searchTsInfoDbElement(e);
                // console.log("TS RETURNED: " + JSON.stringify(ts));
                // if (ts == null) {
                //   console.log("ERROR - DIDINT FOUND TS RECEIPT");
                //   // if ((e.input != "0x") && (e.to == contract_arg)) {
                //   //   receiptsPromises.push(this.getTransactionReceiptFun(e));
                //   // }
                // } else {
                if (ts.to) {
                  // console.log("TS.to: " + ts.to);
                  // console.log("TO: " + ts.to.toUpperCase());
                  // console.log("Contract: " + contract_arg.toUpperCase());
                  if (ts.to.toUpperCase() == contract_arg.toUpperCase()) {
                    receiptsPromises.push(this.creteTableOfTransactions(ts));
                  }
                }
                // }
              });
            }
          }
        } else {
          for (var j = 0; j <= (endBlockNumber - startBlockNumber); j++) {
            bl = dbBlocks[check+j];
            if (bl != null && bl.transactions != null) {
              bl.transactions.forEach(e => {
                ts = this.searchTsInfoDbElement(e);
                // if (ts == null) {
                //   console.log("ERROR - DIDINT FOUND TS RECEIPT");
                //   // if (e.input != "0x") {
                //   //   receiptsPromises.push(this.getTransactionReceiptFun(e));
                //   // }
                // } else {
                //   // console.log("GETTING FROM DB");
                receiptsPromises.push(this.creteTableOfTransactions(ts));
                // }
              });
            }
          }
        }

        Promise.all(receiptsPromises).then(res => {
          // SAVE TO DB
          // console.log("Transactions Receipt: " + JSON.stringify(this.flatten(dbTransRec)));
          endStartAccount = [start, end];
          endStartAccount.push(res);
          // setTimeout
          // console.log("RESOLVING");
          console.timeEnd("getTransactions");
          resolve(endStartAccount);

        }).catch(err => {
          console.log("ERROR receiptsPromises: " + err);
          reject(err);
        });
      });
    });
  },

  getSpentGasOfAccount: function(startBlockNumber, endBlockNumber, account, nickname) {
    console.time("SpentGasOfAccount");
    var transactionsReceiptsPromises = [];

    var onj = new Object({hex: account, name: (nickname ? nickname : account)});
    this.addToHistory(onj);

    return new Promise((resolve, reject) => {


      this.syncStep(startBlockNumber, endBlockNumber, 1).then(rs => {
        startBlockNumber = start;
        endBlockNumber = end;

        transactionsReceiptsPromises.push(this.getBalance(account));

        check = this.searchFor(startBlockNumber);
        for (var i = 0; i <= (endBlockNumber - startBlockNumber); i++) {
          
          // if (check != -1) { // DOESN'T EXIST

            dbBlocks[check+i].transactions.forEach(e => {
              if (e.input != "0x" && (this.searchTsInfoDB(e) == -1)) {
                console.log("ERROR - DIDINT FOUND TS RECEIPT");
                // transactionsReceiptsPromises.push(this.getTranscationInfo(e));
              }
            });

          // } else {
            // console.log("ERROR - BLOCK DOESNT EXIST");

          // }

        }

        Promise.all(transactionsReceiptsPromises).then(res => {

          startEndBalanceGasSpentReceipts = [start, end];
          // push Balance of Account
          startEndBalanceGasSpentReceipts.push(res[0]);
          // Delete balance from initial array,
          // Keep only the receipts
          // res.shift();
          
          var gasSpentBlock = []; // Block - Gas Spent
          var totalGasSpent = 0;
          account = account.toUpperCase();
          // account1 = account1.toUpperCase();
          // account2 = account2.toUpperCase();
          // account3 = account3.toUpperCase();


          // GET POS of start Block in the saved Blocks
          check = this.searchFor(start);

          // checkTsInfoIndexStart = -1;
          // while (checkTsInfoIndexStart == -1) {

          checkTsInfoIndexStart = dbTransInfo.findIndex(element => {
            return element.blockNumber >= start;
          });
            
          // }

          // console.log("START INDEX: " + checkTsInfoIndexStart);

          // checkTsInfoIndexEnd = -1;
          // while (checkTsInfoIndexEnd == -1) {
          checkTsInfoIndexEnd = -1;

          for (var k = dbTransInfo.length-1; k > checkTsInfoIndexStart; k++) {
            if (dbTransInfo[k].blockNumber <= end) {
              checkTsInfoIndexEnd = k;
              break;
            }
          }

          // console.log("END INDEX: " + checkTsInfoIndexEnd);

          // if (checkTsInfoIndexEnd == -1) {
          //   console.log("START == END");
          //   checkTsInfoIndexEnd = checkTsInfoIndexStart;
          // }


          var arDbTSInfo;
          if (checkTsInfoIndexEnd == -1) {
            arDbTSInfo = dbTransInfo.slice(checkTsInfoIndexStart);
          } else {
            arDbTSInfo = dbTransInfo.slice(checkTsInfoIndexStart, checkTsInfoIndexEnd+1);
          }
          // console.log("LENGTH arDbTSInfo AFTER: " + arDbTSInfo.length);
          var j = 0;
          var gasUsedInBlockOfAccount = 0;
          // console.log("A: " +JSON.stringify(dbTransInfo));


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

            while( (j < arDbTSInfo.length) && (arDbTSInfo[j].blockNumber <= dbBlocks[check+i].number)) {

              if ((arDbTSInfo[j].blockNumber == dbBlocks[check+i].number) && (account == arDbTSInfo[j].from.toUpperCase())) {
                console.log("Account: " + arDbTSInfo[j].from.toUpperCase());

                gasUsedInBlockOfAccount += arDbTSInfo[j].gasUsed;
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

          console.timeEnd("SpentGasOfAccount");
          resolve(startEndBalanceGasSpentReceipts);

        }).catch(err => {
          console.log("ERROR transactionsReceiptsPromises: " + err);
          reject(err);
        });
      });

    });
  },

  getGasPerBlock: function(startBlockNumber, endBlockNumber) {
    return new Promise((resolve, reject) => {

      var getBlockPromises = [];

      this.syncStep(startBlockNumber, endBlockNumber, 2).then(rs => {
        startBlockNumber = start;
        endBlockNumber = end;

        startEndGasPerBlock = [startBlockNumber, endBlockNumber];

        check = this.searchFor(startBlockNumber);
        if (check != -1) {
          for (var j = 0; j <= endBlockNumber - startBlockNumber; j++) {
            startEndGasPerBlock.push([dbBlocks[check+j].number, dbBlocks[check+j].gasUsed]);
          }
        } else {
          console.log("ERROR - BLOCK DOESNT EXIST");
        }

        resolve(startEndGasPerBlock);
      });

    });
  },

  getBalancePerBlockOfAccount: function(startBlockNumber, endBlockNumber, account, nickname) {
    return new Promise((resolve, reject) => {

      var getBlockPromises = [];
      // var receiptsPromises = [];
      var blockNumberPromise = web3.eth.getBlockNumber();

      blockNumberPromise.then(res => {
        this.checkStartEndInput(startBlockNumber, endBlockNumber, res);
        startBlockNumber = start;
        endBlockNumber = end;

        // console.log("Using startBlockNumber: " + startBlockNumber);
        // console.log("Using endBlockNumber: " + endBlockNumber);

        for (var i = startBlockNumber; i <= endBlockNumber; i++) {
          getBlockPromises.push(this.getBalance(account, i));

        }

        Promise.all(getBlockPromises).then(blocks => {
          // SAVE TO DB

          // console.log("JSON: " + JSON.stringify(blocks));

          startEndBalancePerBlock = [start, end];

          startEndBalancePerBlock.push(blocks);

          resolve(startEndBalancePerBlock);
          
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

  getBlockInfoMinimalNoChecks(blockNumber) {
    return new Promise((resolve, reject) => {
      web3.eth.getBlock(blockNumber, true).then(bl => {
        bl.timestamp = this.decodeTime(bl.timestamp);
        resolve(bl);
      });
    }).catch(err => {
      console.log("ERROR getBlockInfoMinimalNoChecks: " + err);
      reject(err);
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
              bl.timestamp = this.decodeTime(bl.timestamp);

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
            // getBlock.timestamp = this.decodeTime(getBlock.timestamp);
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
            bl.timestamp = this.decodeTime(bl.timestamp);
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

  getNumberOfTranscationsOfAccountPerBlock: function(startBlockNumber, endBlockNumber, account) {
    if (account != "") {
      this.addToHistory(account);
    }

    this.syncStep(startBlockNumber, endBlockNumber, 1).then(rs => {
      startBlockNumber = start;
      endBlockNumber = end; 

      blocks = [];
      check = this.searchFor(startBlockNumber);
      console.log("FROM - TO BLOCK: " + startBlockNumber + " - " + endBlockNumber);

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

    });
  },

  getTransactionReceiptFun: function(tx) {
    return new Promise((resolve, reject) => {
      web3.eth.getTransactionReceipt(tx.hash).then(res => {
        res.input = tx.input;
        res.gasPrice = tx.gasPrice;
        dbTransInfo.push(res);

        if (res != null) {
          res.gas = tx.gas;
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

  getTranscationInfo: function(e) {
    return new Promise((resolve, reject) => {
      web3.eth.getTransactionReceipt(e.hash).then(res => {
        if (res != null) {
          // console.log("Input: " + rs.input);
          res.input = e.input;
          res.gasPrice = e.gasPrice;
          // console.log("SAVE ON arDbTSInfo: ");
          // dbTransInfo.push(res);
          this.saveTsInfoDB(res);
          resolve(res);
        } else {
          // reject();
          console.log("NOTHING TO RETURN");
        }
      }).catch(err => {
        console.log("ERROR getTranscationInfo: " + err);
        reject(err);
      });
    }).catch(err => {
      console.log("ERROR getTranscationInfo Promise F: " + err);
      reject(err);
    });
  },

  getTranscationInfoHash: function(hash) {
    return new Promise((resolve, reject) => {
      web3.eth.getTransaction(hash).then(rs => {

        if (rs != null) {
          web3.eth.getTransactionReceipt(rs.hash).then(res => {
            if (res != null) {
              // console.log("Input: " + rs.input);
              res.input = rs.input;
              res.gasPrice = rs.gasPrice;
              console.log("SAVE ON arDbTSInfo: ");
              // dbTransInfo.push(res);
              this.saveTsInfoDB(res);
              resolve(res);
            }
          }).catch(err => {
            console.log("ERROR getTransactionReceipt getTranscationInfoHash: " + err);
            resolve([]);
          });

        }

      }).catch(err => {
        console.log("ERROR getTransaction => getTranscationInfoHash: " + err);
        resolve([]);
      });
      
    });
  },

  createTableFromTxReceipt: function(txRec) {
    return new Promise((resolve, reject) => {
      check = this.searchForSilentBugs(txRec.transactionHash);
      if (check == -1) {
        if (txRec.gas == txRec.gasUsed) {
          // console.log("FOUND NEW SILENT BUG");
          silentBugs.push([txRec.transactionHash, txRec.gas, txRec.gasUsed]);
        }
      }

      console.log("Save ts from block: " + txRec.blockNumber);

      this.saveAccountTransactionsSpentGas(txRec.from, txRec.gasUsed).then(res => {
        // console.log("Save on table from BLOCK: " + txRec.blockNumber);
        // console.log("");

        resolve(res);
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
          // console.log("Adding to existing account");
          // console.log("");
          accounts[i][1] += gas;
          accounts[i][2] += 1;
          found = true;
          break;
        }
      }

      if (!found) {
        // console.log("PUSH NEW ACCOUNT");
        // console.log("");
        newAccount = new Object([account, gas, 1]);
        accounts.push(newAccount);
      }

      accounts.sort(function(a, b) {
        return a[2] - b[2];
      });

      resolve(true);
    });
  },

  creteTableOfTransactions: function(txRec) {
    return new Promise((resolve, reject) => {
      console.log("Save ts from block: " + txRec.blockNumber);
      var input = txRec.input.toString();
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

      var obj = new Object({
        block: txRec.blockNumber,
        from: txRec.from,
        hash: txRec.transactionHash,
        to: txRec.to,
        input: input
      });
      resolve(obj);
      
    });
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


    console.log("START: " + start);
    console.log("END: " + end);
    // this.saveStartEndLF(start, end);
  },

  ///////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////// Get Storage on Previous Blocks /////////////////////////
  ////////////////////// FUNCTIONS FOR SPECIFIC CONTRACT ////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  // More info about storage at specified block here:
  // https://medium.com/aigang-network/how-to-read-ethereum-contract-storage-44252c8af925

  getClearingsThroughTime: function(startBlockNumber, endBlockNumber, contract_arg, nickname) { 
    var onj = new Object({hex: contract_arg, name: (nickname ? nickname : contract_arg)});
    this.addToHistory(onj);

    return new Promise((resolve, reject) => {
      // console.log("Contract: " + contract_arg);
      contract_arg = contract_arg.toLowerCase();
      var storagePromises = [];
      var getBlocksPromises = [];

      this.syncStep(startBlockNumber, endBlockNumber, 2).then(rs => {
        startBlockNumber = start;
        endBlockNumber = end;

        this.sortDB();
      
        var check = this.searchFor(startBlockNumber);
        console.log("FROM - TO BLOCK: " + startBlockNumber + " - " + endBlockNumber);
        
        this.syncContractVars(startBlockNumber, endBlockNumber, contract_arg).then(res => {
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
                // console.log("DIFERRENT CONTRACTS: " + contract_arg + " - " + dbClearings[check+i][5]);
              }
              // console.log("Push clearing of block: " + dbClearings[check+i]);
            }
          }
          
          endStartClear = [start, end];
          // console.log(JSON.stringify(res));
          endStartClear.push(res);
          resolve(endStartClear);
        });
      });

    });
  },

  getStorageAtBlock: function(block, contract_arg, timestamp) {
    return new Promise((resolve, reject) => {
      var promiseGetStorageAll = [];

      promiseGetStorageAll.push(this.getStorageAtBlockPriceCheck(block, contract_arg));
      promiseGetStorageAll.push(this.getStorageAtBlockQuantityCheck(block, contract_arg));
      promiseGetStorageAll.push(this.getStorageAtBlockTypeCheck(block, contract_arg));

      Promise.all(promiseGetStorageAll).then(clearings => {
        var result = [];
        result.push(block);
        result.push(timestamp);
        // console.log("Push: " + timestamp);
        
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

  getStorageAtBlockPriceCheck: function(block, contract_arg) {
    return new Promise((resolve, reject) => {
      this.getStorageAtBlockPrice(block, contract_arg).then(rs => {
        if (rs == -99) {
          console.log("CALLING getStorageAt AGAIN");
          this.getStorageAtBlockPrice(block, contract_arg).then(r => {
            console.log("RESOLVING: " + parseInt(r));
            resolve(r);
          });
          // resolve(rs);
        } else {
          resolve(rs);
        }
      })
    });
  },

  getStorageAtBlockPrice: function(block, contract_arg) {
    return web3.eth.getStorageAt(contract_arg, 6, block).catch(err => {
      console.log("ERROR getStorageAtBlockPrice: " + err);
      return -99;
    });
  },

  getStorageAtBlockQuantityCheck: function(block, contract_arg) {
    return new Promise((resolve, reject) => {
      this.getStorageAtBlockQuantity(block, contract_arg).then(rs => {
        if (rs == -99) {
          // console.log("CALLING getStorageAt AGAIN");
          // this.getStorageAtBlockQuantityCheck(block, contract_arg);
          this.getStorageAtBlockQuantity(block, contract_arg).then(r => {
            console.log("RESOLVING: " +  parseInt(r));
            resolve(r);
          });
        } else {
          resolve(rs);
        }
      })
    });
  },

  getStorageAtBlockQuantity: function(block, contract_arg) {
    return web3.eth.getStorageAt(contract_arg, 5, block).catch(err => {
      console.log("ERROR getStorageAtBlockQuantity: " + err);
      return -99;
    });
  },

  getStorageAtBlockTypeCheck: function(block, contract_arg) {
    return new Promise((resolve, reject) => {
      this.getStorageAtBlockType(block, contract_arg).then(rs => {
        if (rs == -99) {
          console.log("CALLING getStorageAtBlockTypeCheck AGAIN");
          // this.getStorageAtBlockTypeCheck(block, contract_arg);
          this.getStorageAtBlockType(block, contract_arg).then(r => {
            console.log("RESOLVING: " + parseInt(r));
            resolve(r);
          });
        } else {
          resolve(rs);
        }
      })
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

  /////////////////////////// Get Clearing Values At Current STATE //////////////////////////////

  getContractResults: function(contract_arg, nickname) {
    var onj = new Object({hex: contract_arg, name: (nickname ? nickname : contract_arg)});
    this.addToHistory(onj);

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

  ///////////////////////////////////// MARKET CHART ///////////////////////////////////////////

  marketChart: function(startBlockNumber, endBlockNumber) {
    return new Promise((resolve, reject) => {
      var storagePromises = [];
      var getBlocksPromises = [];

      this.syncStep(startBlockNumber, endBlockNumber, 2).then(rs => {
        startBlockNumber = start;
        endBlockNumber = end;
      
        var check = this.searchFor(startBlockNumber);
        console.log("FROM - TO BLOCK: " + startBlockNumber + " - " + endBlockNumber);
        var first_clear = null;
        var second_clear = null;
        var generation = [];
        var consumption = [];

        for (var i = 0; i <= end-start; i++) {

          dbBlocks[check+i].transactions.some(ts => {
            // console.log("IN SOME: " + ts.input);
            if (ts.input.toString().includes("0x256a9ea1")) {
              console.log("Found clearing - Block: " + ts.blockNumber + " pos: " + ts.transactionIndex);
              
              if (first_clear == null) {
                first_clear = {block: ts.blockNumber, index: ts.transactionIndex};
              } else {
                second_clear = {block: ts.blockNumber, index: ts.transactionIndex};
                return true;
              }

            } else {
              // console.log("ELSE");
              var inputSh = ts.input.toString();
              var quant = 0;
              var pric = 0;

              if (inputSh.length > 10) {
                inputSh = inputSh.slice(10);
                inputSh = "0x".concat(inputSh);
                help = web3.eth.abi.decodeParameters(['int256', 'int256'], inputSh);
                quant = help[0];
                pric = help[1];
              }

              if (first_clear) {
                if (ts.input.includes("0x0d31d41a")) { // generation
                  console.log("GENERATION Q,P: " + quant +', '+ pric);

                  generation = this.marketAdd(generation, quant, (pric > 300 ? 300 : pric));
                  // generation.push({quantity: quant, price: pric});
                } else { // consumption
                  console.log("CONSUMPTION Q,P: " + quant +', '+ pric);
                  consumption = this.marketAdd(consumption, quant, (pric > 300 ? 300 : pric));

                  // consumption.push({quantity: quant, price: pric});
                }
              }
            }
            
          });
          
          if (first_clear && second_clear) {
            console.log("FOUND BORDERS - STOP");
            console.log("FIRST CLEAR: " + first_clear.block + " , Index: " + first_clear.index);
            console.log("SECOND CLEAR: " + second_clear.block + " , Index: " + second_clear.index);

            break;
          }
        }



        endStartClear = [start, end];
        console.log("GENERATION TABLE:");
        console.log(generation.length);
        // console.log(JSON.stringify(generation));


        console.log("CONSUMPTION TABLE:");
        console.log(consumption.length);
        // console.log(JSON.stringify(consumption));


        generation = generation.sort((a, b) => {
          return a.price - b.price;
        });

        consumption = consumption.sort((a, b) => {
          return b.price - a.price;
        });
        // console.log(JSON.stringify(res));
        endStartClear.push(generation);
        endStartClear.push(consumption);

        resolve(endStartClear);

      });

    });
  },

  marketAdd: function(table, quantity, price) {
    var found = table.findIndex(el => {
      return el.price == parseInt(price);
    });

    if (found != -1) {
      table[found].quantity += parseInt(quantity);
    } else {
      table.push({quantity: parseInt(quantity), price: parseInt(price)});
    }

    return table;
  // "7f495ea5": "consumptionBid(int256,int256)",
  // "0d31d41a": "generationBid(int256,int256)",
  },

  ///////////////////////////////////////////////////////////////////////////////
  ///////////////////////////// SEARCH - SAVE ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  searchFor: function(blockNumber) {
    // console.log("A: " +JSON.stringify(dbBlocks));
    return dbBlocks.findIndex(element => {
      return element.number == blockNumber;
    });
  },

  searchForInArray: function(array, blockNumber) {
    return array.findIndex(element => {
      if (element) {
        return element[0] == blockNumber;
      } else {
        return -1;
      }
    });
  },

  searchTsInfoDB: function(ts) {
    // console.log("A: " +JSON.stringify(dbBlocks));
    var rt = dbTransInfo.findIndex(element => {
      return element.transactionHash == ts.hash;
    });

    // console.log("RETUNR: " + rt);
    return rt;
  },

  searchTsInfoDbElement: function(ts) {
    // console.log("A: " +JSON.stringify(dbBlocks));
    var rt = dbTransInfo.find(element => {
      return element.transactionHash == ts.hash;
    });

    // console.log("RETUNR: " + rt);
    return rt;
  },

  searchForSilentBugs: function(hash) {
    return silentBugs.findIndex(element => {
      return element[0] == hash;
    });
  },

  saveTsInfoDB(ts) {
    var rs = dbTransInfo.findIndex(element => {
      return element.transactionHash == ts.transactionHash;
    });

    // console.log("RET: " + JSON.stringify(rs));
    if (rs == -1) {
      // console.log("PUSH");
      dbTransInfo.push(ts);
    }
  },

  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////// EXTRA HELP FUNCTIONS ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  getAccountInfo: function(start_block, end_block, account, nickname) {

    var onj = new Object({hex: account, name: (nickname ? nickname : account)});
    this.addToHistory(onj);

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
                transactionsReceiptsPromises.push(this.getTranscationInfo(e));
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
                  transactionsReceiptsPromises.push(this.getTranscationInfo(e));
                }
              });
              
            }
          });

          Promise.all(transactionsReceiptsPromises).then(receipts => {
            endStartContracts = [start, end]
            var transactionsReceiptsValid = [];
            // console.log("Lenght of receipts: " + receipts.length);
            receipts.forEach(rs => {
              if (rs.contractAddress) {
                // console.log("Found contract");
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

  getBalance: function(account, block) {
    return new Promise((resolve, reject) => {
      if (block) {
        web3.eth.getBalance(account, block).then(res => {
          if (res != null) {
            // console.log("PAOK");
            resolve([block, res]);
          }
        }).catch(err => {
          console.log("ERROR getBalance: " + err);
          reject(err);
        });
      } else {
        web3.eth.getBalance(account).then(res => {
          if (res != null) {
            // console.log("PAOK");
            resolve(res);
          }
        }).catch(err => {
          console.log("ERROR getBalance: " + err);
          reject(err);
        });
      }
      
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
    acc = arg.hex.toLowerCase();
    arg.hex = acc;
    var found = previous_contracts_accounts.find(function(element) {
      return element.hex == acc;
    });

    if (!found) {
      previous_contracts_accounts.push(arg);
      // console.log("Pushed arg: " + JSON.stringify(arg));
    } else {
      previous_contracts_accounts.some(r => {
        if (r.hex == acc) {
          r.name = ((arg.name != arg.hex) ? arg.name : r.name);
          // console.log("CHANGED TO: " + r.name);
          return true;
        }
      });
    }
  },

  searchPrevAccounts: function(arg) {
    var found = previous_contracts_accounts.find(function(element) {
      return element.name == arg;
    });

    return found;
  },

  is_hexadecimal: function(str){
    if (str[0] == 0 && str[1].toLowerCase() == 'x') {
      return true;
    } else {
      return false
    }

    // var a = parseInt(str,16);
    // return (a.toString(16) ===str.toLowerCase())
    // regexp = /^[0-9a-fA-F]+$/;
    // // regexp.test(str)
    // if (parseInt(str, 16)) {
    //   console.log("ARG is hex");
    //   return true;
    // } else {
    //   console.log("ARG is NOT hex");  
    //   return false;
    // }
  },

  getTransactionsByAccount: function(startBlockNumber, endBlockNumber, myaccount) {
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

  getGasPrice() {
    return web3.eth.getGasPrice();
  },

  getLastBlock() {
    return web3.eth.getBlock("latest",true);
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

  ////////////////////////////// PRINTS ///////////////////////////////////////

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

}

