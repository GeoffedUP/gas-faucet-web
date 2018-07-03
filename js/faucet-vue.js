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
    all_events: [],
    latest_eth_block: 0,
  },
  created: function () {
    // `this` points to the vm instance
    console.log('faucet vue created')
    //this.getDispenseEvents();
  },
  computed: {
    maxGwei: function () {
      if(this.rate_wei_per_satoshi == 0) {
        return 0;
      }
      let satoshis = this.faucet_balance * 10**8;
      let satoshis_bn = new Eth.BN(satoshis);
      let wei_bn = satoshis_bn.mul(new Eth.BN(this.rate_wei_per_satoshi));
      //log('satoshis', satoshis, 'wei_bn', wei_bn);
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
      if(this.faucet_balance == undefined) {
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
      //console.log(this.all_events.length, 'dispense events', this.all_events);
      // let donate_events = [{
      //   block_number: 8888888, 
      //   tx_hash: '0x3154ef180a81ae82f132cc67e4a08f48858f7e7db18cb4c05122d81e9b43ebb1',
      //   type: 'dispense',
      //   destination: '0x5409e9e2f6cc8340d307fa15e0728adad54d6e8c',
      //   gas_price: 12345,
      //   tokens: 0.1234,
      // },];
      //let donate_events = [];
      //console.log(donate_events.length, 'donate events', donate_events);

      let events = this.all_events;
      //let events = this.dispenseEvents;
      //let events = this.dispenseEvents.concat(this.donateEvents);
      return events
    },
  },
  methods: {
    /* called by setContractAddress, so runs once addres is set */
    update: function (e) {
      this.all_events = [];
      eth.blockNumber().then((value)=>{
        this.latest_eth_block = parseInt(value.toString(10), 10);

        /* check the last 32 days. TODO: increase maybe */
        let days = 32;
        this.getDispenseEvents(4 * 60 * 24 * days);
        this.getDonateEvents(4 * 60 * 24 * days);
      });
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
      this.update();
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
      //log('wei', wei);
      let wei_bn = new Eth.BN(wei);
      //log('wei_bn', wei_bn.toNumber());
      let expected_satoshis = wei_bn.div(new Eth.BN(this.rate_wei_per_satoshi)).toNumber();
      //log('expected_satoshis', expected_satoshis);
      let expected_tokens = (expected_satoshis / 10**8);
      return expected_tokens;
    },
    pushEvent: function (event) {
      this.all_events.push(event);
    },
    getDispenseEvents: function (num_blocks_into_past) {
      var latest_eth_block = this.latest_eth_block;
      /* subtract 1.5 minutes of blocks because infura can be slow */
      //latest_eth_block -= 6;
      eth.getLogs({
        fromBlock: latest_eth_block - num_blocks_into_past,
        toBlock: latest_eth_block,
        address: this.contract_address,
        topics: ['0xeb9df064f68e905565a2656b40e16dd2df0c9c21d72fda0d3a97de56f826f3d8', null],
      })
      .then((result) => {
        log("got filter results:", result.length, "transactions");

        var contract_address = this.contract_address;
        var event_save_fn = this.pushEvent;

        //console.log('4addresssss:', this.contract_address);
        result.forEach(function(transaction){
          console.log(transaction);
          function getMinerAddressFromTopic(address_from_topic) {
            return '0x' + address_from_topic.substr(26, 41);
          }
          var tx_hash = transaction['transactionHash'];
          var block_number = parseInt(transaction['blockNumber'].toString());
          var destination = getMinerAddressFromTopic(transaction['topics'][1].toString());
          //console.log('data is ', transaction['data'].substr(2, 65));
          //console.log('bn is ', new Eth.BN(transaction['data'].substr(2, 65), 16).toString());
          //console.log('bn is ', new Eth.BN(transaction['data'].substr(2, 65), 16).toNumber());
          var tokens = (new Eth.BN(transaction['data'].substr(2, 65), 16).toNumber()) / 10**8;
          
          //console.log('5addresssss:', contract_address);
          eth.getTransactionByHash(tx_hash)
          .then(function(result){
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
                //console.log('6addresssss:', contract_address);
                event_save_fn({
                  block_number: block_number, 
                  tx_hash: tx_hash,
                  type: 'dispense',
                  destination: destination,
                  gas_price: gas_price,
                  tokens: tokens,
                });
                break;
              default:
                log('GOT UNKNOWN TOPIC:', transaction['topics'][0].toString());
                log(transaction);
                break;
            }
          });
        });
      });
    },
    getDonateEvents: function (num_blocks_into_past) {
      var latest_eth_block = this.latest_eth_block;
      /* subtract 1.5 minutes of blocks because infura can be slow */
      //latest_eth_block -= 6;
      eth.getLogs({
        fromBlock: latest_eth_block - num_blocks_into_past,
        toBlock: latest_eth_block,
        //address: null,
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', 
          null,
          '0x000000000000000000000000'+this.contract_address.slice(2,65)],
      })
      .then((result) => {
        log("got filter results:", result.length, "transactions");

        var contract_address = this.contract_address;
        var event_save_fn = this.pushEvent;

        //console.log('4addresssss:', this.contract_address);
        result.forEach(function(transaction){
          //console.log(transaction);
          function getMinerAddressFromTopic(address_from_topic) {
            return '0x' + address_from_topic.substr(26, 41);
          }
          var tx_hash = transaction['transactionHash'];
          var block_number = parseInt(transaction['blockNumber'].toString());
          //var destination = getMinerAddressFromTopic(transaction['topics'][1].toString());
          //console.log('data is ', transaction['data'].substr(2, 65));
          //console.log('bn is ', new Eth.BN(transaction['data'].substr(2, 65), 16).toString());
          //console.log('bn is ', new Eth.BN(transaction['data'].substr(2, 65), 16).toNumber());
          var tokens = (new Eth.BN(transaction['data'].substr(2, 65), 16).toNumber()) / 10**8;


          event_save_fn({
            block_number: block_number, 
            tx_hash: tx_hash,
            type: 'donate',
            //destination: destination,
            //gas_price: gas_price,
            tokens: tokens,
          });
          
          //console.log('5addresssss:', contract_address);
          //eth.getTransactionByHash(tx_hash)
          //.then(function(result){
            //console.log(result);
            //let gas_price = result.gasPrice.toNumber() / 10**9;
            //console.log('gas_price', gas_price);
            //let gas = result.gas.toNumber();
            //console.log('gas', gas);
            //let nonce = result['input'].substr(2, 72);
            //log('tx_hash', tx_hash)
            //log('  nonce', nonce);

            //mined_blocks.push([block_number, tx_hash, miner_address, nonce])

            // switch(transaction['topics'][0].toString()){
            //   case "0xeb9df064f68e905565a2656b40e16dd2df0c9c21d72fda0d3a97de56f826f3d8":
            //     console.log('6addresssss:', contract_address);
            //     event_save_fn({
            //       block_number: block_number, 
            //       tx_hash: tx_hash,
            //       type: 'donate',
            //       destination: destination,
            //       gas_price: gas_price,
            //       tokens: tokens,
            //     });
            //     break;
            //   default:
            //     log('GOT UNKNOWN TOPIC:', transaction['topics'][0].toString());
            //     log(transaction);
            //     break;
            // }
          //});
        });
      });
    },
  }
})
