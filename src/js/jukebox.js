import contract from 'truffle-contract'
import JukeboxContract from '@contracts/Jukebox.json'

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

  queueTrack(trackURI, clientID) {
    let self = this
    return new Promise((resolve, reject) => {
      self.instance.sendTransaction({ from: window.web3.eth.coinbase, to: self.instance.address, gas: 2300000, value: web3.toWei(0.1, "ether"), data: window.web3.toHex(trackURI + clientID)}).then(function () {
        resolve()
      })
    })
  },

  listenToHasPayedEvent: function () {
    let self = this
    var hasPayedEvent = self.instance.hasPayed();

    return new Promise((resolve, reject) => {
      hasPayedEvent.watch(function (error, result) {
        if (!error)
          resolve(window.web3.toAscii(result.args.trackURI))
      })
    });
  }
}

export default Jukebox
