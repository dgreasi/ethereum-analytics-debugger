var express = require('express');
var router = express.Router();
// var app = require('../server.js');
var analytics = require('../analytics');
// var $ = require('jquery');

router.get('/', function(req, res) {
  analytics.getLastBlockLocally().then(block => {
    // console.log('PAOK: ' + block);
    var prvAC = analytics.getPreviousAccounts();
    // console.log('ACCOUNTS: ' + JSON.stringify(prvAC));
    res.render('home', {
      title: 'Ethereum Analytics Debugger',
      lastBlock: block,
      previous_contracts_accounts: prvAC
    });
  });
});

///////////////////////////////////////////////////////////////
/////////////////////// Get Functions /////////////////////////
///////////////////////////////////////////////////////////////
// analytics.getLastBlockLocally().then(block => {

// });

router.post('/get', function(req, res) {
  var start_block = req.body.start_block;
  var end_block = req.body.end_block;
  var contract = req.body.contract;
  var nickname = req.body.nickname;
  var id_function = req.body.id_function;
  var hash_function = req.body.hash_function;
  var noData, prvAC, ret, transactionsT, balanceArray;
  // console.log('Function: ' + id_function + ' , start + end: ' + start_block + ' - ' + end_block);

  if (id_function === '1') {
    // GET EXPERIMENT
    ret = checkReturnHex(contract);

    if (ret || contract === '') {
      analytics
        .getAccountTransactionsGasSpentClearings(
          start_block,
          end_block,
          ret,
          nickname
        )
        .then(val => {
          noData = null;

          if (val[3].length < 1) {
            console.log('ASSING NoDATA');
            console.log(JSON.stringify(val));
            noData =
              'No available Info! Probably there are no transactions for the specified scenario.';
          }

          prvAC = analytics.getPreviousAccounts();
          analytics.getLastBlockLocally().then(block => {
            var dbData = val[3];
            var totalTransactions = 0;
            if (dbData) {
              dbData.forEach(d => {
                totalTransactions += d[2];
              });
            }

            res.render('home', {
              title: 'Ethereum Analytics Debugger - Get Experiment',
              start: val[0],
              end: val[1],
              silentBugs: val[2],
              data: val[3],
              totalTrans: totalTransactions,
              noData: noData,
              lastBlock: block,
              previous_contracts_accounts: prvAC
            });
          });
        })
        .catch(err => {
          console.log(
            'ERROR getAccountTransactionsGasSpentClearings Index: ' + err
          );
        });
    } else {
      noData = "Contract doesn't exist.";
      prvAC = analytics.getPreviousAccounts();
      analytics.getLastBlockLocally().then(block => {
        res.render('home', {
          title: 'Ethereum Analytics Debugger - Get Experiment',
          noData: noData,
          lastBlock: block,
          previous_contracts_accounts: prvAC
        });
      });
    }
  } else if (id_function === '2') {
    // GET STATE OF CONTRACT THROUGH TIME
    if (!contract) {
      let noData = "Contract doesn't exist.";
      let prvAC = analytics.getPreviousAccounts();
      analytics.getLastBlockLocally().then(block => {
        res.render('home', {
          title: 'Ethereum Analytics Debugger - Get Clearing Through Blocks',
          noData: noData,
          lastBlock: block,
          previous_contracts_accounts: prvAC
        });
      });
    } else {
      let ret = checkReturnHex(contract);

      if (ret) {
        analytics
          .getClearingsThroughTime(start_block, end_block, ret, nickname)
          .then(val => {
            let noData = null;

            if (val[2].length < 1) {
              console.log('ASSING NoDATA get_clearing_through_time');
              noData =
                "No available Info! Probably there are no transactions for the specified scenario, or the contract you specified doesn't exist.";
            }
            var prvAC = analytics.getPreviousAccounts();
            analytics.getLastBlockLocally().then(block => {
              res.render('home', {
                title:
                  'Ethereum Analytics Debugger - Get Clearing Through Blocks',
                start: val[0],
                end: val[1],
                clearingTT: val[2],
                noData: noData,
                lastBlock: block,
                previous_contracts_accounts: prvAC
              });
            });
          });
      } else {
        let noData = "Contract doesn't exist.";
        let prvAC = analytics.getPreviousAccounts();
        analytics.getLastBlockLocally().then(block => {
          res.render('home', {
            title: 'Ethereum Analytics Debugger - Get Clearing Through Blocks',
            noData: noData,
            lastBlock: block,
            previous_contracts_accounts: prvAC
          });
        });
      }
    }
  } else if (id_function === '3') {
    // GET CONTRACT DETAILS
    analytics.getContractDetails(start_block, end_block).then(val => {
      noData = null;

      if (val[2].length < 1) {
        // console.log('ASSING NoDATA');
        noData =
          'No available Info! Probably there are no transactions for the specified scenario.';
      }
      prvAC = analytics.getPreviousAccounts();
      analytics.getLastBlockLocally().then(block => {
        res.render('home', {
          title: 'Ethereum Analytics Debugger - Get Contracts',
          start: val[0],
          end: val[1],
          contracts: val[2],
          noData: noData,
          lastBlock: block,
          previous_contracts_accounts: prvAC
        });
      });
    });
  } else if (id_function === '4') {
    // GET TRANSACTIONS PER BLOCK
    analytics.getTransactionsPerBlock(start_block, end_block).then(val => {
      noData = null;

      if (val[1].length < 1) {
        // console.log('ASSING NoDATA get_clearing_through_time');
        noData =
          'No available Info! Probably there are no blocks for the specified scenario.';
      }

      var start = val[0][0];
      var end = val[0][1];
      val.shift();
      val.shift();

      var avgTs = 0;

      val.forEach(bl => {
        avgTs += bl[1];
      });

      avgTs = avgTs / (end - start);

      prvAC = analytics.getPreviousAccounts();
      analytics.getLastBlockLocally().then(block => {
        res.render('home', {
          title: 'Ethereum Analytics Debugger - Get Transactions Per Block',
          start: start,
          end: end,
          transactionsPerBlock: val,
          noData: noData,
          lastBlock: block,
          averageTsPerBlock: avgTs,
          previous_contracts_accounts: prvAC
        });
      });
    });
  } else if (id_function === '5') {
    // GET GAS SPENT OF ACCOUNT
    if (contract === '') {
      noData = 'Account not specified.';
      prvAC = analytics.getPreviousAccounts();
      analytics.getLastBlockLocally().then(block => {
        res.render('home', {
          title: 'Ethereum Analytics Debugger - Get Gas Spent of Account',
          noData: noData,
          lastBlock: block,
          previous_contracts_accounts: prvAC
        });
      });
    } else {
      ret = checkReturnHex(contract);

      if (ret) {
        analytics
          .getSpentGasOfAccount(start_block, end_block, ret, nickname)
          .then(val => {
            noData = null;

            // Balance
            var accountMbalance = val[2];
            // Total Gas Spent
            var totalGas = val[3];
            // console.log(totalGas);
            if (totalGas === 0) {
              totalGas = '0';
            }
            // Array Block - Gas Spent
            var blockGas = val[4];
            // console.log(JSON.stringify(blockGas));

            if (blockGas.length < 1) {
              noData =
                'No available Info! Probably there are no transactions for the specified scenario.';
            }
            // console.log('Balance ' + accountMbalance);
            // console.log('totalGas ' + totalGas);
            // console.log(' ' + );
            prvAC = analytics.getPreviousAccounts();
            analytics.getLastBlockLocally().then(block => {
              res.render('home', {
                title: 'Ethereum Analytics Debugger - Get Gas Spent of Account',
                start: val[0],
                end: val[1],
                account: contract,
                balance: accountMbalance,
                totalGasSpent: totalGas,
                arrayBlockGasSpentAccount: blockGas,
                noData: noData,
                lastBlock: block,
                previous_contracts_accounts: prvAC
              });
            });
          });
      } else {
        noData = "Account doesn't exist.";
        prvAC = analytics.getPreviousAccounts();
        analytics.getLastBlockLocally().then(block => {
          res.render('home', {
            title: 'Ethereum Analytics Debugger - Get Gas Spent of Account',
            noData: noData,
            lastBlock: block,
            previous_contracts_accounts: prvAC
          });
        });
      }
    }
  } else if (id_function === '6') {
    // GET ACCOUNT INFO
    if (contract === '') {
      noData = 'Account not specified.';
      prvAC = analytics.getPreviousAccounts();
      analytics.getLastBlockLocally().then(block => {
        res.render('home', {
          title: 'Ethereum Analytics Debugger - Get Account Info',
          noData: noData,
          lastBlock: block,
          previous_contracts_accounts: prvAC
        });
      });
    } else {
      ret = checkReturnHex(contract);

      if (ret) {
        analytics
          .getAccountInfo(start_block, end_block, ret, nickname)
          .then(val => {
            noData = null;

            var accountMbalance = val[2][0];
            var totalTransactions = val[2][1];
            // Delete first element from array
            // Keep transactions
            val[2].shift();
            val[2].shift();

            // Keep Inner array
            transactionsT = val[2][0];
            // console.log(JSON.stringify(transactionsT));
            if (transactionsT.length < 1) {
              // console.log('ASSING NoDATA');
              noData =
                'No available Info! Probably there are no transactions for the specified scenario.';
            }
            prvAC = analytics.getPreviousAccounts();
            analytics.getLastBlockLocally().then(block => {
              res.render('home', {
                title: 'Ethereum Analytics Debugger - Get Account Info',
                start: val[0],
                end: val[1],
                account: contract,
                balance: accountMbalance,
                totalTransactions: totalTransactions,
                transactions: transactionsT,
                noData: noData,
                lastBlock: block,
                previous_contracts_accounts: prvAC
              });
            });
          });
      } else {
        noData = "Account doesn't exist.";
        prvAC = analytics.getPreviousAccounts();
        analytics.getLastBlockLocally().then(block => {
          res.render('home', {
            title: 'Ethereum Analytics Debugger - Get Account Info',
            noData: noData,
            lastBlock: block,
            previous_contracts_accounts: prvAC
          });
        });
      }
    }
  } else if (id_function === '7') {
    // GET LAST BLOCK CLEARING
    if (contract === '') {
      noData = 'Contract not specified.';
      prvAC = analytics.getPreviousAccounts();
      analytics.getLastBlockLocally().then(block => {
        res.render('home', {
          title: 'Ethereum Analytics Debugger - Get Account Info',
          noData: noData,
          lastBlock: block,
          previous_contracts_accounts: prvAC
        });
      });
    } else {
      ret = checkReturnHex(contract);

      if (ret) {
        analytics.getContractResults(ret, nickname).then(clearings => {
          clearings[0] = parseInt(clearings[0]);
          clearings[1] = parseInt(clearings[1]);
          clearings[2] = parseInt(clearings[2]);

          prvAC = analytics.getPreviousAccounts();
          analytics.getLastBlockLocally().then(block => {
            res.render('home', {
              title: 'Ethereum Analytics Debugger - Get Clearing',
              clearings: clearings,
              lastBlock: block,
              previous_contracts_accounts: prvAC
            });
          });
        });
      } else {
        noData = "Contract doesn't exist.";
        prvAC = analytics.getPreviousAccounts();
        analytics.getLastBlockLocally().then(block => {
          res.render('home', {
            title: 'Ethereum Analytics Debugger - Get Clearing',
            noData: noData,
            lastBlock: block,
            previous_contracts_accounts: prvAC
          });
        });
      }
    }
  } else if (id_function === '8') {
    // GET BLOCKS INFO
    analytics.blocksInfo(start_block, end_block).then(val => {
      noData = null;

      if (val[1].length < 1) {
        // console.log('ASSING NoDATA get_clearing_through_time');
        noData =
          'No available Info! Probably there are no blocks for the specified scenario.';
      }

      var start = val[0][0];
      var end = val[0][1];
      val.shift();
      val.shift();

      prvAC = analytics.getPreviousAccounts();
      analytics.getLastBlockLocally().then(block => {
        res.render('home', {
          title: 'Ethereum Analytics Debugger - Get Blocks Info',
          start: start,
          end: end,
          blocksInfo: val,
          noData: noData,
          lastBlock: block,
          previous_contracts_accounts: prvAC
        });
      });
    });
  } else if (id_function === '9') {
    // GET BALANCE OF ACCOUNT PER BLOCK - CHART

    if (contract === '') {
      noData = 'Account not specified.';
      prvAC = analytics.getPreviousAccounts();
      analytics.getLastBlockLocally().then(block => {
        res.render('home', {
          title:
            'Ethereum Analytics Debugger - Get Balance of Account Per Block',
          noData: noData,
          lastBlock: block,
          previous_contracts_accounts: prvAC
        });
      });
    } else {
      ret = checkReturnHex(contract);

      if (ret) {
        analytics
          .getBalancePerBlockOfAccount(start_block, end_block, ret, nickname)
          .then(val => {
            noData = null;

            // Array Block - Gas Spent
            balanceArray = val[2];
            // console.log(val[0] + ' - ' + val[1]);

            if (balanceArray.length < 1) {
              noData =
                'No available Info! Probably there are no transactions for the specified scenario.';
            }
            // console.log('Balance ' + accountMbalance);
            // console.log('totalGas ' + totalGas);
            // console.log(' ' + );
            prvAC = analytics.getPreviousAccounts();
            analytics.getLastBlockLocally().then(block => {
              res.render('home', {
                title:
                  'Ethereum Analytics Debugger - Get Balance of Account Per Block',
                start: val[0],
                end: val[1],
                account: contract,
                noData: noData,
                lastBlock: block,
                balanceArray: balanceArray,
                previous_contracts_accounts: prvAC
              });
            });
          });
      } else {
        noData = "Account doesn't exist.";
        prvAC = analytics.getPreviousAccounts();
        analytics.getLastBlockLocally().then(block => {
          res.render('home', {
            title:
              'Ethereum Analytics Debugger - Get Balance of Account Per Block',
            noData: noData,
            lastBlock: block,
            previous_contracts_accounts: prvAC
          });
        });
      }
    }
  } else if (id_function === '10') {
    // SYNC

    analytics.syncStep(start_block, end_block).then(val => {
      // console.log(JSON.stringify(res));
      // val[2].forEach(r => {
      //   console.log('TS: ' + r.blockNumber);
      // });
      // console.log('DONE');
      prvAC = analytics.getPreviousAccounts();
      analytics.getLastBlockLocally().then(block => {
        // console.log('REDIRECT');

        res.render('home', {
          title:
            'Ethereum Analytics Debugger - Sync through specified blocks Complete',
          start: val[0],
          end: val[1],
          lastBlock: block,
          previous_contracts_accounts: prvAC
        });
      });
    });
  } else if (id_function === '11') {
    // Get Transactions
    ret = checkReturnHex(contract);

    if (ret || contract === '') {
      analytics
        .getTransactions(start_block, end_block, ret, nickname)
        .then(val => {
          noData = null;

          if (val[2].length < 1) {
            console.log('ASSING NoDATA');
            console.log(JSON.stringify(val));
            noData =
              'No available Info! Probably there are no transactions for the specified scenario.';
          }

          prvAC = analytics.getPreviousAccounts();
          analytics.getLastBlockLocally().then(block => {
            var dbData = val[2];

            // console.log(JSON.stringify(dbData));

            res.render('home', {
              title: 'Ethereum Analytics Debugger - Get Transactions',
              start: val[0],
              end: val[1],
              transactionsAll: dbData,
              totalTrans: dbData.length,
              noData: noData,
              lastBlock: block,
              previous_contracts_accounts: prvAC
            });
          });
        });
    } else {
      noData = "Contract doesn't exist.";
      prvAC = analytics.getPreviousAccounts();
      analytics.getLastBlockLocally().then(block => {
        res.render('home', {
          title: 'Ethereum Analytics Debugger - Get Transactions',
          noData: noData,
          lastBlock: block,
          previous_contracts_accounts: prvAC
        });
      });
    }
  } else if (id_function === '12') {
    // Market Chart
    analytics.marketChart(start_block, end_block).then(val => {
      noData = null;

      if (val[2].length < 1) {
        console.log('ASSING NoDATA');
        console.log(JSON.stringify(val));
        noData =
          'No available Info! Probably there are no transactions for the specified scenario.';
      } else {
        var genD = [];
        var conD = [];

        var gen = val[2];
        var con = val[3];

        var genNew = [];
        var conNew = [];
        // push at the beggining
        genNew.push({ quantity: 0, price: gen[0].price });
        genNew.push(gen[0]);

        conNew.push({ quantity: 0, price: con[0].price });
        conNew.push(con[0]);

        for (var i = 1; i < gen.length; i++) {
          gen[i].quantity += gen[i - 1].quantity;
          genNew.push({ quantity: gen[i - 1].quantity, price: gen[i].price });
          genNew.push(gen[i]);
        }

        for (var j = 1; j < con.length; j++) {
          // help1 = 0;
          con[j].quantity += con[j - 1].quantity;
          conNew.push({ quantity: con[j - 1].quantity, price: con[j].price });
          conNew.push(con[j]);
        }

        // console.log('Gen length: ' + genNew.length);
        // console.log('Con length: ' + conNew.length);

        genNew.forEach(el => {
          genD.push(el.price);
          genD.push(el.quantity);
        });

        conNew.forEach(el => {
          conD.push(el.price);
          conD.push(el.quantity);
        });
        // dbData.push(val[2]);
        // dbData.push(val[3]);

        // console.log(JSON.stringify(dbData));
        // console.log('REDIRECT');
      }

      prvAC = analytics.getPreviousAccounts();
      analytics.getLastBlockLocally().then(block => {
        res.render('home', {
          title: 'Ethereum Analytics Debugger - Get Transactions',
          start: val[0],
          end: val[1],
          market: genNew,
          generation: val[2],
          consumption: val[3],
          genD: genD,
          conD: conD,
          noData: noData,
          lastBlock: block,
          previous_contracts_accounts: prvAC
        });
      });
    });
  } else if (id_function === '13') {
    // Get Time to Mine Block
    analytics.getTimeToMineBlock(start_block, end_block).then(val => {
      var noData = null;

      prvAC = analytics.getPreviousAccounts();
      analytics.getLastBlockLocally().then(block => {
        // console.log('REDIRECT');
        if (!val[2]) {
          console.log('ASSING NoDATA');
          console.log(JSON.stringify(val));
          noData =
            'No available Info! Probably there are no transactions for the specified scenario.';
        }

        res.render('home', {
          title: 'Ethereum Analytics Debugger - Time to Mine Block',
          start: val[0],
          end: val[1],
          timeToMine: val[2],
          noData: noData,
          lastBlock: block,
          previous_contracts_accounts: prvAC
        });
      });
    });
  } else if (id_function === '14') {
    ret = checkReturnHex(contract);

    if (ret) {
      // console.log('Contract: ' + contract);
      // console.log('Hash of function: ' + hash_function);

      analytics
        .getReturnValueOfFunction(contract, hash_function, nickname)
        .then(val => {
          let prvAC = analytics.getPreviousAccounts();
          let contractsC = analytics.getCompiledContracts();
          analytics.getLastBlockLocally().then(block => {
            if (val) {
              res.render('home', {
                title:
                  'Ethereum Analytics Debugger - Get Value of function: ' +
                  hash_function,
                lastBlock: block,
                contracts_compiled: contractsC,
                previous_contracts_accounts: prvAC,
                call_general_fun: val,
                function_live_value: true
              });
            } else {
              res.render('home', {
                title:
                  'Ethereum Analytics Debugger - Error getting return value',
                lastBlock: block,
                contracts_compiled: contractsC,
                previous_contracts_accounts: prvAC,
                noData:
                  "The specified address of contract doesn't contain a function with hash: " +
                  hash_function +
                  ", or the function doesn't return a value"
              });
            }
          });
        });
    } else {
      let noData = 'No contract address Specified.';
      let prvAC = analytics.getPreviousAccounts();
      let contractsC = analytics.getCompiledContracts();
      analytics.getLastBlockLocally().then(block => {
        res.render('home', {
          title: 'Ethereum Analytics Debugger - Error at get Value of function',
          noData: noData,
          lastBlock: block,
          contracts_compiled: contractsC,
          previous_contracts_accounts: prvAC
        });
      });
    }
  } else if (id_function === '15') {
    analytics.getPeersNumber().then(peers => {
      // console.log('PEERS: ' + peers);
      var prvAC = analytics.getPreviousAccounts();
      analytics.getLastBlockLocally().then(block => {
        res.render('home', {
          title: 'Ethereum Analytics Debugger - Get Peers',
          infoP: '1',
          peers: peers,
          lastBlock: block,
          previous_contracts_accounts: prvAC
        });
      });
    });
  } else {
    ret = checkReturnHex(contract);

    if (ret || contract === '') {
      analytics
        .getAccountTransactionsGasSpentClearings(
          start_block,
          end_block,
          ret,
          nickname
        )
        .then(val => {
          noData = null;

          if (val[3].length < 1) {
            console.log('ASSING NoDATA');
            console.log(JSON.stringify(val));
            noData =
              'No available Info! Probably there are no transactions for the specified scenario.';
          }

          prvAC = analytics.getPreviousAccounts();
          analytics.getLastBlockLocally().then(block => {
            var dbData = val[3];
            var totalTransactions = 0;
            if (dbData) {
              dbData.forEach(d => {
                totalTransactions += d[2];
              });
            }

            res.render('home', {
              title: 'Ethereum Analytics Debugger - Get Experiment',
              start: val[0],
              end: val[1],
              silentBugs: val[2],
              data: val[3],
              totalTrans: totalTransactions,
              noData: noData,
              lastBlock: block,
              previous_contracts_accounts: prvAC
            });
          });
        });
    } else {
      noData = "Contract doesn't exist.";
      prvAC = analytics.getPreviousAccounts();
      analytics.getLastBlockLocally().then(block => {
        res.render('home', {
          title: 'Ethereum Analytics Debugger - Get Experiment',
          noData: noData,
          lastBlock: block,
          previous_contracts_accounts: prvAC
        });
      });
    }
  }
});

router.post('/get_contract_abi', function(req, res, next) {
  let sol_code = req.body.sol_code;
  // console.log(JSON.stringify(sol_code));
  if (sol_code) {
    analytics.getABI(sol_code).then(val => {
      if (val.length > 1) {
        // console.log(JSON.stringify(val[2]));
        let prvAC = analytics.getPreviousAccounts();
        analytics.getLastBlockLocally().then(block => {
          res.render('home', {
            title: 'Ethereum Analytics Debugger - Compiled Contracts',
            lastBlock: block,
            previous_contracts_accounts: prvAC,
            warnings: val[1],
            contracts_compiled: val[2]
          });
        });
      } else {
        let prvAC = analytics.getPreviousAccounts();
        analytics.getLastBlockLocally().then(block => {
          res.render('home', {
            title: 'Ethereum Analytics Debugger - Error at Contract',
            lastBlock: block,
            previous_contracts_accounts: prvAC,
            error_contract: val[0]
          });
        });
      }
    });
  } else {
    let noData = 'No solidity code submitted.';
    let prvAC = analytics.getPreviousAccounts();
    let contractsC = analytics.getCompiledContracts();
    analytics.getLastBlockLocally().then(block => {
      res.render('home', {
        title: 'Ethereum Analytics Debugger - Compiled Contracts',
        noData: noData,
        lastBlock: block,
        contracts_compiled: contractsC,
        previous_contracts_accounts: prvAC
      });
    });
  }
});

function checkReturnHex(arg) {
  var prvAC = analytics.getPreviousAccounts();
  if (isHex(arg)) {
    // console.log('RETURN: ' + arg);
    return arg;
  } else {
    var ret = searchPrevAcc(prvAC, arg);
    if (ret) {
      // console.log('RETURN: ' + ret.hex);
      return ret.hex;
    } else {
      // console.log('RETURN: FALSE');

      return false;
    }
  }
}

function isHex(str) {
  if (parseInt(str[0]) === 0 && str[1].toLowerCase() === 'x') {
    return true;
  } else {
    return false;
  }
}

function searchPrevAcc(prvAC, arg) {
  var found = prvAC.find(function(element) {
    return element.name === arg;
  });

  return found;
}

router.post('/get_block_info', function(req, res) {
  var block = req.body.block;

  analytics.getBlockInfoMinimal(block).then(val => {
    // console.log('INDEX');
    var prvAC = analytics.getPreviousAccounts();
    analytics.getLastBlockLocally().then(block => {
      res.render('home', {
        title: 'Ethereum Analytics Debugger - Get Block Info',
        blockInfo: val,
        lastBlock: block,
        previous_contracts_accounts: prvAC
      });
    });
  });
});

router.get('/get_block/:block', function(req, res) {
  var block = req.params.block;

  analytics.getBlockInfoMinimal(block).then(val => {
    // console.log('INDEX');
    var prvAC = analytics.getPreviousAccounts();
    analytics.getLastBlockLocally().then(block => {
      res.render('home', {
        title: 'Ethereum Analytics Debugger - Get Block Info',
        blockInfo: val,
        lastBlock: block,
        previous_contracts_accounts: prvAC
      });
    });
  });
});

router.get('/account/:acc', function(req, res) {
  var account = req.params.acc;
  // console.log('Account: ' + JSON.stringify(account));

  analytics.getAccountInfo(1, 1, account, '').then(val => {
    var noData = null;

    var accountMbalance = val[2][0];
    var totalTransactions = val[2][1];
    // Delete first element from array
    // Keep transactions
    val[2].shift();
    val[2].shift();

    // Keep Inner array
    var transactionsT = val[2][0];
    // console.log(JSON.stringify(transactionsT));
    if (transactionsT.length < 1) {
      // console.log('ASSING NoDATA');
      noData =
        'No available Info! Probably there are no transactions for the specified scenario.';
    }

    var prvAC = analytics.getPreviousAccounts();
    analytics.getLastBlockLocally().then(block => {
      res.render('home', {
        title: 'Ethereum Analytics Debugger - Get Account Info',
        start: val[0],
        end: val[1],
        account: account,
        balance: accountMbalance,
        totalTransactions: totalTransactions,
        transactions: transactionsT,
        noData: noData,
        lastBlock: block,
        previous_contracts_accounts: prvAC
      });
    });
  });
});

router.post('/get_transaction_info', function(req, res) {
  var hash = req.body.hash;

  analytics.getTranscationInfoHash(hash).then(val => {
    var noData = null;

    if (val.length < 1) {
      console.log('ASSING NoDATA get_transaction_info');
      noData = 'No available Info! There is no transaction with that hash.';
    }

    var prvAC = analytics.getPreviousAccounts();
    analytics.getLastBlockLocally().then(block => {
      res.render('home', {
        title: 'Ethereum Analytics Debugger - Get Transaction Info',
        transaction_info: val,
        noData: noData,
        lastBlock: block,
        previous_contracts_accounts: prvAC
      });
    });
  });
});

router.get('/get_transaction/:hash', function(req, res) {
  var hash = req.params.hash;
  // console.log('Account: ' + JSON.stringify(account));

  analytics.getTranscationInfoHash(hash).then(val => {
    var prvAC = analytics.getPreviousAccounts();
    analytics.getLastBlockLocally().then(block => {
      res.render('home', {
        title: 'Ethereum Analytics Debugger - Get Transaction Info',
        transaction_info: val,
        lastBlock: block,
        previous_contracts_accounts: prvAC
      });
    });
  });
});

router.get('/get_live', function(req, res) {
  // console.log('CALLED');
  let promT = [];

  promT.push(analytics.getLastBlock());
  promT.push(analytics.getGasPrice());

  Promise.all(promT).then(r => {
    let dat = new Date();
    r.push(dat);
    // console.log('R: ' + JSON.stringify(r));
    res.send(r);
  });
});

router.get('/get_live_fn_chart', function(req, res) {
  // console.log('CALLED');
  let promT = [];

  promT.push(analytics.getLastBlock());
  promT.push(analytics.getReturnValueOfFunctionLiveChart());

  Promise.all(promT).then(r => {
    // let dat = new Date();
    // r.push(dat);
    // console.log(JSON.stringify(r));
    // console.log('R: ' + JSON.stringify(r));
    res.send(r);
  });
});

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

router.get('/*', function(req, res) {
  res.render('home', {
    title: 'Ethereum Analytics Debugger (wrong url, redirected to home)'
  });
});

module.exports = router;
