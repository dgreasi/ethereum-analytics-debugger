# Ethereum_analytics_debugger (WIP)
A NodeJs project to get various analytics and debug a private ethereum network.

## Requirements
1) A private ethereum network (Instructions to initiate one can be found [here](https://github.com/Temeteron/my_private_blockchain_network]))
2) A node of this network locally running on your pc

## Basic Functions

1) **Get Experiment** - ARGS: (Start block, End block, (?) Contract)

>This function will generate a table which contains the addresses of the accounts that made transactions through the specified range of blocks.

Each line contains: 
- (address of account)
- (Spent Gas of the transactions)
- (number of transactions through specified range of blocks)

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/get_experiment.png?raw=true "Experiment")

2) **Get state of Contract** - ARGS: (Start block, End block, Contract)

>This function will generate a chart that contains the values of the variables of the specified contract, at each block and time of day. The chart represents the values through the specified range of blocks.

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/state_of_contract.png?raw=true "State of Contract")
>Currently this function has to be changed from each developer to get the wanted variables. You need to edit the function "getStorageAtBlock()" at line 718 and his sub-functions to match your needs. More specifically you should change the pointer number in each sub-function to target your vars.

3) **Get Contracts** - ARGS: (Start block, End block)

>This function will search through the specified range of blocks to find mined contracts. It will return some information about the mined Contract, such as , block number, miner, owner, address of contract (needed) etc.

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/get_contract.png?raw=true "Contracts")

4) **Get Transaction** - ARGS (Hash of Transaction)

>This function will return all the info available for the specified hash of the transaction.

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/transaction_info.png?raw=true "Transaction Info")

5) **Get Gas Spent of Account** - ARGS (Start block, End block, Account)

>This function will generate a chart that contains the spent gas of an account for each block through a specified range of blocks. It also contains the limit of gas for each block to find easier "silent bugs".

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/gas_spent_chart_2.png?raw=true "Gas Spent")

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/gas_spent_chart_1.png?raw=true "Gas Limit per Block")

6) **Get Transactions Per Blocks** - ARGS (Start block, End block)

>This function will generate a chart that contains the number of transactions on each block which makes easier to monitor your experiment.

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/transactions_per_block.png?raw=true "Ts per Block")

7) **Get Block** - ARGS (Number of Block)

>This function returns all the available information about the specified block

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/get_block.png?raw=true "Block Info")

8) **Get Account Info** - ARGS (Start block, End block, Account)

>This function will return basic info of the specified account such as his balance and the total number of transactions. It also returns a table with the transactions of the account through the specified range of blocks.

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/get_account_info.png?raw=true "Account Info")

9) **Get Number of Peers** - ARGS ()

> This function returns the number of peers of the ethereum node that we are connected on.

## Get Started
1) Clone:
```
$ git clone https://github.com/Temeteron/Ethereum_analytics_debugger.git
```

2) Cd to directory and install packages:
```
$ cd Ethereum_analytics_debugger
$ npm install
```

3) Start your local ethereum node with "geth" at rpcport 8100

4) If you have different rpcport than 8100 and you can't change it, go to /basic/analytics.js and change the rpcport at line 9 to {my_port}:
```
web3.setProvider(new web3.providers.HttpProvider('http://localhost:{my_port}'));
```

5) Start NodeJs Server:
```
$ cd basic
$ node server.js
```

6) Use the web interface at [http://localhost:3000](http://localhost:3000)


### Home Interface

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/basic_UI.png?raw=true "Home")