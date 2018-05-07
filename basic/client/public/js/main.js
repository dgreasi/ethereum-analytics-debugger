// add scripts

$(document).on('ready', function() {

	setInterval(() => {
		$.get( '/get_live',"", function(data) {

			$('#Block').html(data[0].number);
			$('#difficulty').html(data[0].difficulty);
			$('#gasLimit').html(data[0].gasLimit);
			$('#gasUsed').html(data[0].gasUsed);
			$('#gas').html(data[1]);
			$('#date').html(data[2]);

			diff_chart = document.getElementById('diff_chart');
			gasLimit_chart = document.getElementById('gasLimit_chart');
			gasUsed_chart = document.getElementById('gasUsed_chart');
			ts_number_chart = document.getElementById('ts_number_chart');
			market_chart = document.getElementById('market_chart');

			
			if (diff_chart) {
				// console.log("diff_chart.data: " + JSON.stringify(diff_chart.data));
				var layoutD = {
					title: 'Difficulty',
					yaxis: {title: 'Difficulty of Block'},
				};

				if (diff_chart.data) {
					var found = diff_chart.data[0].x.find((el) => {
						return el == data[0].number;
					});

					// console.log("FOUND: " + found);
					if (found) {
						// console.log("ALREADY IN");
					} else {
						var blockN = [];
						blockN = diff_chart.data[0].x;
						var diffN = [];
						diffN = diff_chart.data[0].y;

						// console.log("BLOCK TO PUSH: " + blockN);
						// console.log("DIFF TO PUSH: " + diffN);
						blockN.push(data[0].number);
						diffN.push(data[0].difficulty);

						if (blockN.length > 10) {
							blockN.shift();
							diffN.shift();
						}
						// console.log("AFTER    BLOCK TO PUSH: " + blockN);
						// console.log("AFTER    DIFF TO PUSH: " + diffN);
						
						var data_update = {
						    x: blockN,
						    y: diffN,
							name: 'Difficulty',
				  			type: 'bar'
						};

						var dataD = [data_update];
						// console.log("NEW DATA TO PUSH: " + JSON.stringify(dataD));

						Plotly.update('diff_chart', dataD, layoutD);

						// Plotly.plot('diff_chart', dataD, layoutD);
					}
				} else {					
					// console.log("INIT CHART");
					block = [];
					diff = [];

					block.push(data[0].number);
					diff.push(data[0].difficulty);

					var trace1D = {
					  	x: block,
						y: diff,
						name: 'Difficulty',
			  			type: 'bar'
					};

					var dataD = [trace1D];

					Plotly.plot('diff_chart', dataD, layoutD);
				}
			}

			if (gasLimit_chart) {
				// console.log("diff_chart.data: " + JSON.stringify(diff_chart.data));
				var layoutD1 = {
					title: 'Gas Limit',
					yaxis: {title: 'gas'},
				};

				if (gasLimit_chart.data) {
					var found = gasLimit_chart.data[0].x.find((el) => {
						return el == data[0].number;
					});

					// console.log("FOUND: " + found);
					if (found) {
						// console.log("ALREADY IN");
					} else {
						var blockN1 = [];
						blockN1 = gasLimit_chart.data[0].x;
						var diffN1 = [];
						diffN1 = gasLimit_chart.data[0].y;

						// console.log("BLOCK TO PUSH: " + blockN);
						// console.log("DIFF TO PUSH: " + diffN);
						blockN1.push(data[0].number);
						diffN1.push(data[0].gasLimit);

						if (blockN1.length > 10) {
							blockN1.shift();
							diffN1.shift();
						}
						// console.log("AFTER    BLOCK TO PUSH: " + blockN);
						// console.log("AFTER    DIFF TO PUSH: " + diffN);
						
						var data_update1 = {
						    x: blockN1,
						    y: diffN1,
							name: 'Gas Limit',
				  			type: 'bar'
						};

						var dataD1 = [data_update1];
						// console.log("NEW DATA TO PUSH: " + JSON.stringify(dataD));

						Plotly.update('gasLimit_chart', dataD1, layoutD1);

						// Plotly.plot('diff_chart', dataD, layoutD);
					}
				} else {					
					// console.log("INIT CHART");
					block1 = [];
					diff1 = [];

					block1.push(data[0].number);
					diff1.push(data[0].gasLimit);

					var trace1D = {
					  	x: block1,
						y: diff1,
						name: 'Gas Limit',
			  			type: 'bar'
					};

					var dataD1 = [trace1D];

					Plotly.plot('gasLimit_chart', dataD1, layoutD1);
				}
			}

			if (gasUsed_chart) {
				// console.log("diff_chart.data: " + JSON.stringify(diff_chart.data));
				var layoutD2 = {
					title: 'Gas Spending',
					yaxis: {title: 'gas'},
				};

				if (gasUsed_chart.data) {
					var found = gasUsed_chart.data[0].x.find((el) => {
						return el == data[0].number;
					});

					// console.log("FOUND: " + found);
					if (found) {
						// console.log("ALREADY IN");
					} else {
						var blockN2 = [];
						blockN2 = gasUsed_chart.data[0].x;
						var diffN2 = [];
						diffN2 = gasUsed_chart.data[0].y;

						// console.log("BLOCK TO PUSH: " + blockN);
						// console.log("DIFF TO PUSH: " + diffN);
						blockN2.push(data[0].number);
						diffN2.push(data[0].gasUsed);

						if (blockN2.length > 10) {
							blockN2.shift();
							diffN2.shift();
						}
						// console.log("AFTER    BLOCK TO PUSH: " + blockN);
						// console.log("AFTER    DIFF TO PUSH: " + diffN);
						
						var data_update2 = {
						    x: blockN2,
						    y: diffN2,
							name: 'Gas Used',
				  			type: 'bar'
						};

						var dataD2 = [data_update2];
						// console.log("NEW DATA TO PUSH: " + JSON.stringify(dataD));

						Plotly.update('gasUsed_chart', dataD2, layoutD2);

						// Plotly.plot('diff_chart', dataD, layoutD);
					}
				} else {					
					// console.log("INIT CHART");
					block2 = [];
					diff2 = [];

					block2.push(data[0].number);
					diff2.push(data[0].gasUsed);

					var traceD2 = {
					  	x: block2,
						y: diff2,
						name: 'Gas Used',
			  			type: 'bar'
					};

					var dataD2 = [traceD2];

					Plotly.plot('gasUsed_chart', dataD2, layoutD2);
				}
			}

			if (ts_number_chart) {
				// console.log("diff_chart.data: " + JSON.stringify(diff_chart.data));
				var layoutD3 = {
					title: 'Transactions',
					yaxis: {title: '# of ts'},
				};

				if (ts_number_chart.data) {
					var found = ts_number_chart.data[0].x.find((el) => {
						return el == data[0].number;
					});

					// console.log("FOUND: " + found);
					if (found) {
						// console.log("ALREADY IN");
					} else {
						var blockN3 = [];
						blockN3 = ts_number_chart.data[0].x;
						var diffN3 = [];
						diffN3 = ts_number_chart.data[0].y;

						// console.log("BLOCK TO PUSH: " + blockN);
						// console.log("DIFF TO PUSH: " + diffN);
						blockN3.push(data[0].number);
						diffN3.push(data[0].transactions.length);

						if (blockN3.length > 10) {
							blockN3.shift();
							diffN3.shift();
						}
						// console.log("AFTER    BLOCK TO PUSH: " + blockN);
						// console.log("AFTER    DIFF TO PUSH: " + diffN);
						
						var data_update3 = {
						    x: blockN3,
						    y: diffN3,
							name: '# of ts',
				  			type: 'bar'
						};

						var dataD3 = [data_update3];
						// console.log("NEW DATA TO PUSH: " + JSON.stringify(dataD));

						Plotly.update('ts_number_chart', dataD3, layoutD3);

						// Plotly.plot('diff_chart', dataD, layoutD);
					}
				} else {					
					// console.log("INIT CHART");
					block3 = [];
					diff3 = [];

					block3.push(data[0].number);
					diff3.push(data[0].gasUsed);

					var traceD3 = {
					  	x: block3,
						y: diff3,
						name: '# of ts',
			  			type: 'bar'
					};

					var dataD3 = [traceD3];

					Plotly.plot('ts_number_chart', dataD3, layoutD3);
				}
			}


		});
	}, 3000);

	// console.log("CHECK");
	price_chart = document.getElementById('price_chart');
	array_block_gas_spent_chart = document.getElementById('array_block_gas_spent_chart');
	transactions_per_block_chart = document.getElementById('transactions_per_block_chart');
	gas_per_block_chart = document.getElementById('gas_per_block_chart');
	balance_of_account_per_block_chart = document.getElementById('balance_of_account_per_block_chart');
	market_chart = document.getElementById('market_chart');



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

	if (gas_per_block_chart) {
		var data1_chart = gas_per_block_chart.getAttribute('data-for');
		var dataToArray1_chart = data1_chart.split(",");

		var blocks = [];
		var gasSpent = [];

		for (var i = 0; i < dataToArray1_chart.length; i=i+2) {
			blocks.push(dataToArray1_chart[i]);
			gasSpent.push(dataToArray1_chart[i+1]);
		}

		// NEW CHART
		var trace1 = {
		  	x: blocks,
			y: gasSpent,
			name: 'gasSpent',
			fill: 'tozeroy',
  			type: 'scatter'
		};

		var data = [trace1];

		var layout = {
		  title: 'Gas Spent - Blocks',
		  yaxis: {title: 'Gas Spent'},
		};

		Plotly.plot('gas_per_block_chart', data, layout);
	}

	if (balance_of_account_per_block_chart) {
		var data1_chart = balance_of_account_per_block_chart.getAttribute('data-for');
		var dataToArray1_chart = data1_chart.split(",");

		var blocks = [];
		var balance = [];

		for (var i = 0; i < dataToArray1_chart.length; i=i+2) {
			blocks.push(dataToArray1_chart[i]);
			balance.push(dataToArray1_chart[i+1]);
		}

		// NEW CHART
		var trace1 = {
		  	x: blocks,
			y: balance,
			name: 'balance',
			fill: 'tozeroy',
  			type: 'scatter'
		};

		var data = [trace1];

		var layout = {
		  title: 'Balance of Account - Blocks',
		  yaxis: {title: 'Balance'},
		};

		Plotly.plot('balance_of_account_per_block_chart', data, layout);
	}

	if (market_chart) {
		console.log("CHART");
		generation = document.getElementById('generation');
		consumption = document.getElementById('consumption');

		var data1_chart = generation.getAttribute('data-for');
		var data2_chart = consumption.getAttribute('data-for');

		var dataToArray1_chart = data1_chart.split(",");
		var dataToArray2_chart = data2_chart.split(",");

		console.log(JSON.stringify(dataToArray1_chart));

		var genPrice = [];
		var genQuantity = [];

		var conPrice = [];
		var conQuantity = [];

		for (var i = 0; i < dataToArray1_chart.length; i=i+2) {
			genPrice.push(parseInt(dataToArray1_chart[i]));
			genQuantity.push(parseInt(dataToArray1_chart[i+1]));
		}

		for (var i = 0; i < dataToArray2_chart.length; i=i+2) {
			conPrice.push(parseInt(dataToArray2_chart[i]));
			conQuantity.push(parseInt(dataToArray2_chart[i+1]));
		}

		console.log("genPrice: " + JSON.stringify(genPrice));
		console.log("genQuantity: " + JSON.stringify(genQuantity));

		console.log("conPrice: " + JSON.stringify(conPrice));
		console.log("conQuantity: " + JSON.stringify(conQuantity));


		// NEW CHART
		var trace1 = {
		  	x: genQuantity,
			y: genPrice,
			name: 'Generation',
  			type: 'scatter'
		};

		var trace2 = {
			x: conQuantity,
			y: conPrice,
			name: 'Consumption',
			type: 'scatter'
		};

		var data = [trace1, trace2];

		var layout = {
		  title: 'Market State',
		  yaxis: {title: 'Price'},
		};

		Plotly.plot('market_chart', data, layout);
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

$( "#gas_per_block" ).click(function() {
  // alert( "Handler for .click() called." );
  $( "#id_function" ).val("8");
  $( "#submit_global" ).click();
});

$( "#get_balance_account_per_block" ).click(function() {
  // alert( "Handler for .click() called." );
  $( "#id_function" ).val("9");
  $( "#submit_global" ).click();
});

$( "#sync" ).click(function() {
  // alert( "Handler for .click() called." );
  $( "#id_function" ).val("10");
  $( "#submit_global" ).click();
});

$( "#get_trs" ).click(function() {
  // alert( "Handler for .click() called." );
  $( "#id_function" ).val("11");
  $( "#submit_global" ).click();
});

$( "#get_market_chart" ).click(function() {
  // alert( "Handler for .click() called." );
  $( "#id_function" ).val("12");
  $( "#submit_global" ).click();
});
