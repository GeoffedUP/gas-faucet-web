faucet_app = new Vue({
  el: '#faucet',
  data: {
    recipient_address: '',
    gasprice: 5,
    donate_amount: 1,
    faucet_balance: 0,
    rate_wei_per_satoshi: 0,
    contract_address: '',
    status_string: '',
  },
  computed: {
    maxGwei: function () {
      if(this.rate_wei_per_satoshi == 0) {
        return 0;
      }
      let satoshis = this.faucet_balance * 10**8;
      let satoshis_bn = new Eth.BN(satoshis);
      let wei_bn = satoshis_bn.mul(new Eth.BN(this.rate_wei_per_satoshi));
      log('satoshis', satoshis, 'wei_bn', wei_bn);
      return wei_bn.toNumber() / 10**9;
    },
    calculatedTokens: function () {
      return this.getTokensForGasPrice(this.gasprice);
    },
    expectedTokens: function () {
      if(this.rate_wei_per_satoshi == 0) {
        return "--";
      }
      if(this.calculatedTokens > this.faucet_balance) {
        return this.faucet_balance;
      }
      return this.calculatedTokens;
    },
    faucetDisplayBalance: function () {
      if(this.rate_wei_per_satoshi == 0 && this.faucet_balance == 0) {
        return "--";
      }
      return this.faucet_balance.toFixed(3);
    },
    sortedRecentEvents: function () {
      return this.recentEvents.sort((a, b) => {return a.block_number - b.block_number;});
    },
    recentEvents: function () {
      if(this.contract_address == '' || this.contract_address == '0x') {
        return [];
      }
      let events = this.dispenseEvents;
      //let events = this.dispenseEvents.concat(this.donateEvents);
      return events
    },
    dispenseEvents: function () {
      let events = []
      /* check the last 23040 blocks (about 4 days). TODO: increase maybe */
      eth.blockNumber().then((value)=>{
        latest_eth_block = parseInt(value.toString(10), 10);
        /* subtract 1.5 minutes of blocks because infura can be slow */
        latest_eth_block -= 6;
        log('loaded latest_eth_block:', latest_eth_block);
        log('filtering addy', this.contract_address);
        eth.getLogs({
          fromBlock: latest_eth_block - 23040,
          toBlock: latest_eth_block,
          address: this.contract_address,
          topics: ['0xeb9df064f68e905565a2656b40e16dd2df0c9c21d72fda0d3a97de56f826f3d8', null],
        })
        .then((result) => {
          log("got filter results:", result.length, "transactions");

          result.forEach(function(transaction){
            console.log(transaction);
            function getMinerAddressFromTopic(address_from_topic) {
              return '0x' + address_from_topic.substr(26, 41);
            }
            var tx_hash = transaction['transactionHash'];
            var block_number = parseInt(transaction['blockNumber'].toString());
            var destination = getMinerAddressFromTopic(transaction['topics'][1].toString());

            eth.getTransactionByHash(tx_hash)
            .then(async function(result){
              console.log(result);
              let gas_price = result.gasPrice.toNumber() / 10**9;
              //console.log('gas_price', gas_price);
              //let gas = result.gas.toNumber();
              //console.log('gas', gas);
              //let nonce = result['input'].substr(2, 72);
              //log('tx_hash', tx_hash)
              //log('  nonce', nonce);

              //mined_blocks.push([block_number, tx_hash, miner_address, nonce])

              switch(transaction['topics'][0].toString()){
                case "0xeb9df064f68e905565a2656b40e16dd2df0c9c21d72fda0d3a97de56f826f3d8":
                  events.push({
                    block_number: block_number, 
                    tx_hash: tx_hash,
                    type: 'dispense',
                    destination: destination,
                    gas_price: gas_price,
                  });
                  break;
                default:
                  log('topic:', transaction['topics'][0].toString());
                  break;
              }
            });
          });
        });
      });
      return events
    },
  },
  methods: {
    update: function (e) {
      //this.contract_address = this.contract_address;
    },
    updateDonateAmount: function (e) {
      this.donate_amount = e.target.value
    },
    updateGasPrice: _.debounce(function (e) {
      this.gasprice = e.target.value
    }, 300),
    updateAddress: function (e) {
      this.recipient_address = e.target.value
    },
    setAddress: function (recipient_address) {
      this.recipient_address = recipient_address;
    },
    setContractAddress: function (contract_address) {
      this.contract_address = contract_address;
    },
    setFaucetBalance: function (faucet_balance) {
      this.faucet_balance = faucet_balance;
    },
    setStatusString: function (status_string) {
      this.status_string = status_string;
    },
    setRate: function (rate_wei_per_satoshi) {
      this.rate_wei_per_satoshi = rate_wei_per_satoshi;
    },
    dispenseTokens: function () {
      let txhash = FaucetApp.handleDispense(this.gasprice, this.recipient_address);
      status_string = "Dispense transaction " + txhash + " sent.";
    },
    donateTokens: function () {
      let txhash = FaucetApp.handleDonate(0, this.donate_amount);
      status_string = "Donate transaction " + txhash + " sent.";
    },
    getTokensForGasPrice: function(gasprice) {
      if(this.rate_wei_per_satoshi == '0') {
        return 0;
      }
      let wei = parseFloat(gasprice) * 10**9;
      log('wei', wei);
      let wei_bn = new Eth.BN(wei);
      log('wei_bn', wei_bn.toNumber());
      let expected_satoshis = wei_bn.div(new Eth.BN(this.rate_wei_per_satoshi)).toNumber();
      log('expected_satoshis', expected_satoshis);
      let expected_tokens = (expected_satoshis / 10**8);
      return expected_tokens;
    },
  }
})
