/*
 * blockNode.cpp
 *
 *  Created on: Jul 11, 2017
 *      Author: ubuntu
 */

#include "blockNode.h"
#include <stdlib.h>
#include <stdio.h>
#include <fstream>
#include <unistd.h>

#include <sys/types.h>
#include <sys/stat.h>
#include <dirent.h>
#include <errno.h>

#include <iostream>
#include <string>
#include <sstream>

#include  <iomanip>
#include <fstream>

#include "ethereumapi.h"
#include <jsonrpccpp/client/connectors/httpclient.h>


using namespace std;
//ofstream myfile;
ofstream out("out.txt");
streambuf *coutbuf = cout.rdbuf();

string contractAddress = "0x8f3baa46c2dc09710f8a49f18813c05c233ae15f";

int output () {
  //myfile << "Writing this to a file.\n";
 // myfile.close();
  return 0;
}

void blockNode::initNode(int id) {
	//myfile.open ("results.txt");
	
	cout.rdbuf(out.rdbuf());

	nodeId = 30300 + id;
	rpcPort = 8101 + id;
	printf("nodeId = %d \n", this->nodeId);
	std::stringstream ss;
	ss << nodeId;

	//stringId :  password for new nodes, port, id
	std::string stringId(ss.str());
	std::string root = "/home/ubuntu/tmp/eth/1923";
	std::string datadir = root + "/data/" + stringId;

	const char * dirPath = datadir.c_str();
	DIR* directory = opendir(dirPath);

	if (directory == NULL) //if is not directory initialize node
	{
		//init node and get enode

		string systemString = "bash -c \"geth --datadir ";
		systemString += datadir;
		systemString += " init /home/ubuntu/tmp/eth/1923/genesis.json\"";

		cout << systemString << endl;
		const char * systemCommand = systemString.c_str();
		system(systemCommand);

	}
	closedir(directory);

	std::string keystorePathS = root + "/keystore";
	const char * keystorePath = keystorePathS.c_str();
	DIR* directoryKeystore = opendir(keystorePath);
	if (directoryKeystore == NULL) //if is not directory create it
	{
		cout << "directory " << keystorePathS << "does not exist, create it" <<endl;
		mkdir(keystorePath, 0777);
	}
	closedir(directoryKeystore);


	std::string accountPathS = keystorePathS + "/" + stringId;
	const char * accountPath = accountPathS.c_str();
	DIR* directoryAccount = opendir(accountPath);

	if (directoryAccount == NULL) //if is not directory create new account and make keystore folders
	{
		cout << "directory " << accountPathS << "does not exist, create it and create a new account" <<endl;
		mkdir(accountPath, 0777);

		//create new account
		string systemString = "bash -c \"geth --datadir ";
		systemString += datadir;
		systemString += " --password <(echo -n ";
		systemString += stringId;
		systemString += ") account new\"";

		cout << systemString << endl;
		const char * systemCommand = systemString.c_str();
		system(systemCommand);

		//copy keystore from /home/user/tmp/eth/1923/data/30300 to /home/user/tmp/eth/1923/keystore/30300
		systemString = "cp -R ";
		systemString += datadir;
		systemString += "/keystore ";
		systemString += accountPathS;

		cout << systemString << endl;
		systemCommand = systemString.c_str();
		system(systemCommand);

		//copy keystore from /home/user/tmp/eth/1923/keystore/30300 to /home/user/tmp/eth/1923/data/30300/keystore
		systemString = "cp -R ";
		systemString += accountPathS;
		systemString += "/keystore ";
		systemString += datadir;
		systemString += "/keystore";

		cout << systemString << endl;
		systemCommand = systemString.c_str();
		system(systemCommand);

	}

	closedir(directoryAccount);

}


void blockNode::startNode(int id) {

	//copy static-nodes.json
	//start node
	nodeId = 30300 + id;
	rpcPort = 8101 + id;

	printf("nodeId = %d \n", this->nodeId);

	std::stringstream ss;
	ss << this->nodeId;

	//stringId :  password for new nodes, port, id
	std::string stringId(ss.str());

	std::stringstream sp;
	sp << this->rpcPort;

	//stringPort :  rpcPort
	std::string stringPort(sp.str());


	std::string root = "/home/ubuntu/tmp/eth/1923";
	std::string datadir = root + "/data/" + stringId;

	string systemString = "bash -c \"geth --bootnodes enode://9222941eb46bd45d7876891f4d3eba37e3762f8abf53051d4c45cee683a4a26c967a2f15ebaeb71f54f15721bce1977154b3c8d9c8a01f614cf36f5da6e40e40@127.0.0.1:30299 --datadir=";
	systemString += datadir;
	systemString += " --identity='mynode-";
	systemString += stringId;
	systemString += "' --port=";
	systemString += stringId;
	systemString += " --rpc --rpcapi='db,eth,net,web3,admin,personal' --rpcport=";
	systemString += stringPort;
	systemString += " --rpcaddr=127.0.0.1 --rpccorsdomain='*' --ipcpath ";
	systemString += datadir;
	systemString += "/geth.ipc --networkid=1923 2>&1 &\"";

	cout << systemString << endl;
	const char * systemCommand = systemString.c_str();

	system(systemCommand);

	//get the address of the newly created account
	jsonrpc::HttpClient httpclient("http://localhost:"+stringPort);
	EthereumAPI c(httpclient);
	Json::Value accounts;
	bool created = false;
	while (!created) {
		try {
			accounts = c.eth_accounts();
			cout << "accounts : " << accounts << endl;
			created = true;
		} catch (jsonrpc::JsonRpcException& e) {
			created = false;
		}
	}

	//unlock the account holding eths
	jsonrpc::HttpClient marketclient("http://localhost:8100");
	EthereumAPI market(marketclient);
	try {
		string address = "0xad56cedb7d9ee48b3b93f682a9e2d87f80221768";
		market.personal_unlockAccount(address, "0", 0);
	} catch (jsonrpc::JsonRpcException& e) {
		cout << "error unlocking account " << e.GetMessage() << endl;
	}

	//send eths to the new account
	try
	{
		Json::Value root; // {}
		root["from"] = "0xad56cedb7d9ee48b3b93f682a9e2d87f80221768";
		root["to"] = accounts[0];
		root["value"] = "0x1BC16D674EC80000"; // 2000000000000000000 = 2Eth
		market.eth_sendTransaction(root);
	}
	catch (jsonrpc::JsonRpcException & e)
	{
		cerr << e.what() << endl;
	}

}

void blockNode::clearMarket(int id){
	cout << "MARKET CLEARING CALLED " << endl;
	/**/jsonrpc::HttpClient httpclient("http://localhost:8100");
	EthereumAPI c(httpclient);

	/*try {
		//string address = accounts[0].asString();
		string address = "0xad56cedb7d9ee48b3b93f682a9e2d87f80221768";
		c.personal_unlockAccount(address, "0", 0);
		cout << "ACCOUNT UNLOCKED " << endl;
	} catch (jsonrpc::JsonRpcException& e) {
		cout << "ERROR UNLOCKING ACCOUNT " << e.GetMessage() << endl;
	}
*/
	try{
		Json::Value root3; // {}
		root3["from"] = "0xad56cedb7d9ee48b3b93f682a9e2d87f80221768";
		root3["to"] = contractAddress;
		root3["data"] = "0xdd2e6ab5";

		string result3 = c.eth_call(root3, "latest");
		int price3 = strtoul(result3.c_str(), NULL, 16);
		cout << "get block number NOW : " << price3 << endl;

		Json::Value root; // {}
		root["from"] = "0xad56cedb7d9ee48b3b93f682a9e2d87f80221768";
		root["to"] = contractAddress;
		root["data"] = "0x901a40a7";

		string result = c.eth_call(root, "latest");
		int price = strtoul(result.c_str(), NULL, 16);
		cout << "get market result : " << price << endl;

		Json::Value root2; // {}
		root2["from"] = "0xad56cedb7d9ee48b3b93f682a9e2d87f80221768";
		root2["to"] = contractAddress;
		root2["data"] = "0x14fffa15";

		string result2 = c.eth_call(root2, "latest");
		int price2 = strtoul(result2.c_str(), NULL, 16);
		cout << "get market clearingQuantity : " << price2 << endl;

		Json::Value root1; // {}
		root1["from"] = "0xad56cedb7d9ee48b3b93f682a9e2d87f80221768";
		root1["to"] = contractAddress;
		root1["data"] = "0xbc3d513f";

		//output();

		string result1 = c.eth_call(root1, "latest");
		int price1 = strtoul(result1.c_str(), NULL, 16);
		cout << "get market clearingType : " << price1 << endl;

	}
	catch (jsonrpc::JsonRpcException & e)
	{
		cerr << e.what() << endl;
	}

	// try
	// {
	// 	//default account : 0xad56cedb7d9ee48b3b93f682a9e2d87f80221768
	// 	Json::Value root; // {}
	// 	root["from"] = "0xad56cedb7d9ee48b3b93f682a9e2d87f80221768";
	// 	root["to"] = contractAddress;
	// 	root["gas"] = "0x2DC6C0";
	// 	root["gasPrice"] = "0x430E23400";
	// 	root["data"] = "0x256a9ea1";
	// 	string result = c.eth_sendTransaction(root);
	// 	cout << "MARKET CLEARING HASH : " << result << endl;
	// 	//cout.rdbuf(coutbuf);
	// }
	// catch (jsonrpc::JsonRpcException & e)
	// {
	// 	cerr << e.what() << endl;
	// }
}
//"7f495ea5": "consumptionBid(int256,int256)",
void blockNode::submitConsumptionBid(int id, int price, int quantity){
	//comment out when gas problem solved
	nodeId = 30300 + id;
	rpcPort = 8101 + id;

	std::stringstream sp;
	sp << rpcPort;
	std::string stringPort(sp.str());

	std::stringstream ss;
	ss << nodeId;
	std::string stringId(ss.str());


	cout << "submitConsumptionBid price : " << price << " quantity : "<< quantity << endl;
	//output();

	jsonrpc::HttpClient httpclient("http://localhost:" + stringPort);
	EthereumAPI c(httpclient);
	Json::Value accounts = c.eth_accounts();
	//cout << "accounts : " << accounts[0] << endl;

	//UnlockAccount
	try {
		string address = accounts[0].asString();
		c.personal_unlockAccount(address, stringId, 0);

	} catch (jsonrpc::JsonRpcException& e) {
		cout << "error unlocking account " << e.GetMessage() << endl;
	}

	try {
		string balance = c.eth_getBalance(accounts[0].asString(), "latest");
		cout << "BALANCE of: " << accounts[0].asString() << " = " << balance << endl;
	} catch (jsonrpc::JsonRpcException& e) {
		cout << "error unlocking account " << e.GetMessage() << endl;
	}


	std::stringstream priceStream;
	std::stringstream quantityStream;

	priceStream << setfill('0') << setw(64) << std::hex << price;
	std::string resultprice( priceStream.str() );

	quantityStream << setfill('0') << setw(64) << std::hex << quantity;
	std::string resultquantity( quantityStream.str() );

	//cout << "submitConsumptionBid priceHEX:" << resultprice << " quantityHEX:" << resultquantity << endl;

	try
	{
		//contract address: 0x4291ae232bcbeb5a64b612a971384efac3dab88d
		//default account : 0xad56cedb7d9ee48b3b93f682a9e2d87f80221768
		// 027cb7c6 clear();
		//Json::Value result = "\"from\": \"0x1d1ae163d75d6689c6c70c7367bbd08ac5361e4e\", \"to\": \"0x35bc45bb2c4c8f311ed9e0e867287ecb9ca90f8b\", \"data\": \"0x256a9ea1\"";
		Json::Value root; // {}
		root["from"] = accounts[0];
		root["to"] = contractAddress;
		root["gas"] = "0x30D40";
		// root["gasPrice"] = "0x430E23400";
		root["data"] = "0x7f495ea5"+resultquantity+resultprice;
		c.eth_sendTransaction(root);
		//cout << c.eth_accounts() << endl;
	}
	catch (jsonrpc::JsonRpcException & e)
	{
		cerr << e.what() << endl;
	}
}


//"0d31d41a": "generationBid(int256,int256)",
void blockNode::submitGenerationBid(int id, int price, int quantity){
	//comment out when gas problem solved
	nodeId = 30300 + id;
	rpcPort = 8101 + id;

	std::stringstream sp;
	sp << rpcPort;
	std::string stringPort(sp.str());

	std::stringstream ss;
	ss << nodeId;
	std::string stringId(ss.str());


	cout << "submitGenerationBid price : " << price << " quantity : "<< quantity << endl;
	//output();

	jsonrpc::HttpClient httpclient("http://localhost:" + stringPort);
	EthereumAPI c(httpclient);
	Json::Value accounts = c.eth_accounts();
	//cout << "accounts : " << accounts[0] << endl;

	//UnlockAccount
	try {
		string address = accounts[0].asString();
		c.personal_unlockAccount(address, stringId, 0);
	} catch (jsonrpc::JsonRpcException& e) {
		cout << "error unlocking account " << e.GetMessage() << endl;
	}

	try {
		string balance = c.eth_getBalance(accounts[0].asString(), "latest");
		cout << "BALANCE of: " << accounts[0].asString() << " = " << balance << endl;
	} catch (jsonrpc::JsonRpcException& e) {
		cout << "error unlocking account " << e.GetMessage() << endl;
	}


	std::stringstream priceStream;
	std::stringstream quantityStream;

	priceStream << setfill('0') << setw(64) << std::hex << price;
	std::string resultprice( priceStream.str() );


	quantityStream << setfill('0') << setw(64) << std::hex << quantity;
	std::string resultquantity( quantityStream.str() );

	//cout << "submitGenerationBid priceHEX:" << resultprice << " quantityHEX:" << resultquantity << endl;

	try
	{
		//contract address: 0x4291ae232bcbeb5a64b612a971384efac3dab88d
		//default account : 0xad56cedb7d9ee48b3b93f682a9e2d87f80221768
		// 027cb7c6 clear();
		//Json::Value result = "\"from\": \"0x1d1ae163d75d6689c6c70c7367bbd08ac5361e4e\", \"to\": \"0x35bc45bb2c4c8f311ed9e0e867287ecb9ca90f8b\", \"data\": \"0x256a9ea1\"";
		Json::Value root; // {}
		root["from"] = accounts[0];
		root["to"] = contractAddress;
		root["gas"] = "0x30D40";
		// root["gasPrice"] = "0x430E23400";
		root["data"] = "0x0d31d41a"+resultquantity+resultprice;
		c.eth_sendTransaction(root);
		//cout << c.eth_accounts() << endl;
	}
	catch (jsonrpc::JsonRpcException & e)
	{
		cerr << e.what() << endl;
	}
}

marketStruct blockNode::readClearing(int id) {
	marketStruct market = marketStruct();
	nodeId = 30300 + id;
	rpcPort = 8101 + id;

	std::stringstream sp;
	sp << rpcPort;
	std::string stringPort(sp.str());

	std::stringstream ss;
	ss << nodeId;
	std::string stringId(ss.str());

	jsonrpc::HttpClient httpclient("http://localhost:" + stringPort);
	EthereumAPI c(httpclient);
	Json::Value accounts = c.eth_accounts();

	/*try{
		Json::Value root; // {}
		root["from"] = accounts[0];
		root["to"] = contractAddress;
		root["data"] = "0x901a40a7";

		string result = c.eth_call(root, "latest");
		int price = strtoul(result.c_str(), NULL, 16);
		cout << "get market result : " << price << endl;

		Json::Value root2; // {}
		root2["from"] = accounts[0];
		root2["to"] = contractAddress;
		root2["data"] = "0xc4ffe131";

		string result2 = c.eth_call(root2, "latest");
		int price2 = strtoul(result2.c_str(), NULL, 16);
		cout << "get market clearingQuantity : " << price2 << endl;

		Json::Value root1; // {}
		root1["from"] = accounts[0];
		root1["to"] = contractAddress;
		root1["data"] = "0xbc3d513f";

		//output();

		string result1 = c.eth_call(root1, "latest");
		int price1 = strtoul(result1.c_str(), NULL, 16);
		cout << "get market clearingType : " << price1 << endl;

	}
	catch (jsonrpc::JsonRpcException & e)
	{
		cerr << e.what() << endl;
	}*/


	/*market.price = result["clearingPrice"].asInt();
	market.quantity = result["clearingQuantity"].asInt();
	market.type = result["clearingType"].asInt();*/

	market.price = 10;
	market.quantity = 100;
	market.type = 0;

	return market;
}

blockNode::blockNode() {

	/*id++;
	printf("id = %d \n", this->id);
	nodeId = 30300 + id;
	rpcPort = 8101 + id;*/
}

blockNode::~blockNode() {
	// TODO Auto-generated destructor stub
}
