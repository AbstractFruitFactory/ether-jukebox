<template>
  <div class="dashboard">
    <h1>{{ msg }}</h1>
    <md-button class="md-raised md-primary" href="http://localhost:8888/login">Login</md-button>
    <md-button class="md-raised md-primary" @click="queueTrack()">Play</md-button>
    <md-field>
      <md-input v-model="trackURI"></md-input>
    </md-field>
    <div>{{ state.name }}</div>
  </div>
</template>

<script>
  import Jukebox from '@/js/jukebox'
  import SpotifyWebApi from 'spotify-web-api-js'
  const spotifyApi = new SpotifyWebApi()
  
  export default {
    name: 'dashboard',
    data() {
      return {
        msg: 'Welcome to your truffle-vue dApp',
        pseudo: undefined,
        state: undefined,
        trackURI: undefined,
        trackRequests: {}
      }
    },

    created: function() {
      const params = this.getHashParams();
      const token = params["/access_token"];
      if (token) {
        spotifyApi.setAccessToken(token);
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
        Jukebox.queueTrack(self.trackURI).then(async function() {
            var response = await Jukebox.listenToHasPayedEvent()
            self.playTrack(response)
        })
      },

      playTrack: function(trackURI) {
        var self = this
        spotifyApi.play({
            "uris": [trackURI]
          })
          .then((response) => {
            console.log(response)
          })
      }
    }
  }
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
</style>
