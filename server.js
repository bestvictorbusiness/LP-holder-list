const config = require("./config");
var Web3 = require("web3");
const axios = require('axios');
const fetch = require('node-fetch');
let settings = { method: "Get" };
var allAddress = [];
var socket; 
var toBlock; 
var fromBlock; 
var address; 
var abi;
var contract;
var web3

var options = {
  timeout: 600000, // ms
  // Useful if requests result are large
  clientConfig: {
    maxReceivedFrameSize: 100000000, // bytes - default: 1MiB
    maxReceivedMessageSize: 100000000, // bytes - default: 8MiB
  },
  // Enable auto reconnection
  reconnect: {
    auto: true,
    delay: 5000, // ms
    maxAttempts: 15,
    onTimeout: false,
  },
};



async function main(network) {

  if(network=="pancakeswap"){

    socket = config.pancakeswap.socket;
    toBlock = config.pancakeswap.toBlock;
    fromBlock = config.pancakeswap.fromBlock;
    address = config.pancakeswap.contractAddress;
    abi = config.pancakeswap.contractAbi;

  }
  else if(network=="uniswap"){

    socket = config.uniswap.socket;
    toBlock = config.uniswap.toBlock;
    fromBlock = config.uniswap.fromBlock;
    address = config.uniswap.contractAddress;
    abi = config.uniswap.contractAbi;

  }

  web3 = await new Web3(new Web3.providers.WebsocketProvider(socket, options));
  contract = await new web3.eth.Contract(abi, address);

  setTimeout(async () => {
    try {
      await contract.getPastEvents('Transfer', {
          filter: {from: '0x0000000000000000000000000000000000000000' },
          fromBlock: fromBlock,
          toBlock: toBlock
      }, async function(error, events){
        //console.log(events)
        await custom(events);
        //console.log(events);
      });
    } catch (err) {
      console.log("catch", err.message)
      console.error(err);
    }
  });
}
async function custom(data) {
  try {
    console.log(data.length);
    if(data.length > 0) {
        await asyncForEach(data, async order => {
          //console.log(allAddress.includes(order.returnValues.to.toLowerCase()))
          if(!allAddress.includes(order.returnValues.to.toLowerCase())) {
            await contract.methods.balanceOf(order.returnValues.to).call().then(async function (info) {
              //console.log(info)
              var balance = await web3.utils.fromWei(info.toString(),"ether")
              if(balance > 0) {
                console.log("addr", order.returnValues.to, balance)
              }
            })
            allAddress.push(order.returnValues.to.toLowerCase())
          }
        })
    }
  } catch(err){
    console.log(err)
  }
}
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}


main("pancakeswap");
