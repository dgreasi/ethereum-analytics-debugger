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
		var prices = [];
		var quantity = [];

		for (var i = 0; i < dataToArray_chart.length; i=i+4) {
			blocks.push(dataToArray_chart[i]);
			prices.push(dataToArray_chart[i+1]);
			quantity.push(dataToArray_chart[i+2]);
		}

		// console.log("Blocks: " + blocks[0]);
		// console.log("Prices: " + prices[0]);
		// console.log("Quantity: " + quantity[0]);

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

		var data = [trace1, trace2];

		var layout = {
		  title: 'Clearing Price && Quantity',
		  yaxis: {title: 'Price'},
		  yaxis2: {
		    title: 'Quantity',
		    titlefont: {color: 'rgb(148, 103, 189)'},
		    tickfont: {color: 'rgb(148, 103, 189)'},
		    overlaying: 'y',
		    side: 'right'
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

