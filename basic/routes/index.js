var express = require('express');
var router = express.Router();
var app = require('../server.js');
var analytics = require('../analytics.js');


router.get('/', function(req, res, next) {

  res.render('home', { title: 'Ethereum Analytics Debugger' });
});


router.post('/get_transactions', function(req, res, next) {
	var start_block = req.body.start_block;
  var end_block = req.body.end_block;

  console.log("Start block: " + start_block);
  console.log("End block: " + end_block);
	
	// val = route1();
  val = analytics.printPaok();
	res.render('home', { 
    title: 'Ethereum Analytics Debugger - Get Experiment',
    start: start_block,
    end: end_block ,
    data: val
  });
});

router.post('/get_balance', function(req, res, next) {
	var account = req.body.account;

  console.log("Account: " + account);

	res.render('home', { title: 'Ethereum Analytics Debugger - Get Balance' });
});


router.post('/get_accounts', function(req, res, next) {
  var start_block = req.body.start_block;
  var end_block = req.body.end_block;

  console.log("Start block: " + start_block);
  console.log("End block: " + end_block);

	res.render('home', { title: 'Ethereum Analytics Debugger - Get Accounts' });
});

router.post('/get_gas_spent', function(req, res, next) {
  var account = req.body.account;
  var start_block = req.body.start_block;
  var end_block = req.body.end_block;

  console.log("Account: " + account);
  console.log("Start block: " + start_block);
  console.log("End block: " + end_block);

  res.render('home', { title: 'Ethereum Analytics Debugger - Get Gas Spent' });
});

router.post('/get_clearing', function(req, res, next) {

  res.render('home', { title: 'Ethereum Analytics Debugger - Get Clearing' });
});

router.post('/route4', function(req, res, next) {
	var pass = req.body.password;
	
	route4();

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

//////////////////// *** FUNCTIONS *** ////////////////////

function route1() {
	console.log("Calling function route1");
}

function route2() {
	console.log("Calling function route2");	
}

function route3() {
	console.log("Calling function route3");
}

function route4() {
	console.log("Calling function route4");
}


module.exports = router;
