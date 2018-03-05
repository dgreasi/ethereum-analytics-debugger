// add scripts

$(document).on('ready', function() {
	// console.log("CHECK");
	price_chart = document.getElementById('price_chart');
	array_block_gas_spent_chart = document.getElementById('array_block_gas_spent_chart');
	transactions_per_block_chart = document.getElementById('transactions_per_block_chart');

	if (price_chart) {
		var data_chart = price_chart.getAttribute('data-for');
		var dataToArray_chart = data_chart.split(",");
		// console.log("TEST price_chart: " + JSON.stringify(dataToArray_chart));

		var blocks = [];
		var time = [];
		var prices = [];
		var quantity = [];
		var zeros = [];

		for (var i = 0; i < dataToArray_chart.length; i=i+6) {
			blocks.push(dataToArray_chart[i]);
			time.push(dataToArray_chart[i+1]);
			zeros.push(0);
			// console.log("TIME: " + dataToArray_chart[i+1]);
			prices.push(dataToArray_chart[i+2]);
			quantity.push(dataToArray_chart[i+3]);
		}

		// console.log("Blocks: " + blocks[0]);
		// console.log("Prices: " + prices[0]);
		// console.log("Quantity: " + quantity[0]);


		// console.log("blocks: " + blocks.length);
		// console.log("time: " + time.length);
		// console.log("A: " + JSON.stringify(time));
		// NEW CHART

		var trace1 = {
		  	x: blocks,
			y: prices,
			name: 'Price data',
			type: 'scatter'
		};

		var trace2 = {
			x: blocks,
			y: quantity,
			name: 'Quantity data',
			yaxis: 'y2',
			type: 'scatter'
		};

		var trace3 = {
			x: time,
			y: zeros,
			name: 'Time',
			xaxis: 'x2',
			type: 'scatter',
			marker: {
              color: 'white'
            }
		};

		var data = [trace1, trace2, trace3];
		// var data = [trace1, trace2];


		var layout = {
		  title: 'Clearing Price && Quantity',
		  xaxis: {
		  	title: 'Blocks',
		  },
		  yaxis: {
		  	title: 'Price',
		  	range: [0, 40]
		  },
		  yaxis2: {
		    title: 'Quantity',
		    titlefont: {color: 'rgb(148, 103, 189)'},
		    tickfont: {color: 'rgb(148, 103, 189)'},
		    overlaying: 'y',
		    side: 'right'
		  },
		  xaxis2: {
            titlefont: {color: 'white'}, 
            tickfont: {color: 'rgb(148, 103, 189)'}, 
            overlaying: 'x', 
            side: 'top'
      	  }
		};

		Plotly.plot('price_chart', data, layout);
	}

	if (array_block_gas_spent_chart) {
		var data1_chart = array_block_gas_spent_chart.getAttribute('data-for');
		var dataToArray1_chart = data1_chart.split(",");
		// console.log("TEST array_block_gas_spent_chart: " + JSON.stringify(dataToArray1_chart));

		var blocks = [];
		var gasSpent = [];
		var gasLimit = [];

		for (var i = 0; i < dataToArray1_chart.length; i=i+3) {
			blocks.push(dataToArray1_chart[i]);
			gasSpent.push(dataToArray1_chart[i+1]);
			gasLimit.push(dataToArray1_chart[i+2]);
		}

		// console.log("Blocks: " + blocks[0]);
		// console.log("Prices: " + prices[0]);
		// console.log("Quantity: " + quantity[0]);

		// NEW CHART

		var trace1 = {
		  	x: blocks,
			y: gasSpent,
			name: 'gasSpent',
			fill: 'tozeroy',
  			type: 'scatter'
		};

		var trace2 = {
			x: blocks,
			y: gasLimit,
			name: 'gasLimit',
			fill: 'tozeroy',
			type: 'scatter'
		};

		var data = [trace1, trace2];

		var layout = {
		  title: 'Gas Spent - Gas Limit - Blocks',
		  yaxis: {title: 'Gas Spent'},
		};

		Plotly.plot('array_block_gas_spent_chart', data, layout);
	}

	if (transactions_per_block_chart) {

		var data_chart = transactions_per_block_chart.getAttribute('data-for');
		var dataToArray_chart = data_chart.split(",");
		// console.log("TEST transactions_per_block_chart: " + JSON.stringify(dataToArray_chart));

		var blocks = [];
		var transcations = [];
		var quantity = [];

		for (var i = 0; i < dataToArray_chart.length; i=i+2) {
			blocks.push(dataToArray_chart[i]);
			transcations.push(dataToArray_chart[i+1]);
		}

		// console.log("Blocks: " + blocks[0]);
		// console.log("Prices: " + prices[0]);
		// console.log("Quantity: " + quantity[0]);

		// NEW CHART

		var trace1 = {
		  	x: blocks,
			y: transcations,
			fill: 'tozeroy',
			type: 'scatter'
		};

		var data = [trace1];

		var layout = {
		  title: 'Transactions Per Block',
		  yaxis: {title: '# Transactions'},
		};

		Plotly.plot('transactions_per_block_chart', data, layout);
	}
});


$('.clickclass').click(function (event) {
  // If the input button is clicked, get the parent with class 'clickclass' and replace with other HTML.
  console.log("Target id: " + event.target.id);
  console.log("Target val: " + event.target);
  val = $(event.target).text();
  console.log("VAL: " + JSON.stringify(val));
  $( "#contract" ).val(val);
  // if (event.target.id == 'save_button') {
  //    myparent = event.target.parent();
  //    myparent.html('some html code');
  // }

});

$( "#get_exp" ).click(function() {
  // alert( "Handler for .click() called." );
  $( "#id_function" ).val("1");
  $( "#submit_global" ).click();
});

$( "#get_clr" ).click(function() {
  // alert( "Handler for .click() called." );
  $( "#id_function" ).val("2");
  $( "#submit_global" ).click();
});

$( "#get_con_details" ).click(function() {
  // alert( "Handler for .click() called." );
  $( "#id_function" ).val("3");
  $( "#submit_global" ).click();
});

$( "#get_transactions_per_block" ).click(function() {
  // alert( "Handler for .click() called." );
  $( "#id_function" ).val("4");
  $( "#submit_global" ).click();
});

$( "#get_account_gas_spent" ).click(function() {
  // alert( "Handler for .click() called." );
  $( "#id_function" ).val("5");
  $( "#submit_global" ).click();
});

$( "#get_account_info" ).click(function() {
  // alert( "Handler for .click() called." );
  $( "#id_function" ).val("6");
  $( "#submit_global" ).click();
});

$( "#get_clr_last_block" ).click(function() {
  // alert( "Handler for .click() called." );
  $( "#id_function" ).val("7");
  $( "#submit_global" ).click();
});