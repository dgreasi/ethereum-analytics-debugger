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

  analytics.getAccountTransactionsGasSpentClearings(start_block, end_block).then(val => {
    
    // console.log("RETURN VALUE: " + JSON.stringify(val));

  	res.render('home', { 
      title: 'Ethereum Analytics Debugger - Get Experiment',
      start: val[0],
      end: val[1],
      data: val[2]
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

    accountMbalance = val[2][0];
    // Delete first element from array
    // Keep transactions
    val[2].shift();
    // Keep Inner array
    transactionsT = val[2][0];

    res.render('home', {
      title: 'Ethereum Analytics Debugger - Get Account Info',
      start: val[0],
      end: val[1],
      account: account,
      balance: accountMbalance,
      transactions: transactionsT
    });
    
  });
});

router.get('/account/:acc', function(req, res, next) {
  var account = req.params.acc;

  // console.log("Account: " + JSON.stringify(account));

  analytics.getAccountInfo(1, 1, account).then(val => {

    accountMbalance = val[2][0];

    // Delete first element from array
    // Keep transactions
    val[2].shift();

    // Keep Inner array
    transactionsT = val[2][0];

    res.render('home', {
      title: 'Ethereum Analytics Debugger - Get Account Info',
      start: val[0],
      end: val[1],
      account: account,
      balance: accountMbalance,
      transactions: transactionsT
    });
    
  });
});

router.post('/get_clearing_through_time', function(req, res, next) {
  var start_block = req.body.start_block;
  var end_block = req.body.end_block;

  analytics.getClearingsThroughTime(start_block, end_block).then(val => {

    res.render('home', { 
      title: 'Ethereum Analytics Debugger - Get Clearing Through Blocks',
      start: val[0],
      end: val[1],
      clearingTT: val[2]
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
