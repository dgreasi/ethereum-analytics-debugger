var express = require('express');
var router = express.Router();
var app = require('../server.js');
var analytics = require('../analytics.js');


router.get('/', function(req, res, next) {

  res.render('home', { title: 'Ethereum Analytics Debugger' });
});

///////////////////////////////////////////////////////////////
/////////////////////// Get Functions /////////////////////////
///////////////////////////////////////////////////////////////

router.post('/get_experiment', function(req, res, next) {
	var start_block = req.body.start_block;
  var end_block = req.body.end_block;

  analytics.getPendingTransactions();

  analytics.getAccountTransactionsGasSpentClearings(start_block, end_block).then(val => {
    noData = null;

    if (val[2].length < 1) {
      // console.log("ASSING NoDATA");
      noData = "No available Info! Probably there are no transactions for the specified scenario.";
    }

  	res.render('home', { 
      title: 'Ethereum Analytics Debugger - Get Experiment',
      start: val[0],
      end: val[1],
      data: val[2],
      noData: noData
    });
  });
});

router.post('/get_clearing', function(req, res, next) {

  analytics.getContractResults().then(clearings => {
    clearings[0] = parseInt(clearings[0]);
    clearings[1] = parseInt(clearings[1]);
    clearings[2] = parseInt(clearings[2]);
    res.render('home', {
      title: 'Ethereum Analytics Debugger - Get Clearing',
      clearings: clearings
    });
  });
});

router.post('/get_balance', function(req, res, next) {
  var account = req.body.account;

  analytics.getBalance(account).then(val => {
    if (val.length < 1) {
      val = "Non-existed Account";
    }
    res.render('home', {
      title: 'Ethereum Analytics Debugger - Get Balance',
      account: account,
      balance: val
    });
    
  });
});

router.post('/get_peers', function(req, res, next) {
  
  analytics.getPeersNumber().then(peers => {
    // console.log("PEERS: " + peers);
    res.render('home', { 
      title: 'Ethereum Analytics Debugger - Get Peers',
      infoP: '1',
      peers: peers
    });
  });
});

router.post('/get_account_info', function(req, res, next) {
  var start_block = req.body.start_block;
  var end_block = req.body.end_block;
  var account = req.body.account;

  analytics.getAccountInfo(start_block, end_block, account).then(val => {
    noData = null;


    accountMbalance = val[2][0];
    // Delete first element from array
    // Keep transactions
    val[2].shift();
    // Keep Inner array
    transactionsT = val[2][0];

    if (transactionsT.length < 1) {
      // console.log("ASSING NoDATA");
      noData = "No available Info! Probably there are no transactions for the specified scenario.";
    }

    res.render('home', {
      title: 'Ethereum Analytics Debugger - Get Account Info',
      start: val[0],
      end: val[1],
      account: account,
      balance: accountMbalance,
      transactions: transactionsT,
      noData: noData
    });
    
  });
});

router.post('/get_account_gas_spent',function(req, res, next) {
  var start_block = req.body.start_block;
  var end_block = req.body.end_block;
  var account = req.body.account;


  analytics.getSpentGasOfAccount(start_block, end_block, account).then(val => {
    noData = null;

    // Balance
    accountMbalance = val[2];
    // Total Gas Spent
    totalGas = val[3];
    if (totalGas == 0) {
      totalGas = "0";
    }
    // Array Block - Gas Spent
    blockGas = val[4];

    if (blockGas.length < 1) {
      noData = "No available Info! Probably there are no transactions for the specified scenario.";
    }
    // console.log("Balance " + accountMbalance);
    // console.log("totalGas " + totalGas);
    // console.log(" " + );

    res.render('home', {
      title: 'Ethereum Analytics Debugger - Get Gas Spent of Account',
      start: val[0],
      end: val[1],
      account: account,
      balance: accountMbalance,
      totalGasSpent: totalGas,
      arrayBlockGasSpent: blockGas,
      noData: noData
    });
    
  });
});


router.post('/get_block_info',function(req, res, next) {
  var block = req.body.block;

  analytics.getBlockInfo(block).then(val => {
    // console.log("INDEX");
    res.render('home', {
      title: 'Ethereum Analytics Debugger - Get Block Info',
      blockInfo: val
    });
    
  });
});

router.get('/account/:acc', function(req, res, next) {
  var account = req.params.acc;

  // console.log("Account: " + JSON.stringify(account));

  analytics.getAccountInfo(1, 1, account).then(val => {
    noData = null;

    accountMbalance = val[2][0];

    // Delete first element from array
    // Keep transactions
    val[2].shift();

    // Keep Inner array
    transactionsT = val[2][0];

    if (transactionsT.length < 1) {
      // console.log("ASSING NoDATA");
      noData = "No available Info! Probably there are no transactions for the specified scenario.";
    }

    res.render('home', {
      title: 'Ethereum Analytics Debugger - Get Account Info',
      start: val[0],
      end: val[1],
      account: account,
      balance: accountMbalance,
      transactions: transactionsT,
      noData: noData
    });
    
  });
});

router.post('/get_clearing_through_time', function(req, res, next) {
  var start_block = req.body.start_block;
  var end_block = req.body.end_block;

  analytics.getClearingsThroughTime(start_block, end_block).then(val => {
    noData = null;

    if (val[2].length < 1) {
      // console.log("ASSING NoDATA get_clearing_through_time");
      noData = "No available Info! Probably there are no transactions for the specified scenario.";
    }

    res.render('home', { 
      title: 'Ethereum Analytics Debugger - Get Clearing Through Blocks',
      start: val[0],
      end: val[1],
      clearingTT: val[2],
      noData: noData
    });
  });
});

router.post('/get_contract_details', function(req, res, next) {
  var start_block = req.body.start_block;
  var end_block = req.body.end_block;

  analytics.getContractDetails(start_block, end_block).then(val => {
    noData = null;

    if (val.length < 1) {
      // console.log("ASSING NoDATA");
      noData = "No available Info! Probably there are no transactions for the specified scenario.";
    }

    res.render('home', { 
      title: 'Ethereum Analytics Debugger - Get Contract Details',
      contracts: val,
      noData: noData
    });
  });
});

router.post('/get_transaction_info', function(req, res, next) {
  var hash = req.body.hash;

  analytics.getTranscationInfo(hash).then(val => {
    noData = null;

    if (val.length < 1) {
      console.log("ASSING NoDATA get_transaction_info");
      noData = "No available Info! There is no transaction with that hash.";
    }

    res.render('home', { 
      title: 'Ethereum Analytics Debugger - Get Transaction Info',
      transaction_info: val,
      noData: noData
    });
  });
});

router.get('/get_transaction/:hash', function(req, res, next) {
  var hash = req.params.hash;

  // console.log("Account: " + JSON.stringify(account));

  analytics.getTranscationInfo(hash).then(val => {

    res.render('home', { 
      title: 'Ethereum Analytics Debugger - Get Transaction Info',
      transaction_info: val
    });
  });
});

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////


router.post('/get_accounts', function(req, res, next) {
  var start_block = req.body.start_block;
  var end_block = req.body.end_block;

  // console.log("Start block: " + start_block);
  // console.log("End block: " + end_block);

	res.render('home', { title: 'Ethereum Analytics Debugger - Get Accounts' });
});

router.post('/get_gas_spent', function(req, res, next) {
  var account = req.body.account;
  var start_block = req.body.start_block;
  var end_block = req.body.end_block;

  // console.log("Account: " + account);
  // console.log("Start block: " + start_block);
  // console.log("End block: " + end_block);

  res.render('home', { title: 'Ethereum Analytics Debugger - Get Gas Spent' });
});


router.post('/route4', function(req, res, next) {
	var pass = req.body.password;
	

	if (pass == "paok1994") {
		// exitAll();
		res.render('home', { title: 'Ethereum Analytics Debugger - Route 4 - Success)' });
	} else {
		res.render('home', { title: 'Ethereum Analytics Debugger - Route 4 - Wrong Password)' });
	}
});

router.get('/*', function(req, res, next) {
  res.render('home', { title: 'Ethereum Analytics Debugger (wrong url, redirected to home)' });
});


module.exports = router;
