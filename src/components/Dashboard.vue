<template>
  <div class="dashboard">
    <h1>{{ msg }}</h1>
    <md-button class="md-raised md-primary" href="http://localhost:8888/login">Login</md-button>
    <md-button class="md-raised md-primary" @click="getNowPlaying">Get playing</md-button>
    <div>{{ state.name }}</div>
  </div>
</template>

<script>
  import Users from '@/js/users'
  
  import SpotifyWebApi from 'spotify-web-api-js'
  const spotifyApi = new SpotifyWebApi()
  
  export default {
    name: 'dashboard',
    data() {
      return {
        msg: 'Welcome to your truffle-vue dApp',
        pseudo: undefined,
        state: undefined
      }
    },
  
    created: function() {
      const params = this.getHashParams();
      const token = params["/access_token"];
      console.log(token)
      if (token) {
        console.log(token)
        spotifyApi.setAccessToken(token);
      }
      this.state = {
        loggedIn: token ? true : false,
        nowPlaying: {
          name: 'Not Checked',
          albumArt: ''
        }
      }
    },
  
    methods: {
      login: function() {
  
      },
  
      getHashParams() {
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
  
  
      getNowPlaying() {
        spotifyApi.getMyCurrentPlaybackState()
          .then((response) => {
            this.state = {
  
              name: response.item.name,
              albumArt: response.item.album.images[0].url
  
            }
          })
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
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
