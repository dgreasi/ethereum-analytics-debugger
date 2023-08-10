# Ethereum_analytics_debugger
A NodeJs project to get various analytics and debug a private ethereum network.

This project is my Thesis to obtain the MSc at Electrical and Computer Engineering.

An electronic version of the Thesis can be found [here](https://drive.google.com/file/d/1K2NZaZfZXIRw50QG04abFSC0EP5KuJ-5/view).

## Requirements
1) An ethereum network (Instructions to initiate a local one can be found [here](https://github.com/Temeteron/my_private_blockchain_network))
2) A node of this network locally running on your pc
3) If you want to check state of contracts at past blocks you should start your node **from the first time** with the following parameters  **"--syncmode full --gcmode=archive"**, so that the node will be fully synced. An example of a start geth command follows:
```
geth --port 30299 --rpc --rpcapi="db,eth,net,web3,admin,personal" --rpcport 8100 --rpcaddr=11.10.1.1 --rpccorsdomain "*" --syncmode full --gcmode=archive
```
## Functions Table
| #  | Features                          | Inspector | Other Tools |
|:--:| --------------------------------- |:---------:|:-----------:|
| 1  |  Get Block                        |     x     |      x      |
| 2  |  Get Transaction                  |     x     |      x      |
| 3  |  Explore 1,2                      |     x     |      x      |
| 4  |  Get specified range of blocks    |     x     |             |
| 5  |  Sync with a big number of blocks |     x     |             |
| 6  |  Table (accounts, # ts, gas spent)|     x     |             |
| 7  |  Get Ts through Blocks            |     x     |             |
| 8  |  Chart Block Information          |     x     |      x      |
| 9  |  Chart Gas Spent of Account       |     x     |             |
| 10 |  Chart Balance of Account         |     x     |             |
| 11 |  Chart Transactions Per Block     |     x     |      x      |
| 12 |  Chart Time to Mine Block         |     x     |      x      |
| 13 |  Get Account Detailed Info        |     x     |             |
| 14 |  Get # Peers of Node              |     x     |             |
| 15 |  Live Monitoring                  |     x     |             |
| 16 |  Find Mined Contracts             |     x     |             |
| 17 |  Compile Contract - Get ABI       |     x     |             |
| 18 |  Call get Functions of Contract   |     x     |             |
| 19 |  Support Private Networks         |     x     |             |
| 20 |  Support Public Networks          |     x     |      x      |
| 21 |  Fast Setup                       |     x     |             |
| 22 |  Good Documentation               |     x     |             |

## Get Started

1) Download release at [releases](https://github.com/Temeteron/Ethereum_analytics_debugger/releases) or clone the latest:
```
$ git clone https://github.com/Temeteron/Ethereum_analytics_debugger.git

```
> For Node version < 6 use release [1](https://github.com/Temeteron/Ethereum_analytics_debugger/releases/tag/1.0.0)

2) Cd to directory and install packages (if you downloaded a release you must unzip the file):
```
$ cd Ethereum_analytics_debugger/basic
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
$ npm start
```

6) Use the web interface at [http://localhost:3000](http://localhost:3000)

>The code of the functions is located at: analytics.js which is imported and used at /routes/index.js

>Pure javascript and a bit of JQuery in the front are used. Handlebars and bootstrap are also being used. 

>There is a version of the implementation that can be used for faster testing in terminal. Just run the terminal_analytics.js with node after choosing which functions you want to call.

## Important
The web3 library, which is the official library of Ethereum to enable communication between a nodejs server and an Ethereum Node, has bugs for node version >= 8.

The only function that fails sometimes is:
```
web.eth.getTransactionReceipt()
```
You can rerun your scenario and this call will fail less times.

On node < 8 it works just fine!

## Analysis of Functions

1.0) **Live Chart** - ARGS: ()

> This function its automatically called every three seconds and creates 4 live charts. Each chart demonstrate the return objects for a window of 10 blocks. 1) Difficulty per Block, 2) Gas Limit per Block 3) Number of Transactions per Block 4) Gas Spend per Block

1.1) **Get Experiment** - ARGS: (Start block, End block, (?) Contract)

>This function will generate a table which contains the addresses of the accounts that made transactions through the specified range of blocks. Also a table will be generated, if there are silent bugs, which will contain the transaction in which occurred the bug. Silent Bugs: a transaction that was mined but didn't execute the code of the contract because of insufficient gas, gasless send unexisted address of function, a command throw, the reached call stack limit. Such transactions are also known as Rolled Back transactions.

Each line contains: 
- (address of account)
- (Spent Gas of the transactions)
- (number of transactions through specified range of blocks)

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/get_experiment.png?raw=true "Experiment")

1.2) **Get Transactions** - ARGS: (Start block, End block, (?) Contract)

>This function will generate a table which contains all the transactions through the specified range of blocks, or only the transactions with the specified receiver. The row of the table is consisted from: Block - TimeStamp - Input(function + args) - Contract

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/get_transactions.png?raw=true "Get Transactions")

2.0) **Get Blocks Info** - ARGS: (Start block, End block)

>This function will generate a chart which contains 4 traces:
- Gas limit
- Gas sent
- Gas spent
- Block size

Those data can be compared each other for better inspection

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/gas_per_block.png?raw=true "Gas Per Block")

2.1) **Get Gas Spent of Account** - ARGS: (Start block, End block, Account)

>This function will generate a chart that contains the spent gas of an account for each block through a specified range of blocks. It also contains the limit of gas for each block to find easier "silent bugs".

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/gas_spent_chart_2.png?raw=true "Gas Spent")

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/gas_spent_chart_1.png?raw=true "Gas Limit per Block")

2.2) **Get Balance of Account Per Block** - ARGS: (Start block, End block, Account)

>This function will generate a chart that contains the number of transactions on each block which makes easier to monitor your experiment.

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/balance_of_account_per_block.png?raw=true "Balance of Account per Block")

2.3) **Get Transactions Per Blocks** - ARGS: (Start block, End block)

>This function will generate a chart that contains the number of transactions on each block which makes easier to monitor your experiment.

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/transactions_per_block.png?raw=true "Ts per Block")

2.4) **Get Time to Mine Block** - ARGS: (Start block, End block)

>This function will generate a chart that contains the elapsed time to mine each block.

3.0) **Get Block** - ARGS: (Number of Block)

>This function returns all the available information about the specified block

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/get_block.png?raw=true "Block Info")

3.1) **Get Transaction** - ARGS: (Hash of Transaction)

>This function will return all the info available for the specified hash of the transaction.

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/transaction_info.png?raw=true "Transaction Info")

3.2) **Get Account Info** - ARGS: (Start block, End block, Account)

>This function will return basic info of the specified account such as his balance and the total number of transactions. It also returns a table with the transactions of the account through the specified range of blocks.

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/get_account_info.png?raw=true "Account Info")

3.3) **Get Number of Peers** - ARGS: ()

> This function returns the number of peers of the ethereum node that we are connected on.

4.0) **Get state of Custom Contract** - ARGS: (Start block, End block, Contract)

>This function will generate a chart that contains the values of the variables of the specified contract, at each block and time of day. The chart represents the values through the specified range of blocks. A table that contains the data of the chart is also generated.

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/state_of_contract.png?raw=true "State of Contract")
![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/transactions.png?raw=true "Transactions to Contract")
>Currently this function has to be changed from each developer to get the wanted variables. You need to edit the function "getStorageAtBlock()" at line 1157 and his sub-functions to match your needs. More specifically you should change the pointer number in each sub-function to target your vars.

>More Info about 'How to read Ethereum contract storage' can be found [here](https://medium.com/aigang-network/how-to-read-ethereum-contract-storage-44252c8af925)

4.1) **Get Chart from args of ts to Contract** - ARGS: (Start block, End block, Contract)

>This function will generate a chart through blocks with the corresponding argument that was sent to the specified contract.

4.2) **Get Contracts** - ARGS: (Start block, End block)

>This function will search through the specified range of blocks to find mined contracts. It will return some information about the mined Contract, such as , block number, miner, owner, address of contract (needed) etc.


![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/get_contract.png?raw=true "Contracts")

4.3) **Interact with any Contract** - ARGS: (Contract Code, Address of Mined Contract)

>Compile a contract from the Solidity code, generate ABI and use it through UI to call GET functions. You can monitor any contract by using the real time option which calls in everry block the specified GET function.

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/abi.png?raw=true "ABI")

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/real_time_function.png?raw=true "Real Time Chart")


### Home Interface

![alt text](https://github.com/Temeteron/Ethereum_analytics_debugger/blob/master/Contracts%20and%20Info/img/basic_UI.png?raw=true "Home")

