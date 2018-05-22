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

var start = 1;
var end = 1000;
var lastBlock = 0;

///////////////////////////////////////////////////////////////////////////////
/////////////////// Smart Contract - Smart Grid Functions /////////////////////
///////////////////////////////////////////////////////////////////////////////

export const syncStep = function(startBlockNumber, endBlockNumber, type) {
  return web3.eth
    .getBlockNumber()
    .then(res => {
      checkStartEndInput(startBlockNumber, endBlockNumber, res);
      startBlockNumber = start;
      endBlockNumber = end;

      return getSteps(startBlockNumber, endBlockNumber).then(steps => {
        var stepCalls = [];

        const syncFn = (type === 1 ? sync : syncBl).bind(this);

        for (var i = 0; i < steps.length - 1; i++) {
          const startBlockNumber = steps[i];
          const endBlockNumber =
            i < steps.length - 2 ? steps[i + 1] - 1 : steps[i + 1];
          stepCalls.push(() => syncFn(startBlockNumber, endBlockNumber));
        }

        const mySeriesPromise = stepCalls.reduce(
          (acc, crntFn) => acc.then(crntFn),
          Promise.resolve()
        );

        return mySeriesPromise;
      });
    })
    .then(() => {
      var endStartAccount = [start, end];
      return endStartAccount;
    })
    .catch(err => {
      console.log('ERROR sync: ' + err);
      return [];
    });
};

const sync = function(startBlockNumber, endBlockNumber) {
  return syncBlocks(startBlockNumber, endBlockNumber)
    .then(() => syncTsReceipts(startBlockNumber, endBlockNumber))
    .then(() => {
      console.log(
        'IN PROMISE CALL: ' + startBlockNumber + ' - ' + endBlockNumber
      );
      console.log('DB BLOCKS LENGTH: ' + dbBlocks.length);
      console.log('DB Trans Receipts LENGTH: ' + dbTransInfo.length);
      console.log(' ');

      return true;
    })
    .catch(err => {
      console.log('ERROR syncTsReceipts Call: ' + err);
      throw err;
    })
    .catch(err => {
      console.log('ERROR syncBlocks Call: ' + err);
      // reject(err);
      return [];
    });
};

const syncBl = function(startBlockNumber, endBlockNumber) {
  return syncBlocks(startBlockNumber, endBlockNumber)
    .then(() => {
      console.log(
        'IN PROMISE CALL: ' + startBlockNumber + ' - ' + endBlockNumber
      );
      console.log('DB BLOCKS LENGTH: ' + dbBlocks.length);
      console.log(' ');

      return true;
    })
    .catch(err => {
      console.log('ERROR syncBlocks Call: ' + err);
      // reject(err);
      return [];
    });
};

const syncBlocks = function(startBlockNumber, endBlockNumber) {
  var getBlockPromises = [];

  for (let i = startBlockNumber; i <= endBlockNumber; i++) {
    let check = searchFor(i);
    // console.log("CHECK: " + check);

    if (check === -1) {
      // DOESN'T EXIST
      var getBlock = getBlockInfoMinimalNoChecks(i);
      getBlockPromises.push(getBlock);
    } else {
      // console.log('BLOCK: ' + i + ' EXISTS ALREADY');
    }
  }

  return Promise.all(getBlockPromises)
    .then(blocks => {
      // SAVE TO DB
      dbBlocks = dbBlocks.concat(blocks);
      dbBlocks.sort(function(a, b) {
        return a.number - b.number;
      });

      return dbBlocks;
    })
    .catch(err => {
      console.log('ERROR syncBlocks: ' + err);
      throw err;
    });
};

const syncTsReceipts = function(startBlockNumber, endBlockNumber) {
  return Promise.resolve()
    .then(() => {
      let transactionsReceiptsPromises = [];

      let check = searchFor(startBlockNumber);
      if (check === -1) {
        console.log("DIDN'T found block");
      } else {
        for (let i = 0; i <= endBlockNumber - startBlockNumber; i++) {
          // console.log("CHECK: " + (check+i));
          let bl = dbBlocks[check + i];
          if (bl) {
            if (bl.transactions) {
              // console.log("Block with transactions");
              let ts = null;
              bl.transactions.forEach(e => {
                ts = searchTsInfoDbElement(e);
                // console.log("TS DB: " + ts);
                if (ts) {
                  console.log('TS EXISTS ALREADY');
                } else {
                  if (e.input !== '0x') {
                    transactionsReceiptsPromises.push(getTranscationInfo(e));
                  }
                }
              });
            }
          }
        }
      }
      return Promise.all(transactionsReceiptsPromises);
    })
    .then(() => {
      dbTransInfo.sort(function(a, b) {
        return a.blockNumber - b.blockNumber;
      });
      if (dbTransInfo) {
        console.log('RESOLVE TSREC');
        return dbTransInfo;
      } else {
        console.log('NO transactionsReceiptsPromises');
        return [];
      }
    })
    .catch(err => {
      console.log('ERROR syncTsReceipts: ' + err);
      return [];
    });
};

const getSteps = function(startBlockNumber, endBlockNumber) {
  let startStep = startBlockNumber;
  return getStepsFromNumberOfTs(startBlockNumber, endBlockNumber).then(r => {
    console.log('RETURN OF getStepsNew is: ' + r);

    // CREATE STEPS
    let stepNumber = r;
    let step = [startStep];
    while (endBlockNumber - startStep > stepNumber) {
      startStep = startStep + stepNumber;
      step.push(startStep);
    }
    step.push(endBlockNumber);
    return step;
  });
};

const getStepsFromNumberOfTs = function(startBlockNumber, endBlockNumber) {
  return syncBlocks(startBlockNumber, endBlockNumber).then(() => {
    // console.log('Return val: ' + rs.length);
    let startN = startBlockNumber;
    if (endBlockNumber - startBlockNumber > 1000) {
      startN = endBlockNumber - 1000;
      startN = startN > 0 ? startN : endBlockNumber - 1000 - startN + 1;
    }

    console.log('STart is: ' + startN);
    console.log('endBlockNumber is: ' + endBlockNumber);

    let checkBL = searchFor(endBlockNumber);
    let num_ts = 0;
    let i;
    if (checkBL >= 0) {
      for (i = 0; i <= endBlockNumber - startN; i++) {
        // console.log('CHECK: ' + checkBL + ' - ' + i);
        num_ts += dbBlocks[checkBL - i].transactions.length;
        // console.log('Block: ' + dbBlocks[checkBL-i].number);
        if (num_ts > 2000) {
          break;
        }
      }
    } else {
      console.log('ERROR, dint found block');
      i = 100;
    }
    // console.log('STEP is: ' + i);
    return i;
  });
};

const sortDB = function() {
  dbBlocks.sort(function(a, b) {
    return a.number - b.number;
  });

  dbTransInfo.sort(function(a, b) {
    return a.blockNumber - b.blockNumber;
  });
};

const syncContractVars = function(startBlockNumber, endBlockNumber, contract) {
  return web3.eth
    .getBlockNumber()
    .then(res => {
      checkStartEndInput(startBlockNumber, endBlockNumber, res);
      startBlockNumber = start;
      endBlockNumber = end;

      return getSteps(startBlockNumber, endBlockNumber).then(steps => {
        console.log('steps: ' + JSON.stringify(steps));

        let stepCalls = [];
        for (let i = 0; i < steps.length - 1; i++) {
          const startBlockNumber = steps[i];
          const endBlockNumber =
            i < steps.length - 2 ? steps[i + 1] - 1 : steps[i + 1];
          console.log(
            'START - END: ' + startBlockNumber + ' - ' + endBlockNumber
          );
          stepCalls.push(() =>
            syncGetVarsStep(startBlockNumber, endBlockNumber, contract)
          );
        }

        const mySeriesPromise = stepCalls.reduce(
          (acc, crntFn) => acc.then(crntFn),
          Promise.resolve()
        );

        return mySeriesPromise;
      });
    })
    .then(() => {
      var endStartAccount = [start, end];
      return endStartAccount;
    })
    .catch(err => {
      console.log('ERROR syncContractVars: ' + err);
      return [];
    });
};

const syncGetVarsStep = function(
  startBlockNumber,
  endBlockNumber,
  contract_arg
) {
  // return Promise.resolve().then(() => {
  var getContractVarPromises = [];
  console.log('syncGetVarsStep');
  for (let i = startBlockNumber; i <= endBlockNumber; i++) {
    let checkCl = searchForInArray(dbClearings, i);
    if (checkCl === -1) {
      let checkBL = searchFor(i);
      if (checkBL === -1) {
        console.log('BLOCK DINDNT FOUND');
      }
      // console.log("Push promise, timestamp: " + dbBlocks[checkBL].number + " & " + dbBlocks[checkBL].timestamp);
      // var timestamp = this.decodeTime(dbBlocks[checkBL].timestamp);
      // console.log("AFTER, timestamp: " + timestamp);
      getContractVarPromises.push(
        getStorageAtBlock(i, contract_arg, dbBlocks[checkBL].timestamp)
      );
    }
  }

  return Promise.all(getContractVarPromises)
    .then(blocks => {
      // SAVE TO DB
      dbClearings = dbClearings.concat(blocks);

      dbClearings.sort(function(a, b) {
        return a[0] - b[0];
      });

      console.log(
        'IN PROMISE CALL syncGetVarsStep: ' +
          startBlockNumber +
          ' - ' +
          endBlockNumber
      );
      console.log('DB dbClearings LENGTH: ' + dbClearings.length);
      console.log(' ');

      return dbClearings;
    })
    .catch(err => {
      console.log('ERROR syncGetVarsStep: ' + err);
      return [];
    });
  // });
};

////////// Get only transactions that are calls to functions of a Contract /////
///////////// IE a send Gas transaction will not be shown here /////////////////
export const getAccountTransactionsGasSpentClearings = function(
  startBlockNumber,
  endBlockNumber,
  contract_arg,
  nickname
) {
  console.time('Main Experiment');

  // Empty global vars
  accounts = [];
  silentBugs = [];
  return syncStep(startBlockNumber, endBlockNumber, 1)
    .catch(err => {
      console.log('ERROR syncStep: ' + err);
      throw err;
    })
    .then(() => {
      let startBlockNumber = start;
      let endBlockNumber = end;

      sortDB();

      var check = searchFor(startBlockNumber);
      console.log('BUILDING TABLE');
      console.log(
        'FROM - TO BLOCK: ' + startBlockNumber + ' - ' + endBlockNumber
      );
      for (let j = 0; j <= endBlockNumber - startBlockNumber; j++) {
        let bl = dbBlocks[check + j];

        if (bl && bl.transactions) {
          if (contract_arg) {
            // console.log("Block with transactions");
            var onj = {
              hex: contract_arg,
              name: nickname ? nickname : contract_arg
            };
            addToHistory(onj);
            // console.log("Call with contract_arg");
            bl.transactions.forEach(e => {
              var ts = searchTsInfoDbElement(e);
              if (ts) {
                if (ts.to) {
                  if (ts.to.toUpperCase() === contract_arg.toUpperCase()) {
                    createTableFromTxReceipt(ts);
                  }
                }
              } else {
                console.log(
                  'ERROR - DIDINT FOUND TS RECEIPT getAccountTransactionsGasSpentClearings - ts: ' +
                    ts
                );
              }
            });
          } else {
            bl.transactions.forEach(e => {
              var ts = searchTsInfoDbElement(e);
              if (ts) {
                // console.log("GETTING FROM DB");
                createTableFromTxReceipt(ts);
              } else {
                // console.log(
                //   'ERROR - DIDINT FOUND TS RECEIPT getAccountTransactionsGasSpentClearings - ts:' +
                //     ts
                // );
              }
            });
          }
        }
      }
    })
    .then(() => {
      var endStartAccount = [start, end];
      endStartAccount.push(silentBugs);
      console.log('Accounts length: ' + accounts.length);
      endStartAccount.push(accounts);

      // console.log("RESOLVING");
      console.timeEnd('Main Experiment');
      return endStartAccount;
    })
    .catch(err => {
      console.log('ERROR getAccountTransactionsGasSpentClearings: ' + err);
    });
};

export const getTransactions = function(
  startBlockNumber,
  endBlockNumber,
  contract_arg,
  nickname
) {
  console.time('getTransactions');
  accounts = [];
  silentBugs = [];

  return syncStep(startBlockNumber, endBlockNumber, 1)
    .catch(err => {
      console.log('ERROR syncStep: ' + err);
      throw err;
    })
    .then(() => {
      let receiptsPromises = [];

      startBlockNumber = start;
      endBlockNumber = end;

      sortDB();

      let check = searchFor(startBlockNumber);
      console.log(
        'FROM - TO BLOCK: ' + startBlockNumber + ' - ' + endBlockNumber
      );
      let ts = null;
      if (contract_arg) {
        for (var j = 0; j <= endBlockNumber - startBlockNumber; j++) {
          let bl = dbBlocks[check + j];
          if (bl && bl.transactions) {
            // console.log("Block with transactions");
            var onj = {
              hex: contract_arg,
              name: nickname ? nickname : contract_arg
            };
            addToHistory(onj);
            // console.log("Call with contract_arg");

            bl.transactions.forEach(e => {
              // console.log("TS: " + e.hash);
              ts = searchTsInfoDbElement(e);
              // console.log("TS RETURNED: " + JSON.stringify(ts));
              if (ts) {
                if (ts.to) {
                  if (ts.to.toUpperCase() === contract_arg.toUpperCase()) {
                    receiptsPromises.push(creteTableOfTransactions(ts));
                  }
                }
              } else {
                console.log('ERROR - DIDINT FOUND TS RECEIPT getTransactions');
              }
            });
          }
        }
      } else {
        for (let i = 0; i <= endBlockNumber - startBlockNumber; i++) {
          let bl1 = dbBlocks[check + i];
          if (bl1 && bl1.transactions) {
            bl1.transactions.forEach(e => {
              ts = searchTsInfoDbElement(e);
              if (ts) {
                receiptsPromises.push(creteTableOfTransactions(ts));
              } else {
                console.log('ERROR - DIDINT FOUND TS RECEIPT');
              }
            });
          }
        }
      }

      return Promise.all(receiptsPromises).catch(err => {
        console.log('ERROR receiptsPromises: ' + err);
        throw err;
      });
    })
    .then(res => {
      // SAVE TO DB
      let endStartAccount = [start, end];
      endStartAccount.push(res);

      // setTimeout
      // console.log("RESOLVING");
      console.timeEnd('getTransactions');

      return endStartAccount;
    })
    .catch(err => {
      console.log('ERROR getTransactions: ' + err);
    });
};

export const getSpentGasOfAccount = function(
  startBlockNumber,
  endBlockNumber,
  account,
  nickname
) {
  console.time('SpentGasOfAccount');
  var transactionsReceiptsPromises = [];

  var onj = { hex: account, name: nickname ? nickname : account };
  addToHistory(onj);

  return new Promise((resolve, reject) => {
    syncStep(startBlockNumber, endBlockNumber, 1)
      .catch(err => {
        console.log('ERROR syncStep getSpentGasOfAccount: ' + err);
        throw err;
      })
      .then(() => {
        startBlockNumber = start;
        endBlockNumber = end;

        transactionsReceiptsPromises.push(getBalance(account));

        var check = searchFor(startBlockNumber);
        for (var i = 0; i <= endBlockNumber - startBlockNumber; i++) {
          // if (check !== -1) { // DOESN'T EXIST
          if (dbBlocks[check + i]) {
            if (dbBlocks[check + i].transactions) {
              dbBlocks[check + i].transactions.forEach(e => {
                if (e.input !== '0x' && searchTsInfoDB(e) === -1) {
                  console.log('ERROR - DIDINT FOUND TS RECEIPT');
                  // transactionsReceiptsPromises.push(this.getTranscationInfo(e));
                }
              });
            }
          }

          // } else {
          // console.log("ERROR - BLOCK DOESNT EXIST");

          // }
        }

        Promise.all(transactionsReceiptsPromises)
          .then(res => {
            var startEndBalanceGasSpentReceipts = [start, end];
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
            check = searchFor(start);

            // checkTsInfoIndexStart = -1;
            // while (checkTsInfoIndexStart === -1) {

            var checkTsInfoIndexStart = dbTransInfo.findIndex(element => {
              return element.blockNumber >= start;
            });

            // }

            // console.log("START INDEX: " + checkTsInfoIndexStart);

            // checkTsInfoIndexEnd = -1;
            // while (checkTsInfoIndexEnd === -1) {
            var checkTsInfoIndexEnd = -1;

            for (
              var k = dbTransInfo.length - 1;
              k > checkTsInfoIndexStart;
              k++
            ) {
              if (dbTransInfo[k].blockNumber <= end) {
                checkTsInfoIndexEnd = k;
                break;
              }
            }

            // console.log("END INDEX: " + checkTsInfoIndexEnd);

            // if (checkTsInfoIndexEnd === -1) {
            //   console.log("START === END");
            //   checkTsInfoIndexEnd = checkTsInfoIndexStart;
            // }

            var arDbTSInfo;
            if (checkTsInfoIndexEnd === -1) {
              arDbTSInfo = dbTransInfo.slice(checkTsInfoIndexStart);
            } else {
              arDbTSInfo = dbTransInfo.slice(
                checkTsInfoIndexStart,
                checkTsInfoIndexEnd + 1
              );
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
            for (var i = 0; i <= end - start; i++) {
              while (
                j < arDbTSInfo.length &&
                arDbTSInfo[j].blockNumber <= dbBlocks[check + i].number
              ) {
                if (
                  arDbTSInfo[j].blockNumber === dbBlocks[check + i].number &&
                  account === arDbTSInfo[j].from.toUpperCase()
                ) {
                  console.log('Account: ' + arDbTSInfo[j].from.toUpperCase());

                  gasUsedInBlockOfAccount += arDbTSInfo[j].gasUsed;
                }
                j++;
              }

              gasSpentBlock.push([
                dbBlocks[check + i].number,
                gasUsedInBlockOfAccount,
                dbBlocks[check + i].gasLimit
              ]);
              totalGasSpent += gasUsedInBlockOfAccount;
              gasUsedInBlockOfAccount = 0;
              j = 0;
            }

            // Push Total Gas Spent
            startEndBalanceGasSpentReceipts.push(totalGasSpent);
            // Push [Block - Gas Spent] Array
            startEndBalanceGasSpentReceipts.push(gasSpentBlock);

            console.timeEnd('SpentGasOfAccount');
            resolve(startEndBalanceGasSpentReceipts);
          })
          .catch(err => {
            console.log('ERROR transactionsReceiptsPromises: ' + err);
            reject(err);
          });
      });
  });
};

export const blocksInfo = function(startBlockNumber, endBlockNumber) {
  // return new Promise(resolve => {
  return syncStep(startBlockNumber, endBlockNumber, 2)
    .catch(err => {
      console.log('ERROR syncStep blocksInfo: ' + err);
      throw err;
    })
    .then(() => {
      let startBlockNumber = start;
      let endBlockNumber = end;

      let startEndGasPerBlock = [startBlockNumber, endBlockNumber];

      let check = searchFor(startBlockNumber);
      // console.log('Length: ' + dbBlocks.length);
      // console.log('CHECK: ' + check);
      if (check !== -1) {
        for (let j = 0; j <= endBlockNumber - startBlockNumber; j++) {
          if (dbBlocks[check + j]) {
            // console.log('i: ' + j);
            let total_gas_sent = 0;
            if (dbBlocks[check + j].transactions) {
              dbBlocks[check + j].transactions.forEach(ts => {
                total_gas_sent += ts.gas;
              });

              startEndGasPerBlock.push([
                dbBlocks[check + j].number,
                dbBlocks[check + j].gasUsed,
                dbBlocks[check + j].size,
                total_gas_sent,
                dbBlocks[check + j].gasLimit
              ]);
            }
          }
        }
      } else {
        console.log('ERROR - BLOCK DOESNT EXIST');
      }

      return startEndGasPerBlock;
    });
  // });
};

export const getBalancePerBlockOfAccount = function(
  startBlockNumber,
  endBlockNumber,
  account,
  nickname
) {
  var onj = { hex: account, name: nickname ? nickname : account };
  addToHistory(onj);
  return new Promise((resolve, reject) => {
    syncStep(startBlockNumber, endBlockNumber, 2)
      .catch(err => {
        console.log('ERROR syncStep getBalancePerBlockOfAccount: ' + err);
        throw err;
      })
      .then(() => {
        let startBlockNumber = start;
        let endBlockNumber = end;

        let getBlockPromises = [];

        for (var i = startBlockNumber; i <= endBlockNumber; i++) {
          getBlockPromises.push(getBalance(account, i));
        }

        Promise.all(getBlockPromises)
          .then(blocks => {
            // SAVE TO DB

            // console.log("JSON: " + JSON.stringify(blocks));

            let startEndBalancePerBlock = [start, end];

            startEndBalancePerBlock.push(blocks);

            resolve(startEndBalancePerBlock);
          })
          .catch(err => {
            console.log('ERROR getBalancePerBlockOfAccount: ' + err);
            reject(err);
          });
      });
  });
};

const getBlockInfoMinimalNoChecks = function(blockNumber) {
  return web3.eth
    .getBlock(blockNumber, true)
    .then(bl => {
      // bl.timestamp = this.decodeTime(bl.timestamp);
      bl.time = decodeTime(bl.timestamp);
      return bl;
    })
    .catch(err => {
      console.log('ERROR getBlockInfoMinimalNoChecks: ' + err);
      return [];
    });
};

export const getBlockInfoMinimal = function(blockNumber) {
  return new Promise(resolve => {
    var blockNumberPromise = web3.eth.getBlockNumber();

    blockNumberPromise.then(res => {
      if (blockNumber <= res) {
        var check = searchFor(blockNumber);

        if (check === -1) {
          web3.eth.getBlock(blockNumber, true).then(bl => {
            // console.log("GET BLOCK: " + blockNumber);
            // SAVE TO DB
            bl.timestamp = decodeTime(bl.timestamp);

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
          // bl.timestamp = this.decodeTime(bl.timestamp);
          bl.time = decodeTime(bl.timestamp);

          resolve(bl);
        });
      }
    });
  }).catch(err => {
    console.log('ERROR getBlockInfo: ' + err);
    return [];
  });
};

export const getTransactionsPerBlock = function(
  startBlockNumber,
  endBlockNumber
) {
  return syncStep(startBlockNumber, endBlockNumber, 2)
    .catch(err => {
      console.log('ERROR syncStep getTransactionsPerBlock: ' + err);
      throw err;
    })
    .then(() => {
      let startBlockNumber = start;
      let endBlockNumber = end;

      let transactionsPerBlock = [startBlockNumber, endBlockNumber];

      let check = searchFor(startBlockNumber);

      if (check !== -1) {
        for (let j = 0; j <= endBlockNumber - startBlockNumber; j++) {
          if (dbBlocks[check + j]) {
            if (dbBlocks[check + j].transactions) {
              transactionsPerBlock.push([
                dbBlocks[check + j].number,
                dbBlocks[check + j].transactions.length
              ]);
            }
          }
        }
      } else {
        console.log('ERROR - BLOCK DOESNT EXIST');
      }

      return transactionsPerBlock;
    });
};

export const getTimeToMineBlock = function(startBlockNumber, endBlockNumber) {
  console.time('getTimeToMineBlock');
  accounts = [];
  silentBugs = [];
  var timeToMine = [];

  return syncStep(startBlockNumber, endBlockNumber, 2)
    .catch(err => {
      console.log('ERROR syncStep getTimeToMineBlock: ' + err);
      throw err;
    })
    .then(() => {
      startBlockNumber = start;
      endBlockNumber = end;

      sortDB();

      var check = searchFor(startBlockNumber);
      console.log(
        'FROM - TO BLOCK: ' + startBlockNumber + ' - ' + endBlockNumber
      );
      // timeToMine.push([dbBlocks[check].number, dbBlocks[check].timestamp]);
      for (var j = 1; j <= endBlockNumber - startBlockNumber; j++) {
        var bl = dbBlocks[check + j];
        // console.log("timestamp: " + bl.timestamp);
        timeToMine.push([
          bl.number,
          parseInt(bl.timestamp) - parseInt(dbBlocks[check + j - 1].timestamp)
        ]);
      }

      // SAVE TO DB
      var endStartAccount = [start, end];
      endStartAccount.push(timeToMine);
      // console.log(JSON.stringify(timeToMine));
      // setTimeout
      // console.log("RESOLVING");

      console.timeEnd('getTimeToMineBlock');

      return endStartAccount;
    })
    .catch(err => {
      console.log('ERROR getTimeToMineBlock: ' + err);
    });
};

export const getNumberOfTranscationsOfAccountPerBlock = function(
  startBlockNumber,
  endBlockNumber,
  account
) {
  if (account !== '') {
    addToHistory(account);
  }

  syncStep(startBlockNumber, endBlockNumber, 1).then(() => {
    startBlockNumber = start;
    endBlockNumber = end;

    var blocks = [];
    var check = searchFor(startBlockNumber);
    console.log(
      'FROM - TO BLOCK: ' + startBlockNumber + ' - ' + endBlockNumber
    );

    for (var j = 0; j <= endBlockNumber - startBlockNumber; j++) {
      blocks.push(dbBlocks[check + j]);
    }

    blocks.forEach(rs => {
      console.log('Block: ' + rs.number);
    });

    blocks.forEach(block => {
      if (block !== null && block.transactions !== null) {
        var numOfTran = 0;

        block.transactions.forEach(e => {
          var fromA = e.from.toUpperCase();
          account = account.toUpperCase();
          if (e.input !== '0x' && fromA === account) {
            numOfTran++;
          }
        });

        console.log(block.number + ',' + numOfTran);
      } else {
        console.log(block.number + ',' + 0);
      }
    });
  });
};

const getTranscationInfo = function(e) {
  return web3.eth
    .getTransactionReceipt(e.hash)
    .then(res => {
      if (res !== null) {
        // console.log("Input: " + rs.input);
        res.input = e.input;
        res.gasPrice = e.gasPrice;
        // res.gas = e.gas;
        // console.log("SAVE ON arDbTSInfo getTranscationInfo");
        // dbTransInfo.push(res);
        saveTsInfoDB(res);
        return res;
      } else {
        console.log('NOTHING TO RETURN');
        return [];
      }
    })
    .catch(err => {
      console.log(
        'ERROR getTranscationInfo (RERUN  TO GET ALL RECEIPTS): ' + err
      );
      return [];
    });
};

export const getTranscationInfoHash = function(hash) {
  return new Promise(resolve => {
    web3.eth
      .getTransaction(hash)
      .then(rs => {
        if (rs !== null) {
          web3.eth
            .getTransactionReceipt(rs.hash)
            .then(res => {
              if (res !== null) {
                // console.log("Input: " + rs.input);
                res.input = rs.input;
                res.gasPrice = rs.gasPrice;
                res.gas = rs.gas;
                console.log('SAVE ON arDbTSInfo: ');
                // dbTransInfo.push(res);
                saveTsInfoDB(res);
                resolve(res);
              }
            })
            .catch(err => {
              console.log(
                'ERROR getTransactionReceipt getTranscationInfoHash: ' + err
              );
              resolve([]);
            });
        }
      })
      .catch(err => {
        console.log('ERROR getTransaction => getTranscationInfoHash: ' + err);
        resolve([]);
      });
  });
};

const createTableFromTxReceipt = function(txRec) {
  var check = searchForSilentBugs(txRec.transactionHash);
  if (check === -1) {
    if (txRec.gas === txRec.gasUsed) {
      // console.log("FOUND NEW SILENT BUG");
      silentBugs.push([txRec.transactionHash, txRec.gas, txRec.gasUsed]);
    }
  }

  saveAccountTransactionsSpentGas(txRec.from, txRec.gasUsed);
};

const saveAccountTransactionsSpentGas = function(account, gas) {
  var found = false;

  for (var i = 0; i < accounts.length; i++) {
    var str1 = parseInt(accounts[i][0]);
    var str2 = parseInt(account);

    if (str1 === str2) {
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
    var newAccount = new Object([account, gas, 1]);
    accounts.push(newAccount);
  }

  accounts.sort(function(a, b) {
    return a[2] - b[2];
  });
};

const creteTableOfTransactions = function(txRec) {
  return new Promise(resolve => {
    // console.log("Save ts from block: " + txRec.blockNumber);
    var input = txRec.input.toString();
    var fun = input.slice(0, 10);
    if (input.length > 10) {
      input = input.slice(10);
      input = '0x'.concat(input);
      var help = web3.eth.abi.decodeParameters(['int256', 'int256'], input);
      input = '';
      input = input.concat(help[0]);
      input = input.concat(', ');
      input = input.concat(help[1]);
      input = fun.concat(', '.concat(input));
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
};

////////////////////////// Fix START && END block /////////////////////////

const checkStartEndInput = function(
  startBlockNumber,
  endBlockNumber,
  endOfBlockEth
) {
  // console.log("TYPE of start: " + typeof startBlockNumber);
  // console.log("TYPE of end: " + typeof endBlockNumber);
  startBlockNumber = parseInt(startBlockNumber);
  endBlockNumber = parseInt(endBlockNumber);
  lastBlock = endOfBlockEth;
  // console.log("Last block: " + lastBlock);
  // console.log("startBlockNumber: " + startBlockNumber);
  // console.log("endBlockNumber: " + endBlockNumber);

  if (endBlockNumber === 1 && startBlockNumber === 1) {
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
      if (
        !startBlockNumber ||
        parseInt(startBlockNumber) > parseInt(endBlockNumber)
      ) {
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

  console.log('START: ' + start);
  console.log('END: ' + end);
  // saveStartEndLF(start, end);
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
////////////////////// Get Storage on Previous Blocks /////////////////////////
////////////////////// FUNCTIONS FOR SPECIFIC CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////////

// More info about storage at specified block here:
// https://medium.com/aigang-network/how-to-read-ethereum-contract-storage-44252c8af925

export const getClearingsThroughTime = function(
  startBlockNumber,
  endBlockNumber,
  contract_arg,
  nickname
) {
  let onj = { hex: contract_arg, name: nickname ? nickname : contract_arg };
  addToHistory(onj);

  return new Promise(resolve => {
    contract_arg = contract_arg.toLowerCase();

    sortDB();

    let check = searchFor(startBlockNumber);
    console.log(
      'FROM - TO BLOCK: ' + startBlockNumber + ' - ' + endBlockNumber
    );

    syncContractVars(startBlockNumber, endBlockNumber, contract_arg).then(
      () => {
        let startBlockNumber = start;
        let endBlockNumber = end;
        let res = [];

        check = searchForInArray(dbClearings, startBlockNumber);

        for (let i = 0; i <= endBlockNumber - startBlockNumber; i++) {
          if (check === -1) {
            console.log('Didnt found in dbClearings');
          } else {
            if (contract_arg === dbClearings[check + i][5]) {
              // console.log("FOUND CONTRACT IN DB");
              res.push(dbClearings[check + i]);
            }
            // else {
            // console.log("DIFERRENT CONTRACTS: " + contract_arg + " - " + dbClearings[check+i][5]);
            // }
          }
        }

        let endStartClear = [start, end];
        endStartClear.push(res);
        resolve(endStartClear);
      }
    );
  });
};

const getStorageAtBlock = function(block, contract_arg, timestamp) {
  return new Promise((resolve, reject) => {
    var promiseGetStorageAll = [];

    promiseGetStorageAll.push(getStorageAtBlockPriceCheck(block, contract_arg));
    promiseGetStorageAll.push(
      getStorageAtBlockQuantityCheck(block, contract_arg)
    );
    promiseGetStorageAll.push(getStorageAtBlockTypeCheck(block, contract_arg));

    Promise.all(promiseGetStorageAll)
      .then(clearings => {
        var result = [];
        result.push(block);
        result.push(timestamp);
        // console.log("Push: " + timestamp);

        clearings[0] = parseInt(clearings[0]);
        clearings[1] = parseInt(clearings[1]);
        clearings[2] = parseInt(clearings[2]);

        result.push(clearings);
        result = flatten(result);
        result.push(contract_arg);

        resolve(result);
      })
      .catch(err => {
        reject(err);
        console.log('ERROR promiseGetStorageAll: ' + err);
      });
  });
};

const getStorageAtBlockPriceCheck = function(block, contract_arg) {
  return new Promise(resolve => {
    getStorageAtBlockPrice(block, contract_arg).then(rs => {
      if (rs === -99) {
        // console.log('CALLING getStorageAt AGAIN');
        // getStorageAtBlockPrice(block, contract_arg).then(r => {
        //   console.log('RESOLVING: ' + parseInt(r));
        //   resolve(r);
        // });
        resolve(rs);
      } else {
        resolve(rs);
      }
    });
  });
};

const getStorageAtBlockPrice = function(block, contract_arg) {
  return web3.eth.getStorageAt(contract_arg, 6, block).catch(err => {
    console.log('ERROR getStorageAtBlockPrice: ' + err);
    return -99;
  });
};

const getStorageAtBlockQuantityCheck = function(block, contract_arg) {
  return new Promise(resolve => {
    getStorageAtBlockQuantity(block, contract_arg).then(rs => {
      if (rs === -99) {
        // console.log("CALLING getStorageAt AGAIN");
        // this.getStorageAtBlockQuantityCheck(block, contract_arg);
        // getStorageAtBlockQuantity(block, contract_arg).then(r => {
        //   console.log('RESOLVING: ' + parseInt(r));
        //   resolve(r);
        // });
        resolve(rs);
      } else {
        resolve(rs);
      }
    });
  });
};

const getStorageAtBlockQuantity = function(block, contract_arg) {
  return web3.eth.getStorageAt(contract_arg, 5, block).catch(err => {
    console.log('ERROR getStorageAtBlockQuantity: ' + err);
    return -99;
  });
};

const getStorageAtBlockTypeCheck = function(block, contract_arg) {
  return new Promise(resolve => {
    getStorageAtBlockType(block, contract_arg).then(rs => {
      if (rs === -99) {
        console.log('CALLING getStorageAtBlockTypeCheck AGAIN');
        // getStorageAtBlockTypeCheck(block, contract_arg);
        getStorageAtBlockType(block, contract_arg).then(r => {
          console.log('RESOLVING: ' + parseInt(r));
          resolve(r);
        });
      } else {
        resolve(rs);
      }
    });
  });
};

const getStorageAtBlockType = function(block, contract_arg) {
  return web3.eth.getStorageAt(contract_arg, 7, block).catch(err => {
    console.log('ERROR getStorageAtBlockType: ' + err);
    return -99;
  });
};

/////////////////////////// Get Clearing Values At Current STATE //////////////////////////////

export const getContractResults = function(contract_arg, nickname) {
  var onj = { hex: contract_arg, name: nickname ? nickname : contract_arg };
  addToHistory(onj);

  return new Promise((resolve, reject) => {
    var promisesAllgetClearing = [];

    promisesAllgetClearing.push(getClearingPrice(contract_arg));
    promisesAllgetClearing.push(getclearingQuantity(contract_arg));
    promisesAllgetClearing.push(getclearingType(contract_arg));

    Promise.all(promisesAllgetClearing)
      .then(clearings => {
        resolve(clearings);
      })
      .catch(err => {
        reject(err);
        console.log('ERROR: ' + err);
      });
  });
};

const getClearingPrice = function(contract_arg) {
  return web3.eth.call({ to: contract_arg, data: '0x901a40a7' });
};

const getclearingQuantity = function(contract_arg) {
  return web3.eth.call({ to: contract_arg, data: '0x14fffa15' });
};

const getclearingType = function(contract_arg) {
  return web3.eth.call({ to: contract_arg, data: '0xbc3d513f' });
};

///////////////////////////////////// MARKET CHART ///////////////////////////////////////////

export const marketChart = function(startBlockNumber, endBlockNumber) {
  return new Promise(resolve => {
    syncStep(startBlockNumber, endBlockNumber, 2)
      .then(() => {
        startBlockNumber = start;
        endBlockNumber = end;

        var check = searchFor(startBlockNumber);
        console.log(
          'FROM - TO BLOCK: ' + startBlockNumber + ' - ' + endBlockNumber
        );
        var first_clear = null;
        var second_clear = null;
        var generation = [];
        var consumption = [];

        for (var i = 0; i <= end - start; i++) {
          dbBlocks[check + i].transactions.some(ts => {
            // console.log("IN SOME: " + ts.input);
            if (ts.input.toString().includes('0x256a9ea1')) {
              console.log(
                'Found clearing - Block: ' +
                  ts.blockNumber +
                  ' pos: ' +
                  ts.transactionIndex
              );

              if (first_clear) {
                second_clear = {
                  block: ts.blockNumber,
                  index: ts.transactionIndex
                };
                return true;
              } else {
                first_clear = {
                  block: ts.blockNumber,
                  index: ts.transactionIndex
                };
              }
            } else {
              // console.log("ELSE");
              var inputSh = ts.input.toString();
              var quant = 0;
              var pric = 0;

              if (inputSh.length > 10) {
                inputSh = inputSh.slice(10);
                inputSh = '0x'.concat(inputSh);
                var help = web3.eth.abi.decodeParameters(
                  ['int256', 'int256'],
                  inputSh
                );
                quant = help[0];
                pric = help[1];
              }

              if (first_clear) {
                if (ts.input.includes('0x0d31d41a')) {
                  // generation
                  console.log('GENERATION Q,P: ' + quant + ', ' + pric);

                  generation = marketAdd(
                    generation,
                    quant,
                    pric > 300 ? 300 : pric
                  );
                  // generation.push({quantity: quant, price: pric});
                } else {
                  // consumption
                  console.log('CONSUMPTION Q,P: ' + quant + ', ' + pric);
                  consumption = marketAdd(
                    consumption,
                    quant,
                    pric > 300 ? 300 : pric
                  );

                  // consumption.push({quantity: quant, price: pric});
                }
              }
            }
          });

          if (first_clear && second_clear) {
            console.log('FOUND BORDERS - STOP');
            console.log(
              'FIRST CLEAR: ' +
                first_clear.block +
                ' , Index: ' +
                first_clear.index
            );
            console.log(
              'SECOND CLEAR: ' +
                second_clear.block +
                ' , Index: ' +
                second_clear.index
            );

            break;
          }
        }

        var endStartClear = [start, end];
        console.log('GENERATION TABLE:');
        console.log(generation.length);
        // console.log(JSON.stringify(generation));

        console.log('CONSUMPTION TABLE:');
        console.log(consumption.length);
        // console.log(JSON.stringify(consumption));

        if (first_clear === null && second_clear === null) {
          for (var j = 0; j < 65; j++) {
            dbBlocks[check + j].transactions.some(ts => {
              var inputSh = ts.input.toString();
              var quant = 0;
              var pric = 0;

              if (inputSh.length > 10) {
                inputSh = inputSh.slice(10);
                inputSh = '0x'.concat(inputSh);
                var help = web3.eth.abi.decodeParameters(
                  ['int256', 'int256'],
                  inputSh
                );
                quant = help[0];
                pric = help[1];
              }

              if (ts.input.includes('0x0d31d41a')) {
                // generation
                console.log('GENERATION Q,P: ' + quant + ', ' + pric);
                generation = marketAdd(
                  generation,
                  quant,
                  pric > 300 ? 300 : pric
                );
              } else {
                // consumption
                console.log('CONSUMPTION Q,P: ' + quant + ', ' + pric);
                consumption = marketAdd(
                  consumption,
                  quant,
                  pric > 300 ? 300 : pric
                );
              }
            });
          }
        }

        generation = generation.sort((a, b) => {
          return a.price - b.price;
        });

        consumption = consumption.sort((a, b) => {
          return b.price - a.price;
        });
        // console.log(JSON.stringify(res));
        // console.log("GENERATION TABLE:");
        // console.log(generation.length);
        // console.log(JSON.stringify(generation));

        // console.log("CONSUMPTION TABLE:");
        // console.log(consumption.length);

        if (generation.length === 0) {
          generation.push({ quantity: -99, price: -99 });
        }

        if (consumption.length === 0) {
          consumption.push({ quantity: -99, price: -99 });
        }
        endStartClear.push(generation);
        endStartClear.push(consumption);

        resolve(endStartClear);
      })
      .catch(err => {
        console.log('ERROR syncStep marketChart: ' + err);
      });
  }).catch(err => {
    console.log('ERROR marketChart: ' + err);
    return [];
  });
};

const marketAdd = function(table, quantity, price) {
  var found = table.findIndex(el => {
    if (el) {
      console.log('EL: ' + JSON.stringify(el));
      // console.log("PRICE: " + el.price);
      return el.price === parseInt(price);
    }
  });

  if (found !== -1) {
    table[found].quantity += parseInt(quantity);
  } else {
    table.push({ quantity: parseInt(quantity), price: parseInt(price) });
  }

  return table;
  // "7f495ea5": "consumptionBid(int256,int256)",
  // "0d31d41a": "generationBid(int256,int256)",
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////// SEARCH - SAVE ///////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const searchFor = function(blockNumber) {
  // console.log("A: " +JSON.stringify(dbBlocks));
  return dbBlocks.findIndex(element => {
    return element.number === blockNumber;
  });
};

const searchForInArray = function(array, blockNumber) {
  return array.findIndex(element => {
    if (element) {
      return element[0] === blockNumber;
    } else {
      return -1;
    }
  });
};

const searchTsInfoDB = function(ts) {
  // console.log("A: " +JSON.stringify(dbBlocks));
  var rt = dbTransInfo.findIndex(element => {
    return element.transactionHash === ts.hash;
  });

  // console.log("RETUNR: " + rt);
  return rt;
};

const searchTsInfoDbElement = function(ts) {
  // console.log("A: " +JSON.stringify(dbBlocks));
  var rt = dbTransInfo.find(element => {
    return element.transactionHash === ts.hash;
  });

  // console.log("RETUNR: " + rt);
  return rt;
};

const searchForSilentBugs = function(hash) {
  return silentBugs.findIndex(element => {
    return element[0] === hash;
  });
};

const saveTsInfoDB = function(ts) {
  var rs = dbTransInfo.findIndex(element => {
    return element.transactionHash === ts.transactionHash;
  });

  // console.log("RET: " + JSON.stringify(rs));
  if (rs === -1) {
    // console.log("PUSH");
    dbTransInfo.push(ts);
  }
};

///////////////////////////////////////////////////////////////////////////////
////////////////////////// EXTRA HELP FUNCTIONS ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export const getAccountInfo = function(
  start_block,
  end_block,
  account,
  nickname
) {
  var onj = new Object({ hex: account, name: nickname ? nickname : account });
  addToHistory(onj);

  return new Promise((resolve, reject) => {
    var promisesDif = [];
    // console.log("BEGIN");
    promisesDif.push(getBalance(account));
    promisesDif.push(getNumberOfTransactions(account));
    promisesDif.push(getTransactionsByAccount(start_block, end_block, account));

    Promise.all(promisesDif)
      .then(res => {
        var results = [start, end];
        results.push(res);
        resolve(results);
      })
      .catch(err => {
        reject(err);
        console.log('ERROR promisesDif: ' + err);
      });
  });
};

const getNumberOfTransactions = function(account) {
  return new Promise((resolve, reject) => {
    web3.eth
      .getTransactionCount(account)
      .then(res => {
        if (res !== null) {
          // console.log("PAOK");
          resolve(res);
        }
      })
      .catch(err => {
        console.log('ERROR getTransactionCount: ' + err);
        reject(err);
      });
  });
};

export const getContractDetails = function(startBlockNumber, endBlockNumber) {
  return syncStep(startBlockNumber, endBlockNumber, 1)
    .catch(err => {
      console.log('ERROR syncStep getContractDetails: ' + err);
      throw err;
    })
    .then(() => {
      let startBlockNumber = start;
      let endBlockNumber = end;

      let endStartContracts = [startBlockNumber, endBlockNumber];
      let transactionsReceiptsValid = [];

      dbTransInfo.forEach(rs => {
        if (rs && rs.contractAddress) {
          transactionsReceiptsValid.push(rs);
        }
      });

      endStartContracts.push(transactionsReceiptsValid);
      return endStartContracts;
    });
};

const getBalance = function(account, block) {
  if (block) {
    return web3.eth
      .getBalance(account, block)
      .then(res => {
        if (res !== null) {
          // console.log("PAOK: " + res);
          return [block, res];
        }
      })
      .catch(err => {
        console.log('ERROR getBalance: ' + err);
        return [];
      });
  } else {
    return web3.eth
      .getBalance(account)
      .then(res => {
        if (res !== null) {
          console.log('No block specified for balance of account');
          return [99999, res];
        }
      })
      .catch(err => {
        console.log('ERROR getBalance: ' + err);
        return [];
      });
  }
};

export const getLastBlockLocally = function() {
  if (lastBlock !== 0) {
    // console.log('Local');
    return new Promise(resolve => {
      resolve(lastBlock);
    });
  } else {
    // console.log('Ger Promise');
    return web3.eth.getBlockNumber();
  }
};

export const getPreviousAccounts = function() {
  // console.log("ACCOUNTS: " + JSON.stringify(previous_contracts_accounts));
  return previous_contracts_accounts;
};

const addToHistory = function(arg) {
  var acc = String(arg.hex).toLowerCase();
  arg.hex = acc;
  var found = previous_contracts_accounts.find(function(element) {
    return element.hex === acc;
  });

  if (!found) {
    previous_contracts_accounts.push(arg);
    // console.log("Pushed arg: " + JSON.stringify(arg));
  } else {
    previous_contracts_accounts.some(r => {
      if (r.hex === acc) {
        r.name = arg.name !== arg.hex ? arg.name : r.name;
        // console.log("CHANGED TO: " + r.name);
        return true;
      }
    });
  }
};

const getTransactionsByAccount = function(
  startBlockNumber,
  endBlockNumber,
  myaccount
) {
  return new Promise((resolve, reject) => {
    var transactionsR = [];
    var getBlockPromises = [];
    var blockNumberPromise = web3.eth.getBlockNumber();
    var promiseRec = [];

    blockNumberPromise
      .then(res => {
        checkStartEndInput(startBlockNumber, endBlockNumber, res);
        startBlockNumber = start;
        endBlockNumber = end;

        for (var i = startBlockNumber; i <= endBlockNumber; i++) {
          var check = searchFor(i);
          // console.log("CHECK: " + check);

          if (check === -1) {
            // DOESN'T EXIST
            var getBlock = web3.eth.getBlock(i, true);
            getBlockPromises.push(getBlock);
          }
        }

        Promise.all(getBlockPromises)
          .then(blocks => {
            dbBlocks = dbBlocks.concat(blocks);
            dbBlocks.sort(function(a, b) {
              return a.number - b.number;
            });

            blocks = [];
            check = searchFor(startBlockNumber);
            for (var j = 0; j <= endBlockNumber - startBlockNumber; j++) {
              blocks.push(dbBlocks[check + j]);
              dbBlocks[check + j].transactions.forEach(e => {
                var fromA = e.from.toUpperCase();
                myaccount = myaccount.toUpperCase();
                if (myaccount === '*' || myaccount === fromA) {
                  promiseRec.push(web3.eth.getTransactionReceipt(e.hash));
                }
              });
            }

            Promise.all(promiseRec)
              .then(trans => {
                blocks.forEach(block => {
                  if (block !== null && block.transactions !== null) {
                    block.transactions.forEach(e => {
                      var fromA = e.from.toUpperCase();
                      myaccount = myaccount.toUpperCase();

                      if (myaccount === '*' || myaccount === fromA) {
                        var input = e.input.toString();
                        var fun = input.slice(0, 10);
                        if (input.length > 10) {
                          input = input.slice(10);
                          input = '0x'.concat(input);
                          var help = web3.eth.abi.decodeParameters(
                            ['int256', 'int256'],
                            input
                          );
                          input = '';
                          input = input.concat(help[0]);
                          input = input.concat(', ');
                          input = input.concat(help[1]);
                          input = fun.concat(', '.concat(input));
                        }

                        trans.some(el => {
                          if (el.transactionHash === e.hash) {
                            var bug = e.gas === el.gasUsed ? 1 : 0;
                            var obj = {
                              hash: e.hash,
                              blockNumber: e.blockNumber,
                              bug: bug,
                              gasUsed: el.gasUsed,
                              to: e.to,
                              input: input
                            };
                            transactionsR.push(obj);
                            return true;
                          }
                        });
                      }
                    });
                  }
                });

                resolve(transactionsR);
              })
              .catch(err => {
                if (err !== 'ReferenceError: name is not define') {
                  reject(err);
                  console.log('ERROR promiseRec: ' + err);
                }
              });
          })
          .catch(err => {
            if (err !== 'ReferenceError: name is not define') {
              reject(err);
              console.log('ERROR getBlockPromises: ' + err);
            }
          });
      })
      .catch(err => {
        if (err !== 'ReferenceError: name is not define') {
          reject(err);
          console.log('ERROR getBlockNumber: ' + err);
        }
      });
  });
};

export const getPeersNumber = function() {
  return web3.eth.net.getPeerCount();
};

export const getGasPrice = function() {
  return web3.eth.getGasPrice();
};

export const getLastBlock = function() {
  return web3.eth.getBlock('latest', true);
};

const decodeTime = function(timestamp) {
  var date = new Date(timestamp * 1000);
  // Hours part from the timestamp
  var hours = date.getHours();
  // Minutes part from the timestamp
  var minutes = '0' + date.getMinutes();
  // Seconds part from the timestamp
  // var seconds = "0" + date.getSeconds();
  // + ':' + seconds.substr(-2)

  // Will display time in 10:30:23 format
  var formattedTime = hours + ':' + minutes.substr(-2);
  return formattedTime;
};

const flatten = function(arr) {
  return arr.reduce((flat, toFlatten) => {
    return flat.concat(
      Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten
    );
  }, []);
};

//////////////////////////////////////////////////////////////////////////////
//////////////////////// CUREENTLY NOT USING /////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////// COMMENT OUT TO USE //////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

////////////////////////////// PRINTS ///////////////////////////////////////

// const printBalanceOfAccounts = function() {
//   console.log('BALANCES');
//   for (var i = 0; i < accounts.length; i++) {
//     web3.eth
//       .getBalance(accounts[i][0])
//       .then(bal => {
//         console.log('Account: ' + accounts[i][0] + ' ,balance: ' + bal);
//       })
//       .catch(err => {
//         console.log('ERROR: ' + err);
//       });
//   }
// };

// const printsAccountsResults = function() {
//   console.log('');
//   for (var i = 0; i < accounts.length; i++) {
//     console.log(
//       i +
//         1 +
//         ')' +
//         'Account: ' +
//         accounts[i][0] +
//         ' , gas spent: ' +
//         accounts[i][1] +
//         ' , # of transactions: ' +
//         accounts[i][2]
//     );
//   }
//   console.log('');
// };

//////////////////////////////// END /////////////////////////////////////////

// USE TO FIND POSITION OF STORAGE IN SMART CONTRACT
// const checkPositionStorage = function(contract) {
//   for (var i = 0; i < 10; i++) {
//     web3.eth.getStorageAt(contract, i).then(res => {
//       console.log('Index: ' + i + ' , val: ' + parseInt(res));
//     });
//   }
// };

// const getPendingTransactions = function() {
//   web3.eth.subscribe('pendingTransactions', (error, result) => {
//     if (!error) console.log(result);
//   })
//   .on('data', function(transaction) {
//     console.log('Pending: ' + transaction);
//   });
// };

// const printTransactionInfo = function(e) {
//   console.log('');
//   console.log(
//     'Account: ' + e.from + ' ,TO: ' + e.to + ' , called FUNCTION: ' + e.input
//   );
//   console.log('');
// };

// const searchPrevAccounts = function(arg) {
//   var found = previous_contracts_accounts.find(function(element) {
//     return element.name === arg;
//   });

//   return found;
// };

// const is_hexadecimal = function(str) {
//   if (str[0] === 0 && str[1].toLowerCase() === 'x') {
//     return true;
//   } else {
//     return false;
//   }
// };

// const getTimeDateOfBlock = function(block) {
//   web3.eth.getBlock(block, true).then(res => {
//     var date = new Date(res.timestamp * 1000);
//     // Hours part from the timestamp
//     var hours = date.getHours();
//     // Minutes part from the timestamp
//     var minutes = '0' + date.getMinutes();
//     // Seconds part from the timestamp
//     var seconds = '0' + date.getSeconds();
//     var day = date.getDate();

//     // Will display time in 10:30:23 format
//     var formattedTime =
//       day + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
//     console.log(formattedTime);
//   });
// };

// const clearContract = function() {
//   // My ABI
//   var ABI;
//   var myContract =  new web3.eth.Contract(ABI, contract);
//   myContract
//   myContract.options.from = accountOfCentralNode;
//   myContract.options.gasPrice = '20000000000000';
//   myContract.options.gas = 5000000;
// };
