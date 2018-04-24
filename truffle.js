var HDWalletProvider = require("truffle-hdwallet-provider");
var fs = require('fs');

var mnemonic  = "party abstract display seven visual gasp curve churn cute suspect shell index"

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 9545,
      gas: 5000000,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/1ZabHKvRw6HJ1ehv5rNp")
      },
      network_id: '3',
      gas: 4612388.
    },
  }
};