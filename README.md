# Ethereum_analytics_debugger
A NodeJs project to get various analytics and debug a private ethereum network.

## Requirements
1) A private ethereum network (Instructions to initiate one can be found [here](https://github.com/Temeteron/my_private_blockchain_network]))
2) A node of this network locally running on your pc

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

3) If you have different rpcport than 8100 and you can't change it, go to /basic/analytics.js and change the rpcport at line 9 to {my_port}:
```
web3.setProvider(new web3.providers.HttpProvider('http://localhost:{my_port}'));
```

4) Start NodeJs Server:
```
$ cd basic
$ node server.js
```

5) Use the web interface at [http://localhost:3000](http://localhost:3000)