FaucetApp = {
  web3Provider: null,
  contracts: {},
  contract_address: null,

  init: function(contract_address) {
    FaucetApp.contract_address = contract_address;

    faucet_app.setContractAddress(contract_address);

    return FaucetApp.initWeb3();
  },

  initWeb3: function() {
    log('init time');
    log('init time');
    if (FaucetApp.contract_address == null) {
      return false;
    }
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      FaucetApp.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      FaucetApp.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(FaucetApp.web3Provider);

    return FaucetApp.initContract();
  },

  initContract: function() {
    $.getJSON('js/GasFaucet.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var GasFaucet = data;
      FaucetApp.contracts.GasFaucet = TruffleContract(GasFaucet);

      // Set the provider for our contract
      FaucetApp.contracts.GasFaucet.setProvider(FaucetApp.web3Provider);

      // Use our contract to retrieve and mark the adopted pets
      FaucetApp.getFaucetBalance();
      FaucetApp.getRate();
      FaucetApp.getTokenAddress();
    });
    $.getJSON('js/ERC20Interface.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var Token = data;
      FaucetApp.contracts.Token = TruffleContract(Token);

      // Set the provider for our contract
      FaucetApp.contracts.Token.setProvider(FaucetApp.web3Provider);
    });

    /*return FaucetApp.bindEvents();*/
  },

  //bindEvents: function() {
  //  $(document).on('click', '.buttonDispense', FaucetApp.handleDispense);
  //},

  getFaucetBalance: function() {
    var gasFaucetInstance;

    FaucetApp.contracts.GasFaucet.at(FaucetApp.contract_address).then(function(instance) {
      gasFaucetInstance = instance;

      return gasFaucetInstance.tokenBalance.call();
    }).then(function(balance_in_satoshis) {
      //console.log('balance:');
      //console.log(balance);
      let balance = balance_in_satoshis.div(10**8).toNumber();
      //console.log('balance:', balance);
      faucet_app.setFaucetBalance(balance);
      // for (i = 0; i < balance.length; i++) {
      //   if (balance[i] !== '0x0000000000000000000000000000000000000000') {
      //     $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
      //   }
      // }
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  getRate: function() {
    var gasFaucetInstance;

    FaucetApp.contracts.GasFaucet.at(FaucetApp.contract_address).then(function(instance) {
      gasFaucetInstance = instance;

      return gasFaucetInstance.getWeiPerSatoshi.call();
    }).then(function(rate_wei_per_satoshi) {
      //console.log('balance:');
      //console.log(balance);
      let rate = rate_wei_per_satoshi.toNumber();
      //console.log('rate:', rate);
      faucet_app.setRate(rate);
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  getTokenAddress: function() {
    var gasFaucetInstance;

    FaucetApp.contracts.GasFaucet.at(FaucetApp.contract_address).then(function(instance) {
      gasFaucetInstance = instance;
      return gasFaucetInstance.faucetTokenAddress.call();
    }).then(function(address) {
      FaucetApp.token_address = address;
      //console.log('token_address:');
      //console.log(address);
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handleDispense: function(gasprice, destination) {
    var gasFaucetInstance;
    log('dispense:', gasprice, 'gwei', destination, 'destination');
    //destination = new Eth.BN(destination, 16);

    gasprice = gasprice * 10**9;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      FaucetApp.contracts.GasFaucet.at(FaucetApp.contract_address).then(function(instance) {
        console.log('1 - sending tx');
        gasFaucetInstance = instance;
        let result = gasFaucetInstance.dispense(destination, {from: account, gasPrice: gasprice});
        faucet_app.setStatusString('Dispense transaction pending... Open MetaMask to approve if it does not open automatically.');

        return result;

      }).then(function(result) {
        let tx_hash = result.tx;
        let block_num = result.receipt.blockNumber;
        let gas_used = result.gasUsed;
        let gas_fee = gas_used * gasprice;
        let tx_hash_link = '<a href="https://etherscan.io/tx/' + tx_hash + '">' + tx_hash.substr(0, 8) + '</a>';
        console.log('2 - sent tx');
        faucet_app.setStatusString("Dispense transaction " + tx_hash_link + " was successful.");
        faucet_app.update();
      }).catch(function(err) {
        console.log('3 - err');
        console.log(err.message);
      });
    });
  },

  handleDonate: function(gasprice, tokens) {
    var gasFaucetInstance;
    log('donate:', gasprice, 'gwei', tokens, 'tokens');

    tokens = tokens * 10**8;
    gasprice = gasprice * 10**9;


    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      FaucetApp.contracts.Token.at(FaucetApp.token_address).then(function(instance) {
        let result;
        console.log('1 - sending tx');
        tokenInstance = instance;

        // Execute adopt as a transaction by sending account
        if(gasprice == 0) {
          result = tokenInstance.transfer(FaucetApp.contract_address, tokens, {from: account});
        }else {
          result = tokenInstance.transfer(FaucetApp.contract_address, tokens, {from: account, gasPrice: gasprice});
        }
        faucet_app.setStatusString('Donation transaction pending... <span style="font-style: italic;">Open metamask to approve if it does not open automatically.</span>');

        return result;
      }).then(function(result) {
        let tx_hash = result.tx;
        let block_num = result.receipt.blockNumber;
        let tx_hash_link = '<a href="https://etherscan.io/tx/' + tx_hash + '">' + tx_hash.substr(0, 8) + '</a>';
        console.log('2 - sent tx');
        faucet_app.setStatusString("Donation transaction " + tx_hash_link + " was successful.");
      }).catch(function(err) {
        console.log('3 - err');
        console.log(err.message);
      });
    });
  }
};


web3.version.getNetwork((err, netId) => {
  let contract_address;
  switch (netId) {
    case "1":
      log('NETWORK: mainnet');
      contract_address = '0x8302D610F9c6b94560beFb9A7118B4AA7f414Ec3';
      break
    case "2":
      log('NETWORK: Morden test network [DEPRECATED]');
      fail;
      break
    case "3":
      log('NETWORK: ropsten test network');
      //contract_address = '0xeEE591f610a1bb9fBc4002137A4e1e10D31Ae018';
      contract_address = '0x4FE2c096FC4e32663e2c850C389972C2a455075B';
      break
    default:
      log('NETWORK: an unknown network');
      fail;
  }
  $(document).ready(function() {FaucetApp.init(contract_address);});
});

