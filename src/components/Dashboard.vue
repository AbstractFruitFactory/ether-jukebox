<template>
  <v-app id="app" dark>
    <v-dialog v-model="showHostDialog">
      <v-card>
        <v-inner-text>
          <v-btn @click="signClientID()">Sign</v-btn>
          <v-btn @click="host()">Host</v-btn>
        </v-inner-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="showQueueDialog">
      <v-card>
        <v-inner-text>
          <v-text-field v-model="clientId" label="Client ID"></v-text-field>
          <v-text-field v-model="trackURI" label="Track URI"></v-text-field>
          <v-btn @click="queueTrack()">Queue</v-btn>
        </v-inner-text>
      </v-card>
    </v-dialog>
    <v-btn @click="showHostDialog = true">Host Jukebox</v-btn>
    <v-btn href="http://localhost:8888/login">Login</v-btn>
    <v-btn @click="showQueueDialog = true">Queue</v-btn>
    <div>{{ state.name }}</div>
  </v-app>
</template>

<script>
  import Jukebox from '@/js/jukebox'
  import SpotifyWebApi from 'spotify-web-api-js'
  const spotifyApi = new SpotifyWebApi()
  var rp = require('request-promise')

  
  export default {
    name: 'dashboard',
    data() {
      return {
        showHostDialog: false,
        showQueueDialog: false,
        state: undefined,
        trackURI: undefined,
        clientId: undefined,
        trackRequests: {},
        token: undefined,
        params: undefined
      }
      return hashParams;
    },
  
    created: function() {
      self.params = this.getHashParams();
      self.token = self.params["/access_token"];
      if (self.token) {
        spotifyApi.setAccessToken(self.token);
      }
      this.state = {
        loggedIn: token ? true : false,
      }
      Jukebox.init()
    },
  
    methods: {
  
      getHashParams: function() {
        var hashParams = {};
        var e, r = /([^&;=]+)=?([^&;]*)/g,
          q = window.location.hash.substring(1);
        e = r.exec(q)
        while (e) {
          hashParams[e[1]] = decodeURIComponent(e[2]);
          e = r.exec(q);
        }
        return hashParams;
      },
  
      queueTrack: function() {
        var self = this
        let clientId = self.clientId
        let trackURI = self.trackURI
  
        var options = {
          method: 'POST',
          uri: 'http://localhost:8888/clientid',
          body: {
            id: clientId
          },
          json: true
        };
  
        rp(options)
          .then(function(clientAddress) {
            Jukebox.queueTrack(clientAddress, trackURI).then(function(hash) {
              self.waitForReceipt(hash, function() {
                console.log("Track queued.")
              })
            })
          })
          .catch(function(err) {
            console.log(err)
          });
      },
  
      waitForReceipt: function(hash, cb) {
        let self = this
        window.web3.eth.getTransactionReceipt(hash, function(err, receipt) {
          if (err) {
            error(err);
          }
  
          if (receipt !== null) {
            // Transaction went through
            if (cb) {
              cb(receipt);
            }
          } else {
            // Try again in 1 second
            window.setTimeout(function() {
              self.waitForReceipt(hash, cb);
            }, 1000);
          }
        });
      },
  
      signClientID: function() {
        let message = [{
          type: 'string',
          name: 'ID',
          value: self.params['id']
        }]
        this.signMsg(message, window.web3.eth.coinbase)
      },
  
      signMsg: function(msgParams, from) {
        window.web3.currentProvider.sendAsync({
          method: 'eth_signTypedData',
          params: [msgParams, from],
          from: from,
        }, function(err, result) {
          if (err) return console.error(err)
          if (result.error) {
            return console.error(result.error.message)
          }
  
          var options = {
            method: 'POST',
            uri: 'http://localhost:8888/send',
            body: {
              msg: result.result,
              data: msgParams,
              from: from,
              token: self.token
            },
            json: true
          };
  
          rp(options)
            .then(function(parsedBody) {
              console.log(parsedBody)
            })
            .catch(function(err) {
              console.log(err)
            });
        })
      },
  
      host: function() {
        let self = this
  
        spotifyApi.getMe().then(function(result) {
          var options = {
            method: 'POST',
            uri: 'http://localhost:8888/clientid',
            body: {
              id: result.id
            },
            json: true
          };
  
          rp(options)
            .then(function(clientAddress) {
              self.listenToEvent(clientAddress)
            })
            .catch(function(err) {
              console.log(err)
            });
        })
      },
  
      listenToEvent: function(clientAddress) {
        let self = this
        Jukebox.getCounter(clientAddress).then(function(counter) {
          Jukebox.listenToEvent(clientAddress, counter.add(1)).then(function(result) {
            self.playTrack(result.trackURI).then(function(res) {
              self.listenToEvent(clientAddress)
            })
          })
        })
      },
  
      playTrack: function(trackURI) {
        var self = this
        return new Promise((resolve, reject) => {
          spotifyApi.play({
              "uris": [trackURI]
            })
            .then((response) => {
              resolve(response)
            })
        })
      }
    }
  }
};
</script>

<style scoped>
h1,
h2 {
  font-weight: normal;
  display: block;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}

.dialog {
  padding: 30px;
}
</style>
