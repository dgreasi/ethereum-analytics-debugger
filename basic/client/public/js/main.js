// add scripts

$(document).on('ready', function() {
	setInterval(() => {
		$.get('/get_live', '', function(data) {
			$('#Block').html(data[0].number);
			$('#difficulty').html(data[0].difficulty);
			$('#gasLimit').html(data[0].gasLimit);
			$('#gasUsed').html(data[0].gasUsed);
			$('#gas').html(data[1]);
			$('#date').html(data[2]);

			let diff_chart = document.getElementById('diff_chart');
			let gasLimit_chart = document.getElementById('gasLimit_chart');
			let gasUsed_chart = document.getElementById('gasUsed_chart');
			let ts_number_chart = document.getElementById('ts_number_chart');

			if (diff_chart) {
				// console.log("diff_chart.data: " + JSON.stringify(diff_chart.data));
				let layoutD = {
					title: 'Difficulty',
					yaxis: { title: 'Difficulty of Block' }
				};
				let dataD;

				if (diff_chart.data) {
					let found = diff_chart.data[0].x.find(el => {
						return el === data[0].number;
					});

					// console.log("FOUND: " + found);
					if (found) {
						// console.log("ALREADY IN");
					} else {
						let blockN = [];
						blockN = diff_chart.data[0].x;
						let diffN = [];
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

						let data_update = {
							x: blockN,
							y: diffN,
							name: 'Difficulty',
							type: 'bar'
						};

						dataD = [data_update];
						// console.log("NEW DATA TO PUSH: " + JSON.stringify(dataD));

						Plotly.update('diff_chart', dataD, layoutD);

						// Plotly.plot('diff_chart', dataD, layoutD);
					}
				} else {
					// console.log("INIT CHART");
					let block = [];
					let diff = [];

					block.push(data[0].number);
					diff.push(data[0].difficulty);

					let traceD = {
						x: block,
						y: diff,
						name: 'Difficulty',
						type: 'bar'
					};

					dataD = [traceD];

					Plotly.plot('diff_chart', dataD, layoutD);
				}
			}

			if (gasLimit_chart) {
				// console.log("diff_chart.data: " + JSON.stringify(diff_chart.data));
				let layoutD1 = {
					title: 'Gas Limit',
					yaxis: { title: 'gas' }
				};
				let dataD1;

				if (gasLimit_chart.data) {
					let found1 = gasLimit_chart.data[0].x.find(el => {
						return el === data[0].number;
					});

					// console.log("FOUND: " + found);
					if (found1) {
						// console.log("ALREADY IN");
					} else {
						let blockN1 = [];
						blockN1 = gasLimit_chart.data[0].x;
						let diffN1 = [];
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

						let data_update1 = {
							x: blockN1,
							y: diffN1,
							name: 'Gas Limit',
							type: 'bar'
						};

						dataD1 = [data_update1];
						// console.log("NEW DATA TO PUSH: " + JSON.stringify(dataD));

						Plotly.update('gasLimit_chart', dataD1, layoutD1);

						// Plotly.plot('diff_chart', dataD, layoutD);
					}
				} else {
					// console.log("INIT CHART");
					let block1 = [];
					let diff1 = [];

					block1.push(data[0].number);
					diff1.push(data[0].gasLimit);

					let traceD1 = {
						x: block1,
						y: diff1,
						name: 'Gas Limit',
						type: 'bar'
					};

					dataD1 = [traceD1];

					Plotly.plot('gasLimit_chart', dataD1, layoutD1);
				}
			}

			if (gasUsed_chart) {
				// console.log("diff_chart.data: " + JSON.stringify(diff_chart.data));
				let layoutD2 = {
					title: 'Gas Spending',
					yaxis: { title: 'gas' }
				};
				let dataD2;

				if (gasUsed_chart.data) {
					let found2 = gasUsed_chart.data[0].x.find(el => {
						return el === data[0].number;
					});

					// console.log("FOUND: " + found);
					if (found2) {
						// console.log("ALREADY IN");
					} else {
						let blockN2 = [];
						blockN2 = gasUsed_chart.data[0].x;
						let diffN2 = [];
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

						let data_update2 = {
							x: blockN2,
							y: diffN2,
							name: 'Gas Used',
							type: 'bar'
						};

						dataD2 = [data_update2];
						// console.log("NEW DATA TO PUSH: " + JSON.stringify(dataD));

						Plotly.update('gasUsed_chart', dataD2, layoutD2);

						// Plotly.plot('diff_chart', dataD, layoutD);
					}
				} else {
					// console.log("INIT CHART");
					let block2 = [];
					let diff2 = [];

					block2.push(data[0].number);
					diff2.push(data[0].gasUsed);

					let traceD2 = {
						x: block2,
						y: diff2,
						name: 'Gas Used',
						type: 'bar'
					};

					dataD2 = [traceD2];

					Plotly.plot('gasUsed_chart', dataD2, layoutD2);
				}
			}

			if (ts_number_chart) {
				// console.log("diff_chart.data: " + JSON.stringify(diff_chart.data));
				let layoutD3 = {
					title: 'Transactions',
					yaxis: { title: '# of ts' }
				};
				let dataD3;

				if (ts_number_chart.data) {
					let found3 = ts_number_chart.data[0].x.find(el => {
						return el === data[0].number;
					});

					// console.log("FOUND: " + found);
					if (found3) {
						// console.log("ALREADY IN");
					} else {
						let blockN3 = [];
						blockN3 = ts_number_chart.data[0].x;
						let diffN3 = [];
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

						let data_update3 = {
							x: blockN3,
							y: diffN3,
							name: '# of ts',
							type: 'bar'
						};

						dataD3 = [data_update3];
						// console.log("NEW DATA TO PUSH: " + JSON.stringify(dataD));

						Plotly.update('ts_number_chart', dataD3, layoutD3);

						// Plotly.plot('diff_chart', dataD, layoutD);
					}
				} else {
					// console.log("INIT CHART");
					let block3 = [];
					let diff3 = [];

					block3.push(data[0].number);
					diff3.push(data[0].transactions.length);

					let traceD3 = {
						x: block3,
						y: diff3,
						name: '# of ts',
						type: 'bar'
					};

					dataD3 = [traceD3];

					Plotly.plot('ts_number_chart', dataD3, layoutD3);
				}
			}
		});
	}, 3000);

	// console.log("CHECK");
	let price_chart = document.getElementById('price_chart');
	let array_block_gas_spent_account_chart = document.getElementById(
		'array_block_gas_spent_account_chart'
	);
	let transactions_per_block_chart = document.getElementById(
		'transactions_per_block_chart'
	);

	let blocks_info_chart = document.getElementById('blocks_info_chart');
	let balance_of_account_per_block_chart = document.getElementById(
		'balance_of_account_per_block_chart'
	);
	let market_chart = document.getElementById('market_chart');
	let time_to_mine_chart = document.getElementById('time_to_mine_chart');

	if (price_chart) {
		let data_chart = price_chart.getAttribute('data-for');
		let dataToArray_chart = data_chart.split(',');
		// console.log("TEST price_chart: " + JSON.stringify(dataToArray_chart));

		let blocks = [];
		let time = [];
		let prices = [];
		let quantity = [];
		let zeros = [];

		for (let i = 0; i < dataToArray_chart.length; i = i + 6) {
			blocks.push(dataToArray_chart[i]);
			time.push(dataToArray_chart[i + 1]);
			zeros.push(0);
			// console.log("TIME: " + dataToArray_chart[i+1]);
			prices.push(dataToArray_chart[i + 2]);
			quantity.push(dataToArray_chart[i + 3]);
		}

		// console.log("Blocks: " + blocks[0]);
		// console.log("Prices: " + prices[0]);
		// console.log("Quantity: " + quantity[0]);

		// console.log("blocks: " + blocks.length);
		// console.log("time: " + time.length);
		// console.log("A: " + JSON.stringify(time));
		// NEW CHART

		let trace1 = {
			x: blocks,
			y: prices,
			name: 'Price data',
			type: 'scatter'
		};

		let trace2 = {
			x: blocks,
			y: quantity,
			name: 'Quantity data',
			yaxis: 'y2',
			type: 'scatter'
		};

		let data = [trace1, trace2];

		let layout = {
			title: 'Clearing Price && Quantity',
			xaxis: {
				title: 'Blocks'
			},
			yaxis: {
				title: 'Price',
				range: [0, 40]
			},
			yaxis2: {
				title: 'Quantity',
				titlefont: { color: 'rgb(148, 103, 189)' },
				tickfont: { color: 'rgb(148, 103, 189)' },
				overlaying: 'y',
				side: 'right'
			},
			xaxis2: {
				titlefont: { color: 'white' },
				tickfont: { color: 'rgb(148, 103, 189)' },
				overlaying: 'x',
				side: 'top'
			}
		};

		Plotly.plot('price_chart', data, layout);
	}

	if (array_block_gas_spent_account_chart) {
		let data1_chart = array_block_gas_spent_account_chart.getAttribute(
			'data-for'
		);
		let dataToArray1_chart = data1_chart.split(',');
		// console.log("TEST array_block_gas_spent_account_chart: " + JSON.stringify(dataToArray1_chart));

		let blocks1 = [];
		let gasSpent = [];
		let gasLimit = [];

		for (let j = 0; j < dataToArray1_chart.length; j = j + 3) {
			blocks1.push(dataToArray1_chart[j]);
			gasSpent.push(dataToArray1_chart[j + 1]);
			gasLimit.push(dataToArray1_chart[j + 2]);
		}

		// console.log("Blocks: " + blocks1[0]);
		// console.log("Prices: " + prices[0]);
		// console.log("Quantity: " + quantity[0]);

		// NEW CHART

		trace1 = {
			x: blocks1,
			y: gasSpent,
			name: 'gasSpent',
			fill: 'tozeroy',
			type: 'scatter'
		};

		trace2 = {
			x: blocks1,
			y: gasLimit,
			name: 'gasLimit',
			fill: 'tozeroy',
			type: 'scatter'
		};

		data = [trace1, trace2];

		layout = {
			title: 'Gas Spent - Gas Limit - Blocks',
			yaxis: { title: 'Gas Spent' }
		};

		Plotly.plot('array_block_gas_spent_account_chart', data, layout);
	}

	if (transactions_per_block_chart) {
		data_chart = transactions_per_block_chart.getAttribute('data-for');
		dataToArray_chart = data_chart.split(',');
		// console.log("TEST transactions_per_block_chart: " + JSON.stringify(dataToArray_chart));

		let blocks5 = [];
		let transcations = [];
		quantity = [];

		for (let k = 0; k < dataToArray_chart.length; k = k + 2) {
			blocks5.push(dataToArray_chart[k]);
			transcations.push(dataToArray_chart[k + 1]);
		}

		// console.log("Blocks: " + blocks5[0]);
		// console.log("Prices: " + prices[0]);
		// console.log("Quantity: " + quantity[0]);

		// NEW CHART

		trace1 = {
			x: blocks5,
			y: transcations,
			fill: 'tozeroy',
			type: 'scatter'
		};

		data = [trace1];

		layout = {
			title: 'Transactions Per Block',
			yaxis: { title: '# Transactions' }
		};

		Plotly.plot('transactions_per_block_chart', data, layout);
	}

	if (blocks_info_chart) {
		data1_chart = blocks_info_chart.getAttribute('data-for');
		dataToArray1_chart = data1_chart.split(',');

		let blocks2 = [];
		let gasSpent = [];
		let block_size = [];
		let gasSent = [];
		let gasLimit = [];

		for (let t = 0; t < dataToArray1_chart.length; t = t + 5) {
			blocks2.push(dataToArray1_chart[t]);
			gasSpent.push(dataToArray1_chart[t + 1]);
			block_size.push(dataToArray1_chart[t + 2]);
			gasSent.push(dataToArray1_chart[t + 3]);
			gasLimit.push(dataToArray1_chart[t + 4]);
		}

		// NEW CHART
		let trace1 = {
			x: blocks2,
			y: gasSpent,
			name: 'gasSpent',
			fill: 'tozeroy',
			type: 'scatter'
		};

		let trace2 = {
			x: blocks2,
			y: gasLimit,
			name: 'gasLimit',
			fill: 'tozeroy',
			type: 'scatter'
		};

		let trace3 = {
			x: blocks2,
			y: gasSent,
			name: 'gasSent',
			fill: 'tozeroy',
			type: 'scatter'
		};

		let trace4 = {
			x: blocks2,
			y: block_size,
			name: 'blockSize',
			fill: 'tozeroy',
			type: 'scatter'
		};

		data = [trace1, trace2, trace3, trace4];

		layout = {
			title: 'Blocks Info',
			yaxis: { title: 'Value' }
		};

		Plotly.plot('blocks_info_chart', data, layout);
	}

	if (balance_of_account_per_block_chart) {
		data1_chart = balance_of_account_per_block_chart.getAttribute(
			'data-for'
		);
		dataToArray1_chart = data1_chart.split(',');

		let blocks3 = [];
		let balance = [];

		for (let l = 0; l < dataToArray1_chart.length; l = l + 2) {
			blocks3.push(dataToArray1_chart[l]);
			balance.push(dataToArray1_chart[l + 1]);
		}

		// NEW CHART
		trace1 = {
			x: blocks3,
			y: balance,
			name: 'balance',
			fill: 'tozeroy',
			type: 'scatter'
		};

		data = [trace1];

		layout = {
			title: 'Balance of Account - Blocks',
			yaxis: { title: 'Balance' }
		};

		Plotly.plot('balance_of_account_per_block_chart', data, layout);
	}

	if (market_chart) {
		console.log('CHART');
		let generation = document.getElementById('generation');
		let consumption = document.getElementById('consumption');

		data1_chart = generation.getAttribute('data-for');
		let data2_chart = consumption.getAttribute('data-for');

		dataToArray1_chart = data1_chart.split(',');
		let dataToArray2_chart = data2_chart.split(',');

		console.log(JSON.stringify(dataToArray1_chart));

		let genPrice = [];
		let genQuantity = [];

		let conPrice = [];
		let conQuantity = [];

		for (i = 0; i < dataToArray1_chart.length; i = i + 2) {
			genPrice.push(parseInt(dataToArray1_chart[i]));
			genQuantity.push(parseInt(dataToArray1_chart[i + 1]));
		}

		for (j = 0; j < dataToArray2_chart.length; j = j + 2) {
			conPrice.push(parseInt(dataToArray2_chart[j]));
			conQuantity.push(parseInt(dataToArray2_chart[j + 1]));
		}

		console.log('genPrice: ' + JSON.stringify(genPrice));
		console.log('genQuantity: ' + JSON.stringify(genQuantity));

		console.log('conPrice: ' + JSON.stringify(conPrice));
		console.log('conQuantity: ' + JSON.stringify(conQuantity));

		// NEW CHART
		trace1 = {
			x: genQuantity,
			y: genPrice,
			name: 'Generation',
			type: 'scatter'
		};

		trace2 = {
			x: conQuantity,
			y: conPrice,
			name: 'Consumption',
			type: 'scatter'
		};

		data = [trace1, trace2];

		layout = {
			title: 'Market State',
			yaxis: { title: 'Price' }
		};

		Plotly.plot('market_chart', data, layout);
	}

	if (time_to_mine_chart) {
		data1_chart = time_to_mine_chart.getAttribute('data-for');
		dataToArray1_chart = data1_chart.split(',');

		let blocks4 = [];
		balance = [];

		for (i = 2; i < dataToArray1_chart.length; i = i + 2) {
			blocks4.push(dataToArray1_chart[i]);
			balance.push(dataToArray1_chart[i + 1]);
		}

		// NEW CHART
		trace1 = {
			x: blocks4,
			y: balance,
			name: 'balance',
			fill: 'tozeroy',
			type: 'scatter'
		};

		data = [trace1];

		layout = {
			title: 'Time to Mine Block - Blocks',
			yaxis: { title: 'Time' }
		};

		Plotly.plot('time_to_mine_chart', data, layout);
	}
});

$('.clickclass').click(function(event) {
	// If the input button is clicked, get the parent with class 'clickclass' and replace with other HTML.
	console.log('Target id: ' + event.target.id);
	console.log('Target val: ' + event.target);
	let val = $(event.target).text();
	console.log('VAL: ' + JSON.stringify(val));
	$('#contract').val(val);
	// if (event.target.id == 'save_button') {
	//    myparent = event.target.parent();
	//    myparent.html('some html code');
	// }
});

$('#get_exp').click(function() {
	// alert( "Handler for .click() called." );
	$('#id_function').val('1');
	$('#submit_global').click();
});

$('#get_clr').click(function() {
	// alert( "Handler for .click() called." );
	$('#id_function').val('2');
	$('#submit_global').click();
});

$('#get_con_details').click(function() {
	// alert( "Handler for .click() called." );
	$('#id_function').val('3');
	$('#submit_global').click();
});

$('#get_transactions_per_block').click(function() {
	// alert( "Handler for .click() called." );
	$('#id_function').val('4');
	$('#submit_global').click();
});

$('#get_account_gas_spent').click(function() {
	// alert( "Handler for .click() called." );
	$('#id_function').val('5');
	$('#submit_global').click();
});

$('#get_account_info').click(function() {
	// alert( "Handler for .click() called." );
	$('#id_function').val('6');
	$('#submit_global').click();
});

$('#get_clr_last_block').click(function() {
	// alert( "Handler for .click() called." );
	$('#id_function').val('7');
	$('#submit_global').click();
});

$('#blocks_info').click(function() {
	// alert( "Handler for .click() called." );
	$('#id_function').val('8');
	$('#submit_global').click();
});

$('#get_balance_account_per_block').click(function() {
	// alert( "Handler for .click() called." );
	$('#id_function').val('9');
	$('#submit_global').click();
});

$('#sync').click(function() {
	// alert( "Handler for .click() called." );
	$('#id_function').val('10');
	$('#submit_global').click();
});

$('#get_trs').click(function() {
	// alert( "Handler for .click() called." );
	$('#id_function').val('11');
	$('#submit_global').click();
});

$('#get_market_chart').click(function() {
	// alert( "Handler for .click() called." );
	$('#id_function').val('12');
	$('#submit_global').click();
});

$('#get_time_to_mine_block').click(function() {
	// alert( "Handler for .click() called." );
	$('#id_function').val('13');
	$('#submit_global').click();
});
