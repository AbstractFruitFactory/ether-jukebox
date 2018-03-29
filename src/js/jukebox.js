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

  queueTrack(clientID, trackURI) {
    let self = this

    return new Promise((resolve, reject) => {
      self.instance.queueTrack(clientID, trackURI, { from: window.web3.eth.coinbase, gas: 2300000 }).then(function () {
        resolve()
      })
    })
  },

  listenToQueueTrackEvent: function () {
    let self = this
    var queueEvent = self.instance.queuedTrack();

    return new Promise((resolve, reject) => {
      queueEvent.watch(function (error, result) {
        if (!error)
          resolve(result);
      })
    });
  }
}

export default Jukebox
