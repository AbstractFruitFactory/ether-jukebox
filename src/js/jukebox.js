import contract from 'truffle-contract'
import JukeboxContract from '../../build/contracts/Jukebox.json'

const Jukebox = {

  contract: null,

  instance: null,

  init: function () {
    let self = this

    return new Promise(function (resolve, reject) {
      self.contract = contract(JukeboxContract)
      self.contract.setProvider(window.web3.currentProvider)

      self.contract.deployed().then(instance => {
        self.instance = instance
        resolve()
      }).catch(err => {
        reject(err)
      })
    })
  },

  deployNew: function () {
    let self = this
    let contract = window.web3.eth.contract(Jukebox.abi)
    return new Promise((resolve, reject) => {
      contract.new({ from: window.web3.eth.coinbase, data: Jukebox.bytecode, gas: 4400000, gasPrice: 100000000000 }, function (err, instance) {
        if (!instance.address) {
          resolve(instance.transactionHash)
        }
      })
    })
  },

  queueTrack(clientAddress, trackURI) {
    let self = this
<<<<<<< HEAD
    var queueEvent = self.instance.nextQueuedTrack();
=======
    return new Promise((resolve, reject) => {
      self.instance.queueTrack.sendTransaction(clientAddress, trackURI, { from: window.web3.eth.coinbase, to: self.instance.address, gas: 2300000, value: web3.toWei(0.1, "ether") }).then(function (hash) {
        resolve(hash)
      })
    })
  },
>>>>>>> centralized

  listenToEvent: function (clientAddress, counter) {
    let self = this
    var event = self.instance.LogQueueTrack({ client: clientAddress, counter: counter });
    return new Promise((resolve, reject) => {
      event.watch(function (error, result) {
        if (!error)
          resolve({
            clientAddress: result.args.clientAddress,
            trackURI: result.args.trackURI
          })
      });
    },
    )
  },

  getCounter: function(clientAddress) {
    let self = this
    return new Promise((resolve, reject) => {
      self.instance.getCounter(clientAddress, { from: window.web3.eth.coinbase, gas: 2300000 }).then(function (counter) {
        resolve(counter)
      })
    })
  }
}

export default Jukebox
